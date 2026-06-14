import type { Candle } from "../stellar/market";
import {
  runBacktest,
  type BacktestConfig,
  type BacktestTrade,
} from "./engine";
import { computeMetrics, type Metrics } from "./metrics";
import { bestParams } from "./search";
import type { StrategyParams } from "./strategy";

/**
 * Walk-forward analysis - the honesty test that separates a real edge from a
 * curve-fit.
 *
 * The trap: optimize parameters on all your history and the backtest looks
 * incredible, because you fit the noise. Walk-forward refuses to let you do
 * that. It rolls a window forward: on each step it optimizes ONLY on a training
 * slice, then trades those frozen parameters on the NEXT, never-seen test
 * slice. The test trades from every fold are concatenated into one
 * out-of-sample track record. THAT number - not the in-sample one - is what you
 * are allowed to believe.
 *
 * A genuine edge shows positive out-of-sample expectancy AND does so across
 * most folds (not one fold carrying the average). A curve-fit posts a gorgeous
 * in-sample score and an out-of-sample one that hovers around zero or negative.
 */

export interface Fold {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
}

export interface FoldResult {
  fold: Fold;
  /** Parameters chosen on the training slice (null = nothing qualified). */
  params: StrategyParams | null;
  /** In-sample expectancy of the chosen params (for the train/test gap). */
  trainExpectancyR: number;
  /** Out-of-sample trades these params produced on the unseen test slice. */
  testTrades: BacktestTrade[];
  testMetrics: Metrics;
}

export interface WalkForwardResult {
  folds: FoldResult[];
  /** All out-of-sample trades pooled across folds (the honest track record). */
  oosTrades: BacktestTrade[];
  oosMetrics: Metrics;
  /** Folds with positive OOS expectancy / folds that actually traded. */
  positiveFolds: number;
  tradedFolds: number;
}

/**
 * Build rolling train/test folds over the usable index range [window, n).
 * Test windows are non-overlapping (we step forward by testBars), so pooling
 * their trades double-counts nothing.
 */
export function makeFolds(
  n: number,
  window: number,
  trainBars: number,
  testBars: number,
): Fold[] {
  const folds: Fold[] = [];
  let trainStart = window;
  while (trainStart + trainBars + testBars <= n) {
    const trainEnd = trainStart + trainBars;
    folds.push({
      trainStart,
      trainEnd,
      testStart: trainEnd,
      testEnd: trainEnd + testBars,
    });
    trainStart += testBars;
  }
  return folds;
}

/**
 * Run walk-forward over one pair. `optimize` defaults to the grid search in
 * search.ts; `trainBars`/`testBars` are in candles (e.g. at 1h: 600 train ~25d,
 * 200 test ~8d).
 */
export function walkForward(
  base: string,
  quote: string,
  candles: Candle[],
  cfg: BacktestConfig,
  trainBars: number,
  testBars: number,
  minTrainTrades = 8,
): WalkForwardResult {
  const folds = makeFolds(candles.length, cfg.window, trainBars, testBars);
  const foldResults: FoldResult[] = [];
  const oosTrades: BacktestTrade[] = [];

  for (const fold of folds) {
    // Train: optimize on [trainStart, trainEnd), with `window` candles of
    // warmup preceding it (trainStart >= window guarantees the slice exists).
    const trainSlice = candles.slice(fold.trainStart - cfg.window, fold.trainEnd);
    const best = bestParams(trainSlice, cfg, minTrainTrades);

    if (!best) {
      foldResults.push({
        fold,
        params: null,
        trainExpectancyR: 0,
        testTrades: [],
        testMetrics: computeMetrics([]),
      });
      continue;
    }

    // Test: trade the FROZEN params on [testStart, testEnd), unseen during
    // optimization, again with `window` candles of warmup before it.
    const testSlice = candles.slice(fold.testStart - cfg.window, fold.testEnd);
    const testRes = runBacktest(base, quote, testSlice, {
      ...cfg,
      params: best.params,
    });
    const testMetrics = computeMetrics(testRes.trades);

    foldResults.push({
      fold,
      params: best.params,
      trainExpectancyR: best.metrics.expectancyR,
      testTrades: testRes.trades,
      testMetrics,
    });
    oosTrades.push(...testRes.trades);
  }

  const traded = foldResults.filter((f) => f.testMetrics.trades > 0);
  const positive = traded.filter((f) => f.testMetrics.expectancyR > 0);

  return {
    folds: foldResults,
    oosTrades,
    oosMetrics: computeMetrics(oosTrades),
    positiveFolds: positive.length,
    tradedFolds: traded.length,
  };
}
