import { describe, it, expect } from "vitest";
import type { Candle } from "../stellar/market";
import { candleQuality } from "./data";

const HOUR = 3_600_000;

/** A candle at the given hour index with a chosen trade count. */
function candle(hourIndex: number, tradeCount: number): Candle {
  return {
    time: new Date(hourIndex * HOUR).toISOString(),
    open: 1,
    high: 1,
    low: 1,
    close: 1,
    baseVolume: 100,
    tradeCount,
  };
}

describe("candleQuality", () => {
  it("is neutral on an empty series", () => {
    expect(candleQuality([], HOUR)).toEqual({
      candles: 0,
      medianTradesPerBucket: 0,
      coverage: 1,
    });
  });

  it("reports the median trades per bucket (per-bar liquidity)", () => {
    const cs = [1, 2, 3, 100, 200].map((tc, i) => candle(i, tc));
    const q = candleQuality(cs, HOUR);
    expect(q.candles).toBe(5);
    expect(q.medianTradesPerBucket).toBe(3);
  });

  it("scores a continuous series at full coverage", () => {
    const cs = Array.from({ length: 10 }, (_, i) => candle(i, 50));
    expect(candleQuality(cs, HOUR).coverage).toBeCloseTo(1, 3);
  });

  it("drops coverage when the history is gappy (Horizon skipped empty buckets)", () => {
    // 10 candles spanning hours [0..4] then [10..14]: 15 expected, 10 present.
    const hours = [0, 1, 2, 3, 4, 10, 11, 12, 13, 14];
    const q = candleQuality(hours.map((h) => candle(h, 50)), HOUR);
    expect(q.coverage).toBeCloseTo(10 / 15, 2);
  });

  it("separates a deep book from a thin one by median liquidity", () => {
    const deep = Array.from({ length: 50 }, (_, i) => candle(i, 2000));
    const thin = Array.from({ length: 50 }, (_, i) => candle(i, 4));
    expect(candleQuality(deep, HOUR).medianTradesPerBucket).toBeGreaterThan(1000);
    expect(candleQuality(thin, HOUR).medianTradesPerBucket).toBeLessThan(20);
  });
});
