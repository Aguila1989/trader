import { config } from "../config";
import { canonicalAsset } from "../stellar/assets";
import { curatedTier } from "../stellar/universe";
import { walkBook } from "../stellar/indicators";
import { isXlmSpec, xlmNotional } from "../trading/positions";
import type {
  DailyState,
  PolicyContext,
  PolicyResult,
  PositionSummary,
  TradeProposal,
} from "../types";

// Stellar amounts carry 7 decimals; treat anything smaller as zero.
const EPS = 1e-7;

export interface PolicyInputs {
  proposal: TradeProposal;
  context: PolicyContext;
  daily: DailyState;
  killSwitch: boolean;
  nowMs: number;
  /** Open positions from the FIFO ledger. Enables the exposure caps and the
   *  risk-reducing detection (a trade that SHRINKS a position is exempted from
   *  activity caps so a stop-loss can never be locked out). */
  positions?: PositionSummary[];
  /** Mark-to-market PnL of open positions in XLM (from the position monitor).
   *  Only its LOSS side counts toward the daily-loss halt - otherwise a book
   *  of bleeding positions never trips MAX_DAILY_LOSS because nothing is
   *  realized. */
  unrealizedPnl?: number;
  /**
   * True when this check gates an UNATTENDED submission (auto-trade, no human
   * looking at fresh data). Market checks then fail CLOSED: missing orderbook
   * or volume data blocks the trade instead of silently skipping the check.
   */
  autoExecution?: boolean;
}

/**
 * The risk gate. The AI's proposal must clear every check here before any
 * transaction is built or signed. Returns the full list of violations so the
 * dashboard can show exactly why a trade was blocked.
 *
 * Risk-REDUCING trades (ones that shrink an existing position) get a narrower
 * rulebook: kill switch, whitelist, sanity and price-deviation still apply,
 * but cooldown, daily activity caps, liquidity gates and the loss-limit halt
 * do not - blocking the exit is worse than taking it.
 */
export function checkPolicy(inp: PolicyInputs): PolicyResult {
  const { proposal, context, daily, killSwitch, nowMs } = inp;
  const { limits } = config;
  const violations: string[] = [];

  // 0. Kill switch overrides everything - including exits. It is the
  //    operator's explicit "stop the world".
  if (killSwitch) {
    violations.push("Kill switch is active - all trading halted.");
  }

  // 1. Asset whitelist - both legs must be allowed and distinct.
  const whitelist = new Set(limits.assetWhitelist.map(safeCanon));
  const baseC = safeCanon(proposal.baseAsset);
  const quoteC = safeCanon(proposal.quoteAsset);
  if (!whitelist.has(baseC)) {
    violations.push(`Base asset ${proposal.baseAsset} is not whitelisted.`);
  }
  if (!whitelist.has(quoteC)) {
    violations.push(`Quote asset ${proposal.quoteAsset} is not whitelisted.`);
  }
  if (baseC === quoteC) {
    violations.push("Base and quote assets are identical.");
  }

  // 2. Numeric sanity.
  const amount = Number(proposal.amount);
  const price = Number(proposal.limitPrice);
  if (!(amount > 0)) violations.push("Amount must be a positive number.");
  if (!(price > 0)) violations.push("Limit price must be a positive number.");

  // Position-aware framing: does this trade INCREASE or REDUCE exposure on its
  // pair? newNet is the pair's net base quantity if the trade fully fills.
  const positions = inp.positions ?? [];
  const net = pairNet(positions, baseC, quoteC);
  const signedDelta =
    amount > 0 ? (proposal.side === "buy" ? amount : -amount) : 0;
  const newNet = net + signedDelta;
  // Risk-reducing = strictly shrinks the position WITHOUT flipping its sign.
  // A trade that crosses zero (e.g. long +6, SELL 10 -> short -4) lands smaller
  // in magnitude but opens fresh directional risk on the OTHER side, so it must
  // NOT be exempted from the entry gates - only a trim or a full close (to
  // exactly zero) is a genuine reduction.
  const sameSide =
    net === 0 || newNet === 0 || Math.sign(newNet) === Math.sign(net);
  const riskReducing = sameSide && Math.abs(newNet) < Math.abs(net) - EPS;

  // 3. Per-trade size cap (tier-aware), tapered as the daily loss budget burns.
  //    A risk-reducing trade may always be as large as the position it closes.
  const baseCap = maxAmountForPair(proposal.baseAsset, proposal.quoteAsset);
  const taper = lossTaper(
    daily.realizedPnl,
    inp.unrealizedPnl ?? 0,
    limits.maxDailyLoss,
  );
  let cap = baseCap * taper;
  if (riskReducing) cap = Math.max(cap, Math.abs(net));
  if (amount > cap + EPS) {
    violations.push(
      taper < 1 && !riskReducing
        ? `Amount ${amount} exceeds max per trade ${round7(cap)} (cap ${baseCap} tapered x${taper} - ${Math.round(
            lossBudgetUsed(daily.realizedPnl, inp.unrealizedPnl ?? 0, limits.maxDailyLoss) * 100,
          )}% of the daily loss budget is used).`
        : `Amount ${amount} exceeds max per trade ${round7(cap)}.`,
    );
  }

  // 4. Daily caps - skipped for risk-reducing trades (closing is what brings
  //    risk DOWN; the halt must not lock losing positions open).
  if (!riskReducing) {
    if (daily.tradeCount >= limits.maxTradesPerDay) {
      violations.push(
        `Daily trade count ${daily.tradeCount} reached cap ${limits.maxTradesPerDay}.`,
      );
    }
    // Daily volume is XLM-normalized (store.recordSubmittedTrade books it that
    // way) so both sides of this comparison share one unit across pairs.
    const notional = amount > 0 && price > 0 ? xlmNotional(baseC, quoteC, amount, price) : 0;
    if (notional > 0 && daily.volume + notional > limits.maxDailyVolume) {
      violations.push(
        `Trade would push daily volume past cap ${limits.maxDailyVolume} (XLM-equivalent).`,
      );
    }
    // Loss halt counts realized PLUS the unrealized LOSS side of open marks -
    // otherwise ten open positions all deep red would never trip the limit.
    const unrealizedLoss = Math.min(0, inp.unrealizedPnl ?? 0);
    const effectivePnl = daily.realizedPnl + unrealizedLoss;
    if (effectivePnl <= -Math.abs(limits.maxDailyLoss)) {
      violations.push(
        `Daily loss limit ${limits.maxDailyLoss} XLM reached ` +
          `(realized ${daily.realizedPnl}${unrealizedLoss < 0 ? ` + unrealized ${round7(unrealizedLoss)}` : ""} XLM). ` +
          `Only risk-reducing exits are allowed.`,
      );
    }
  }

  // 5. Slippage: declared cap + deviation from live market (all trades - it
  //    bounds the price of exits too).
  if (proposal.maxSlippageBps > limits.maxSlippageBps) {
    violations.push(
      `Declared slippage ${proposal.maxSlippageBps}bps exceeds cap ${limits.maxSlippageBps}bps.`,
    );
  }
  const ref = proposal.side === "buy" ? context.bestAsk : context.bestBid;
  if (ref && ref > 0 && price > 0) {
    const deviationBps = Math.abs((price - ref) / ref) * 10_000;
    // Buying above the ask, or selling below the bid, is paying away slippage.
    const worseThanMarket = proposal.side === "buy" ? price > ref : price < ref;
    if (worseThanMarket && deviationBps > limits.maxSlippageBps) {
      violations.push(
        `Limit price ${price} is ${deviationBps.toFixed(0)}bps off market ${ref} (cap ${limits.maxSlippageBps}bps).`,
      );
    }
  }

  // 5b. Size-vs-depth: price the FULL amount against the live book (no limit
  //     bound - the limit already caps the worst fill; this asks whether the
  //     MARKET can absorb the size at all). A tight touch with nothing behind
  //     it means a cap-size order either sweeps far past the touch or mostly
  //     rests as stale-offer bait - both are entries this bot shouldn't open.
  //     Risk-increasing only.
  if (!riskReducing && ref && ref > 0 && amount > 0) {
    const levels = proposal.side === "buy" ? context.asks : context.bids;
    if (levels && levels.length > 0) {
      const walk = walkBook(levels, amount, proposal.side);
      if (walk.fillableBase < amount - EPS) {
        violations.push(
          `The visible ${proposal.side === "buy" ? "ask" : "bid"} side holds only ` +
            `~${round7(walk.fillableBase)} of the ${amount} proposed - the market cannot absorb this size.`,
        );
      } else if (walk.vwap != null) {
        const sweepBps =
          proposal.side === "buy"
            ? ((walk.vwap - ref) / ref) * 10_000
            : ((ref - walk.vwap) / ref) * 10_000;
        if (sweepBps > limits.maxSlippageBps) {
          violations.push(
            `Filling ${amount} would sweep the book ~${sweepBps.toFixed(0)}bps past the touch ` +
              `(cap ${limits.maxSlippageBps}bps) - the book is too thin for this size.`,
          );
        }
      }
    }
  }

  // 6. Liquidity gates (risk-increasing entries only): refuse to OPEN risk in
  //    markets too wide or too dead to exit cleanly.
  if (!riskReducing) {
    if (
      limits.maxEntrySpreadBps > 0 &&
      context.spreadBps != null &&
      context.spreadBps > limits.maxEntrySpreadBps
    ) {
      violations.push(
        `Spread ${context.spreadBps.toFixed(0)}bps exceeds entry cap ${limits.maxEntrySpreadBps}bps - too wide to trade into.`,
      );
    }
    if (
      limits.minVolume24h > 0 &&
      context.baseVolume24h != null &&
      context.baseVolume24h < limits.minVolume24h
    ) {
      violations.push(
        `24h volume ${round7(context.baseVolume24h)} is below the minimum ${limits.minVolume24h} - market too thin.`,
      );
    }
    // Unattended submissions fail CLOSED on missing market data: an outage
    // must not mean "all market checks silently skipped".
    if (inp.autoExecution) {
      if (context.bestBid == null || context.bestAsk == null) {
        violations.push(
          "No live orderbook data - auto-execution requires fresh market context (fails closed).",
        );
      }
      if (limits.minVolume24h > 0 && context.baseVolume24h == null) {
        violations.push(
          "No 24h volume data - auto-execution requires liquidity data (fails closed).",
        );
      }
    }
  }

  // 7. Exposure caps (risk-increasing only): daily VOLUME bounds activity, not
  //    accumulation - within it the bot could still pile up one big directional
  //    book. Cap the net position per pair and the XLM-equivalent total.
  if (!riskReducing && amount > 0 && price > 0) {
    const pairCap = baseCap * Math.max(1, limits.pairExposureMultiplier);
    if (Math.abs(newNet) > pairCap + EPS) {
      violations.push(
        `Trade would grow net ${baseC}/${quoteC} exposure to ${round7(Math.abs(newNet))} base units ` +
          `(cap ${round7(pairCap)} = per-trade ${baseCap} x ${Math.max(1, limits.pairExposureMultiplier)}).`,
      );
    }
    if (limits.maxOpenExposure > 0) {
      const currentTotal = totalExposureXlm(positions);
      const othersTotal = currentTotal - positionExposureXlm(positions, baseC, quoteC);
      const newTotal = othersTotal + xlmNotional(baseC, quoteC, newNet, price);
      if (newTotal > currentTotal + EPS && newTotal > limits.maxOpenExposure + EPS) {
        violations.push(
          `Trade would push total open exposure to ~${round7(newTotal)} XLM-equivalent ` +
            `(cap ${limits.maxOpenExposure}).`,
        );
      }
    }
  }

  // 8. Reward/risk: when the analyst states a target AND an invalidation level,
  //    they must point the right way and clear the minimum ratio. (Entries only.)
  //    Unattended entries fail CLOSED when the bracket is missing: the prompt
  //    demands both fields on every proposal, so an entry without a stated
  //    stop must never submit without a human looking at it.
  if (!riskReducing && limits.minRiskReward > 0 && inp.autoExecution) {
    const t = Number(proposal.targetPrice ?? "");
    const inv = Number(proposal.invalidationPrice ?? "");
    if (!(t > 0) || !(inv > 0)) {
      violations.push(
        "Missing or invalid target_price/invalidation_price - auto-execution requires a stated bracket (fails closed).",
      );
    }
  }
  if (
    !riskReducing &&
    limits.minRiskReward > 0 &&
    price > 0 &&
    proposal.targetPrice != null &&
    proposal.invalidationPrice != null
  ) {
    const target = Number(proposal.targetPrice);
    const invalidation = Number(proposal.invalidationPrice);
    if (target > 0 && invalidation > 0) {
      const reward =
        proposal.side === "buy" ? target - price : price - target;
      const risk =
        proposal.side === "buy" ? price - invalidation : invalidation - price;
      if (reward <= 0 || risk <= 0) {
        violations.push(
          `target_price/invalidation_price are inconsistent with a ${proposal.side} at ${price} ` +
            `(target must sit on the profit side, invalidation on the loss side).`,
        );
      } else if (reward / risk < limits.minRiskReward) {
        violations.push(
          `Reward/risk ${(reward / risk).toFixed(2)} is below the minimum ${limits.minRiskReward} ` +
            `(target ${target}, invalidation ${invalidation}, entry ${price}).`,
        );
      }
    }
  }

  // 9. Staleness: a proposal priced minutes ago must not execute on a market
  //    that has moved on. (The analyst/monitor can always re-propose.)
  if (limits.maxProposalAgeSeconds > 0) {
    const created = Date.parse(proposal.createdAt);
    if (Number.isFinite(created)) {
      const ageSec = (nowMs - created) / 1000;
      if (ageSec > limits.maxProposalAgeSeconds) {
        violations.push(
          `Proposal is ${Math.round(ageSec)}s old (max ${limits.maxProposalAgeSeconds}s) - re-analyze for a fresh price.`,
        );
      }
    }
  }

  // 10. Cooldown between submitted trades (entries only - an exit must not wait).
  if (!riskReducing && daily.lastTradeAt) {
    const elapsed = (nowMs - new Date(daily.lastTradeAt).getTime()) / 1000;
    if (elapsed < limits.cooldownSeconds) {
      violations.push(
        `Cooldown active: ${Math.ceil(limits.cooldownSeconds - elapsed)}s remaining.`,
      );
    }
  }

  return { allowed: violations.length === 0, violations };
}

function safeCanon(spec: string): string {
  try {
    return canonicalAsset(spec);
  } catch {
    return spec.trim();
  }
}

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/** Net base quantity this system holds on the given pair (0 when flat). */
function pairNet(
  positions: PositionSummary[],
  baseC: string,
  quoteC: string,
): number {
  for (const p of positions) {
    if (safeCanon(p.base) === baseC && safeCanon(p.quote) === quoteC) {
      return p.netQty;
    }
  }
  return 0;
}

/** XLM-equivalent absolute exposure of one position (avg entry as the rate). */
function positionExposureXlm(
  positions: PositionSummary[],
  baseC: string,
  quoteC: string,
): number {
  for (const p of positions) {
    if (safeCanon(p.base) === baseC && safeCanon(p.quote) === quoteC) {
      return xlmNotional(p.base, p.quote, p.netQty, p.avgPrice);
    }
  }
  return 0;
}

/** Sum of XLM-equivalent absolute exposure across all open positions. */
export function totalExposureXlm(positions: PositionSummary[]): number {
  return round7(
    positions.reduce(
      (s, p) => s + xlmNotional(p.base, p.quote, p.netQty, p.avgPrice),
      0,
    ),
  );
}

/** Fraction (0..1+) of the daily loss budget consumed by realized + open losses. */
function lossBudgetUsed(
  realizedPnl: number,
  unrealizedPnl: number,
  maxDailyLoss: number,
): number {
  if (!(maxDailyLoss > 0)) return 0;
  const loss = Math.max(0, -(realizedPnl + Math.min(0, unrealizedPnl)));
  return loss / maxDailyLoss;
}

/**
 * Per-trade size multiplier that TAPERS as the daily loss budget burns, instead
 * of trading full size right up to the hard halt. Full size while less than
 * half the budget is used, then a linear ramp down to 25% at the limit (where
 * the loss gate halts entries anyway).
 */
export function lossTaper(
  realizedPnl: number,
  unrealizedPnl: number,
  maxDailyLoss: number,
): number {
  const used = lossBudgetUsed(realizedPnl, unrealizedPnl, maxDailyLoss);
  if (used <= 0.5) return 1;
  if (used >= 1) return 0.25;
  return Number((1 - ((used - 0.5) / 0.5) * 0.75).toFixed(4));
}

/**
 * Effective per-trade size cap for a pair RIGHT NOW: the tier cap scaled by the
 * loss-budget taper. This is what the analyst is told in its prompt, so the
 * model never proposes a size the policy engine would then block.
 */
export function effectiveCapForPair(
  base: string,
  quote: string,
  realizedPnl: number,
  unrealizedPnl: number,
): number {
  return round7(
    maxAmountForPair(base, quote) *
      lossTaper(realizedPnl, unrealizedPnl, config.limits.maxDailyLoss),
  );
}

/**
 * Effective per-trade size cap for a pair, in BASE-asset units (XLM for every
 * chain-scan trade). High-tier curated assets (deep blue-chip stablecoins) lift
 * the cap to maxAmountPerTradeHigh, but ONLY when EVERY non-XLM leg is high-tier;
 * any low-tier or unknown leg keeps the conservative standard maxAmountPerTrade.
 */
export function maxAmountForPair(base: string, quote: string): number {
  const std = config.limits.maxAmountPerTrade;
  const high = Math.max(config.limits.maxAmountPerTradeHigh, std);
  // Caps are in BASE-asset units and the HIGH cap is calibrated for the
  // chain-scan shape (base = XLM). Any pair whose base is NOT XLM - cross
  // pairs like USDC/EURC but also inverted manual pairs like USDC/XLM - keeps
  // the conservative standard cap: 50 USDC is ~5x the real size of 50 XLM.
  if (!isXlmSpec(base)) return std;
  if (isXlmSpec(quote)) return std; // degenerate XLM/XLM
  return curatedTier(quote) === "high" ? high : std;
}
