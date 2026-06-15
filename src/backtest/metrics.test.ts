import { describe, it, expect } from "vitest";
import type { BacktestTrade } from "./engine";
import { computeMetrics, expectancyCI } from "./metrics";

/** A filler trade with a chosen R-multiple; other fields don't affect stats. */
function trade(rMultiple: number): BacktestTrade {
  return {
    pair: "XLM/USDC",
    side: "buy",
    regime: "ranging",
    confidence: "medium",
    reason: "test",
    entryTime: "t0",
    entryPrice: 1,
    exitTime: "t1",
    exitPrice: 1,
    target: 1,
    invalidation: 1,
    riskPerUnit: 1,
    rMultiple,
    pnlPct: rMultiple,
    barsHeld: 1,
    exitReason: "target",
  };
}

function many(rMultiple: number, n: number): BacktestTrade[] {
  return Array.from({ length: n }, () => trade(rMultiple));
}

describe("computeMetrics statistics", () => {
  it("has zero dispersion and a null t-stat on empty / singleton sets", () => {
    const empty = computeMetrics([]);
    expect(empty.stdDevR).toBe(0);
    expect(empty.tStat).toBeNull();
    expect(empty.sharpePerTrade).toBe(0);

    // n < 2: variance is undefined, so no t-stat.
    expect(computeMetrics([trade(0.5)]).tStat).toBeNull();
  });

  it("computes sample stdev, t-stat and per-trade Sharpe for a zero-mean set", () => {
    // R = [1, -1, 1, -1]: mean 0 -> t and Sharpe collapse to 0.
    const m = computeMetrics([trade(1), trade(-1), trade(1), trade(-1)]);
    expect(m.expectancyR).toBeCloseTo(0, 6);
    expect(m.tStat).toBeCloseTo(0, 6);
    expect(m.sharpePerTrade).toBeCloseTo(0, 6);
    // ddof=1 stdev of [1,-1,1,-1] = sqrt(4/3) ~ 1.1547.
    expect(m.stdDevR).toBeCloseTo(1.1547, 3);
  });

  it("returns a null t-stat when every outcome is identical (zero variance)", () => {
    const m = computeMetrics(many(0.5, 30));
    expect(m.expectancyR).toBeCloseTo(0.5, 6);
    expect(m.stdDevR).toBe(0);
    expect(m.tStat).toBeNull(); // can't divide by zero spread
    expect(m.sharpePerTrade).toBe(0);
  });

  it("produces a significant t-stat when wins dominate with modest spread", () => {
    // 15x +1R, 5x -1R -> mean 0.5, ddof=1 stdev ~0.889, t = 0.5*sqrt(20)/0.889 ~ 2.52.
    const m = computeMetrics([...many(1, 15), ...many(-1, 5)]);
    expect(m.expectancyR).toBeCloseTo(0.5, 6);
    expect(m.tStat).not.toBeNull();
    expect(m.tStat!).toBeGreaterThan(2);
  });
});

describe("expectancyCI (deterministic bootstrap)", () => {
  it("returns null with fewer than 2 trades", () => {
    expect(expectancyCI([])).toBeNull();
    expect(expectancyCI([trade(1)])).toBeNull();
  });

  it("is reproducible: the same trades yield the identical interval", () => {
    const ts = [...many(0.8, 30), ...many(-1, 10)];
    expect(expectancyCI(ts)).toEqual(expectancyCI(ts));
  });

  it("brackets the expectancy, low <= high", () => {
    const ts = [...many(1, 40), ...many(-1, 10)];
    const ci = expectancyCI(ts)!;
    expect(ci.lowerR).toBeLessThanOrEqual(ci.upperR);
    const m = computeMetrics(ts);
    expect(ci.lowerR).toBeLessThanOrEqual(m.expectancyR);
    expect(ci.upperR).toBeGreaterThanOrEqual(m.expectancyR);
  });

  it("flags a strong edge as clearing zero, a coin-flip as spanning it", () => {
    // Strong: mean +0.6R; the whole 95% interval should sit above 0.
    const strong = expectancyCI([...many(1, 40), ...many(-1, 10)])!;
    expect(strong.lowerR).toBeGreaterThan(0);
    expect(strong.excludesZero).toBe(true);

    // Coin-flip: mean 0R; the interval must straddle 0 -> not an edge.
    const coinflip = expectancyCI([...many(1, 25), ...many(-1, 25)])!;
    expect(coinflip.lowerR).toBeLessThan(0);
    expect(coinflip.upperR).toBeGreaterThan(0);
    expect(coinflip.excludesZero).toBe(false);
  });
});
