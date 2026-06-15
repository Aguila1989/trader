import type { BacktestTrade } from "./engine";

/**
 * Performance statistics over a set of completed backtest trades.
 *
 * The unit is the R-MULTIPLE: a trade's net cost-adjusted PnL divided by the
 * risk it put up (entry-to-stop distance). R is currency- and size-agnostic, so
 * outcomes from XLM/USDC and XLM/NGNT are summable on one axis and the equity
 * curve reads as "how many units of risk did this edge return". Win rate alone
 * is famously misleading - expectancy (avg R) and profit factor are what say
 * whether there is an edge once costs are paid.
 */
export interface Metrics {
  trades: number;
  wins: number;
  losses: number;
  scratches: number;
  winRatePct: number;
  /** Average R across all trades = per-trade expectancy. >0 means an edge. */
  expectancyR: number;
  /** Sum of R across all trades (equity in risk units). */
  totalR: number;
  /** Gross winning R / gross losing R. >1 = profitable, <1 = bleeds. */
  profitFactor: number | null;
  /** Sample standard deviation of per-trade R (how dispersed the outcomes are). */
  stdDevR: number;
  /**
   * One-sample t-statistic of expectancy vs zero = mean * sqrt(n) / stdDev.
   * null when <2 trades or zero variance. |t| >~ 2 is ~95% confidence
   * (two-sided, n >~ 30) that the edge is NOT just luck - the headline
   * "is this real or noise" number. A great-looking expectancy on 12 trades
   * with t=0.7 is a coin that landed heads a few times, not an edge.
   */
  tStat: number | null;
  /** Per-trade Sharpe = expectancy / stdDev (risk-adjusted edge, unitless). */
  sharpePerTrade: number;
  avgWinR: number;
  avgLossR: number;
  avgWinPct: number;
  avgLossPct: number;
  bestR: number;
  worstR: number;
  avgBarsHeld: number;
  /** Largest peak-to-trough drop of the cumulative-R equity curve, in R. */
  maxDrawdownR: number;
  /** Cumulative R after each trade, in order (the equity curve). */
  equityCurveR: number[];
  /** Count of exits by reason, e.g. { target: 3, stop: 5, timeout: 2 }. */
  exitReasons: Record<string, number>;
}

// Treat |R| below this as a scratch (cost-only) rather than a win or loss.
const SCRATCH_EPS = 0.01;

export function computeMetrics(trades: BacktestTrade[]): Metrics {
  const empty: Metrics = {
    trades: 0,
    wins: 0,
    losses: 0,
    scratches: 0,
    winRatePct: 0,
    expectancyR: 0,
    totalR: 0,
    profitFactor: null,
    stdDevR: 0,
    tStat: null,
    sharpePerTrade: 0,
    avgWinR: 0,
    avgLossR: 0,
    avgWinPct: 0,
    avgLossPct: 0,
    bestR: 0,
    worstR: 0,
    avgBarsHeld: 0,
    maxDrawdownR: 0,
    equityCurveR: [],
    exitReasons: {},
  };
  if (trades.length === 0) return empty;

  let wins = 0;
  let losses = 0;
  let scratches = 0;
  let grossWinR = 0;
  let grossLossR = 0; // accumulated as a positive magnitude
  let sumWinPct = 0;
  let sumLossPct = 0;
  let totalR = 0;
  let sumR2 = 0; // Σ R² - feeds the variance / t-stat in one pass.
  let sumBars = 0;
  let bestR = -Infinity;
  let worstR = Infinity;
  const equityCurveR: number[] = [];
  const exitReasons: Record<string, number> = {};

  let cum = 0;
  let peak = 0;
  let maxDrawdownR = 0;

  for (const t of trades) {
    const r = t.rMultiple;
    totalR += r;
    sumR2 += r * r;
    sumBars += t.barsHeld;
    bestR = Math.max(bestR, r);
    worstR = Math.min(worstR, r);
    exitReasons[t.exitReason] = (exitReasons[t.exitReason] ?? 0) + 1;

    if (r > SCRATCH_EPS) {
      wins++;
      grossWinR += r;
      sumWinPct += t.pnlPct;
    } else if (r < -SCRATCH_EPS) {
      losses++;
      grossLossR += -r;
      sumLossPct += t.pnlPct;
    } else {
      scratches++;
    }

    cum += r;
    equityCurveR.push(round(cum, 4));
    peak = Math.max(peak, cum);
    maxDrawdownR = Math.max(maxDrawdownR, peak - cum);
  }

  // Dispersion-based statistics: is the expectancy distinguishable from luck?
  const n = trades.length;
  const mean = totalR / n;
  // Sample variance (ddof=1). Clamp tiny negatives from float cancellation.
  const variance = n > 1 ? Math.max(0, (sumR2 - n * mean * mean) / (n - 1)) : 0;
  const stdDevR = Math.sqrt(variance);
  const seR = n > 1 ? stdDevR / Math.sqrt(n) : 0; // standard error of the mean
  const tStat = seR > 0 ? mean / seR : null;
  const sharpePerTrade = stdDevR > 0 ? mean / stdDevR : 0;

  const decided = wins + losses;
  return {
    trades: trades.length,
    wins,
    losses,
    scratches,
    winRatePct: decided > 0 ? round((wins / decided) * 100, 1) : 0,
    expectancyR: round(mean, 4),
    totalR: round(totalR, 4),
    profitFactor: grossLossR > 0 ? round(grossWinR / grossLossR, 3) : null,
    stdDevR: round(stdDevR, 4),
    tStat: tStat === null ? null : round(tStat, 3),
    sharpePerTrade: round(sharpePerTrade, 4),
    avgWinR: wins > 0 ? round(grossWinR / wins, 4) : 0,
    avgLossR: losses > 0 ? round(-grossLossR / losses, 4) : 0,
    avgWinPct: wins > 0 ? round(sumWinPct / wins, 4) : 0,
    avgLossPct: losses > 0 ? round(sumLossPct / losses, 4) : 0,
    bestR: round(bestR, 4),
    worstR: round(worstR, 4),
    avgBarsHeld: round(sumBars / trades.length, 1),
    maxDrawdownR: round(maxDrawdownR, 4),
    equityCurveR,
    exitReasons,
  };
}

function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

export interface ExpectancyCI {
  /** Confidence level, e.g. 0.95. */
  level: number;
  resamples: number;
  /** Lower / upper bound of expectancy (avg R), in R. */
  lowerR: number;
  upperR: number;
  /** True when the whole interval sits on one side of 0 (edge ≠ noise). */
  excludesZero: boolean;
}

/**
 * Bootstrap percentile confidence interval for expectancy (mean R).
 *
 * Why a bootstrap and not a textbook t-interval: R-multiples are not normal -
 * they are bounded near -1R by the stop and carry a fat right tail from
 * targets/timeouts, so the symmetric t-interval misleads at the sample sizes a
 * DEX strategy produces (tens of trades). Resampling the actual trades with
 * replacement assumes nothing about the shape of the distribution.
 *
 * It is DETERMINISTIC (fixed PRNG seed): the same trades always yield the same
 * interval, because a backtest number that jitters run-to-run is its own kind
 * of lie. The headline read is `excludesZero` (really lowerR > 0): if the 95%
 * interval still includes 0, a positive point estimate is not yet an edge.
 */
export function expectancyCI(
  trades: BacktestTrade[],
  level = 0.95,
  resamples = 10_000,
): ExpectancyCI | null {
  const n = trades.length;
  if (n < 2) return null;
  const rs = trades.map((t) => t.rMultiple);
  const rng = mulberry32(0x9e3779b9); // fixed seed -> reproducible interval
  const means = new Array<number>(resamples);
  for (let b = 0; b < resamples; b++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += rs[Math.floor(rng() * n)]!;
    means[b] = sum / n;
  }
  means.sort((a, b) => a - b);
  const tail = (1 - level) / 2;
  const lowerR = means[Math.max(0, Math.floor(tail * resamples))]!;
  const upperR = means[Math.min(resamples - 1, Math.ceil((1 - tail) * resamples) - 1)]!;
  return {
    level,
    resamples,
    lowerR: round(lowerR, 4),
    upperR: round(upperR, 4),
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
