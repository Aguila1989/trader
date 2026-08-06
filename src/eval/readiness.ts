import { armKeyOf, type ArmAttribution, type EvalArmKey } from "./types";

/**
 * The READINESS GATE: the pure decision of whether an arm's paper-trading
 * track record has earned the right to touch real (tiny) money.
 *
 * This module knows nothing about loops, clocks, or I/O - it is a function of
 * history in, verdict out, which is exactly what makes it trustworthy: the
 * same history always produces the same answer, and every test below can
 * construct that history by hand instead of running a simulation.
 *
 * It builds on src/eval/types.ts's ArmAttribution (the Phase-4 evaluator's
 * per-iteration output). At the time this was written src/eval/stats.ts (the
 * sibling module types.ts's own doc-comments reference for `verdictFor`) did
 * not yet exist in the tree - it is one of several files a concurrent Phase-4a
 * build is producing. Rather than hard-depend on an interface that might land
 * with a different shape, this module implements its OWN small bootstrap CI
 * (bootstrapCI below) over `ArmAttribution.netReturns`, using the exact same
 * method and fixed seed as src/backtest/metrics.ts's `expectancyCI` (that
 * function only accepts `BacktestTrade[]`, not raw returns, so it can't be
 * reused directly here). If/when stats.ts lands with an equivalent helper,
 * `bootstrapCI` here should be deleted in favor of it - see ITERATION.md.
 *
 * READY requires ALL of:
 *  1. Significant, cost-surviving edge: the pooled confirmation-tail CI on net
 *     returns clears zero at a confidence level tightened by how many
 *     variants this loop has tried for that arm (the multiple-comparisons bar).
 *  2. Stable across regimes: no regime with enough trades to trust is a net
 *     loser, and the edge shows up in more than one regime (one regime
 *     carrying the whole result is a curve-fit to that regime, not an edge).
 *  3. Stable out-of-sample: only iterations that were BOTH out-of-sample AND
 *     untouched by this run's own tuner count at all.
 *  4. Sustained >= K consecutive such iterations (a single lucky iteration,
 *     however dazzling, is explicitly not enough - see the tests).
 *  5. Plateaued: the last `plateauWindow` iterations show no material
 *     improvement - i.e. further tuning has stopped paying off. An edge that
 *     is still visibly improving hasn't finished being found yet; it isn't
 *     "ready", it's "in progress".
 *
 * Budget exhaustion (iteration cap or wall-clock, decided by the caller) short
 * -circuits straight to `no-proven-edge` even if some gates are individually
 * satisfied - see evaluateReadiness. That is a valid, honest terminal state,
 * not a bug: most hypotheses are simply wrong, and saying so is the point.
 */

export interface BudgetStatus {
  /** True once the loop's iteration cap OR wall-clock allowance is used up. */
  exhausted: boolean;
  iterationsUsed: number;
  maxIterations: number;
}

/**
 * One iteration's confirmation result for one arm. `attribution` is whatever
 * the Phase-4 evaluator measured on THIS iteration's window; `isOutOfSample`
 * and `tunedThisIteration` are iterate.ts's bookkeeping about how that window
 * was obtained, and are what let readiness ignore anything tainted by tuning.
 */
export interface ArmIterationResult {
  iteration: number;
  key: EvalArmKey;
  /** True only when the trades behind `attribution` came from a window this
   *  iteration's own tuning step never saw (a genuine held-out confirmation). */
  isOutOfSample: boolean;
  /** True when the params scored here were selected/adjusted USING this same
   *  iteration's window. Any iteration with this true can NEVER count toward
   *  the K-consecutive run or the pooled significance test below. */
  tunedThisIteration: boolean;
  attribution: ArmAttribution;
}

export interface ReadinessConfig {
  /** K: consecutive untouched (OOS, untuned) iterations required. */
  minConsecutiveIterations: number;
  /** M: iterations over which "no material improvement" must hold to call it
   *  plateaued. */
  plateauWindow: number;
  /** Minimum change in mean net return between consecutive iterations that
   *  still counts as "materially improving" (i.e. NOT yet plateaued). */
  materialImprovement: number;
  /** Base two-sided confidence level for the edge-vs-zero CI, BEFORE the
   *  multiple-comparisons correction (0.95 matches the repo's existing
   *  backtest/metrics.ts + eval/types.ts DEFAULT_EVAL_CONFIG convention). */
  baseConfidenceLevel: number;
  /** Trades required in a regime bucket before its result counts toward the
   *  stability check - too few trades in a bucket is noise, not instability. */
  minTradesPerRegimeBucket: number;
  /** An arm must show a trustworthy result in at least this many DISTINCT
   *  regimes across its qualifying iterations. */
  minRegimesCovered: number;
  /** Fraction of the qualifying (confirmation-tail) iterations that must
   *  individually be non-negative (mirrors the >=60% fold-consistency bar
   *  backtest/report.ts already uses for walk-forward verdicts). */
  minConsistentFraction: number;
  /** Bootstrap resamples for the significance recompute. */
  ciResamples: number;
  /** Minimum INDEPENDENT round-trip observations (pooled across the
   *  confirmation tail) required before significance is even tested. The
   *  observations are one-per-closing-decision (see attribution.ts) precisely
   *  so this counts real round trips, not correlated lot-chunks; a tight CI
   *  over a handful of round trips is noise. (Review 2026-08-04, eval-honesty
   *  P0 — the gate previously had no minimum-n at all.) */
  minIndependentTrades: number;
}

export const DEFAULT_READINESS_CONFIG: ReadinessConfig = {
  minConsecutiveIterations: 5,
  plateauWindow: 3,
  materialImprovement: 0.02,
  baseConfidenceLevel: 0.95,
  minTradesPerRegimeBucket: 5,
  minRegimesCovered: 2,
  minConsistentFraction: 0.6,
  ciResamples: 10_000,
  minIndependentTrades: 30,
};

export type Recommendation =
  | "ready-for-tiny-live"
  | "keep-iterating"
  | "no-proven-edge";

export interface ArmReadiness {
  key: EvalArmKey;
  ready: boolean;
  consecutiveQualifyingIterations: number;
  significant: boolean;
  regimeStable: boolean;
  consistent: boolean;
  plateaued: boolean;
  reasons: string[];
}

export interface ReadinessResult {
  ready: boolean;
  recommendation: Recommendation;
  reasons: string[];
  perArm: ArmReadiness[];
}

/**
 * The trailing run of iterations that are BOTH out-of-sample AND untouched by
 * this run's tuner. A single tuned (or in-sample) iteration anywhere in the
 * trailing run resets it to empty from that point forward - this is what
 * makes "the final K confirmation iterations apply NO further tuning" an
 * enforced property of the readiness check itself, not just of iterate.ts's
 * loop control.
 */
export function trailingConfirmationRun(
  iterations: ArmIterationResult[],
): ArmIterationResult[] {
  const run: ArmIterationResult[] = [];
  for (let i = iterations.length - 1; i >= 0; i--) {
    const it = iterations[i]!;
    if (!it.isOutOfSample || it.tunedThisIteration) break;
    run.unshift(it);
  }
  return run;
}

/**
 * "No material improvement for M iterations." Walks the trailing `window`
 * consecutive-pair deltas of `scores` (already in iteration order) and
 * requires every one of them to be <= `materialImprovement`. Fewer than
 * `window + 1` points is "not enough evidence to call it plateaued yet",
 * which correctly keeps a short history from being declared plateaued.
 */
export function detectPlateau(
  scores: number[],
  window: number,
  materialImprovement: number,
): boolean {
  if (scores.length < window + 1) return false;
  const tail = scores.slice(scores.length - (window + 1));
  for (let i = 1; i < tail.length; i++) {
    if (tail[i]! - tail[i - 1]! > materialImprovement) return false;
  }
  return true;
}

/**
 * Bonferroni-style multiplicity correction: the more variants this loop has
 * tried for an arm, the tighter the confidence interval it must clear before
 * "positive" is allowed to read as "proven". Clamped below 0.995 so the
 * bootstrap tail stays non-degenerate at the default resample count (a level
 * closer to 1 would need more resamples to even have a distinct tail index).
 */
export function adjustedConfidenceLevel(
  baseLevel: number,
  variantsTried: number,
): number {
  const baseAlpha = 1 - baseLevel;
  const n = Math.max(1, variantsTried);
  const adjustedAlpha = baseAlpha / n;
  // TODO(review 2026-08-04, eval-honesty P1): this 0.995 clamp saturates the
  // multiple-comparisons correction — beyond ~10 variants the bar stops
  // tightening, so a thousands-of-variants automated search is under-corrected
  // and a noise winner can reach "ready". Fix by scaling the bootstrap resample
  // count with the level (or a BCa/analytic tail) so the correction keeps
  // biting, and UNIFY with stats.ts (whose Šidák path has no clamp, so the two
  // honesty layers disagree at high variant counts). Deliberately not rushed
  // here — a wrong stats change makes honesty worse; do it with a known-answer
  // test before the eval loop is ever run.
  return Math.min(1 - adjustedAlpha, 0.995);
}

export interface BootstrapCI {
  level: number;
  resamples: number;
  lowerR: number;
  upperR: number;
  excludesZero: boolean;
}

/**
 * Deterministic percentile bootstrap CI on the mean of `returns`. Same method
 * and fixed seed (0x9e3779b9 - also eval/types.ts's DEFAULT_EVAL_CONFIG.seed)
 * as src/backtest/metrics.ts's expectancyCI, reimplemented here because that
 * function is typed to BacktestTrade[] rather than raw numbers. See the file
 * banner for why this isn't imported from a not-yet-existing stats.ts.
 */
export function bootstrapCI(
  returns: number[],
  level: number,
  resamples: number,
): BootstrapCI | null {
  const n = returns.length;
  if (n < 2) return null;
  const rng = mulberry32(0x9e3779b9);
  const means = new Array<number>(resamples);
  for (let b = 0; b < resamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += returns[Math.floor(rng() * n)]!;
    means[b] = sum / n;
  }
  means.sort((a, b) => a - b);
  const tail = (1 - level) / 2;
  const lowerR = means[Math.max(0, Math.floor(tail * resamples))]!;
  const upperR =
    means[Math.min(resamples - 1, Math.ceil((1 - tail) * resamples) - 1)]!;
  return {
    level,
    resamples,
    lowerR: round(lowerR),
    upperR: round(upperR),
    excludesZero: lowerR > 0 || upperR < 0,
  };
}

/** Small deterministic PRNG (mulberry32) - seeded, so the CI reproduces. */
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

function round(n: number): number {
  return Number(n.toFixed(4));
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

/** Merge per-iteration regime buckets into one pooled { trades, netPnlXlm }
 *  map so the stability check sees the WHOLE confirmation tail per regime,
 *  not one iteration's thin slice of it. */
function pooledRegimes(
  tail: ArmIterationResult[],
): Map<string, { trades: number; netPnlXlm: number }> {
  const pooled = new Map<string, { trades: number; netPnlXlm: number }>();
  for (const it of tail) {
    for (const [regime, bucket] of Object.entries(it.attribution.byRegime)) {
      const cur = pooled.get(regime) ?? { trades: 0, netPnlXlm: 0 };
      cur.trades += bucket.trades;
      cur.netPnlXlm += bucket.netPnlXlm;
      pooled.set(regime, cur);
    }
  }
  return pooled;
}

function evaluateArmReadiness(
  key: EvalArmKey,
  iterations: ArmIterationResult[],
  variantsTried: number,
  config: ReadinessConfig,
): ArmReadiness {
  const label = armKeyOf(key);
  const reasons: string[] = [];

  const tail = trailingConfirmationRun(iterations);
  const consecutive = tail.length;
  const enoughConsecutive = consecutive >= config.minConsecutiveIterations;
  if (!enoughConsecutive) {
    reasons.push(
      `${label}: only ${consecutive}/${config.minConsecutiveIterations} consecutive untouched out-of-sample iterations`,
    );
  }

  const perIterationMean = tail.map((it) => mean(it.attribution.netReturns));
  const consistentCount = perIterationMean.filter((m) => m > 0).length;
  const consistentFraction = tail.length ? consistentCount / tail.length : 0;
  const consistent =
    tail.length > 0 && consistentFraction >= config.minConsistentFraction;
  if (!consistent) {
    reasons.push(
      `${label}: only ${consistentCount}/${tail.length || 0} confirmation iterations were individually net-positive (need >=${Math.round(config.minConsistentFraction * 100)}%)`,
    );
  }

  const pooledReturns = tail.flatMap((it) => it.attribution.netReturns);
  const enoughIndependent = pooledReturns.length >= config.minIndependentTrades;
  const level = adjustedConfidenceLevel(config.baseConfidenceLevel, variantsTried);
  const ci = bootstrapCI(pooledReturns, level, config.ciResamples);
  const significant =
    enoughIndependent && ci != null && ci.excludesZero && ci.lowerR > 0;
  if (!significant) {
    reasons.push(
      !enoughIndependent
        ? `${label}: only ${pooledReturns.length} independent round-trip(s) pooled - need >=${config.minIndependentTrades} before significance can be tested`
        : ci == null
          ? `${label}: fewer than 2 pooled confirmation trades - can't test significance`
          : `${label}: ${(level * 100).toFixed(2)}% CI [${ci.lowerR}, ${ci.upperR}] (variantsTried=${variantsTried}) does not clear zero`,
    );
  }

  const regimeStats = pooledRegimes(tail);
  const trustedBuckets = [...regimeStats.values()].filter(
    (b) => b.trades >= config.minTradesPerRegimeBucket,
  );
  const badRegime = trustedBuckets.find((b) => b.netPnlXlm < 0);
  const regimesCovered = trustedBuckets.length;
  const regimeStable = !badRegime && regimesCovered >= config.minRegimesCovered;
  if (!regimeStable) {
    reasons.push(
      badRegime
        ? `${label}: a regime with >=${config.minTradesPerRegimeBucket} trades is a net loser - the edge doesn't survive that regime`
        : `${label}: only ${regimesCovered}/${config.minRegimesCovered} regimes have enough trades to trust`,
    );
  }

  const fullTrail = iterations.map((it) => mean(it.attribution.netReturns));
  const plateaued = detectPlateau(
    fullTrail,
    config.plateauWindow,
    config.materialImprovement,
  );
  if (!plateaued) {
    reasons.push(
      `${label}: still materially improving over the last ${config.plateauWindow} iterations - not plateaued yet`,
    );
  }

  const ready =
    enoughConsecutive && consistent && significant && regimeStable && plateaued;

  return {
    key,
    ready,
    consecutiveQualifyingIterations: consecutive,
    significant,
    regimeStable,
    consistent,
    plateaued,
    reasons,
  };
}

/**
 * The single readiness decision. `historyByArm`/`variantsTriedByArm` are keyed
 * by armKeyOf(key). Budget exhaustion always wins over a partial pass: an arm
 * that is close but not yet proven, with the budget spent, is `no-proven-edge`
 * - not `keep-iterating` (there is nothing left to iterate with).
 */
export function evaluateReadiness(
  historyByArm: Record<string, ArmIterationResult[]>,
  variantsTriedByArm: Record<string, number>,
  budget: BudgetStatus,
  config: ReadinessConfig = DEFAULT_READINESS_CONFIG,
): ReadinessResult {
  const armLabels = Object.keys(historyByArm);
  const perArm = armLabels.map((label) => {
    const iterations = historyByArm[label] ?? [];
    const key = iterations[0]?.key ?? { arm: label, venue: "" };
    return evaluateArmReadiness(
      key,
      iterations,
      // Missing count = a wiring gap; default CONSERVATIVELY to the iteration
      // count (a floor for how many variants a search of this length tried)
      // rather than 0/no-correction. (Review 2026-08-04, eval-honesty P2.)
      variantsTriedByArm[label] ?? iterations.length,
      config,
    );
  });

  const readyArms = perArm.filter((a) => a.ready);
  if (readyArms.length > 0) {
    return {
      ready: true,
      recommendation: "ready-for-tiny-live",
      reasons: readyArms.map(
        (a) => `${armKeyOf(a.key)}: meets every readiness gate`,
      ),
      perArm,
    };
  }

  const reasons = perArm.flatMap((a) => a.reasons);
  if (budget.exhausted) {
    return {
      ready: false,
      recommendation: "no-proven-edge",
      reasons: [
        `iteration/wall-clock budget exhausted (${budget.iterationsUsed}/${budget.maxIterations} iterations) before any arm passed every readiness gate - an honest "no proven edge" result, not a failure of the loop.`,
        ...reasons,
      ],
      perArm,
    };
  }

  return {
    ready: false,
    recommendation: "keep-iterating",
    reasons:
      reasons.length > 0
        ? reasons
        : ["no arm history yet - nothing to evaluate"],
    perArm,
  };
}
