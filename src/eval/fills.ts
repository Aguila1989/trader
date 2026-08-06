import { walkBook } from "../stellar/indicators";
import type { BookLevel, TradeSide } from "../types";
import type {
  FillFidelity,
  OrderLiquidity,
  PaperFill,
  PaperOrder,
} from "./types";

/**
 * THE CONSERVATIVE FILL MODEL — the honesty core of the evaluation.
 *
 * Paper trading on LIVE MAINNET data is only worth anything if it CANNOT invent
 * a fill the real market would not have given. This module is written to fail
 * toward "no fill" and toward "worse price", never the other way, because an
 * optimistic paper fill manufactures a fake edge — which is exactly the failure
 * this repo's own backtest already hit (see backtest/engine.ts: "Ignoring costs
 * is the single most common way a backtest lies" and backtest-baseline-no-edge:
 * the XLM/USDC edge existed only at <=10bps and vanished at 100bps).
 *
 * Two paths, deliberately asymmetric:
 *
 *  TAKER — we WALK THE REAL OBSERVED BOOK (the same walkBook the live policy
 *  engine and paper simulator use). The price paid is the true VWAP through the
 *  levels including the spread, and the fill is only as large as the book can
 *  actually absorb within the limit — partials stay partial. This is a directly
 *  observed market fact, tagged `observed-taker`.
 *
 *  MAKER — a resting limit order does NOT fill just because the market TOUCHED
 *  its price. At the touch you are behind the entire queue that was already
 *  resting there; a trade AT your price may consume the queue ahead of you and
 *  stop. So a maker fill is credited ONLY from volume that TRADED STRICTLY
 *  THROUGH the level (a print below a resting bid / above a resting ask means
 *  the book at your price was swept and price kept going), and even then only a
 *  QUEUE-HAIRCUT fraction of that through-volume — because we still cannot see
 *  how much of the sweep landed ahead of us. Tagged `modeled-maker`, because it
 *  is an inference, not an observation.
 */

/**
 * Per-venue fee schedule. bps are of the fill's quote notional (|base|*price).
 * `makerBps` may be NEGATIVE — a real maker REBATE pays you to provide
 * liquidity, and pretending that away would understate a market-making edge.
 * `perFillQuote` is a flat per-fill charge in quote units (e.g. a Stellar-style
 * per-tx network fee converted to quote); it is always a cost (>= 0).
 */
export interface VenueFee {
  makerBps: number;
  takerBps: number;
  perFillQuote?: number;
}

/** Fee schedule keyed by venue id, with a required `default` fallback so an
 *  unpriced venue can never silently trade for free. */
export interface FeeModel {
  default: VenueFee;
  byVenue?: Record<string, VenueFee>;
}

/**
 * Default queue haircut for maker fills: even when price trades THROUGH our
 * resting level, we credit ourselves only this fraction of the observed
 * through-volume, because an unknown share of the sweep filled the queue ahead
 * of us. 0.5 is deliberately pessimistic (assume, on average, half the sweep
 * was in front of us). Lower it further for thicker books; never raise it to 1
 * (that assumes we were always at the front of the queue — the optimistic lie).
 */
export const DEFAULT_QUEUE_HAIRCUT = 0.5;

/** Stellar-style 7-decimal rounding, matching positions.ts / the orchestrator. */
function round7(n: number): number {
  return Number(n.toFixed(7));
}

/** Resolve the venue's fee schedule, falling back to the model default. */
function venueFee(model: FeeModel, venue: string): VenueFee {
  return model.byVenue?.[venue] ?? model.default;
}

/**
 * Signed fee in QUOTE units for a fill. POSITIVE = cost, NEGATIVE = rebate.
 * `notionalQuote` is |filledBase| * avgPrice. The per-fill flat charge is only
 * added when something actually filled (a zero fill costs nothing).
 */
export function feeFor(
  model: FeeModel,
  venue: string,
  liquidity: OrderLiquidity,
  notionalQuote: number,
): number {
  if (!(notionalQuote > 0)) return 0;
  const f = venueFee(model, venue);
  const bps = liquidity === "maker" ? f.makerBps : f.takerBps;
  const bpsCost = (notionalQuote * bps) / 10_000;
  const flat = Math.max(0, f.perFillQuote ?? 0);
  return round7(bpsCost + flat);
}

/** A single observed trade print off the tape (price + base volume). */
export interface MarketTrade {
  /** Trade price (quote per base), > 0. */
  price: number;
  /** Base-asset volume of the print, > 0. */
  baseAmount: number;
}

/**
 * Base volume that traded STRICTLY THROUGH a resting level — the ONLY volume a
 * conservative model lets a resting order fill from.
 *
 *  - resting BUY at P: a print at price < P means sellers pushed price below our
 *    bid, i.e. the book AT P was swept and then some. A print exactly AT P is a
 *    TOUCH: it may have filled the queue ahead of us and stopped, so it does not
 *    count (that is the whole point — touching != filled).
 *  - resting SELL at P: symmetric, prints at price > P.
 *
 * `includeTouch` exists only to make the WRONG (optimistic) model expressible in
 * a test so we can pin that it fills more; production must leave it false.
 */
export function observedThroughVolume(
  side: TradeSide,
  restingPrice: number,
  trades: readonly MarketTrade[],
  includeTouch = false,
): number {
  if (!(restingPrice > 0)) return 0;
  let base = 0;
  for (const t of trades) {
    if (!(t.price > 0) || !(t.baseAmount > 0)) continue;
    const through =
      side === "buy"
        ? includeTouch
          ? t.price <= restingPrice
          : t.price < restingPrice
        : includeTouch
          ? t.price >= restingPrice
          : t.price > restingPrice;
    if (through) base += t.baseAmount;
  }
  return round7(base);
}

/** The observed two-sided book at fill time; both sides let us anchor the mid. */
export interface ObservedBook {
  /** Bids best-first (descending price), amounts in BASE units. */
  bids: BookLevel[];
  /** Asks best-first (ascending price), amounts in BASE units. */
  asks: BookLevel[];
}

/** Mid from the observed touch, or null when a side is empty. */
function midOf(book: ObservedBook): number | null {
  const bid = book.bids[0]?.price;
  const ask = book.asks[0]?.price;
  if (bid != null && ask != null && bid > 0 && ask > 0) return (bid + ask) / 2;
  return null;
}

/** Build a zero-fill result (records WHY nothing filled). */
function noFill(
  order: PaperOrder,
  fidelity: FillFidelity,
  assumptions: string[],
): PaperFill {
  return {
    orderId: order.id,
    arm: order.arm,
    venue: order.venue,
    side: order.side,
    base: order.base,
    quote: order.quote,
    liquidity: order.liquidity,
    filledBase: 0,
    avgPrice: 0,
    feeQuote: 0,
    referencePrice: order.decisionPrice,
    fidelity,
    ts: order.ts,
    assumptions,
    regime: order.regime ?? null,
  };
}

/**
 * TAKER fill against the REAL observed book. Walks the opposite side (asks for a
 * buy, bids for a sell), bounded by the order's limit so a marketable-limit
 * order never fills worse than its limit. Pays the true VWAP (spread included)
 * plus taker fees. Partial fills are partial — the book's depth is the ceiling.
 */
export function fillTaker(
  order: PaperOrder,
  book: ObservedBook,
  fees: FeeModel,
): PaperFill {
  const assumptions: string[] = [
    "taker: walked the REAL observed book; price = VWAP through the levels (spread included).",
    "partial fills stay partial — capped by observed depth within the limit.",
  ];
  const levels = order.side === "buy" ? book.asks : book.bids;
  if (!levels || levels.length === 0 || !(order.amount > 0)) {
    return noFill(order, "observed-taker", [
      ...assumptions,
      "no opposing depth observed -> zero fill.",
    ]);
  }
  // A taker limit bounds the walk; an unbounded (market) taker passes no bound.
  const bound = order.limitPrice > 0 ? order.limitPrice : undefined;
  if (bound === undefined) {
    assumptions.push("unbounded taker (no limit) — took whatever the book offered.");
  }
  const walk = walkBook(levels, order.amount, order.side, bound);
  if (!(walk.fillableBase > 0) || walk.vwap == null) {
    return noFill(order, "observed-taker", [
      ...assumptions,
      "nothing fillable within the limit -> zero fill.",
    ]);
  }
  const filledBase = round7(Math.min(walk.fillableBase, order.amount));
  const avgPrice = round7(walk.vwap);
  const notionalQuote = filledBase * avgPrice;
  const feeQuote = feeFor(fees, order.venue, "taker", notionalQuote);
  if (filledBase < order.amount) {
    assumptions.push(
      `partial: filled ${filledBase}/${order.amount} base — book absorbed no more within the limit.`,
    );
  }
  return {
    orderId: order.id,
    arm: order.arm,
    venue: order.venue,
    side: order.side,
    base: order.base,
    quote: order.quote,
    liquidity: "taker",
    filledBase,
    avgPrice,
    feeQuote,
    referencePrice: order.decisionPrice,
    fidelity: "observed-taker",
    ts: order.ts,
    assumptions,
    regime: order.regime ?? null,
  };
}

/** Evidence a resting maker order needs to (maybe) fill: the trades that
 *  printed on the tape while it rested. The fill is derived ONLY from the
 *  strictly-through subset of these. */
export interface MakerFillEvidence {
  /** Trade prints observed while the order rested (any side; filtered here). */
  trades: readonly MarketTrade[];
  /** ISO timestamp to stamp the fill with (defaults to the order ts). */
  ts?: string;
}

export interface MakerFillOptions {
  /** Queue haircut fraction in [0,1). Defaults to DEFAULT_QUEUE_HAIRCUT. */
  queueHaircut?: number;
  /** Use the WRONG optimistic touch-fills rule. Test-only; never in production. */
  includeTouch?: boolean;
}

/**
 * MAKER fill — the modeled path. A resting order at `order.limitPrice` fills at
 * that limit price (you rest at P and get filled at P), but ONLY from volume
 * that traded STRICTLY THROUGH P, and then only a `queueHaircut` fraction of it.
 *
 * Crucially, a market that merely TOUCHED P produces ZERO fill: `through` volume
 * excludes touches, so a resting order at the touch that never got run over
 * stays unfilled. Fee is the maker rate (a rebate credits the fill: negative
 * feeQuote). Tagged `modeled-maker`.
 */
export function fillMaker(
  order: PaperOrder,
  evidence: MakerFillEvidence,
  fees: FeeModel,
  opts: MakerFillOptions = {},
): PaperFill {
  const haircut = clampHaircut(opts.queueHaircut ?? DEFAULT_QUEUE_HAIRCUT);
  const assumptions: string[] = [
    "maker: fills ONLY from volume that traded STRICTLY THROUGH the resting price (a touch does not fill — you are behind the queue).",
    `queue haircut ${haircut}: credited only that fraction of through-volume (unknown share of the sweep filled ahead of us).`,
    "fill price = the resting limit price (a maker fills at its own price, not the through price).",
  ];
  if (opts.includeTouch) {
    assumptions.push(
      "WARNING: includeTouch=true — OPTIMISTIC touch-fills model enabled; NOT valid for a real evaluation.",
    );
  }
  const ts = evidence.ts ?? order.ts;
  if (!(order.amount > 0) || !(order.limitPrice > 0)) {
    return { ...noFill(order, "modeled-maker", assumptions), ts };
  }
  const throughBase = observedThroughVolume(
    order.side,
    order.limitPrice,
    evidence.trades,
    opts.includeTouch ?? false,
  );
  const credited = round7(throughBase * haircut);
  const filledBase = round7(Math.min(credited, order.amount));
  if (!(filledBase > 0)) {
    return {
      ...noFill(order, "modeled-maker", [
        ...assumptions,
        throughBase > 0
          ? `through-volume ${throughBase} × haircut rounded to zero fill.`
          : "no volume traded through the resting price -> zero fill (touch-only or no trades).",
      ]),
      ts,
    };
  }
  const avgPrice = round7(order.limitPrice);
  const notionalQuote = filledBase * avgPrice;
  const feeQuote = feeFor(fees, order.venue, "maker", notionalQuote);
  if (feeQuote < 0) assumptions.push("maker rebate earned (negative fee cost).");
  if (filledBase < order.amount) {
    assumptions.push(
      `partial: filled ${filledBase}/${order.amount} base — through-volume × haircut absorbed no more.`,
    );
  }
  return {
    orderId: order.id,
    arm: order.arm,
    venue: order.venue,
    side: order.side,
    base: order.base,
    quote: order.quote,
    liquidity: "maker",
    filledBase,
    avgPrice,
    feeQuote,
    referencePrice: order.decisionPrice,
    fidelity: "modeled-maker",
    ts,
    assumptions,
    regime: order.regime ?? null,
  };
}

/** Keep the haircut in [0,1): 1 would assume front-of-queue (optimistic). */
function clampHaircut(h: number): number {
  if (!Number.isFinite(h)) return DEFAULT_QUEUE_HAIRCUT;
  if (h < 0) return 0;
  if (h >= 1) return 0.999_999_9;
  return h;
}

/**
 * Route an order to the correct conservative model. A pure convenience over the
 * two explicit functions; the maker path needs tape evidence, the taker path
 * needs the book.
 */
export function fillOrder(
  order: PaperOrder,
  ctx: { book?: ObservedBook; evidence?: MakerFillEvidence },
  fees: FeeModel,
  opts?: MakerFillOptions,
): PaperFill {
  if (order.liquidity === "maker") {
    return fillMaker(order, ctx.evidence ?? { trades: [] }, fees, opts);
  }
  return fillTaker(
    order,
    ctx.book ?? { bids: [], asks: [] },
    fees,
  );
}

/** Re-export the observed mid helper for attribution's spread decomposition. */
export { midOf as observedMid };
