import type { BookLevel, TradeSide } from "../types";
import type { Regime } from "../stellar/indicators";

/**
 * Plain-data types for the automatic paper-trading EVALUATION layer (Phase 4).
 *
 * The whole point of this module is to be UNABLE TO FLATTER a strategy: every
 * number it produces has to survive costs and a significance bar before it is
 * allowed to read as "edge". So these types deliberately keep three things
 * first-class that an optimistic evaluator quietly drops:
 *  1. WHICH arm × WHICH venue produced a fill (so nothing is pooled that
 *     shouldn't be, and multiple-comparisons can be counted honestly).
 *  2. HOW a fill was obtained — an OBSERVED taker sweep vs a MODELED maker
 *     fill — carried as `fidelity`, so the report can down-weight modeled fills.
 *  3. The DECISION-TIME reference price, so implementation shortfall (spread +
 *     slippage vs the price the strategy actually saw) is measurable, not hidden.
 *
 * Everything here is data only — no behavior, no I/O, no import-time work.
 */

/** A strategy variant under test (e.g. "rsi-meanrev", "ema-cross-v2"). */
export type EvalArm = string;

/** A venue a fill was (paper-)executed against (e.g. "stellar-sdex"). Kept
 *  separate from the arm because the SAME strategy can behave very differently
 *  on a maker-rebate CLOB vs a per-tx AMM/DEX, and pooling the two would lie. */
export type EvalVenue = string;

/** The identity a paper order / fill / trade is bucketed under. */
export interface EvalArmKey {
  arm: EvalArm;
  venue: EvalVenue;
}

/** Stable string form of an EvalArmKey, for use as a Map key. The separator is
 *  a pair of colons so a colon inside an arm/venue id can never collide. */
export function armKeyOf(k: EvalArmKey): string {
  return `${k.arm}::${k.venue}`;
}

/** How an order intends to take liquidity: rest (maker) or cross (taker). The
 *  fill model is fundamentally different and honest per side (see fills.ts). */
export type OrderLiquidity = "maker" | "taker";

/**
 * Provenance of a fill's PRICE + SIZE, so the significance layer can state
 * per-arm confidence:
 *  - "observed-taker": we walked the REAL observed order book and took it. The
 *    price and fillable size are directly observed market facts.
 *  - "modeled-maker": the order rested and we INFERRED a fill from trades that
 *    printed through its level. We can never observe our own queue position, so
 *    this is a model, and a report should treat an edge built on it as weaker.
 */
export type FillFidelity = "observed-taker" | "modeled-maker";

/**
 * One paper order the evaluator wants to (simulate) placing. `decisionPrice` is
 * the market reference (mid) at the moment the strategy decided — the anchor for
 * implementation-shortfall accounting; without it, slippage is invisible.
 */
export interface PaperOrder {
  id: string;
  arm: EvalArm;
  venue: EvalVenue;
  side: TradeSide;
  /** "XLM" | "CODE:ISSUER" — same canonical form the rest of the app uses. */
  base: string;
  quote: string;
  liquidity: OrderLiquidity;
  /** Base-asset units the order wants filled (> 0). */
  amount: number;
  /** Limit price (quote per base). For a maker this is the RESTING price and
   *  also the price it fills at; for a taker it bounds how far it crosses. */
  limitPrice: number;
  /** Mid at the moment of decision (quote per base); the slippage anchor. */
  decisionPrice: number;
  /** ISO timestamp of the decision (drives FIFO ordering + drawdown series). */
  ts: string;
  /** Optional stop / invalidation price (quote per base). When present it lets
   *  attribution express realized PnL as an R-multiple; absent -> R is null. */
  stopPrice?: number;
  /** Regime at decision time, for the per-regime breakdown. */
  regime?: Regime | null;
}

/**
 * One (simulated) fill produced by the CONSERVATIVE model in fills.ts. Fees are
 * already applied here (per-venue), and `assumptions` records exactly which
 * honesty rules shaped this fill so the report can quote them verbatim.
 */
export interface PaperFill {
  orderId: string;
  arm: EvalArm;
  venue: EvalVenue;
  side: TradeSide;
  base: string;
  quote: string;
  liquidity: OrderLiquidity;
  /** Base units that actually filled (>= 0; may be < order.amount — partials
   *  are partials, never rounded up). */
  filledBase: number;
  /** Volume-weighted fill price achieved (quote per base). 0 iff filledBase 0. */
  avgPrice: number;
  /**
   * Signed fee in QUOTE units applied to this fill: POSITIVE = a cost paid,
   * NEGATIVE = a rebate earned (a maker rebate genuinely pays you). Kept signed
   * so cost accounting never has to guess the sign.
   */
  feeQuote: number;
  /** The decision reference carried through from the order (mid at decision),
   *  so attribution can decompose spread + slippage without the order in hand. */
  referencePrice: number;
  fidelity: FillFidelity;
  ts: string;
  /** Human-readable honesty caveats attached to THIS fill (queue haircut used,
   *  through-only rule, unbounded taker, etc.). Surfaced in the report. */
  assumptions: string[];
  regime?: Regime | null;
}

/**
 * A realized round-trip produced by FIFO matching in attribution.ts. PnL is in
 * QUOTE units of the pair; `netPnlXlm` is the same delta normalized to XLM so
 * results from different quote assets are summable (mirrors positions.ts).
 */
export interface ClosedTrade {
  arm: EvalArm;
  venue: EvalVenue;
  base: string;
  quote: string;
  /** Side of the OPENING leg (a long opened by a buy, a short by a sell). */
  openSide: TradeSide;
  /** Base units closed in this round-trip (> 0). */
  qty: number;
  entryPrice: number;
  exitPrice: number;
  /** Gross PnL in quote units, price move only (no fees). */
  grossPnlQuote: number;
  /** Fees attributed to this round-trip (entry + exit share), quote units. */
  feesQuote: number;
  /** Gross minus fees, quote units — the honest realized number. */
  netPnlQuote: number;
  /** netPnlQuote normalized to XLM (for cross-pair summing). */
  netPnlXlm: number;
  /** Implementation shortfall vs the decision price, quote units (entry+exit).
   *  Positive = the round-trip paid away this much to spread/slippage. */
  slippageQuote: number;
  /** Net realized outcome in R units when both legs carried a stop; else null. */
  rMultiple: number | null;
  entryTs: string;
  exitTs: string;
  /** Weakest fidelity of the two legs (a round-trip is only as trustworthy as
   *  its most-modeled leg). */
  fidelity: FillFidelity;
  regime?: Regime | null;
}

/**
 * Per-arm×venue accumulated attribution. All PnL fields are in XLM (normalized)
 * so arms trading different quote assets are comparable; the per-quote raw
 * breakdown lives in `byQuote` for auditing the normalization.
 */
export interface ArmAttribution {
  key: EvalArmKey;
  trades: number;
  wins: number;
  losses: number;
  scratches: number;
  hitRatePct: number;
  /** Gross PnL before costs (XLM). */
  grossPnlXlm: number;
  /** Total fees paid (XLM); NEGATIVE when net rebates were earned. */
  feesXlm: number;
  /** Total rebates earned (XLM, reported as a positive magnitude). */
  rebatesXlm: number;
  /** Total implementation shortfall paid to spread + slippage (XLM). */
  slippageXlm: number;
  /** Net PnL after every cost (XLM) — the only headline that may be believed. */
  netPnlXlm: number;
  /** Average net R multiple across trades that carried a stop (null if none). */
  avgRMultiple: number | null;
  /** Per-trade net R multiples (input to the significance layer). Trades with
   *  no stop contribute a risk-normalized net return instead (see attribution). */
  netReturns: number[];
  /** Largest peak-to-trough drop of the cumulative net-PnL (XLM) curve. */
  maxDrawdownXlm: number;
  /** Cumulative net PnL (XLM) after each closed trade, in order. */
  equityCurveXlm: number[];
  /** Net PnL split by regime label. */
  byRegime: Record<string, RegimeBreakdown>;
  /** Net PnL split by the pair's quote asset (audits normalization). */
  byQuote: Record<string, number>;
  /** Count of round-trips whose weakest leg was a MODELED maker fill — the
   *  share of this edge that rests on a model rather than observation. */
  modeledTrades: number;
  /** Open (unrealized) base position still on the book, by pair. */
  openLots: OpenLotSummary[];
}

export interface RegimeBreakdown {
  trades: number;
  netPnlXlm: number;
  hitRatePct: number;
}

export interface OpenLotSummary {
  base: string;
  quote: string;
  /** Signed net base units still open (+ long, - short). */
  netQty: number;
  avgPrice: number;
}

/**
 * The verdict a whole evaluation resolves to. Nothing but `edge` should ever be
 * treated as tradeable, and `edge` is reachable ONLY when the cost-adjusted CI
 * clears zero AT THE MULTIPLICITY-ADJUSTED confidence level and the sample is
 * adequate (see stats.verdictFor).
 */
export type EvalVerdict = "edge" | "no-edge" | "inconclusive-need-more-data";

/**
 * Evaluation-wide configuration. Plain data; thresholds are the honesty knobs.
 */
export interface EvalConfig {
  /** Arms under test. Its LENGTH × venues is the multiple-comparisons count. */
  arms: EvalArm[];
  /** Venues each arm is evaluated on. */
  venues: EvalVenue[];
  /** N_min: minimum CLOSED trades before an arm's result can be adequate. Below
   *  it the verdict is forced to inconclusive-need-more-data, never no-edge —
   *  "we haven't looked long enough" is not the same as "there is no edge". */
  nMin: number;
  /** D_min: minimum DAYS of live paper data before ANY verdict is emitted. */
  dMin: number;
  /** D_max: evaluation horizon in days — the window is capped so a stale arm
   *  can't accumulate a verdict on data that no longer reflects the market. */
  dMax: number;
  /** Two-sided significance level BEFORE multiplicity adjustment (e.g. 0.05). */
  alpha: number;
  /** Bootstrap resample count (deterministic given the seed). */
  bootstrapResamples: number;
  /** PRNG seed for the bootstrap — fixed so a CI never jitters run to run. */
  seed: number;
  /** Per-regime minimum sample below which a regime bucket is flagged "thin"
   *  as an overfitting risk (a regime carried by 3 trades proves nothing). */
  minRegimeSample: number;
}

/** Conservative defaults. Everything that could flatter a result is set strict:
 *  a real sample requirement, a real horizon, standard 95% confidence. */
export const DEFAULT_EVAL_CONFIG: EvalConfig = {
  arms: [],
  venues: [],
  nMin: 30,
  dMin: 14,
  dMax: 90,
  alpha: 0.05,
  bootstrapResamples: 10_000,
  seed: 0x9e3779b9,
  minRegimeSample: 10,
};

/** Re-exported so consumers of the eval module get the book shape from one place. */
export type { BookLevel, TradeSide, Regime };
