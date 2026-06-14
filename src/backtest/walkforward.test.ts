import { describe, it, expect } from "vitest";
import type { Candle } from "../stellar/market";
import { makeFolds, walkForward } from "./walkforward";
import { DEFAULT_BACKTEST_CONFIG } from "./engine";
import { paramGrid } from "./search";

describe("makeFolds", () => {
  it("produces non-overlapping, forward-rolling test windows", () => {
    // n=1000, window=24, train=600, test=200.
    const folds = makeFolds(1000, 24, 600, 200);
    expect(folds.length).toBeGreaterThan(0);
    for (const f of folds) {
      expect(f.trainStart).toBeGreaterThanOrEqual(24);
      expect(f.trainEnd - f.trainStart).toBe(600);
      expect(f.testStart).toBe(f.trainEnd); // test immediately follows train
      expect(f.testEnd - f.testStart).toBe(200);
      expect(f.testEnd).toBeLessThanOrEqual(1000);
    }
    // Test windows step forward by testBars and never overlap.
    for (let i = 1; i < folds.length; i++) {
      expect(folds[i]!.testStart).toBe(folds[i - 1]!.testStart + 200);
    }
  });

  it("returns no folds when history is too short", () => {
    expect(makeFolds(100, 24, 600, 200)).toEqual([]);
  });
});

describe("paramGrid", () => {
  it("is coarse on purpose (a few dozen configs, not thousands)", () => {
    const grid = paramGrid();
    // 4 RR x 3 atr x 3 trendRsi x 3 rangePos x 2 rangeRsi = 216.
    expect(grid.length).toBe(216);
    // Symmetric knobs are coupled (fewer degrees of freedom to overfit).
    for (const p of grid) {
      expect(p.trendBounceRsi).toBe(100 - p.trendPullbackRsi);
      expect(p.rangeSellRsi).toBe(100 - p.rangeBuyRsi);
      expect(p.rangeHighPos).toBeCloseTo(1 - p.rangeLowPos, 9);
    }
  });
});

describe("walkForward", () => {
  // A deterministic series long enough for at least one train+test fold.
  function series(bars: number): Candle[] {
    const pattern = [100, 102, 100, 98];
    return Array.from({ length: bars }, (_, i) => {
      const close = pattern[i % pattern.length]!;
      return {
        time: new Date(i * 3_600_000).toISOString(),
        open: close,
        high: close + 0.5,
        low: close - 0.5,
        close,
        baseVolume: 1000,
      };
    });
  }

  it("runs folds and returns a pooled out-of-sample track record", () => {
    const candles = series(1100);
    const wf = walkForward(
      "XLM",
      "USDC",
      candles,
      { ...DEFAULT_BACKTEST_CONFIG, applyVolumeGate: false },
      600,
      200,
      2,
    );
    expect(wf.folds.length).toBeGreaterThan(0);
    // Out-of-sample metrics are computed only from test-slice trades.
    expect(wf.oosMetrics.trades).toBe(wf.oosTrades.length);
    expect(wf.tradedFolds).toBeLessThanOrEqual(wf.folds.length);
    expect(wf.positiveFolds).toBeLessThanOrEqual(wf.tradedFolds);
  });

  it("yields no folds (and an empty record) on short history", () => {
    const wf = walkForward(
      "XLM",
      "USDC",
      series(300),
      DEFAULT_BACKTEST_CONFIG,
      600,
      200,
    );
    expect(wf.folds).toEqual([]);
    expect(wf.oosMetrics.trades).toBe(0);
  });
});
