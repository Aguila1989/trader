import { describe, it, expect } from "vitest";
import {
  computeIndicators,
  emaLast,
  rsi,
  takerBuyPct,
  walkBook,
  type OhlcCandle,
} from "./indicators";

/** Build a candle around a close with a given range. */
function candle(close: number, range = 0.5, volume = 100): OhlcCandle {
  return {
    open: close,
    high: close + range / 2,
    low: close - range / 2,
    close,
    baseVolume: volume,
  };
}

describe("emaLast", () => {
  it("returns null with too few values", () => {
    expect(emaLast([1, 2], 8)).toBeNull();
  });

  it("equals the SMA when length == period", () => {
    expect(emaLast([1, 2, 3, 4], 4)).toBeCloseTo(2.5, 9);
  });

  it("weights recent values more after the seed", () => {
    const flatThenUp = [...Array(10).fill(100), 110];
    const e = emaLast(flatThenUp as number[], 10);
    expect(e).not.toBeNull();
    expect(e!).toBeGreaterThan(100);
    expect(e!).toBeLessThan(110);
  });
});

describe("rsi", () => {
  it("returns null with fewer than period+1 closes", () => {
    expect(rsi([1, 2, 3], 14)).toBeNull();
  });

  it("reads 100 on a straight-up series", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    expect(rsi(closes, 14)).toBe(100);
  });

  it("sits near 50 on an alternating series", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + (i % 2));
    const r = rsi(closes, 14);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(30);
    expect(r!).toBeLessThan(70);
  });
});

describe("computeIndicators regimes", () => {
  it("tags a clean directional move as trending-up", () => {
    const candles = Array.from({ length: 24 }, (_, i) => candle(100 + i, 0.5));
    const ind = computeIndicators(candles);
    expect(ind.regime).toBe("trending-up");
    expect(ind.efficiencyRatio).not.toBeNull();
    expect(ind.efficiencyRatio!).toBeGreaterThan(0.9);
    expect(ind.rangePos).not.toBeNull();
    expect(ind.rangePos!).toBeGreaterThan(0.9);
  });

  it("tags the mirror move as trending-down", () => {
    const candles = Array.from({ length: 24 }, (_, i) => candle(124 - i, 0.5));
    expect(computeIndicators(candles).regime).toBe("trending-down");
  });

  it("tags an oscillating series as ranging", () => {
    const candles = Array.from({ length: 24 }, (_, i) =>
      candle(100 + (i % 2), 0.5),
    );
    expect(computeIndicators(candles).regime).toBe("ranging");
  });

  it("tags a sudden true-range expansion as volatile", () => {
    const calm = Array.from({ length: 12 }, (_, i) =>
      candle(100 + (i % 2) * 0.2, 0.3),
    );
    const wild = Array.from({ length: 4 }, (_, i) =>
      candle(100 + (i % 2) * 0.2, 8),
    );
    expect(computeIndicators([...calm, ...wild]).regime).toBe("volatile");
  });

  it("returns nulls on an empty/short window", () => {
    const ind = computeIndicators([]);
    expect(ind.regime).toBeNull();
    expect(ind.rsi14).toBeNull();
    expect(ind.atrPct).toBeNull();
  });
});

describe("walkBook", () => {
  const asks = [
    { price: 0.5, amount: 5 },
    { price: 0.55, amount: 10 },
  ];

  it("computes the VWAP across levels for a buy", () => {
    const { fillableBase, vwap } = walkBook(asks, 10, "buy");
    expect(fillableBase).toBe(10);
    // 5 @ 0.5 + 5 @ 0.55 = 5.25 / 10
    expect(vwap).toBeCloseTo(0.525, 9);
  });

  it("stops at the limit price", () => {
    const { fillableBase, vwap } = walkBook(asks, 10, "buy", 0.5);
    expect(fillableBase).toBe(5);
    expect(vwap).toBeCloseTo(0.5, 9);
  });

  it("walks bids downward for a sell with a floor limit", () => {
    const bids = [
      { price: 0.5, amount: 5 },
      { price: 0.45, amount: 10 },
      { price: 0.4, amount: 10 },
    ];
    const { fillableBase, vwap } = walkBook(bids, 12, "sell", 0.45);
    expect(fillableBase).toBe(12);
    // 5 @ 0.5 + 7 @ 0.45 = 5.65 / 12
    expect(vwap).toBeCloseTo(5.65 / 12, 9);
  });

  it("reports partial fillability when depth runs out", () => {
    const { fillableBase, vwap } = walkBook(asks, 50, "buy");
    expect(fillableBase).toBe(15);
    expect(vwap).not.toBeNull();
  });

  it("returns zero/null when nothing is fillable", () => {
    const { fillableBase, vwap } = walkBook(asks, 10, "buy", 0.4);
    expect(fillableBase).toBe(0);
    expect(vwap).toBeNull();
  });
});

describe("takerBuyPct", () => {
  it("needs a minimum sample", () => {
    expect(
      takerBuyPct([
        { baseAmount: 10, baseIsSeller: false },
        { baseAmount: 10, baseIsSeller: true },
      ]),
    ).toBeNull();
  });

  it("weights by volume, not trade count", () => {
    const pct = takerBuyPct([
      { baseAmount: 70, baseIsSeller: false },
      { baseAmount: 10, baseIsSeller: true },
      { baseAmount: 10, baseIsSeller: true },
      { baseAmount: 10, baseIsSeller: true },
    ]);
    expect(pct).toBeCloseTo(70, 5);
  });

  it("ignores trades without a flag", () => {
    expect(
      takerBuyPct([
        { baseAmount: 10, baseIsSeller: undefined },
        { baseAmount: 10, baseIsSeller: undefined },
        { baseAmount: 10, baseIsSeller: undefined },
      ]),
    ).toBeNull();
  });
});
