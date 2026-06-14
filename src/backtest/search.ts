import { DEFAULT_PARAMS, type StrategyParams } from "./strategy";
import {
  runBacktest,
  type BacktestConfig,
} from "./engine";
import { computeMetrics, type Metrics } from "./metrics";
import type { Candle } from "../stellar/market";

/**
 * Strategy parameter SEARCH.
 *
 * This is the part an AI is genuinely good at and a human is not: mechanically
 * sweeping a large space of configurations and ranking them by an honest score.
 * It is also where backtesting most easily lies to you - test 200 configs and
 * the best one looks brilliant by pure chance (multiple-comparisons bias). So:
 *
 *  - The grid is deliberately COARSE and small (a few dozen configs, not
 *    thousands). Every extra knob is a degree of freedom to overfit.
 *  - The score penalizes tiny samples (expectancy x sqrt(trades)), so a config
 *    that "wins" on 3 lucky trades doesn't beat one with a real track record.
 *  - The ranking this produces is IN-SAMPLE and therefore overfit-prone by
 *    construction. It is only trustworthy once run through walk-forward
 *    (walkforward.ts), which optimizes here on past data and scores on UNSEEN
 *    future data. In-sample search alone is a hypothesis generator, not proof.
 */

/** Expand the (coarse) parameter grid. Symmetric knobs are coupled to halve
 *  the dimensionality - fewer degrees of freedom is fewer ways to overfit. */
export function paramGrid(): StrategyParams[] {
  const rewardRiskMults = [1.2, 1.5, 2, 3];
  const atrStopMults = [1, 1.5, 2];
  const trendRsis = [40, 45, 50]; // bounce mirrors at 100 - this
  const rangePosEdges = [0.2, 0.25, 0.3]; // high mirrors at 1 - this
  const rangeRsis = [35, 40]; // sell mirrors at 100 - this

  const out: StrategyParams[] = [];
  for (const rewardRiskMult of rewardRiskMults) {
    for (const atrStopMult of atrStopMults) {
      for (const trendPullbackRsi of trendRsis) {
        for (const lowPos of rangePosEdges) {
          for (const buyRsi of rangeRsis) {
            out.push({
              ...DEFAULT_PARAMS,
              rewardRiskMult,
              atrStopMult,
              trendPullbackRsi,
              trendBounceRsi: 100 - trendPullbackRsi,
              rangeLowPos: lowPos,
              rangeHighPos: Number((1 - lowPos).toFixed(3)),
              rangeBuyRsi: buyRsi,
              rangeSellRsi: 100 - buyRsi,
            });
          }
        }
      }
    }
  }
  return out;
}

export interface ScoredParams {
  params: StrategyParams;
  metrics: Metrics;
  /** expectancy x sqrt(trades): rewards edge AND a sample big enough to trust. */
  score: number;
}

/**
 * Robustness-adjusted score. A config must clear `minTrades` to be eligible at
 * all (below that it's noise); above it, expectancy is scaled by sqrt(trades)
 * so a thin-but-lucky run can't out-rank a thick, consistently positive one.
 */
export function scoreMetrics(m: Metrics, minTrades: number): number {
  if (m.trades < minTrades) return -Infinity;
  return m.expectancyR * Math.sqrt(m.trades);
}

/**
 * Run the whole grid over one candle window and return configs ranked best
 * first. `cfg` supplies the fixed (non-strategy) knobs - cost, window, gates -
 * which are held constant across the sweep so only the strategy params vary.
 */
export function searchParams(
  candles: Candle[],
  cfg: BacktestConfig,
  minTrades = 8,
): ScoredParams[] {
  const grid = paramGrid();
  const scored: ScoredParams[] = grid.map((params) => {
    const res = runBacktest("BASE", "QUOTE", candles, { ...cfg, params });
    const metrics = computeMetrics(res.trades);
    return { params, metrics, score: scoreMetrics(metrics, minTrades) };
  });
  return scored.sort((a, b) => b.score - a.score);
}

/** The single best-scoring config over a window (or null if none qualifies). */
export function bestParams(
  candles: Candle[],
  cfg: BacktestConfig,
  minTrades = 8,
): ScoredParams | null {
  const top = searchParams(candles, cfg, minTrades)[0];
  return top && Number.isFinite(top.score) ? top : null;
}
