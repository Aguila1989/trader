import type { Metrics } from "./metrics";

/**
 * Growth-optimal position sizing (the Kelly criterion) over a measured edge.
 *
 * This is the mathematical answer to "how much should I risk to earn the most?"
 * - and it is brutally honest: Kelly grows capital fastest when the edge is
 * real, and tells you to bet NOTHING (f <= 0) when it isn't. Risk is the
 * amplifier; this just points it in the right direction at the right magnitude.
 *
 * For a trade that risks 1 unit (the stop distance) to make `b` units (the
 * win/loss payoff ratio) with win probability `p`, the growth-optimal fraction
 * of capital to put at risk per trade is:
 *
 *     f* = p - (1 - p) / b
 *
 * Full Kelly is famously violent (deep drawdowns, ~50% peak-to-trough is
 * normal), and it assumes the measured p and b are the TRUE values - which on a
 * finite, noisy backtest they are not. So practitioners bet a FRACTION of Kelly
 * (half or quarter) and cap it. We default to half-Kelly capped at 2% risk per
 * trade - the ceiling the risk-management literature puts on experienced
 * discretionary traders - and surface the raw number so the math is visible.
 */

export interface KellySizing {
  /** Win/loss payoff ratio b = avgWin / |avgLoss| (in R). */
  payoffRatio: number;
  /** Raw Kelly fraction of capital to risk per trade (can be <= 0). */
  fullKelly: number;
  /** Kelly scaled by `fraction` (e.g. half-Kelly), floored at 0. */
  scaledKelly: number;
  /** Final recommendation: scaledKelly clamped to [0, cap]. */
  recommendedRiskFraction: number;
  /** Plain-language read for the report. */
  note: string;
}

export interface KellyOptions {
  /** Fraction of full Kelly to actually bet (default 0.5 = half-Kelly). */
  fraction?: number;
  /** Hard ceiling on risk-per-trade as a fraction of equity (default 0.02). */
  cap?: number;
}

/**
 * Compute a Kelly sizing recommendation from win rate and average win/loss in R.
 * Inputs are taken from a backtest's OUT-OF-SAMPLE metrics - feeding it
 * in-sample numbers just sizes your overfit, which is worse than not sizing.
 */
export function kellySizing(
  winRate0to1: number,
  avgWinR: number,
  avgLossRmagnitude: number,
  opts: KellyOptions = {},
): KellySizing {
  const fraction = opts.fraction ?? 0.5;
  const cap = opts.cap ?? 0.02;

  if (!(avgWinR > 0) || !(avgLossRmagnitude > 0)) {
    return {
      payoffRatio: 0,
      fullKelly: 0,
      scaledKelly: 0,
      recommendedRiskFraction: 0,
      note: "No measurable wins or losses - cannot size. Risk nothing.",
    };
  }

  const b = avgWinR / avgLossRmagnitude;
  const p = Math.min(1, Math.max(0, winRate0to1));
  const fullKelly = p - (1 - p) / b;
  const scaledKelly = Math.max(0, fullKelly * fraction);
  const recommendedRiskFraction = Math.min(cap, scaledKelly);

  let note: string;
  if (fullKelly <= 0) {
    note =
      "Kelly is <= 0: this edge is not positive enough to bet on. Risk nothing - sizing up only loses faster.";
  } else if (scaledKelly > cap) {
    note = `Half-Kelly suggests ${(scaledKelly * 100).toFixed(
      2,
    )}% risk/trade; capped to ${(cap * 100).toFixed(
      1,
    )}% for safety (measured edge is uncertain on a finite sample).`;
  } else {
    note = `Risk ~${(recommendedRiskFraction * 100).toFixed(
      2,
    )}% of equity per trade (half-Kelly on the measured edge).`;
  }

  return { payoffRatio: round(b, 3), fullKelly: round(fullKelly, 4), scaledKelly: round(scaledKelly, 4), recommendedRiskFraction: round(recommendedRiskFraction, 4), note };
}

/** Convenience: derive a Kelly recommendation straight from a Metrics object. */
export function kellyFromMetrics(m: Metrics, opts: KellyOptions = {}): KellySizing {
  return kellySizing(m.winRatePct / 100, m.avgWinR, Math.abs(m.avgLossR), opts);
}

function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}
