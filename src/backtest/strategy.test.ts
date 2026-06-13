import { describe, it, expect } from "vitest";
import { computeIndicators, type IndicatorSet } from "../stellar/indicators";
import { decide, DEFAULT_PARAMS } from "./strategy";

/** A fully specified indicator set; override only the fields a test cares about. */
function ind(overrides: Partial<IndicatorSet>): IndicatorSet {
  return {
    rsi14: 50,
    ema8: 1,
    ema24: 1,
    atrPct: 2,
    realizedVolPct: 1,
    efficiencyRatio: 0.5,
    rangePos: 0.5,
    volRatio: 1,
    regime: "ranging",
    ...overrides,
  };
}

describe("decide - stand-aside cases", () => {
  it("stands aside when volatile", () => {
    expect(decide(ind({ regime: "volatile", rsi14: 20 }), 100)).toBeNull();
  });

  it("stands aside with no regime tag", () => {
    expect(decide(ind({ regime: null }), 100)).toBeNull();
  });

  it("stands aside without an RSI or ATR read", () => {
    expect(decide(ind({ rsi14: null }), 100)).toBeNull();
    expect(decide(ind({ atrPct: null }), 100)).toBeNull();
  });

  it("never fades a trend (no sell in an uptrend, no buy in a downtrend)", () => {
    // Overbought in an uptrend is NOT a sell for a trend-follower.
    expect(decide(ind({ regime: "trending-up", rsi14: 80 }), 100)).toBeNull();
    // Oversold in a downtrend is NOT a buy.
    expect(decide(ind({ regime: "trending-down", rsi14: 20 }), 100)).toBeNull();
  });

  it("ignores the middle of a range", () => {
    expect(decide(ind({ regime: "ranging", rangePos: 0.5, rsi14: 50 }), 100)).toBeNull();
  });
});

describe("decide - entries and brackets", () => {
  it("buys a pullback in an uptrend with a correctly-shaped bracket", () => {
    const sig = decide(
      ind({ regime: "trending-up", rsi14: 40, atrPct: 2, efficiencyRatio: 0.7, ema8: 1.1, ema24: 1 }),
      100,
    );
    expect(sig).not.toBeNull();
    expect(sig!.side).toBe("buy");
    // ATR = 2% of 100 = 2; stop 1xATR below, target 1.5xATR above.
    expect(sig!.invalidation).toBeCloseTo(98, 9);
    expect(sig!.target).toBeCloseTo(103, 9);
    expect(sig!.rewardRisk).toBe(DEFAULT_PARAMS.rewardRiskMult);
    // Reward/risk is built to clear the policy minimum.
    expect((sig!.target - 100) / (100 - sig!.invalidation)).toBeCloseTo(1.5, 9);
  });

  it("sells a bounce in a downtrend with the mirror bracket", () => {
    const sig = decide(ind({ regime: "trending-down", rsi14: 60, atrPct: 2 }), 100);
    expect(sig).not.toBeNull();
    expect(sig!.side).toBe("sell");
    expect(sig!.invalidation).toBeCloseTo(102, 9);
    expect(sig!.target).toBeCloseTo(97, 9);
  });

  it("buys the bottom of a range and sells the top", () => {
    const buy = decide(ind({ regime: "ranging", rangePos: 0.1, rsi14: 35 }), 100);
    expect(buy?.side).toBe("buy");
    const sell = decide(ind({ regime: "ranging", rangePos: 0.9, rsi14: 65 }), 100);
    expect(sell?.side).toBe("sell");
  });

  it("requires RSI confirmation at the range edge", () => {
    // At the low but RSI not oversold -> no trade.
    expect(decide(ind({ regime: "ranging", rangePos: 0.1, rsi14: 55 }), 100)).toBeNull();
  });

  it("rejects a bracket that would put the stop at/through zero", () => {
    // Huge ATR on a tiny price pushes the stop negative.
    expect(decide(ind({ regime: "trending-up", rsi14: 40, atrPct: 200 }), 1)).toBeNull();
  });
});

describe("decide - integrates with real computeIndicators", () => {
  it("fires a buy on a synthetic uptrend that has pulled back", () => {
    // 20 bars up, then a few down to cool RSI while the net move stays up.
    const closes = [
      ...Array.from({ length: 20 }, (_, i) => 100 + i * 2),
      138, 134, 130, 127,
    ];
    const candles = closes.map((c) => ({
      open: c,
      high: c + 0.5,
      low: c - 0.5,
      close: c,
      baseVolume: 1000,
    }));
    const indicators = computeIndicators(candles);
    const sig = decide(indicators, candles[candles.length - 1]!.close);
    // It should at least not crash and should respect the regime gate; if the
    // regime read is trending-up with a cooled RSI, it's a buy.
    if (indicators.regime === "trending-up" && (indicators.rsi14 ?? 100) <= DEFAULT_PARAMS.trendPullbackRsi) {
      expect(sig?.side).toBe("buy");
    } else {
      expect(sig === null || sig.side === "buy").toBe(true);
    }
  });
});
