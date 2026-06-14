import { randomUUID } from "node:crypto";
import { config, isReadOnly } from "../config";
import { store } from "./store";
import { aiModel, aiProviderId } from "../ai";
import { checkPolicy } from "../policy/engine";
import {
  bookLevelsBase,
  getMarketSnapshot,
  getOpenOffers,
  type MarketSnapshot,
} from "../stellar/market";
import { walkBook } from "../stellar/indicators";
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
  analyze,
  analyzeChain,
  type ProposedTrade,
  type RecentOutcome,
  type TradingMemory,
} from "../claude/agent";
import type { PolicyContext, TradeProposal } from "../types";

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

/** Ask the AI to look at a market, then route any proposals through policy. */
export async function runAnalysis(
  baseAsset: string,
  quoteAsset: string,
): Promise<AnalysisOutcome> {
  store.log("ai", `Analyzing ${baseAsset}/${quoteAsset}...`);
  const result = await analyze(baseAsset, quoteAsset, tradingMemory());
  for (const t of result.toolTrace) store.log("info", `tool: ${t}`);
  store.log("ai", result.reasoning);

  const created: TradeProposal[] = [];
  if (result.proposals.length === 0) {
    store.log("ai", "AI proposed no trade.");
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

  // Visibility: list the scanned markets that fail the ENTRY gates, so it's
  // clear from the log why the analyst skips them (it is told entries there
  // would be blocked, so it doesn't waste tool calls or proposals on them).
  const gated = markets
    .map((m) => {
      const reasons: string[] = [];
      if (
        config.limits.maxEntrySpreadBps > 0 &&
        m.spreadBps != null &&
        m.spreadBps > config.limits.maxEntrySpreadBps
      ) {
        reasons.push(`spread ${m.spreadBps.toFixed(0)}bps`);
      }
      const vol = m.stats.baseVolume24h;
      if (config.limits.minVolume24h > 0 && vol != null && vol < config.limits.minVolume24h) {
        reasons.push(`vol24h ${Number(vol.toFixed(1))}`);
      }
      const label =
        m.base === "XLM"
          ? m.quote.split(":")[0]
          : `${m.base.split(":")[0]}/${m.quote.split(":")[0]}`;
      return reasons.length > 0 ? `${label} (${reasons.join(", ")})` : null;
    })
    .filter((s): s is string => s !== null);
  if (gated.length > 0) {
    store.log(
      "info",
      `Entry gates: ${gated.join("; ")} fail MAX_ENTRY_SPREAD_BPS/MIN_VOLUME_24H - entries there would be blocked, so the analyst is told to skip them.`,
    );
  }

  store.log("ai", `Analyzing ${markets.length} scanned market(s)...`);
  const result = await analyzeChain(markets, tradingMemory());
  for (const t of result.toolTrace) store.log("info", `tool: ${t}`);
  store.log("ai", result.reasoning);

  const created: TradeProposal[] = [];
  if (result.proposals.length === 0) {
    store.log("ai", "AI proposed no trade from the scan.");
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

async function intake(
  p: ProposedTrade,
  meta?: { provider?: string; model?: string },
): Promise<TradeProposal> {
  const now = new Date().toISOString();
  const proposal: TradeProposal = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    side: p.side,
    baseAsset: p.baseAsset,
    quoteAsset: p.quoteAsset,
    amount: p.amount,
    limitPrice: p.limitPrice,
    maxSlippageBps: p.maxSlippageBps,
    reason: p.reason,
    status: "proposed",
    policyViolations: [],
    // Attribution: WHO proposed this (provider + model) is stored on every
    // proposal so hit-rates can later be compared per model / per source.
    provider: meta?.provider ?? aiProviderId(),
    model: meta?.model ?? aiModel(),
    confidence: p.confidence,
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

  const policy = checkPolicy({
    proposal,
    context: await marketContext(p.baseAsset, p.quoteAsset),
    daily: store.getDaily(),
    killSwitch: store.killSwitch,
    nowMs: Date.now(),
    positions: store.getPositions(),
    unrealizedPnl: store.unrealizedPnl,
    autoExecution: store.autoApprove && store.armed,
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

  // In auto-trade mode the manual approval gate is skipped, but the policy
  // engine still ran above (and runs again inside execute()).
  if (!store.autoApprove) {
    store.updateProposal(proposal.id, { status: "pending_approval" });
    store.log("trade", `Proposal ${shortId(proposal.id)} awaiting your approval.`);
    return current(proposal.id);
  }

  // Conviction gate: even in auto-trade, a LOW-confidence call is held for a
  // human - the model said it isn't sure, so an unattended submit is wrong.
  if (proposal.confidence === "low") {
    store.updateProposal(proposal.id, { status: "pending_approval" });
    store.log(
      "trade",
      `Proposal ${shortId(proposal.id)} held for manual review: low confidence.`,
    );
    return current(proposal.id);
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
  return intake(p, { provider: source, model: "" });
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
  const p = store.getProposal(id);
  if (!p) return;

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
    return;
  }

  // On-chain settlement pre-check: confirm trustline + spendable funds so we
  // don't sign a transaction that is guaranteed to fail (and burn a fee).
  const pre = await preflightCheck(p);
  if (!pre.ok) {
    store.updateProposal(id, {
      status: "blocked",
      policyViolations: [`Preflight: ${pre.reason ?? "insufficient funds/trustline"}`],
    });
    store.log(
      "warn",
      `Proposal ${shortId(id)} blocked at preflight: ${pre.reason}`,
    );
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
 * Simulate a marketable fill against the LIVE order book for paper trading.
 *
 * It walks the real depth (the same walkBook the policy engine uses), so the
 * simulated price reflects the spread AND the size impact of crossing the book
 * - exactly the friction a flat-cost backtest can't see, and exactly what
 * decides whether a thin-token "edge" is real or an aggregation artifact. No
 * limit bound: a paper entry is taken marketably (the policy engine already
 * rejected sizes the book can't absorb within slippage), so this fills the size
 * at the honest VWAP. Returns null when there is no book to fill against.
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
  const walk = walkBook(levels, amount, p.side);
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
