import type { EvalVerdict } from "./types";

/**
 * The SIGNIFICANCE layer — the last gate before anything reads as "edge".
 *
 * It mirrors the statistics already trusted in src/backtest/metrics.ts (the same
 * one-sample t-stat = mean·√n/stdev, the same deterministic percentile bootstrap
 * with a fixed mulberry32 seed so a CI never jitters run-to-run) and extends
 * them with the two things an automatic, many-variant evaluation cannot go
 * without:
 *
 *  1. A MULTIPLE-COMPARISONS adjustment. Trying K arm×venue variants and
 *     reporting the best is the classic way to turn noise into a "discovery":
 *     at α=0.05, ~1 in 20 dead strategies clears the bar by luck, so with 20
 *     variants you EXPECT a false winner. We raise the confidence bar with the
 *     number of variants tried (Šidák by default, Bonferroni available) so the
 *     CI a winner must clear widens as the search widens.
 *
 *  2. A blunt decision function. `verdictFor` returns `edge` ONLY when the
 *     cost-adjusted CI clears zero AT THE ADJUSTED LEVEL and the sample is
 *     adequate; otherwise `no-edge` (adequate sample, CI spans/loses) or
 *     `inconclusive-need-more-data` (too few trades / too short a horizon).
 *     "we haven't looked long enough" is never reported as "no edge".
 *
 * The returns fed in MUST already be net of costs (attribution produces exactly
 * that): the whole contract is "clears zero AFTER costs".
 */

function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

/** Small deterministic PRNG (mulberry32) — identical to backtest/metrics.ts so
 *  the two layers agree bit-for-bit on a bootstrap. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SummaryStats {
  n: number;
  /** Mean per-trade net return (the point estimate of the edge). */
  mean: number;
  /** Sample standard deviation (ddof=1). */
  stdDev: number;
  /** Standard error of the mean. */
  seMean: number;
  /** One-sample t-statistic vs zero (null when <2 or zero variance). */
  tStat: number | null;
  /** Risk-adjusted per-trade ratio = mean/stdDev (Sharpe-like, unitless). */
  sharpe: number;
}

/**
 * Dispersion + t-stat over a sample of per-trade net returns. Mirrors
 * computeMetrics' one-pass variance/t-stat exactly (Σx² form, ddof=1, tiny
 * negative clamp).
 */
export function summaryStats(returns: readonly number[]): SummaryStats {
  const n = returns.length;
  if (n === 0) {
    return { n: 0, mean: 0, stdDev: 0, seMean: 0, tStat: null, sharpe: 0 };
  }
  let sum = 0;
  let sum2 = 0;
  for (const x of returns) {
    sum += x;
    sum2 += x * x;
  }
  const mean = sum / n;
  const variance = n > 1 ? Math.max(0, (sum2 - n * mean * mean) / (n - 1)) : 0;
  const stdDev = Math.sqrt(variance);
  const seMean = n > 1 ? stdDev / Math.sqrt(n) : 0;
  const tStat = seMean > 0 ? mean / seMean : null;
  const sharpe = stdDev > 0 ? mean / stdDev : 0;
  return {
    n,
    mean: round(mean, 6),
    stdDev: round(stdDev, 6),
    seMean: round(seMean, 6),
    tStat: tStat === null ? null : round(tStat, 4),
    sharpe: round(sharpe, 4),
  };
}

/**
 * Minimum resamples that must land in EACH tail for the percentile to be a
 * real order statistic rather than "the single most extreme resample mean".
 */
const MIN_TAIL_RESAMPLES = 20;

/**
 * Hard ceiling on bootstrap resamples. A level tight enough to need more than
 * this cannot be honestly resolved by this method at realistic sample sizes;
 * bootstrapCI returns null there, which reads as NOT significant.
 */
export const MAX_RESAMPLES = 200_000;

/** Resamples needed so `level`'s tail index doesn't degenerate to 0. */
export function requiredResamplesFor(level: number): number {
  const tail = (1 - level) / 2;
  if (!(tail > 0)) return Number.POSITIVE_INFINITY;
  return Math.ceil(MIN_TAIL_RESAMPLES / tail);
}

export interface ConfidenceInterval {
  level: number;
  resamples: number;
  lower: number;
  upper: number;
  /** True when the whole interval sits on one side of 0 (mean ≠ noise). */
  excludesZero: boolean;
}

/**
 * Deterministic percentile bootstrap CI for the mean net return. Same rationale
 * as backtest/metrics.expectancyCI: per-trade returns are not normal (bounded
 * near the stop, fat right tail), so resampling assumes nothing about shape, and
 * a fixed seed keeps the interval reproducible. The headline read is
 * `excludesZero` (really lower > 0): a positive mean whose interval still
 * includes 0 is not an edge.
 */
export function bootstrapCI(
  returns: readonly number[],
  level = 0.95,
  resamples = 10_000,
  seed = 0x9e3779b9,
): ConfidenceInterval | null {
  const n = returns.length;
  if (n < 2) return null;
  // Scale resamples to the LEVEL so each tail keeps enough resamples to be a
  // real order statistic. Without this, a heavily multiplicity-corrected level
  // floors the tail index to 0 and the "bound" degenerates into the single
  // most extreme resample mean - noise, not a calibrated 1-in-N bar. When even
  // MAX_RESAMPLES can't resolve the level we return null, which every caller
  // reads as NOT significant (fail closed) rather than a pass at a weaker bar
  // than advertised. (Review 2026-08-04, eval-honesty P2.)
  const needed = requiredResamplesFor(level);
  if (!Number.isFinite(needed) || needed > MAX_RESAMPLES) return null;
  const effectiveResamples = Math.min(MAX_RESAMPLES, Math.max(resamples, needed));
  const rng = mulberry32(seed);
  const means = new Array<number>(effectiveResamples);
  for (let b = 0; b < effectiveResamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += returns[Math.floor(rng() * n)]!;
    means[b] = sum / n;
  }
  means.sort((a, b) => a - b);
  const tail = (1 - level) / 2;
  const lower = means[Math.max(0, Math.floor(tail * effectiveResamples))]!;
  const upper =
    means[Math.min(effectiveResamples - 1, Math.ceil((1 - tail) * effectiveResamples) - 1)]!;
  return {
    level,
    resamples: effectiveResamples,
    lower: round(lower, 6),
    upper: round(upper, 6),
    excludesZero: lower > 0 || upper < 0,
  };
}

/**
 * Šidák-adjusted per-comparison alpha for `variants` independent tests:
 * 1 - (1-α)^(1/m). Slightly less conservative than Bonferroni (α/m) and exact
 * under independence. m<=1 returns α unchanged.
 */
export function sidakAlpha(alpha: number, variants: number): number {
  const m = Math.max(1, Math.floor(variants));
  if (m <= 1) return alpha;
  return 1 - Math.pow(1 - alpha, 1 / m);
}

/** Bonferroni-adjusted per-comparison alpha: α/m. */
export function bonferroniAlpha(alpha: number, variants: number): number {
  const m = Math.max(1, Math.floor(variants));
  return alpha / m;
}

/**
 * Acklam's rational approximation of the inverse standard-normal CDF (probit).
 * Accurate to ~1e-9 over (0,1) — enough for a crude power/MDE figure. Pure.
 */
export function invNormalCdf(p: number): number {
  if (!(p > 0 && p < 1)) return p <= 0 ? -Infinity : Infinity;
  // Coefficients (Peter Acklam).
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number;
  let r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
    ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
}

export interface PowerMDE {
  /** Minimum detectable per-trade mean return at this n / power / alpha. */
  mde: number;
  power: number;
  alpha: number;
  n: number;
  /** True when the OBSERVED mean is smaller than the MDE — i.e. even if the edge
   *  is real, this sample is underpowered to prove it. A key "need more data"
   *  signal that a bare CI does not spell out. */
  underpowered: boolean;
}

/**
 * Crude two-sided minimum detectable effect for a one-sample mean:
 *   MDE = (z_{1-α/2} + z_{power}) · stdDev / √n.
 * The smallest true mean return this sample size could reliably distinguish from
 * zero. If |observed mean| < MDE, a non-significant result is as consistent with
 * "underpowered" as with "no edge" — so we surface it explicitly.
 */
export function powerMDE(
  n: number,
  stdDev: number,
  observedMean: number,
  alpha = 0.05,
  power = 0.8,
): PowerMDE {
  if (n < 2 || !(stdDev > 0)) {
    return { mde: Infinity, power, alpha, n, underpowered: true };
  }
  const zAlpha = invNormalCdf(1 - alpha / 2);
  const zPower = invNormalCdf(power);
  const mde = ((zAlpha + zPower) * stdDev) / Math.sqrt(n);
  return {
    mde: round(mde, 6),
    power,
    alpha,
    n,
    underpowered: Math.abs(observedMean) < mde,
  };
}

/** Max peak-to-trough drawdown of the cumulative sum of a returns series. */
export function maxDrawdownFromReturns(returns: readonly number[]): number {
  let cum = 0;
  let peak = 0;
  let mdd = 0;
  for (const r of returns) {
    cum += r;
    peak = Math.max(peak, cum);
    mdd = Math.max(mdd, peak - cum);
  }
  return round(mdd, 6);
}

export type MultipleComparisons = "sidak" | "bonferroni";

export interface VerdictInput {
  /** Per-trade NET (post-cost) returns for THIS arm. */
  netReturns: readonly number[];
  /** Total number of arm×venue variants TRIED across the whole search — the
   *  multiplicity count. 1 = a single pre-registered hypothesis. */
  variantsTried: number;
  /** Minimum adequate sample (closed trades). Below it -> inconclusive. */
  nMin: number;
  /** Two-sided base significance level before adjustment (e.g. 0.05). */
  alpha?: number;
  /** Which multiplicity correction to apply (default Šidák). */
  correction?: MultipleComparisons;
  bootstrapResamples?: number;
  seed?: number;
  /** True when these returns are IN-SAMPLE only (no out-of-sample / walk-forward
   *  confirmation yet) — always an overfitting caveat. */
  inSampleOnly?: boolean;
  /** Observed days of live paper data (for the horizon gate). */
  daysObserved?: number;
  /** Minimum horizon in days before ANY verdict is emitted. */
  dMin?: number;
  /** Trade counts per regime, to flag thin regimes as an overfitting risk. */
  regimeCounts?: Record<string, number>;
  /** Regime bucket size below which it is flagged thin. */
  minRegimeSample?: number;
}

export interface VerdictResult {
  verdict: EvalVerdict;
  stats: SummaryStats;
  /** CI at the MULTIPLICITY-ADJUSTED level (the bar a winner must clear). */
  ci: ConfidenceInterval | null;
  /** CI at the plain (unadjusted) level, for reference. */
  unadjustedCi: ConfidenceInterval | null;
  baseAlpha: number;
  adjustedAlpha: number;
  adjustedLevel: number;
  correction: MultipleComparisons;
  mde: PowerMDE;
  maxDrawdown: number;
  overfittingWarnings: string[];
  /** One-line plain-language explanation of the verdict. */
  rationale: string;
}

/**
 * The decision function. Reaches `edge` ONLY when the adjusted-level CI clears
 * zero (after costs) AND the sample is adequate; otherwise no-edge or
 * inconclusive-need-more-data. See the module header for the contract.
 */
export function verdictFor(input: VerdictInput): VerdictResult {
  const alpha = input.alpha ?? 0.05;
  const correction = input.correction ?? "sidak";
  const resamples = input.bootstrapResamples ?? 10_000;
  const seed = input.seed ?? 0x9e3779b9;
  const returns = input.netReturns;
  const stats = summaryStats(returns);

  const adjustedAlpha =
    correction === "bonferroni"
      ? bonferroniAlpha(alpha, input.variantsTried)
      : sidakAlpha(alpha, input.variantsTried);
  const adjustedLevel = 1 - adjustedAlpha;

  const ci = bootstrapCI(returns, adjustedLevel, resamples, seed);
  const unadjustedCi = bootstrapCI(returns, 1 - alpha, resamples, seed);
  const mde = powerMDE(stats.n, stats.stdDev, stats.mean, adjustedAlpha, 0.8);
  const maxDrawdown = maxDrawdownFromReturns(returns);
  const overfittingWarnings = buildOverfittingWarnings(input);

  const sampleAdequate = stats.n >= Math.max(2, input.nMin);
  const horizonMet =
    input.dMin == null || input.daysObserved == null
      ? true
      : input.daysObserved >= input.dMin;

  let verdict: EvalVerdict;
  let rationale: string;

  if (!horizonMet) {
    verdict = "inconclusive-need-more-data";
    rationale = `Only ${input.daysObserved}d of paper data; need >=${input.dMin}d before any verdict.`;
  } else if (!sampleAdequate) {
    verdict = "inconclusive-need-more-data";
    rationale = `Only ${stats.n} closed trades; need >=${input.nMin} for an adequate sample. No verdict yet.`;
  } else if (ci && ci.lower > 0) {
    verdict = "edge";
    rationale =
      `Net-of-cost mean ${stats.mean} with the ${round(adjustedLevel * 100, 2)}% CI ` +
      `[${ci.lower}, ${ci.upper}] clearing zero on ${stats.n} trades ` +
      `(adjusted for ${Math.max(1, Math.floor(input.variantsTried))} variants). Edge holds after costs and multiplicity.`;
  } else if (ci && ci.upper < 0) {
    verdict = "no-edge";
    rationale = `Net-of-cost mean ${stats.mean}; the ${round(adjustedLevel * 100, 2)}% CI [${ci.lower}, ${ci.upper}] sits BELOW zero — this loses money after costs.`;
  } else if (stats.mean <= 0) {
    verdict = "no-edge";
    rationale = `Net-of-cost mean is ${stats.mean} (<=0) on an adequate ${stats.n}-trade sample — no positive edge after costs.`;
  } else {
    verdict = "no-edge";
    const spanTxt = ci ? `[${ci.lower}, ${ci.upper}]` : "n/a";
    rationale =
      `Positive point estimate (${stats.mean}) but the adjusted ${round(adjustedLevel * 100, 2)}% CI ${spanTxt} ` +
      `still includes zero on ${stats.n} trades — not distinguishable from noise after costs${mde.underpowered ? " (and underpowered: |mean| < MDE " + mde.mde + ")" : ""}. Not proven.`;
  }

  return {
    verdict,
    stats,
    ci,
    unadjustedCi,
    baseAlpha: alpha,
    adjustedAlpha: round(adjustedAlpha, 6),
    adjustedLevel: round(adjustedLevel, 6),
    correction,
    mde,
    maxDrawdown,
    overfittingWarnings,
    rationale,
  };
}

/** Explicit, itemized overfitting caveats — the report must show these. */
function buildOverfittingWarnings(input: VerdictInput): string[] {
  const out: string[] = [];
  const m = Math.max(1, Math.floor(input.variantsTried));
  if (m > 1) {
    out.push(
      `${m} variants tried — best-of-${m} inflates false positives; the CI bar was widened (multiple-comparisons adjustment) to compensate.`,
    );
  }
  if (input.inSampleOnly) {
    out.push(
      "In-sample only: no out-of-sample / walk-forward confirmation yet. An in-sample winner routinely fails forward — treat as unproven until it survives unseen data.",
    );
  }
  const minRegime = input.minRegimeSample ?? 0;
  if (input.regimeCounts && minRegime > 0) {
    for (const [regime, count] of Object.entries(input.regimeCounts)) {
      if (count < minRegime) {
        out.push(
          `Thin regime "${regime}": only ${count} trades (< ${minRegime}). Any per-regime edge here is likely noise; do not lean on it.`,
        );
      }
    }
  }
  return out;
}
