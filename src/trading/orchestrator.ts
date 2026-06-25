import { randomUUID } from "node:crypto";
import { config, isReadOnly } from "../config";
import { store } from "./store";
import { aiModel, aiProviderId } from "../ai";
import { checkPolicy, isRiskReducing } from "../policy/engine";
import {
  effectiveLimits,
  minAutoConfidence,
  minConfidenceScore,
  maxVolatility24hPct,
  drawdownPausePct,
  riskProfileSummary,
} from "../policy/riskProfile";
import { currentDrawdownPct, drawdownPeak } from "./drawdown";
import {
  bookLevelsBase,
  getBalances,
  getMarketSnapshot,
  getOpenOffers,
  type MarketSnapshot,
} from "../stellar/market";
import { walkBook } from "../stellar/indicators";
import { canonicalAsset } from "../stellar/assets";
import { buildOfferTransaction } from "../stellar/builder";
import { preflightCheck } from "../stellar/preflight";
import {
  signOnly,
  signerPublicKey,
  submitSigned,
  type OfferResultLike,
} from "../stellar/signer";
import { setXlmRate } from "./positions";
import {
  explainNoEntry,
  briefNoEntry,
  baselineCall,
  divergenceNote,
  isFundable,
  type NoEntryInput,
} from "./explain";
import {
  analyze,
  analyzeChain,
  type ProposedTrade,
  type RecentOutcome,
  type TradingMemory,
} from "../claude/agent";
import type { PolicyContext, TradeProposal, TradeSide } from "../types";

/** How many recent submitted trades (with outcomes) the analyst gets to see. */
const MEMORY_OUTCOMES = 5;

/** Snapshot of how this system's own trading has gone, fed to the analyst. */
function tradingMemory(): TradingMemory {
  const recentOutcomes: RecentOutcome[] = store
    .listProposals()
    .filter((p) => p.status === "submitted")
    .slice(0, MEMORY_OUTCOMES)
    .reverse() // newest-first store order -> oldest-first for the prompt
    .map((p) => ({
      pair: `${p.baseAsset.split(":")[0]}/${p.quoteAsset.split(":")[0]}`,
      side: p.side,
      amount: p.filledAmount ?? p.amount,
      price: p.filledPrice ?? p.limitPrice,
      mark1hPnlPct: p.mark1hPnlPct ?? null,
      mark24hPnlPct: p.mark24hPnlPct ?? null,
    }));
  return {
    realizedPnlToday: store.getDaily().realizedPnl,
    unrealizedPnl: store.unrealizedPnl,
    positions: store.getPositions(),
    recentOutcomes,
  };
}

export interface AnalysisOutcome {
  reasoning: string;
  proposals: TradeProposal[];
}

export interface ScanOutcome extends AnalysisOutcome {
  /** How many of the scanned markets actually had a live orderbook. */
  scanned: number;
}

/**
 * Build a "does the wallet hold a usable (>0) amount of this asset?" predicate
 * from live balances, or null when there is no configured account / the fetch
 * fails (the caller then treats fundability as unknown). One Horizon read,
 * shared by the wallet-fit warning and the divergence fundability check.
 */
async function walletHeld(): Promise<((spec: string) => boolean) | null> {
  const pub = signerPublicKey();
  if (!pub) return null;
  let balances: Awaited<ReturnType<typeof getBalances>>;
  try {
    balances = await getBalances(pub);
  } catch {
    return null;
  }
  return (spec: string): boolean => {
    let canon: string;
    try {
      canon = canonicalAsset(spec);
    } catch {
      return false;
    }
    return balances.some((b) => {
      try {
        return canonicalAsset(b.asset) === canon && Number(b.balance) > 0;
      } catch {
        return false;
      }
    });
  };
}

/**
 * Available native XLM balance, for Expert-mode %-of-balance position sizing.
 * undefined when no account is configured or the lookup fails (callers then
 * fall back to the config size envelope). Only fetched when Expert Mode is on.
 */
async function availableXlmBalance(): Promise<number | undefined> {
  const pub = signerPublicKey();
  if (!pub) return undefined;
  try {
    const balances = await getBalances(pub);
    const native = balances.find((b) => b.asset === "XLM");
    return native ? Number(native.balance) : 0;
  } catch {
    return undefined;
  }
}

/**
 * Warn when the wallet can only trade ONE direction on a pair: with no quote
 * currency it can only SELL the base (nothing to buy with); with no base it can
 * only BUY. `held` is the predicate from walletHeld().
 */
function logWalletFit(
  base: string,
  quote: string,
  held: (spec: string) => boolean,
): void {
  const baseCode = base.split(":")[0];
  const quoteCode = quote.split(":")[0];
  if (held(base) && !held(quote)) {
    store.log(
      "warn",
      `Wallet holds ${baseCode} but no ${quoteCode}: on ${baseCode}/${quoteCode} the bot can only SELL ${baseCode} - it can't BUY without ${quoteCode} to spend. Hold some ${quoteCode} to enable buy entries.`,
    );
  } else if (!held(base) && held(quote)) {
    store.log(
      "warn",
      `Wallet holds ${quoteCode} but no ${baseCode}: on ${baseCode}/${quoteCode} the bot can only BUY ${baseCode}, not SELL.`,
    );
  }
}

/** Ask the AI to look at a market, then route any proposals through policy. */
export async function runAnalysis(
  baseAsset: string,
  quoteAsset: string,
): Promise<AnalysisOutcome> {
  store.log("ai", `Analyzing ${baseAsset}/${quoteAsset}...`);
  const held = await walletHeld();
  if (held) logWalletFit(baseAsset, quoteAsset, held);
  const result = await analyze(baseAsset, quoteAsset, tradingMemory());
  for (const t of result.toolTrace) store.log("info", `tool: ${t}`);
  store.log("ai", result.reasoning);

  const created: TradeProposal[] = [];
  if (result.proposals.length === 0) {
    store.log("ai", "AI proposed no trade.");
  }
  // Rulebook check (+ the why-no-entry reason when the AI passed), from one
  // snapshot: surfaces where the AI diverged from the deterministic playbook -
  // e.g. a range-high sell the rules would take but the AI skipped. A skip the
  // wallet couldn't have funded is tagged PHANTOM rather than a real miss.
  try {
    const snap = await getMarketSnapshot(baseAsset, quoteAsset, 8);
    const aiSide = result.proposals[0]?.side ?? null;
    const baseline = baselineCall(snap.stats, snap.stats.lastPrice ?? midOf(snap));
    const fundable =
      held && baseline.side
        ? isFundable(baseline.side, snap.base, snap.quote, held)
        : undefined;
    const check = divergenceNote(snapLabel(snap), baseline, aiSide, fundable);
    if (check) store.log("info", `Rulebook check - ${check.note}`);
    if (result.proposals.length === 0) {
      store.log("info", `Why no entry: ${explainNoEntry(snapToNoEntry(snap), noEntryGates)}`);
    }
  } catch {
    // Transparency is best-effort; never let it break the analysis result.
  }
  for (const p of result.proposals) {
    created.push(await intake(p));
  }
  return { reasoning: result.reasoning, proposals: created };
}

/**
 * Pull the XLM rate of a scanned market into the rate map: an XLM/<token>
 * snapshot's mid is token-per-XLM, so XLM-per-token is its inverse. This is
 * what lets cross-pair PnL / volume / exposure convert into the XLM unit the
 * daily caps are denominated in.
 */
function feedXlmRate(snap: MarketSnapshot): void {
  const mid =
    snap.bestBid != null && snap.bestAsk != null
      ? (snap.bestBid + snap.bestAsk) / 2
      : (snap.stats.lastPrice ?? snap.bestBid ?? snap.bestAsk);
  if (mid == null || !(mid > 0)) return;
  if (snap.base === "XLM") setXlmRate(snap.quote, 1 / mid);
  else if (snap.quote === "XLM") setXlmRate(snap.base, mid);
}

/** Liquidity-gate limits the no-trade explainer reports against. */
const noEntryGates = {
  maxEntrySpreadBps: config.limits.maxEntrySpreadBps,
  minVolume24h: config.limits.minVolume24h,
};

/** Short "BASE/QUOTE" label from a snapshot (codes only, issuers dropped). */
function snapLabel(snap: MarketSnapshot): string {
  return snap.base === "XLM"
    ? `XLM/${snap.quote.split(":")[0]}`
    : `${snap.base.split(":")[0]}/${snap.quote.split(":")[0]}`;
}

/** Mid from the touch, used as the rulebook's lastClose when lastPrice is null. */
function midOf(snap: MarketSnapshot): number {
  if (snap.bestBid != null && snap.bestAsk != null) {
    return (snap.bestBid + snap.bestAsk) / 2;
  }
  return snap.bestBid ?? snap.bestAsk ?? 0;
}

/** Stable key for matching a proposal to a scanned market (canonical legs). */
function pairKey(base: string, quote: string): string {
  const c = (s: string) => {
    try {
      return canonicalAsset(s);
    } catch {
      return s;
    }
  };
  return `${c(base)}|${c(quote)}`;
}

/** Map a live market snapshot to the no-entry explainer's input shape. */
function snapToNoEntry(snap: MarketSnapshot): NoEntryInput {
  const label = snapLabel(snap);
  return {
    label,
    regime: snap.stats.regime ?? null,
    rsi14: snap.stats.rsi14 ?? null,
    rangePos: snap.stats.rangePos ?? null,
    spreadBps: snap.spreadBps ?? null,
    baseVolume24h: snap.stats.baseVolume24h ?? null,
  };
}

/**
 * Scan the curated universe (reputable tokens vs XLM) PLUS the configured
 * cross pairs (fx / peg books like USDC/EURC) in a single pass, then route
 * every proposal through the same policy + approval pipeline as a manual
 * analysis. Markets with no orderbook are skipped. XLM markets are scanned
 * FIRST so their mids feed the XLM rate map before any cross pair needs it.
 */
export async function runChainScan(): Promise<ScanOutcome> {
  const assets = config.scanAssets;
  const crossPairs = config.scanPairs;
  store.log(
    "ai",
    `Scanning ${assets.length} XLM market(s) + ${crossPairs.length} cross pair(s)...`,
  );

  const markets: MarketSnapshot[] = [];
  for (const asset of assets) {
    try {
      const snap = await getMarketSnapshot("XLM", asset, 8);
      if (snap.bids.length === 0 && snap.asks.length === 0) {
        store.log("info", `Skipping ${asset}: empty orderbook.`);
        continue;
      }
      feedXlmRate(snap);
      markets.push(snap);
    } catch (err) {
      store.log("info", `Skipping ${asset}: ${(err as Error).message}`);
    }
  }
  for (const pair of crossPairs) {
    try {
      const snap = await getMarketSnapshot(pair.base, pair.quote, 8);
      if (snap.bids.length === 0 && snap.asks.length === 0) {
        store.log("info", `Skipping ${pair.base}/${pair.quote}: empty orderbook.`);
        continue;
      }
      markets.push(snap);
    } catch (err) {
      store.log(
        "info",
        `Skipping ${pair.base}/${pair.quote}: ${(err as Error).message}`,
      );
    }
  }

  if (markets.length === 0) {
    store.log(
      "warn",
      "Chain scan found no liquid markets (check SCAN_ASSETS / network).",
    );
    return {
      reasoning: "No liquid markets to scan.",
      proposals: [],
      scanned: 0,
    };
  }

  // Split into TRADEABLE (clears the entry gates) and GATED (spread too wide or
  // 24h volume too thin). A gated book is a poor venue for a taker AND, in
  // practice, for a maker too (you'd only fill on a big adverse move, and the
  // thin ones may never fill). Only the tradeable set goes to the analyst, so
  // the scan reflects real opportunity instead of overselling the whole curated
  // universe - the rest are named in the log, not hidden.
  const gatedLabels: string[] = [];
  const tradeable: MarketSnapshot[] = [];
  // Pre-filter against the RISK-SCALED gates (same as checkPolicy), so a higher
  // volatilityTolerance actually surfaces wider-spread / thinner markets to the
  // analyst instead of the scan silently applying the LOW thresholds.
  const scanLimits = effectiveLimits(store.riskProfile);
  // EXPERT volatility: skip tokens whose 24h price swing exceeds the configured
  // max (null in basic mode → no 24h-swing gate, unchanged behavior).
  const maxVol = maxVolatility24hPct(store.riskProfile);
  for (const m of markets) {
    const reasons: string[] = [];
    if (
      scanLimits.maxEntrySpreadBps > 0 &&
      m.spreadBps != null &&
      m.spreadBps > scanLimits.maxEntrySpreadBps
    ) {
      reasons.push(`spread ${m.spreadBps.toFixed(0)}bps`);
    }
    const vol = m.stats.baseVolume24h;
    if (scanLimits.minVolume24h > 0 && vol != null && vol < scanLimits.minVolume24h) {
      reasons.push(`vol24h ${Number(vol.toFixed(1))}`);
    }
    const swing = m.stats.change24hPct;
    if (maxVol != null && swing != null && Math.abs(swing) > maxVol) {
      reasons.push(`24h swing ${Math.abs(swing).toFixed(1)}% > ${maxVol}%`);
    }
    const label =
      m.base === "XLM"
        ? m.quote.split(":")[0]
        : `${m.base.split(":")[0]}/${m.quote.split(":")[0]}`;
    if (reasons.length > 0) gatedLabels.push(`${label} (${reasons.join(", ")})`);
    else tradeable.push(m);
  }
  if (gatedLabels.length > 0) {
    store.log(
      "info",
      `Excluded ${gatedLabels.length} market(s) - too wide/thin to trade, not shown to the analyst: ${gatedLabels.join("; ")}.`,
    );
  }

  if (tradeable.length === 0) {
    store.log(
      "warn",
      `No tradeable markets this scan: all ${markets.length} failed the spread/volume gates. Nothing to analyze.`,
    );
    return {
      reasoning: "No tradeable markets after entry gates.",
      proposals: [],
      scanned: markets.length,
    };
  }

  store.log(
    "ai",
    `Analyzing ${tradeable.length} tradeable market(s) (of ${markets.length} scanned)...`,
  );
  const result = await analyzeChain(tradeable, tradingMemory());
  for (const t of result.toolTrace) store.log("info", `tool: ${t}`);
  store.log("ai", result.reasoning);

  const created: TradeProposal[] = [];
  if (result.proposals.length === 0) {
    store.log("ai", "AI proposed no trade from the scan.");
    store.log(
      "info",
      `No setup in the ${tradeable.length} tradeable book(s): ${tradeable
        .map((m) => briefNoEntry(snapToNoEntry(m)))
        .join("; ")}.`,
    );
  }

  // Rulebook divergences across the tradeable markets: where the AI's judgment
  // differed from the deterministic playbook. A skip the wallet couldn't fund is
  // tagged PHANTOM and reported separately, so the "real misses" count isn't
  // inflated by signals the wallet could never have taken.
  const held = await walletHeld();
  const proposedSide = new Map<string, TradeSide>();
  for (const p of result.proposals) {
    proposedSide.set(pairKey(p.baseAsset, p.quoteAsset), p.side);
  }
  const checks = tradeable
    .map((m) => {
      const baseline = baselineCall(m.stats, m.stats.lastPrice ?? midOf(m));
      const fundable =
        held && baseline.side
          ? isFundable(baseline.side, m.base, m.quote, held)
          : undefined;
      return divergenceNote(
        snapLabel(m),
        baseline,
        proposedSide.get(pairKey(m.base, m.quote)) ?? null,
        fundable,
      );
    })
    .filter((c): c is NonNullable<typeof c> => c != null && c.diverged);
  const real = checks.filter((c) => !c.phantom);
  const phantomTail =
    checks.length - real.length > 0
      ? ` (+ ${checks.length - real.length} phantom, unfundable)`
      : "";
  if (real.length > 0) {
    store.log(
      "info",
      `Rulebook divergences - ${real.length} REAL${phantomTail}: ${real.map((d) => d.note).join(" | ")}`,
    );
  } else {
    store.log(
      "info",
      `Rulebook check: AI matched the playbook on all fundable opportunities across ${tradeable.length} tradeable market(s)${phantomTail}.`,
    );
  }

  for (const p of result.proposals) {
    created.push(await intake(p));
  }
  return {
    reasoning: result.reasoning,
    proposals: created,
    scanned: markets.length,
  };
}

/**
 * MAKER-FIRST repricing: a post_only proposal is priced to REST at the live
 * touch (capture the spread) rather than cross it. Overwrite the stored
 * limitPrice with the joined-touch price so the builder, the ledger fallback
 * (reconcile/recordIncrementalFill book at this limit), the dashboard AND the
 * policy's non-crossing-maker gate all see the actual resting price. Run before
 * EVERY policy check (intake AND execution), so a maker the analyst priced
 * slightly off - or a bid that drifted since the analyst's snapshot - is never
 * false-blocked as a crossing taker. No-op for taker orders; if the touch is
 * missing we do NOT reprice (the policy crossing-maker check is the backstop).
 */
function repriceMaker(
  id: string,
  p: TradeProposal,
  context: PolicyContext,
): TradeProposal {
  if (!p.postOnly) return p;
  const maker = makerLimitPrice(
    p.side,
    context.bestBid,
    context.bestAsk,
    Number(p.limitPrice) || 0,
    config.limits.makerTickBps,
  );
  if (maker && maker !== p.limitPrice) {
    store.log(
      "info",
      `Repriced maker ${p.side} ${p.limitPrice} -> joined ${p.side === "buy" ? "bid" : "ask"} ${maker} (${p.baseAsset}/${p.quoteAsset}).`,
    );
    return store.updateProposal(id, { limitPrice: maker }) ?? p;
  }
  return p;
}

// AI/system insufficient-balance cooldown. After a balance block, suppress the
// SAME (pair, side) re-proposal for this long so the bot doesn't spin proposing
// a trade it cannot fund. Manual orders never enter intake() so are never gated.
// NOTE: a coarse time gate — depositing the missing asset mid-cooldown does NOT
// eagerly clear it; the side re-opens when the window expires (next scan).
const INSUFFICIENT_BALANCE_COOLDOWN_MS = 5 * 60_000;
const insufficientBalanceCooldownUntil = new Map<string, number>();
function balanceCooldownKey(base: string, quote: string, side: string): string {
  return `${base}|${quote}|${side}`.toUpperCase();
}

/** MANUAL vs AI for the structured trade log (system/monitor closes = AI). */
function initiatorTag(p: TradeProposal): "MANUAL" | "AI" {
  return p.initiator === "manual" ? "MANUAL" : "AI";
}

/** Record a (real or paper) fill to the structured TRADE log. Exported so the
 *  monitor's reconcile paths (late-landing + resting-offer partials) log too. */
export function logTradeFill(p: TradeProposal, txHash?: string): void {
  const amount = p.filledAmount ?? p.amount;
  const price = p.filledPrice ?? p.limitPrice;
  const total = Number(amount) * Number(price);
  const partial =
    p.filledAmount != null && Number(p.filledAmount) + 1e-7 < Number(p.amount);
  store.logTrade({
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    action: p.side === "buy" ? "BUY" : "SELL",
    amount: String(amount),
    price: String(price),
    totalValue: Number.isFinite(total) ? total.toFixed(7) : "0",
    initiator: initiatorTag(p),
    status: partial ? "PARTIAL" : "FILLED",
    ...(txHash ? { txHash } : {}),
    orderId: p.id,
  });
}

async function intake(
  p: ProposedTrade,
  meta?: { provider?: string; model?: string; initiator?: TradeProposal["initiator"] },
): Promise<TradeProposal> {
  const now = new Date().toISOString();

  // Insufficient-balance cooldown: drop a repeat proposal for the same pair+side
  // without persisting/streaming it (avoids spinning + feed spam). Logged so the
  // suppression is visible.
  const cdKey = balanceCooldownKey(p.baseAsset, p.quoteAsset, p.side);
  const cdUntil = insufficientBalanceCooldownUntil.get(cdKey) ?? 0;
  if (cdUntil && Date.now() >= cdUntil) insufficientBalanceCooldownUntil.delete(cdKey); // prune expired
  if (Date.now() < cdUntil) {
    const secs = Math.ceil((cdUntil - Date.now()) / 1000);
    store.log(
      "warn",
      `AI proposal suppressed (insufficient-balance cooldown): ${p.side} ` +
        `${p.baseAsset.split(":")[0]}/${p.quoteAsset.split(":")[0]} — ${secs}s remaining.`,
      {
        reason: "insufficient_balance_cooldown",
        base: p.baseAsset,
        quote: p.quoteAsset,
        side: p.side,
        secondsRemaining: secs,
      },
    );
    return {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      side: p.side,
      baseAsset: p.baseAsset,
      quoteAsset: p.quoteAsset,
      amount: p.amount,
      limitPrice: p.limitPrice,
      postOnly: p.postOnly,
      maxSlippageBps: p.maxSlippageBps,
      reason: p.reason,
      status: "blocked",
      policyViolations: [`Insufficient-balance cooldown: retry suppressed for ~${secs}s.`],
      initiator: meta?.initiator ?? "ai",
      provider: meta?.provider ?? aiProviderId(),
      model: meta?.model ?? aiModel(),
      confidence: p.confidence,
      targetPrice: p.targetPrice,
      invalidationPrice: p.invalidationPrice,
      horizon: p.horizon,
      paper: store.paperTrading || undefined,
    };
  }

  const proposal: TradeProposal = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    side: p.side,
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    amount: p.amount,
    limitPrice: p.limitPrice,
    postOnly: p.postOnly,
    maxSlippageBps: p.maxSlippageBps,
    reason: p.reason,
    status: "proposed",
    policyViolations: [],
    // Everything through intake() is AI- or system-initiated; the per-trade size
    // cap applies. Manual orders take the placeManualOrder() path instead.
    initiator: meta?.initiator ?? "ai",
    // Attribution: WHO proposed this (provider + model) is stored on every
    // proposal so hit-rates can later be compared per model / per source.
    provider: meta?.provider ?? aiProviderId(),
    model: meta?.model ?? aiModel(),
    confidence: p.confidence,
    confidenceScore: p.confidenceScore,
    targetPrice: p.targetPrice,
    invalidationPrice: p.invalidationPrice,
    horizon: p.horizon,
    // Tag the whole proposal as paper when a paper session is active, so it is
    // kept out of the persistent trade DB (see store.addProposal).
    paper: store.paperTrading || undefined,
  };
  store.addProposal(proposal);
  store.log(
    "trade",
    `Proposal ${shortId(proposal.id)}: ${p.side} ${p.amount} ${p.baseAsset} @ ${p.limitPrice} ${p.quoteAsset}` +
      `${p.confidence ? ` (${p.confidence} confidence)` : ""}`,
  );

  // Active risk profile, read LIVE (never cached): drives the effective limits,
  // the conviction gate and the drawdown pause for THIS proposal.
  const profile = store.riskProfile;
  // Risk-profile snapshot logged alongside every AI proposal (spec).
  store.log(
    "ai",
    `Risk profile @ proposal ${shortId(proposal.id)}: ${riskProfileSummary(profile)}`,
    { event: "risk_profile_snapshot", proposalId: proposal.id, token: p.baseAsset, riskProfile: profile },
  );
  // Structured AI-log: the proposal itself + the risk-profile snapshot.
  store.logAi({
    eventType: "proposal",
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    reasoning: p.reason,
    riskProfile: profile,
    ...(p.confidence ? { confidence: p.confidence } : {}),
    ...(typeof p.confidenceScore === "number" ? { confidenceScore: p.confidenceScore } : {}),
    direction: p.side,
    price: p.limitPrice,
  });
  store.logAi({
    eventType: "risk_profile",
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    reasoning: `Risk profile at proposal time: ${riskProfileSummary(profile)}`,
    riskProfile: profile,
  });

  // DRAWDOWN TOLERANCE: pause NEW entries (not risk-reducing exits) when the 24h
  // portfolio drawdown exceeds the profile threshold (null at HIGH = no pause).
  const ddThreshold = drawdownPausePct(profile);
  const dd = currentDrawdownPct(Date.now());
  if (
    ddThreshold != null &&
    dd >= ddThreshold &&
    !isRiskReducing(proposal, store.getPositions())
  ) {
    store.updateProposal(proposal.id, {
      status: "blocked",
      policyViolations: [
        `Risk: 24h portfolio drawdown ${dd.toFixed(1)}% >= ${ddThreshold}% pause threshold (drawdownTolerance=${profile.drawdownTolerance}).`,
      ],
    });
    const peak = drawdownPeak(Date.now());
    const ddMsg =
      `Paused by drawdown gate: 24h drawdown ${dd.toFixed(1)}% >= ${ddThreshold}% threshold` +
      ` (drawdownTolerance=${profile.drawdownTolerance})` +
      `${peak ? `; 24h peak ${peak.valueXlm} XLM @ ${new Date(peak.ts).toISOString()}` : ""}.`;
    store.log("ai", `Proposal ${shortId(proposal.id)} ${ddMsg}`, {
      event: "risk_constraint",
      reason: "drawdown_pause",
      drawdownPct: dd,
      threshold: ddThreshold,
      peak: peak ?? undefined,
      riskProfile: profile,
    });
    store.logAi({
      eventType: "risk_constraint",
      baseAsset: p.baseAsset,
      quoteAsset: p.quoteAsset,
      reasoning: ddMsg,
      riskProfile: profile,
    });
    return current(proposal.id);
  }

  const context = await marketContext(p.baseAsset, p.quoteAsset);
  // Reprice a post_only maker to the live touch BEFORE the gate, so it isn't
  // false-blocked as a crossing taker on a stale/imprecise analyst limit (it is
  // repriced again at execution against the freshest book).
  const priced = repriceMaker(proposal.id, proposal, context);
  const policy = checkPolicy({
    proposal: priced,
    context,
    daily: store.getDaily(),
    killSwitch: store.killSwitch,
    nowMs: Date.now(),
    positions: store.getPositions(),
    unrealizedPnl: store.unrealizedPnl,
    autoExecution: store.autoApprove && store.armed,
    limits: effectiveLimits(profile, profile.expertMode ? await availableXlmBalance() : undefined),
  });

  if (!policy.allowed) {
    store.updateProposal(proposal.id, {
      status: "blocked",
      policyViolations: policy.violations,
    });
    store.log(
      "warn",
      `Proposal ${shortId(proposal.id)} BLOCKED: ${policy.violations.join("; ")}`,
    );
    return current(proposal.id);
  }

  // Defensive automation: a RISK-REDUCING close/trim auto-executes whenever
  // execution is possible (live armed or paper), even in MANUAL-approval mode
  // and regardless of conviction. A reducing trade can only SHRINK exposure
  // (cross-zero flips are excluded by isRiskReducing), so a stop-loss is never
  // stranded behind a human who may be away - the gap that otherwise lets a
  // loser bleed in manual mode. Entries are unaffected: they fall through to the
  // approval + conviction gates below. When NOT armed, executeInner holds it for
  // approval anyway, so the gate stays correct.
  if (store.armed && isRiskReducing(proposal, store.getPositions())) {
    store.log(
      "trade",
      `Proposal ${shortId(proposal.id)} auto-executing: risk-reducing exit (no approval needed for closes).`,
    );
    await execute(proposal.id, true);
    return current(proposal.id);
  }

  // In auto-trade mode the manual approval gate is skipped, but the policy
  // engine still ran above (and runs again inside execute()).
  if (!store.autoApprove) {
    store.updateProposal(proposal.id, { status: "pending_approval" });
    store.log("trade", `Proposal ${shortId(proposal.id)} awaiting your approval.`);
    return current(proposal.id);
  }

  // Conviction gate: even in auto-trade, a call below the confidence bar is held
  // for a human. FAILS CLOSED on a missing/malformed confidence (parseProposal
  // yields undefined; an undefined confidence must never auto-submit).
  // EXPERT MODE: an exact numeric threshold (minConfidence). BASIC MODE: the
  // legacy TRADE-FREQUENCY label gate (LOW/MEDIUM require medium+; HIGH also
  // allows "low") — unchanged.
  if (profile.expertMode && profile.expert) {
    const threshold = minConfidenceScore(profile); // = expert.minConfidence
    const score = proposal.confidenceScore;
    if (typeof score !== "number" || score < threshold) {
      const heldMsg = `Proposal skipped: confidence ${
        typeof score === "number" ? score : "unstated"
      } < threshold ${threshold}.`;
      store.updateProposal(proposal.id, { status: "pending_approval" });
      store.log("trade", `Proposal ${shortId(proposal.id)} ${heldMsg}`);
      store.logAi({
        eventType: "rejected",
        baseAsset: proposal.baseAsset,
        quoteAsset: proposal.quoteAsset,
        reasoning: heldMsg,
        riskProfile: profile,
        ...(typeof score === "number" ? { confidenceScore: score } : {}),
      });
      return current(proposal.id);
    }
  } else {
    const minConf = minAutoConfidence(profile); // "low" | "medium"
    const conf = proposal.confidence;
    const meetsConviction =
      conf === "high" || conf === "medium" || (minConf === "low" && conf === "low");
    if (!meetsConviction) {
      const heldMsg = `Held for manual review: ${proposal.confidence ?? "unstated"} confidence (min to auto-submit: ${minConf}).`;
      store.updateProposal(proposal.id, { status: "pending_approval" });
      store.log("trade", `Proposal ${shortId(proposal.id)} ${heldMsg}`);
      store.logAi({
        eventType: "rejected",
        baseAsset: proposal.baseAsset,
        quoteAsset: proposal.quoteAsset,
        reasoning: heldMsg,
        riskProfile: profile,
        ...(proposal.confidence ? { confidence: proposal.confidence } : {}),
      });
      return current(proposal.id);
    }
  }

  store.log("trade", `Proposal ${shortId(proposal.id)} auto-approved.`);
  await execute(proposal.id, true);
  return current(proposal.id);
}

/**
 * Entry point for SYSTEM-generated proposals (the position monitor's stop-loss
 * closes). They run the exact same intake -> policy -> approval/auto pipeline
 * as AI proposals; `source` lands in the provider column for attribution.
 */
export async function submitSystemProposal(
  p: ProposedTrade,
  source: string,
): Promise<TradeProposal> {
  return intake(p, { provider: source, model: "", initiator: "system" });
}

export interface ManualOrderInput {
  baseAsset: string;
  quoteAsset: string;
  side: TradeSide;
  amount: string;
  limitPrice: string;
  maxSlippageBps?: number;
  /** Optional bracket: if both are given, the reward/risk gate applies and the
   *  position monitor will manage a stop from the invalidation level. */
  targetPrice?: string;
  invalidationPrice?: string;
}

/**
 * Place a MANUAL limit order from the dashboard. It skips the AI auto-approve /
 * conviction routing (you placing it IS the approval) but runs the EXACT same
 * execution path as every other trade: the full policy engine (kill switch,
 * whitelist, per-trade size cap, slippage / price-deviation, daily volume/trade/
 * loss caps, exposure, cooldown), the pre-sign preflight, the live-arm switch,
 * and the serial execution lock. Your exact limit price is used as-is (no maker
 * repricing): price it inside the spread to rest as a maker, or through it to
 * cross as a taker. With no target/invalidation the reward/risk gate is skipped
 * and the monitor won't auto-manage a stop; pass them to get both.
 *
 * Returns the resulting proposal: "submitted" (filled or resting), "blocked"
 * with policyViolations, "pending_approval" when live trading is OFF, or a
 * paper fill in paper mode.
 */
export async function placeManualOrder(
  input: ManualOrderInput,
): Promise<TradeProposal> {
  const now = new Date().toISOString();
  const proposal: TradeProposal = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    side: input.side,
    baseAsset: input.baseAsset,
    quoteAsset: input.quoteAsset,
    amount: input.amount,
    limitPrice: input.limitPrice,
    postOnly: false, // manual: honour the operator's exact price, no repricing
    maxSlippageBps: input.maxSlippageBps ?? config.limits.maxSlippageBps,
    reason: "Manual order placed from the dashboard.",
    status: "proposed",
    policyViolations: [],
    // MANUAL: the user chooses their own size, so the per-trade SIZE cap is
    // bypassed in checkPolicy. Every other risk gate still applies.
    initiator: "manual",
    provider: "manual",
    model: "",
    confidence: "high",
    targetPrice: input.targetPrice,
    invalidationPrice: input.invalidationPrice,
    paper: store.paperTrading || undefined,
  };
  store.addProposal(proposal);
  store.log(
    "trade",
    `Manual order ${shortId(proposal.id)}: ${input.side} ${input.amount} ` +
      `${input.baseAsset.split(":")[0]} @ ${input.limitPrice} ${input.quoteAsset.split(":")[0]}` +
      `${store.paperTrading ? " (paper)" : ""}.`,
  );
  // Attended (auto=false): the human placed it, so it runs the same gates an
  // approved proposal does, minus the AI conviction/auto-approve routing.
  await execute(proposal.id, false);
  return store.getProposal(proposal.id) ?? proposal;
}

export async function approve(id: string): Promise<TradeProposal | undefined> {
  const p = store.getProposal(id);
  if (!p) return undefined;
  if (p.status !== "pending_approval") {
    store.log("warn", `Cannot approve ${shortId(id)} in status "${p.status}".`);
    return p;
  }
  // A human clicked with the proposal card in front of them -> attended.
  await execute(id, false);
  return store.getProposal(id);
}

/**
 * Approve + execute WITHOUT a manual click. This is the programmatic
 * counterpart to approve(): it removes the human approval step but the
 * proposal still passes the full policy engine inside execute(), so risk
 * limits, whitelist, slippage, cooldown and the kill switch all still apply.
 */
export async function autoApprove(
  id: string,
): Promise<TradeProposal | undefined> {
  const p = store.getProposal(id);
  if (!p) return undefined;
  if (p.status !== "proposed" && p.status !== "pending_approval") {
    store.log(
      "warn",
      `Cannot auto-approve ${shortId(id)} in status "${p.status}".`,
    );
    return p;
  }
  store.log("trade", `Auto-approving ${shortId(id)} (no manual approval needed).`);
  await execute(id, true);
  return store.getProposal(id);
}

export function reject(id: string): TradeProposal | undefined {
  const p = store.getProposal(id);
  if (!p) return undefined;
  store.updateProposal(id, { status: "rejected" });
  store.log("trade", `Proposal ${shortId(id)} rejected.`);
  return store.getProposal(id);
}

/**
 * A serial queue tail. Every execution awaits the previous one and installs a
 * new tail that resolves when it finishes, so executions never overlap.
 */
let executeChain: Promise<void> = Promise.resolve();

/**
 * Serialize the whole build -> policy -> sign -> submit -> record path. Without
 * this, two CONCURRENT requests (two /api/scan calls, or /api/analyze racing
 * /api/auto-approve) can each pass checkPolicy against the SAME daily snapshot
 * before either calls recordSubmittedTrade - busting MAX_TRADES_PER_DAY, the
 * daily volume / loss caps and the cooldown - and can build on the SAME Horizon
 * sequence number, so the second submit fails with tx_bad_seq. Funnelling every
 * execution through one in-flight chain makes that sequence atomic.
 *
 * The new tail is released in `finally`, so a thrown execution advances the
 * queue instead of wedging it. Errors still propagate to the caller exactly as
 * before (executeInner already converts submit failures into a "failed"
 * proposal rather than throwing).
 *
 * Exported as runExclusive so the position monitor's own submissions (offer
 * cancels) share the SAME queue - otherwise a cancel could race a trade onto
 * the same Horizon sequence number and fail with tx_bad_seq.
 */
export function runExclusive<T>(fn: () => Promise<T>): Promise<T> {
  const prior = executeChain;
  let release!: () => void;
  executeChain = new Promise<void>((resolve) => {
    release = resolve;
  });
  return (async () => {
    await prior;
    try {
      return await fn();
    } finally {
      release();
    }
  })();
}

function execute(id: string, auto: boolean): Promise<void> {
  return runExclusive(() => executeInner(id, auto));
}

/** Build, sign and submit. Re-runs policy at execution time as a final gate. */
async function executeInner(id: string, auto: boolean): Promise<void> {
  let p = store.getProposal(id);
  if (!p) return;

  // Idempotency: approve() and autoApprove() check status BEFORE acquiring the
  // serial lock, so a double-clicked Approve - or approve() racing autoApprove()
  // on the same id - can queue TWO executions that both passed the pre-lock
  // check. The status -> "submitting" flip happens later, INSIDE this lock, so
  // without this guard the second run repeats the whole build -> sign -> submit
  // path: a duplicate ON-CHAIN order (the cooldown only incidentally blocks a
  // duplicate ENTRY; a risk-reducing trim or TRADE_COOLDOWN_SECONDS=0 is not
  // gated) plus a double-counted daily.tradeCount / volume / PnL fill. Refuse to
  // act on a proposal already in flight or done. "failed" is intentionally NOT
  // skipped so an operator can retry a failed submit.
  if (p.status === "submitting" || p.status === "submitted") {
    store.log(
      "warn",
      `Skipping ${shortId(id)}: already ${p.status} (duplicate execute ignored).`,
    );
    return;
  }

  const paper = store.paperTrading;

  // Live-only gates. Paper trading skips them: it needs no signing key and no
  // live-arm switch - it never touches the chain.
  if (!paper) {
    if (isReadOnly) {
      store.updateProposal(id, {
        status: "blocked",
        policyViolations: ["Read-only mode: no signing key configured."],
      });
      store.log("error", `Cannot execute ${shortId(id)}: read-only mode (no signing key).`);
      return;
    }
    // A signing key exists, but live trading is switched OFF on the dashboard.
    // Unlike the no-key case this is recoverable, so hold the proposal for
    // manual approval (don't kill it): flip to Live, then Approve to submit.
    if (!store.liveTrading) {
      store.updateProposal(id, {
        status: "pending_approval",
        error: "Live trading is OFF (read-only). Enable it on the dashboard, then approve.",
      });
      store.log("warn", `Proposal ${shortId(id)} held: live trading is OFF (read-only).`);
      return;
    }
  }

  // One market read, shared by the policy gate and the paper-fill simulation.
  const context = await marketContext(p.baseAsset, p.quoteAsset);

  // MAKER-FIRST repricing before the execution policy gate (shared with intake;
  // see repriceMaker). Re-joins the freshest touch in case the bid/ask moved
  // since intake.
  p = repriceMaker(id, p, context);

  const policy = checkPolicy({
    proposal: p,
    context,
    daily: store.getDaily(),
    killSwitch: store.killSwitch,
    nowMs: Date.now(),
    positions: store.getPositions(),
    unrealizedPnl: store.unrealizedPnl,
    // Unattended submissions fail CLOSED on missing market data.
    autoExecution: auto,
    // Same risk-scaled limits as intake (read live; manual orders keep their
    // own cap-bypass via proposal.initiator inside checkPolicy). Expert mode
    // sizes per order as a % of available balance.
    limits: effectiveLimits(
      store.riskProfile,
      store.riskProfile.expertMode ? await availableXlmBalance() : undefined,
    ),
  });
  if (!policy.allowed) {
    store.updateProposal(id, {
      status: "blocked",
      policyViolations: policy.violations,
    });
    store.log(
      "warn",
      `Proposal ${shortId(id)} blocked at execution: ${policy.violations.join("; ")}`,
    );
    return;
  }

  // PAPER mode: simulate the fill against the live book and book it exactly like
  // a real fill (same ledger, daily counters, outcome marks) - but never sign or
  // submit. This is the zero-risk forward test.
  if (paper) {
    const fill = simulatePaperFill(p, context);
    if (!fill) {
      store.updateProposal(id, {
        status: "blocked",
        policyViolations: ["(paper) no live order book to simulate a fill against."],
      });
      store.log("warn", `Proposal ${shortId(id)} (paper) blocked: no book to fill against.`);
      return;
    }
    const recorded =
      store.updateProposal(id, {
        status: "submitted",
        txHash: "paper",
        submittedAt: new Date().toISOString(),
        filledAmount: String(fill.filledBase),
        filledPrice: String(fill.avgPrice),
        error: undefined,
      }) ?? p;
    store.recordSubmittedTrade(recorded);
    store.log(
      "trade",
      `Proposal ${shortId(id)} PAPER-FILLED ${fill.filledBase} ${p.baseAsset} @ ~${fill.avgPrice} ${p.quoteAsset} (simulated; no on-chain submit).`,
    );
    logTradeFill(recorded, "paper");
    return;
  }

  // On-chain settlement pre-check: confirm trustline + spendable funds so we
  // don't sign a transaction that is guaranteed to fail (and burn a fee).
  const pre = await preflightCheck(p);
  if (!pre.ok) {
    const insufficient = pre.code === "insufficient_balance";
    // Spec-worded message for the funds case; generic for trustline/other.
    const violation = insufficient
      ? `Order rejected: insufficient ${pre.assetGiven} balance. Required: ${pre.required}, Available: ${pre.available}.`
      : `Preflight: ${pre.reason ?? "insufficient funds/trustline"}`;
    store.updateProposal(id, { status: "blocked", policyViolations: [violation] });
    store.log(
      "warn",
      `Proposal ${shortId(id)} blocked at preflight: ${pre.reason}`,
      insufficient
        ? {
            reason: "insufficient_balance",
            token: pre.assetGiven,
            required: pre.required,
            available: pre.available,
            initiator: p.initiator,
          }
        : { reason: pre.code, detail: pre.reason, initiator: p.initiator },
    );
    // A balance pre-check rejection is a TRADE-log event (spec).
    if (insufficient) {
      store.logTrade({
        baseAsset: p.baseAsset,
        quoteAsset: p.quoteAsset,
        action: "REJECTED",
        amount: p.amount,
        price: p.limitPrice,
        totalValue: (Number(p.amount) * Number(p.limitPrice)).toFixed(7),
        initiator: initiatorTag(p),
        status: "REJECTED",
        orderId: p.id,
      });
    }
    // AI/system: arm the cooldown so the same trade isn't re-proposed for 5 min.
    if (insufficient && p.initiator !== "manual") {
      const key = balanceCooldownKey(p.baseAsset, p.quoteAsset, p.side);
      insufficientBalanceCooldownUntil.set(key, Date.now() + INSUFFICIENT_BALANCE_COOLDOWN_MS);
      store.log(
        "warn",
        `${p.baseAsset.split(":")[0]}/${p.quoteAsset.split(":")[0]} ${p.side} on ` +
          `insufficient-balance cooldown for ${INSUFFICIENT_BALANCE_COOLDOWN_MS / 60_000} min.`,
        { reason: "insufficient_balance_cooldown_set", base: p.baseAsset, quote: p.quoteAsset, side: p.side },
      );
      store.logAi({
        eventType: "cooldown",
        baseAsset: p.baseAsset,
        quoteAsset: p.quoteAsset,
        reasoning: `Insufficient-balance cooldown armed for ${p.side} ${p.baseAsset.split(":")[0]}/${p.quoteAsset.split(":")[0]} (${INSUFFICIENT_BALANCE_COOLDOWN_MS / 60_000} min).`,
      });
    }
    return;
  }

  store.updateProposal(id, { status: "submitting", error: undefined });
  store.log("trade", `Submitting ${shortId(id)} to Stellar ${config.network}...`);
  try {
    const tx = await buildOfferTransaction(p);
    // Sign first and persist the hash BEFORE the network submit: if the
    // process dies mid-submit, the monitor can recover this row by hash
    // (recheckTimedOut) instead of leaving real on-chain exposure outside
    // every ledger and cap.
    const hash = signOnly(tx);
    store.updateProposal(id, { txHash: hash });
    const { offerResults } = await submitSigned(tx, hash);
    // Reconcile the REAL fill before recording the trade, so daily volume, the
    // PnL ledger and positions reflect what actually traded - not an optimistic
    // full fill at the limit. A null fill (timeout path) keeps the old
    // assume-full-fill behaviour via proposalToFill's limit-price fallback.
    const fill = reconcileOfferFill(p, offerResults);
    const patch: Partial<TradeProposal> = {
      status: "submitted",
      txHash: hash,
      submittedAt: new Date().toISOString(),
    };
    if (fill) {
      patch.filledAmount = String(fill.filledBase);
      patch.filledPrice = String(fill.avgPrice);
      // A resting remainder leaves an offer on the book - remember its id so
      // the position monitor can book later fills and cancel it when stale.
      if (fill.offerId) patch.offerId = fill.offerId;
      else if (Number(p.amount) - fill.filledBase > 1e-7) {
        // Timeout/effects path: the submit response (and its currentOffer id)
        // was lost, but an offer for the unfilled remainder rests on-chain.
        // Recover its id from the account's open offers so it isn't orphaned
        // (untracked = later fills never booked, stale-cancel never fires).
        const recovered = await recoverRestingOfferId(p);
        if (recovered) patch.offerId = recovered;
      }
    }
    const recorded = store.updateProposal(id, patch) ?? p;
    store.recordSubmittedTrade(recorded);
    store.log("trade", `Proposal ${shortId(id)} SUBMITTED. tx ${hash}`);
    logTradeFill(recorded, hash);
  } catch (err) {
    const msg = extractStellarError(err);
    store.updateProposal(id, { status: "failed", error: msg });
    store.log("error", `Proposal ${shortId(id)} FAILED: ${msg}`);
  }
}

async function marketContext(
  base: string,
  quote: string,
): Promise<PolicyContext> {
  try {
    // Depth 20: enough levels for the policy engine to WALK the book and price
    // a cap-size order, not just read the touch.
    const snap = await getMarketSnapshot(base, quote, 20);
    const levels = bookLevelsBase(snap);
    return {
      bestBid: snap.bestBid ?? undefined,
      bestAsk: snap.bestAsk ?? undefined,
      spreadBps: snap.spreadBps ?? undefined,
      baseVolume24h: snap.stats.baseVolume24h ?? undefined,
      bids: levels.bids,
      asks: levels.asks,
    };
  } catch {
    // Empty context: attended checks skip market gates; autoExecution fails
    // closed on it inside checkPolicy.
    return {};
  }
}

interface OfferFill {
  /** Base units that actually traded (0 if the whole order is resting). */
  filledBase: number;
  /** Volume-weighted price actually paid/received (quote per base). */
  avgPrice: number;
  /** Id of the RESTING offer left on the book (absent when fully filled). The
   *  position monitor uses it to book later fills + cancel stale offers. */
  offerId?: string;
}

function round7(n: number): number {
  return Number(n.toFixed(7));
}

export interface PaperFill {
  /** Base units the live book could absorb for this order. */
  filledBase: number;
  /** Volume-weighted price that size would actually pay/receive (quote/base). */
  avgPrice: number;
}

/**
 * Price a MAKER (post_only) order to REST at the live touch instead of crossing
 * it, so it CAPTURES the spread rather than paying it. Pure (no Horizon, no
 * store) so it is unit-testable.
 *
 *  - BUY:  join the bid (tickBps=0), or step `tickBps` BELOW it (a more passive
 *          resting price, deeper in the queue). Never priced ABOVE the bid
 *          (that would cross) and never worse - higher - than the analyst's
 *          worst-acceptable limit. So: min(joinPrice, analystLimit), then
 *          clamped to <= bestBid.
 *  - SELL: mirror at the ask: join it, or step `tickBps` ABOVE it; never below
 *          the ask, never below the analyst's floor. max(joinPrice,
 *          analystLimit), clamped to >= bestAsk.
 *
 * tickBps steps INSIDE (more passive); the clamp guarantees the price never
 * moves PAST the touch, so a post_only order always rests and never crosses.
 *
 * Returns null when the relevant touch (bid for a buy, ask for a sell) is
 * missing - the caller then leaves the analyst's limit untouched.
 */
export function makerLimitPrice(
  side: TradeProposal["side"],
  bestBid: number | undefined,
  bestAsk: number | undefined,
  analystLimit: number,
  tickBps: number,
): string | null {
  const step = Math.max(0, tickBps) / 10_000;
  if (side === "buy") {
    if (!(bestBid != null && bestBid > 0)) return null;
    // Step BELOW the bid (a more passive buy); clamp <= bid so it never crosses.
    const joinPrice = bestBid * (1 - step);
    // Respect the analyst's worst-acceptable bound (a ceiling for a buy), then
    // re-clamp to the bid so neither the bound nor a 0 tick can push us across.
    const priced = Math.min(joinPrice, analystLimit > 0 ? analystLimit : joinPrice);
    return String(round7(Math.min(priced, bestBid)));
  }
  if (!(bestAsk != null && bestAsk > 0)) return null;
  // Step ABOVE the ask (a more passive sell); floor at the ask so it never crosses.
  const joinPrice = bestAsk * (1 + step);
  const priced = Math.max(joinPrice, analystLimit > 0 ? analystLimit : joinPrice);
  return String(round7(Math.max(priced, bestAsk)));
}

/**
 * Simulate a marketable fill against the LIVE order book for paper trading.
 *
 * It walks the real depth (the same walkBook the policy engine uses), so the
 * simulated price reflects the spread AND the size impact of crossing the book
 * - exactly the friction a flat-cost backtest can't see, and exactly what
 * decides whether a thin-token "edge" is real or an aggregation artifact.
 *
 * A TAKER proposal (post_only falsy) is taken marketably with NO limit bound:
 * the policy engine already rejected sizes the book can't absorb within
 * slippage, so it fills the size at the honest VWAP. A MAKER (post_only)
 * proposal passes its (repriced) limitPrice as the walkBook bound, so the paper
 * fill matches live: only the marketable portion at/inside the touch fills and
 * the rest rests (a buy resting at the bid fills 0 against the asks until the
 * market comes to it). Returns null when there is no book to fill against.
 *
 * Pure (no Horizon, no store) so it is unit-testable like reconcileOfferFill.
 */
export function simulatePaperFill(
  p: TradeProposal,
  context: PolicyContext,
): PaperFill | null {
  const levels = p.side === "buy" ? context.asks : context.bids;
  const amount = Number(p.amount) || 0;
  if (!levels || levels.length === 0 || !(amount > 0)) return null;
  // Gate the limit-omission on !postOnly so paper matches live: a maker only
  // fills the marketable portion bounded by its resting price.
  const bound = p.postOnly ? Number(p.limitPrice) || undefined : undefined;
  const walk = walkBook(levels, amount, p.side, bound);
  if (!(walk.fillableBase > 0) || walk.vwap == null) return null;
  return {
    filledBase: round7(Math.min(walk.fillableBase, amount)),
    avgPrice: round7(walk.vwap),
  };
}

/**
 * Translate Horizon's manageOffer result(s) into the base amount that actually
 * traded and the average price achieved, so the ledger books the REAL fill
 * instead of optimistically assuming the whole limit order executed.
 *
 *  - sell: we sold `amountSold` base and received `amountBought` quote, so the
 *          realized price is amountBought / amountSold (quote per base).
 *  - buy:  we received `amountBought` base and paid `amountSold` quote, so the
 *          realized price is amountSold / amountBought (quote per base).
 *
 * Returns null when no offerResults are present (e.g. the submit timed out and
 * we polled the bare tx record) - the caller then falls back to assuming a full
 * fill at the limit price. A resting remainder (partial fill, or nothing
 * matched and the order sits on the book) is logged but NOT booked: those units
 * haven't traded yet. Later fills of a resting offer are not reconciled here
 * (documented limitation - would need async tracking by offer id).
 */
export function reconcileOfferFill(
  p: TradeProposal,
  offerResults: OfferResultLike[] | undefined,
): OfferFill | null {
  if (!offerResults || offerResults.length === 0) return null;

  // One manageOffer op per proposal; sum defensively in case Horizon ever
  // splits the result across slots. Capture the resting offer id (if any) so
  // the monitor can track later fills / cancel it when stale.
  let bought = 0;
  let sold = 0;
  let offerId: string | undefined;
  for (const r of offerResults) {
    bought += Number(r.amountBought) || 0;
    sold += Number(r.amountSold) || 0;
    const oid = r.currentOffer?.offerId;
    if (oid != null && offerId === undefined) offerId = String(oid);
  }

  const filledBase = p.side === "sell" ? sold : bought;
  const quoteLeg = p.side === "sell" ? bought : sold;
  const requested = Number(p.amount) || 0;

  if (!(filledBase > 0) || !(quoteLeg > 0)) {
    store.log(
      "trade",
      `Proposal ${shortId(p.id)} did not fill immediately; ${requested} ${p.baseAsset} resting on the order book.`,
    );
    return { filledBase: 0, avgPrice: Number(p.limitPrice) || 0, offerId };
  }

  const avgPrice = quoteLeg / filledBase;
  const resting = round7(requested - filledBase);
  if (resting > 1e-7) {
    store.log(
      "trade",
      `Proposal ${shortId(p.id)} partially filled ${round7(filledBase)}/${requested} ${p.baseAsset} @ ~${round7(avgPrice)} ${p.quoteAsset}; ${resting} resting on the book.`,
    );
  }
  return { filledBase: round7(filledBase), avgPrice: round7(avgPrice), offerId };
}

/**
 * Best-effort recovery of a resting offer's id when the submit response (and
 * its currentOffer) was lost to a timeout: match the account's open offers by
 * the proposal's legs and limit price. Returns undefined when no match - the
 * caller keeps the proposal untracked rather than guessing.
 */
export async function recoverRestingOfferId(
  p: TradeProposal,
): Promise<string | undefined> {
  const pub = signerPublicKey();
  if (!pub) return undefined;
  try {
    const offers = await getOpenOffers(pub);
    const selling = p.side === "sell" ? p.baseAsset : p.quoteAsset;
    const buying = p.side === "sell" ? p.quoteAsset : p.baseAsset;
    const limit = Number(p.limitPrice) || 0;
    if (!(limit > 0)) return undefined;
    // Offer price is buying-per-selling: equals the limit for a sell (quote
    // per base) and its inverse for a buy (base per quote).
    const expected = p.side === "sell" ? limit : 1 / limit;
    for (const o of offers) {
      if (o.selling !== selling || o.buying !== buying) continue;
      const op = Number(o.price) || 0;
      if (op > 0 && Math.abs(op - expected) / expected < 0.001) return o.id;
    }
  } catch {
    // Horizon unavailable: stay untracked; the monitor's untracked-offer
    // warning still surfaces it to the operator.
  }
  return undefined;
}

function current(id: string): TradeProposal {
  const p = store.getProposal(id);
  if (!p) throw new Error(`Proposal ${id} vanished from store.`);
  return p;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

function extractStellarError(err: unknown): string {
  const e = err as {
    response?: { data?: { extras?: { result_codes?: unknown } } };
    message?: string;
  };
  const codes = e.response?.data?.extras?.result_codes;
  if (codes) return `${e.message ?? "submit failed"}: ${JSON.stringify(codes)}`;
  return e.message ?? String(err);
}
