import type { BookLevel, TradeSide } from "../types";

/**
 * Pure technical-indicator math over OHLC candles + orderbook levels.
 *
 * Everything here is computed SERVER-SIDE and handed to the AI analyst as
 * ready-made numbers. LLMs are unreliable at arithmetic over long lists of raw
 * candles, so "read the trend yourself" produces noisy judgment - precomputed
 * RSI/ATR/EMA/regime figures make the analysis grounded and repeatable. The
 * policy engine reuses walkBook() for size-aware slippage checks.
 */

/** Minimal candle shape these functions need (market.ts Candle satisfies it). */
export interface OhlcCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  baseVolume: number;
}

/**
 * Market regime classification:
 *  - trending-up / trending-down: directional moves dominate the chop
 *    (Kaufman efficiency ratio over the window).
 *  - ranging: price is oscillating; mean-reversion entries make more sense.
 *  - volatile: the most recent candles' true range expanded sharply vs the
 *    window average - stand aside or size down regardless of direction.
 */
export type Regime = "trending-up" | "trending-down" | "ranging" | "volatile";

export interface IndicatorSet {
  /** Wilder RSI(14) of closes, 0..100 (null if too few candles). */
  rsi14: number | null;
  /** Fast/slow EMAs of closes - their order tells the short-term trend. */
  ema8: number | null;
  ema24: number | null;
  /** Average true range as a % of the last close (per-candle volatility). */
  atrPct: number | null;
  /** Stdev of per-candle log returns, in % (realized volatility). */
  realizedVolPct: number | null;
  /** Kaufman efficiency ratio: |net move| / sum(|candle moves|), 0..1. */
  efficiencyRatio: number | null;
  /** Where the last close sits in the window's low..high range, 0..1. */
  rangePos: number | null;
  /** Recent (last quarter of window) volume vs the window average, ~1 = normal. */
  volRatio: number | null;
  regime: Regime | null;
}

// Regime thresholds. ER >= TRENDING_ER means the net move dominates the chop;
// recent true range > VOLATILE_EXPANSION x the window average means the market
// just got disorderly (vol expansion), which overrides any trend read.
const TRENDING_ER = 0.45;
const VOLATILE_EXPANSION = 1.6;
const MIN_CANDLES_FOR_REGIME = 8;

function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

/** Last EMA value of `values` with the given period (null if too few points). */
export function emaLast(values: number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  // Seed with the SMA of the first `period` values, then fold forward.
  let ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  const k = 2 / (period + 1);
  for (let i = period; i < values.length; i++) {
    const v = values[i];
    if (v === undefined) continue;
    ema = v * k + ema * (1 - k);
  }
  return ema;
}

/** Wilder RSI of closes (needs at least period+1 closes). 0..100. */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = (closes[i] ?? 0) - (closes[i - 1] ?? 0);
    avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Per-candle true ranges (high-low extended by gaps vs the previous close). */
function trueRanges(candles: OhlcCandle[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    if (!c || !prev) continue;
    out.push(
      Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close),
      ),
    );
  }
  return out;
}

function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Compute the full indicator set from a chronological candle window. */
export function computeIndicators(candles: OhlcCandle[]): IndicatorSet {
  const empty: IndicatorSet = {
    rsi14: null,
    ema8: null,
    ema24: null,
    atrPct: null,
    realizedVolPct: null,
    efficiencyRatio: null,
    rangePos: null,
    volRatio: null,
    regime: null,
  };
  const first = candles[0];
  const last = candles[candles.length - 1];
  if (!first || !last || candles.length < 2) return empty;

  const closes = candles.map((c) => c.close);
  const lastClose = last.close;

  // Log returns between consecutive closes (skip non-positive prices).
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1] ?? 0;
    const b = closes[i] ?? 0;
    if (a > 0 && b > 0) rets.push(Math.log(b / a));
  }
  const retMean = mean(rets) ?? 0;
  const variance = mean(rets.map((r) => (r - retMean) ** 2));
  const realizedVolPct =
    variance != null ? round(Math.sqrt(variance) * 100, 3) : null;

  const trs = trueRanges(candles);
  const atr = mean(trs);
  const atrPct =
    atr != null && lastClose > 0 ? round((atr / lastClose) * 100, 3) : null;

  // Efficiency ratio: how much of the candle-to-candle movement was net
  // directional progress. 1 = a clean straight line, ~0 = pure chop.
  const pathLen = rets.length
    ? closes.slice(1).reduce((s, c, i) => s + Math.abs(c - (closes[i] ?? c)), 0)
    : 0;
  const netMove = Math.abs(lastClose - first.close);
  const efficiencyRatio = pathLen > 0 ? round(netMove / pathLen, 3) : null;

  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const rangePos =
    high > low ? round((lastClose - low) / (high - low), 3) : null;

  // Volume pulse: the most recent quarter of the window vs the whole window.
  const quarter = Math.max(1, Math.ceil(candles.length / 4));
  const recentVol = mean(candles.slice(-quarter).map((c) => c.baseVolume));
  const fullVol = mean(candles.map((c) => c.baseVolume));
  const volRatio =
    recentVol != null && fullVol != null && fullVol > 0
      ? round(recentVol / fullVol, 2)
      : null;

  // Regime: vol expansion first (it overrides trend), then ER for direction.
  let regime: Regime | null = null;
  if (candles.length >= MIN_CANDLES_FOR_REGIME) {
    const recentTr = mean(trs.slice(-Math.max(1, Math.ceil(trs.length / 4))));
    const fullTr = mean(trs);
    const expansion =
      recentTr != null && fullTr != null && fullTr > 0 ? recentTr / fullTr : 1;
    if (expansion > VOLATILE_EXPANSION) {
      regime = "volatile";
    } else if ((efficiencyRatio ?? 0) >= TRENDING_ER) {
      regime = lastClose >= first.close ? "trending-up" : "trending-down";
    } else {
      regime = "ranging";
    }
  }

  const r = rsi(closes, 14);
  const e8 = emaLast(closes, 8);
  const e24 = emaLast(closes, 24);
  return {
    rsi14: r != null ? round(r, 1) : null,
    ema8: e8 != null ? round(e8, 7) : null,
    ema24: e24 != null ? round(e24, 7) : null,
    atrPct,
    realizedVolPct,
    efficiencyRatio,
    rangePos,
    volRatio,
    regime,
  };
}

export interface WalkResult {
  /** Base units fillable against the given levels (within the limit price). */
  fillableBase: number;
  /** Volume-weighted average price of that fillable portion (null if none). */
  vwap: number | null;
}

/**
 * Walk the orderbook to estimate what a `sizeBase` order would ACTUALLY pay.
 * Levels must be best-first with amounts in BASE units (see bookLevelsBase in
 * market.ts), i.e. asks ascending for a buy, bids descending for a sell.
 * `limitPrice` bounds the walk: a buy never lifts asks above it, a sell never
 * hits bids below it - anything beyond would rest, not fill.
 *
 * This is what turns the top-of-book slippage check into a size-aware one: a
 * 50-unit order into a book with 3 units at the touch is cheap at the touch
 * and expensive in truth.
 */
export function walkBook(
  levels: BookLevel[],
  sizeBase: number,
  side: TradeSide,
  limitPrice?: number,
): WalkResult {
  let remaining = sizeBase;
  let filled = 0;
  let cost = 0;
  for (const lvl of levels) {
    if (remaining <= 0) break;
    if (!(lvl.price > 0) || !(lvl.amount > 0)) continue;
    if (limitPrice !== undefined && limitPrice > 0) {
      if (side === "buy" && lvl.price > limitPrice) break;
      if (side === "sell" && lvl.price < limitPrice) break;
    }
    const take = Math.min(remaining, lvl.amount);
    filled += take;
    cost += take * lvl.price;
    remaining -= take;
  }
  return {
    fillableBase: filled,
    vwap: filled > 0 ? cost / filled : null,
  };
}

/**
 * Taker-flow proxy from recent trades: % of traded base volume where the base
 * asset was BOUGHT (base_is_seller=false). >50 = net buying pressure. Needs a
 * minimum sample to mean anything; null otherwise. It is a proxy (Horizon does
 * not flag the aggressor side directly), but a lopsided read is informative.
 */
export function takerBuyPct(
  trades: { baseAmount: number; baseIsSeller: boolean | undefined }[],
): number | null {
  let buy = 0;
  let total = 0;
  let counted = 0;
  for (const t of trades) {
    if (t.baseIsSeller === undefined || !(t.baseAmount > 0)) continue;
    counted++;
    total += t.baseAmount;
    if (!t.baseIsSeller) buy += t.baseAmount;
  }
  if (counted < 3 || total <= 0) return null;
  return round((buy / total) * 100, 1);
}
