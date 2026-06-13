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

  const decided = wins + losses;
  return {
    trades: trades.length,
    wins,
    losses,
    scratches,
    winRatePct: decided > 0 ? round((wins / decided) * 100, 1) : 0,
    expectancyR: round(totalR / trades.length, 4),
    totalR: round(totalR, 4),
    profitFactor: grossLossR > 0 ? round(grossWinR / grossLossR, 3) : null,
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
