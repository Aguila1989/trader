import { realizedToXlm } from "../trading/positions";
import type { TradeSide } from "../types";
import type {
  ArmAttribution,
  ClosedTrade,
  EvalArmKey,
  FillFidelity,
  OpenLotSummary,
  PaperFill,
  RegimeBreakdown,
} from "./types";
import { armKeyOf } from "./types";

/**
 * Per-arm PnL ATTRIBUTION with full cost accounting.
 *
 * This turns a stream of conservative paper fills into the honest realized
 * record: signed FIFO lot matching (mirroring src/trading/positions.ts — same
 * signed-lot convention, so a buy-then-sell and a sell-then-buy both realize
 * correctly), gross-vs-net PnL, an explicit split of WHERE the money went (fees
 * paid, rebates earned, implementation shortfall vs the decision price), plus
 * hit-rate, average R, drawdown, and per-REGIME / per-VENUE breakdowns.
 *
 * The decomposition is the point. Gross PnL is computed from ACTUAL fill prices,
 * so spread + slippage are already baked into it; `slippageQuote` re-exposes how
 * much of that gross was implementation shortfall vs a frictionless fill at the
 * decision price. A maker capturing the spread shows a NEGATIVE shortfall (a
 * gain); a taker crossing shows a positive one. Net PnL is gross minus fees —
 * and fees can be negative when a venue pays a maker rebate.
 *
 * All PnL leaves this module normalized to XLM (realizedToXlm), so arms trading
 * different quote assets are summable — 1 USDC of profit and 1 XLM of profit are
 * never naively added. The per-quote raw split is kept in `byQuote` for audit.
 */

const EPS = 1e-7;

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/** A FIFO lot. qty is signed: positive = long base, negative = short base. */
interface Lot {
  qty: number;
  /** Actual fill price of the opening leg (quote per base). */
  price: number;
  /** Decision reference price at the opening leg (for slippage). */
  refPrice: number;
  /** Per-unit fee paid opening this lot (quote units; signed, rebate < 0). */
  feePerUnit: number;
  openSide: TradeSide;
  ts: string;
  stopPrice?: number;
  fidelity: FillFidelity;
  regime: string | null;
}

/** 'modeled-maker' is strictly weaker than 'observed-taker'. */
function weakestFidelity(a: FillFidelity, b: FillFidelity): FillFidelity {
  return a === "modeled-maker" || b === "modeled-maker"
    ? "modeled-maker"
    : "observed-taker";
}

function pairKey(base: string, quote: string): string {
  return `${base}/${quote}`;
}

function signedQty(side: TradeSide, base: number): number {
  return side === "buy" ? base : -base;
}

/**
 * Per-unit implementation shortfall (cost, quote units) of transacting at
 * `fillPrice` when the decision reference was `refPrice`, for a fill on `side`.
 * A BUY paying above ref is a cost (+); a SELL receiving below ref is a cost
 * (+). Price improvement (a maker filling better than mid) is negative — a gain.
 */
function slipPerUnit(side: TradeSide, fillPrice: number, refPrice: number): number {
  return side === "buy" ? fillPrice - refPrice : refPrice - fillPrice;
}

/**
 * Match one fill against a pair's FIFO lots, emitting a ClosedTrade per matched
 * chunk and mutating `lots`. Returns the closed trades produced by this fill.
 */
function applyFill(
  key: EvalArmKey,
  lots: Lot[],
  fill: PaperFill,
): ClosedTrade[] {
  const closed: ClosedTrade[] = [];
  const base = fill.filledBase;
  if (!(base > EPS) || !(fill.avgPrice > 0)) return closed;

  const closeFeePerUnit = base > 0 ? fill.feeQuote / base : 0;
  let remaining = signedQty(fill.side, base);
  const exitSlipPerUnit = slipPerUnit(fill.side, fill.avgPrice, fill.referencePrice);

  while (Math.abs(remaining) > EPS && lots.length > 0) {
    const lot = lots[0];
    if (!lot) break;
    const opposite =
      (lot.qty > 0 && remaining < 0) || (lot.qty < 0 && remaining > 0);
    if (!opposite) break;

    const matched = Math.min(Math.abs(lot.qty), Math.abs(remaining));
    const long = lot.qty > 0;
    // Long closed by a sell: (exit - entry); short closed by a buy: (entry - exit).
    const grossPerUnit = long
      ? fill.avgPrice - lot.price
      : lot.price - fill.avgPrice;
    const grossPnlQuote = grossPerUnit * matched;
    // Fees: the opening leg's share + this closing fill's share.
    const feesQuote = (lot.feePerUnit + closeFeePerUnit) * matched;
    const netPnlQuote = grossPnlQuote - feesQuote;
    // Implementation shortfall: opening leg + closing leg, both as costs.
    const entrySlip = slipPerUnit(lot.openSide, lot.price, lot.refPrice);
    const slippageQuote = (entrySlip + exitSlipPerUnit) * matched;

    // R multiple only when the opening lot carried a stop (risk is defined).
    const riskPerUnit =
      lot.stopPrice != null && lot.stopPrice > 0
        ? Math.abs(lot.price - lot.stopPrice)
        : 0;
    const rMultiple =
      riskPerUnit > EPS ? round7(netPnlQuote / matched / riskPerUnit) : null;

    const priceForXlm = fill.avgPrice; // best single rate at realization
    closed.push({
      arm: key.arm,
      venue: key.venue,
      base: fill.base,
      quote: fill.quote,
      openSide: lot.openSide,
      qty: round7(matched),
      entryPrice: lot.price,
      exitPrice: fill.avgPrice,
      grossPnlQuote: round7(grossPnlQuote),
      feesQuote: round7(feesQuote),
      netPnlQuote: round7(netPnlQuote),
      netPnlXlm: round7(realizedToXlm(netPnlQuote, fill.base, fill.quote, priceForXlm)),
      slippageQuote: round7(slippageQuote),
      rMultiple,
      entryTs: lot.ts,
      exitTs: fill.ts,
      fidelity: weakestFidelity(lot.fidelity, fill.fidelity),
      regime: (lot.regime ?? fill.regime ?? null) as ClosedTrade["regime"],
    });

    lot.qty += long ? -matched : matched;
    remaining += remaining > 0 ? -matched : matched;
    if (Math.abs(lot.qty) < EPS) lots.shift();
  }

  // Any remainder opens (or extends) a position at this fill's terms.
  if (Math.abs(remaining) > EPS) {
    lots.push({
      qty: remaining,
      price: fill.avgPrice,
      refPrice: fill.referencePrice,
      feePerUnit: closeFeePerUnit,
      openSide: fill.side,
      ts: fill.ts,
      stopPrice: undefined,
      fidelity: fill.fidelity,
      regime: fill.regime ?? null,
    });
  }
  return closed;
}

/** Chronological compare on ISO ts, stable for equal timestamps. */
function byTs(a: PaperFill, b: PaperFill): number {
  return a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0;
}

/**
 * Attribute ONE arm×venue's fills into a full ArmAttribution. All `fills` are
 * assumed to share arm+venue (the key is taken from the first fill; pass fills
 * filtered by armKey, or use attributeAll). Fills are matched FIFO per pair.
 *
 * `stopByOrderId` optionally supplies the opening stop price per order id so R
 * multiples can be computed (the fill record itself does not carry the stop).
 */
export function attributeArm(
  fills: PaperFill[],
  stopByOrderId?: ReadonlyMap<string, { stopPrice?: number }>,
): ArmAttribution {
  const first = fills[0];
  const key: EvalArmKey = first
    ? { arm: first.arm, venue: first.venue }
    : { arm: "", venue: "" };

  const byPair = new Map<string, Lot[]>();
  const closedTrades: ClosedTrade[] = [];
  // ONE net-return observation per CLOSING FILL (the closing DECISION), not per
  // lot-chunk. A position scaled into N lots and closed by a single fill is a
  // SINGLE round trip — counting its N near-identical chunk returns as N i.i.d.
  // observations would inflate the effective sample size and collapse the
  // significance CI, letting the readiness gate green-light real money on a
  // handful of real round trips. So we aggregate every chunk a single fill
  // closes into one notional-weighted net return. (Review 2026-08-04, P0.)
  const roundTripReturns: number[] = [];
  // Most recent observed price per pair - the only mark a fill-stream
  // attributor has for valuing what is still OPEN (see unrealizedPnlXlm).
  const lastPriceByPair = new Map<string, number>();
  const ordered = [...fills].sort(byTs);

  for (const fill of ordered) {
    const k = pairKey(fill.base, fill.quote);
    if (fill.avgPrice > 0) lastPriceByPair.set(k, fill.avgPrice);
    let lots = byPair.get(k);
    if (!lots) {
      lots = [];
      byPair.set(k, lots);
    }
    const produced = applyFill(key, lots, fill);
    closedTrades.push(...produced);
    if (produced.length > 0) {
      let netSum = 0;
      let notionalSum = 0;
      for (const t of produced) {
        netSum += t.netPnlQuote;
        notionalSum += Math.abs(t.entryPrice * t.qty);
      }
      roundTripReturns.push(notionalSum > EPS ? netSum / notionalSum : 0);
    }
    // Stamp the stop onto the lot this fill just opened (if any), so a later
    // close can compute R. The just-opened lot is always the last one.
    const stop = stopByOrderId?.get(fill.orderId)?.stopPrice;
    const opened = lots[lots.length - 1];
    if (stop != null && opened && opened.ts === fill.ts && opened.stopPrice == null) {
      opened.stopPrice = stop;
    }
  }

  return summarize(key, closedTrades, byPair, roundTripReturns, lastPriceByPair);
}

/** Split a mixed fill stream by arm×venue and attribute each independently. */
export function attributeAll(
  fills: PaperFill[],
  stopByOrderId?: ReadonlyMap<string, { stopPrice?: number }>,
): Map<string, ArmAttribution> {
  const groups = new Map<string, PaperFill[]>();
  for (const f of fills) {
    const id = armKeyOf({ arm: f.arm, venue: f.venue });
    const g = groups.get(id);
    if (g) g.push(f);
    else groups.set(id, [f]);
  }
  const out = new Map<string, ArmAttribution>();
  for (const [id, group] of groups) {
    out.set(id, attributeArm(group, stopByOrderId));
  }
  return out;
}

/** Roll closed trades + open lots into the ArmAttribution summary.
 *  `roundTripReturns` is one net-return observation per CLOSING FILL (see
 *  attributeArm) — the independent unit the significance layer must use. */
function summarize(
  key: EvalArmKey,
  trades: ClosedTrade[],
  byPair: Map<string, Lot[]>,
  roundTripReturns: number[],
  lastPriceByPair: Map<string, number>,
): ArmAttribution {
  let wins = 0;
  let losses = 0;
  let scratches = 0;
  let grossPnlXlm = 0;
  let feesXlm = 0;
  let rebatesXlm = 0;
  let slippageXlm = 0;
  let netPnlXlm = 0;
  let modeledTrades = 0;
  let rSum = 0;
  let rCount = 0;

  // One observation per round trip (closing decision), built in attributeArm.
  const netReturns = roundTripReturns;
  const equityCurveXlm: number[] = [];
  const byRegime: Record<string, { trades: number; net: number; wins: number }> = {};
  const byQuote: Record<string, number> = {};

  let cum = 0;
  let peak = 0;
  let maxDrawdownXlm = 0;

  for (const t of trades) {
    // Normalize each component to XLM at the realization price for summability.
    const grossX = realizedToXlm(t.grossPnlQuote, t.base, t.quote, t.exitPrice);
    const feeX = realizedToXlm(t.feesQuote, t.base, t.quote, t.exitPrice);
    const slipX = realizedToXlm(t.slippageQuote, t.base, t.quote, t.exitPrice);
    grossPnlXlm += grossX;
    feesXlm += feeX;
    slippageXlm += slipX;
    if (feeX < 0) rebatesXlm += -feeX;
    netPnlXlm += t.netPnlXlm;

    if (t.netPnlXlm > EPS) wins++;
    else if (t.netPnlXlm < -EPS) losses++;
    else scratches++;

    if (t.fidelity === "modeled-maker") modeledTrades++;

    if (t.rMultiple != null) {
      rSum += t.rMultiple;
      rCount++;
    }
    const rk = t.regime ?? "unknown";
    const rb = byRegime[rk] ?? { trades: 0, net: 0, wins: 0 };
    rb.trades++;
    rb.net += t.netPnlXlm;
    if (t.netPnlXlm > EPS) rb.wins++;
    byRegime[rk] = rb;

    byQuote[t.quote] = round7((byQuote[t.quote] ?? 0) + t.netPnlQuote);

    cum += t.netPnlXlm;
    equityCurveXlm.push(round7(cum));
    peak = Math.max(peak, cum);
    maxDrawdownXlm = Math.max(maxDrawdownXlm, peak - cum);
  }

  const decided = wins + losses;
  const regimeOut: Record<string, RegimeBreakdown> = {};
  for (const [rk, rb] of Object.entries(byRegime)) {
    const dec = rb.trades; // hit-rate over all trades in the regime bucket
    regimeOut[rk] = {
      trades: rb.trades,
      netPnlXlm: round7(rb.net),
      hitRatePct: dec > 0 ? round1((rb.wins / dec) * 100) : 0,
    };
  }

  const openLots: OpenLotSummary[] = [];
  let unrealizedPnlXlm = 0;
  for (const [k, lots] of byPair) {
    const netQty = lots.reduce((s, l) => s + l.qty, 0);
    if (Math.abs(netQty) < EPS) continue;
    const totAbs = lots.reduce((s, l) => s + Math.abs(l.qty), 0);
    const avgPrice =
      totAbs > 0
        ? lots.reduce((s, l) => s + Math.abs(l.qty) * l.price, 0) / totAbs
        : 0;
    const [b = "", q = ""] = k.split("/");
    const lastPrice = lastPriceByPair.get(k);
    const entry: OpenLotSummary = {
      base: b,
      quote: q,
      netQty: round7(netQty),
      avgPrice: round7(avgPrice),
    };
    if (lastPrice != null && lastPrice > 0 && avgPrice > 0) {
      // Signed: a long marks up when price rises, a short when it falls.
      const unrealizedQuote = (lastPrice - avgPrice) * netQty;
      const inXlm = realizedToXlm(unrealizedQuote, b, q, lastPrice);
      entry.lastPrice = round7(lastPrice);
      entry.unrealizedPnlXlm = round7(inXlm);
      unrealizedPnlXlm += inXlm;
    }
    openLots.push(entry);
  }

  return {
    key,
    trades: trades.length,
    wins,
    losses,
    scratches,
    hitRatePct: decided > 0 ? round1((wins / decided) * 100) : 0,
    grossPnlXlm: round7(grossPnlXlm),
    feesXlm: round7(feesXlm),
    rebatesXlm: round7(rebatesXlm),
    slippageXlm: round7(slippageXlm),
    netPnlXlm: round7(netPnlXlm),
    avgRMultiple: rCount > 0 ? round7(rSum / rCount) : null,
    netReturns,
    maxDrawdownXlm: round7(maxDrawdownXlm),
    equityCurveXlm,
    byRegime: regimeOut,
    byQuote,
    modeledTrades,
    openLots,
    unrealizedPnlXlm: round7(unrealizedPnlXlm),
  };
}

function round1(n: number): number {
  return Number(n.toFixed(1));
}
