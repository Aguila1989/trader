import { describe, it, expect } from "vitest";
import { makeDirectionalArm, DIRECTIONAL_ARM_ID } from "./directional";
import { DEFAULT_PARAMS } from "../backtest/strategy";
import type { StrategyContext } from "./types";
import type { IndicatorSet } from "../stellar/indicators";

/**
 * Pure unit tests for the directional (rulebook baseline) arm. This arm is a
 * thin StrategyArm wrapper around src/backtest/strategy.ts `decide()` plus
 * its own confidence->size scaling - no mocks needed, no collaborators
 * beyond that pure function.
 */

const DECISION_TIME = "2026-08-04T00:00:00.000Z";

function baseIndicators(overrides: Partial<IndicatorSet> = {}): IndicatorSet {
  return {
    rsi14: 50,
    ema8: null,
    ema24: null,
    atrPct: 2,
    realizedVolPct: 2,
    efficiencyRatio: 0.3,
    rangePos: 0.5,
    volRatio: 1,
    regime: "ranging",
    ...overrides,
  };
}

function baseCtx(overrides: Partial<StrategyContext> = {}): StrategyContext {
  return {
    chain: "stellar",
    market: {
      base: "XLM",
      quote: "USDC",
      lastClose: 100,
      bestBid: 99.9,
      bestAsk: 100.1,
      spreadBps: 20,
      baseVolume24h: 1_000_000,
    },
    indicators: baseIndicators(),
    inventory: {
      netBaseQty: 0,
      avgEntryPrice: null,
      availableQuoteBalance: 100_000,
      availableBaseBalance: 1_000,
    },
    catalysts: [],
    limits: {
      maxNotionalQuote: 10_000,
      maxSlippageBps: 50,
      minRiskReward: 1,
    },
    decisionTime: DECISION_TIME,
    ...overrides,
  };
}

describe("directional — stand aside / degenerate input", () => {
  it("stands aside when the regime is volatile", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "volatile", rsi14: 20, rangePos: 0.05 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when required indicators are missing (null regime)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({ indicators: baseIndicators({ regime: null }) });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when rsi14 is null", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({ indicators: baseIndicators({ rsi14: null }) });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when atrPct is null (no volatility read to size the bracket)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({ indicators: baseIndicators({ atrPct: null }) });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside on a non-positive lastClose (flat/degenerate market)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      market: {
        base: "XLM",
        quote: "USDC",
        lastClose: 0,
        bestBid: null,
        bestAsk: null,
        spreadBps: null,
        baseVolume24h: null,
      },
      indicators: baseIndicators({ regime: "trending-up", rsi14: 30 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside in a ranging regime that is not at either edge (no signal)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "ranging", rangePos: 0.5, rsi14: 50 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("directional — regime-gated side selection", () => {
  it("buys a pullback in a trending-up regime", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "trending-up",
        rsi14: DEFAULT_PARAMS.trendPullbackRsi, // at threshold, inclusive
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("buy");
    expect(out[0]!.armId).toBe(DIRECTIONAL_ARM_ID);
  });

  it("does NOT fade a trending-up regime (no sell when RSI is hot, not a pullback)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi + 20 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("sells a bounce in a trending-down regime", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "trending-down",
        rsi14: DEFAULT_PARAMS.trendBounceRsi, // at threshold, inclusive
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("sell");
  });

  it("does NOT fade a trending-down regime (no buy when RSI is cold, not a bounce)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-down", rsi14: DEFAULT_PARAMS.trendBounceRsi - 20 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("buys the range low edge (mean-reversion) in a ranging regime", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "ranging",
        rangePos: DEFAULT_PARAMS.rangeLowPos,
        rsi14: DEFAULT_PARAMS.rangeBuyRsi,
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("buy");
  });

  it("sells the range high edge (mean-reversion) in a ranging regime", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "ranging",
        rangePos: DEFAULT_PARAMS.rangeHighPos,
        rsi14: DEFAULT_PARAMS.rangeSellRsi,
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("sell");
  });
});

describe("directional — reward/risk bracket sides", () => {
  it("brackets a buy with invalidation below and target above the entry", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.invalidationPrice).toBeLessThan(intent.limitPrice);
    expect(intent.targetPrice).toBeGreaterThan(intent.limitPrice);
    expect(Number.isFinite(intent.invalidationPrice)).toBe(true);
    expect(Number.isFinite(intent.targetPrice)).toBe(true);
  });

  it("brackets a sell with invalidation above and target below the entry", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-down", rsi14: DEFAULT_PARAMS.trendBounceRsi }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.invalidationPrice).toBeGreaterThan(intent.limitPrice);
    expect(intent.targetPrice).toBeLessThan(intent.limitPrice);
  });

  it("stands aside when a stricter ctx.limits.minRiskReward rejects the rulebook's realized ratio", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi }),
      limits: { maxNotionalQuote: 10_000, maxSlippageBps: 50, minRiskReward: DEFAULT_PARAMS.rewardRiskMult + 0.1 },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("directional — confidence -> size scaling", () => {
  it("sizes a medium-confidence signal to 60% of the capped notional", async () => {
    const arm = makeDirectionalArm();
    // trending-up pullback WITHOUT the efficiencyRatio/EMA conditions for "high" -> medium.
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "trending-up",
        rsi14: DEFAULT_PARAMS.trendPullbackRsi,
        efficiencyRatio: 0.1,
        ema8: null,
        ema24: null,
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.confidence).toBe(60);
    const notional = intent.size * intent.limitPrice;
    expect(notional).toBeCloseTo(ctx.limits.maxNotionalQuote * 0.6, 6);
  });

  it("sizes a high-confidence signal to 80% of the capped notional (strictly larger than medium)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({
        regime: "trending-up",
        rsi14: DEFAULT_PARAMS.trendPullbackRsi,
        efficiencyRatio: 0.9,
        ema8: 10,
        ema24: 9, // ema8 >= ema24 -> intact uptrend structure -> high confidence
      }),
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.confidence).toBe(80);
    expect(intent.confidence).toBeGreaterThanOrEqual(0);
    expect(intent.confidence).toBeLessThanOrEqual(100);
    const notional = intent.size * intent.limitPrice;
    expect(notional).toBeCloseTo(ctx.limits.maxNotionalQuote * 0.8, 6);
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
  });

  it("caps notional by available quote balance (buy side) even under a generous limit", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi, efficiencyRatio: 0.1 }),
      inventory: { netBaseQty: 0, avgEntryPrice: null, availableQuoteBalance: 500, availableBaseBalance: 0 },
      limits: { maxNotionalQuote: 10_000, maxSlippageBps: 50, minRiskReward: 1 },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    const notional = intent.size * intent.limitPrice;
    // capped by availableQuoteBalance (500), then scaled by 60% confidence
    expect(notional).toBeCloseTo(500 * 0.6, 6);
  });

  it("caps notional by available base balance x price (sell side)", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-down", rsi14: DEFAULT_PARAMS.trendBounceRsi, efficiencyRatio: 0.1 }),
      inventory: { netBaseQty: 10, avgEntryPrice: 90, availableQuoteBalance: 0, availableBaseBalance: 5 },
      limits: { maxNotionalQuote: 10_000, maxSlippageBps: 50, minRiskReward: 1 },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    // availableBaseBalance (5) * entry (100) = 500 capacity, scaled by 60%
    const notional = intent.size * intent.limitPrice;
    expect(notional).toBeCloseTo(5 * 100 * 0.6, 6);
  });

  it("stands aside with zero available capacity even when the signal fires", async () => {
    const arm = makeDirectionalArm();
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi }),
      inventory: { netBaseQty: 0, avgEntryPrice: null, availableQuoteBalance: 0, availableBaseBalance: 0 },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("directional — no-look-ahead / pure-context invariant", () => {
  it("uses only the provided market.lastClose and indicators, never wall-clock time", async () => {
    const arm = makeDirectionalArm();
    const ctx1 = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi }),
      decisionTime: "2020-01-01T00:00:00.000Z",
    });
    const ctx2 = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: DEFAULT_PARAMS.trendPullbackRsi }),
      decisionTime: "2030-01-01T00:00:00.000Z",
    });
    const [out1, out2] = await Promise.all([arm.propose(ctx1), arm.propose(ctx2)]);
    // Same market/indicator inputs, different decisionTime -> identical output
    // (the arm is a pure function of ctx, not of the actual system clock).
    expect(out1).toEqual(out2);
  });
});

describe("directional — custom params override", () => {
  it("honors an overridden StrategyParams passed to makeDirectionalArm", async () => {
    const customParams = { ...DEFAULT_PARAMS, trendPullbackRsi: 20 };
    const arm = makeDirectionalArm(customParams);
    // RSI of 45 clears the DEFAULT pullback threshold (45) but NOT this
    // stricter custom one (20) -> stands aside under the custom params.
    const ctx = baseCtx({
      indicators: baseIndicators({ regime: "trending-up", rsi14: 45 }),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});
