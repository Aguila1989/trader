import { describe, it, expect } from "vitest";
import { makeFundingCarryArm, DEFAULT_FUNDING_CARRY_PARAMS, FUNDING_CARRY_ARM_ID } from "./fundingCarry";
import type { StrategyContext } from "./types";

/**
 * Pure unit tests for the funding-carry arm. No mocks needed - the arm has no
 * collaborators (no chain, no store, no DB), so this exercises the real logic
 * end to end against hand-built StrategyContext fixtures.
 */

function baseCtx(overrides: Partial<StrategyContext> = {}): StrategyContext {
  return {
    chain: "hyperliquid",
    market: {
      base: "hyperliquid:BTC-PERP",
      quote: "USDC",
      lastClose: 100,
      bestBid: 99.9,
      bestAsk: 100.1,
      spreadBps: 20,
      baseVolume24h: 1_000_000,
    },
    indicators: {
      rsi14: 50,
      ema8: null,
      ema24: null,
      atrPct: 1,
      realizedVolPct: 1,
      efficiencyRatio: 0.3,
      rangePos: 0.5,
      volRatio: 1,
      regime: "ranging",
    },
    inventory: {
      netBaseQty: 0,
      avgEntryPrice: null,
      availableQuoteBalance: 100_000,
      availableBaseBalance: 1_000,
    },
    catalysts: [],
    limits: {
      maxNotionalQuote: 10_000,
      maxSlippageBps: 5, // small round-trip cost so entries can clear it
      minRiskReward: 1,
    },
    decisionTime: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("fundingCarry — wrong-venue / missing-data guards", () => {
  it("throws when routed to a chain with no funding mechanism", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({ chain: "stellar", funding: { rate: 0.001, intervalHours: 1, asOf: "2026-08-04T00:00:00.000Z" } });
    await expect(arm.propose(ctx)).rejects.toThrow(/no funding mechanism/i);
  });

  it("stands aside (no throw) when funding data is unavailable on a funding-capable chain", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({ funding: undefined });
    await expect(arm.propose(ctx)).resolves.toEqual([]);
  });
});

describe("fundingCarry — entry threshold + cost-awareness", () => {
  it("stands aside when |rate| is below the entry threshold", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: { rate: DEFAULT_FUNDING_CARRY_PARAMS.entryRateThreshold / 2, intervalHours: 1, asOf: ctxTime() },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when the rate clears the raw threshold but not the cost-adjusted edge", async () => {
    // A rate just over threshold, held for very few intervals, against a
    // steep round-trip slippage cost - the payment never outruns the cost.
    const arm = makeFundingCarryArm({ ...DEFAULT_FUNDING_CARRY_PARAMS, minHoldIntervals: 1 });
    const ctx = baseCtx({
      funding: { rate: DEFAULT_FUNDING_CARRY_PARAMS.entryRateThreshold * 1.01, intervalHours: 1, asOf: ctxTime() },
      limits: { maxNotionalQuote: 10_000, maxSlippageBps: 500, minRiskReward: 1 }, // 10% round trip
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("enters on the earning side once the edge clears cost, sized within limits", async () => {
    const arm = makeFundingCarryArm();
    // rate > 0 -> longs pay shorts -> the earning side is SHORT ("sell").
    const ctx = baseCtx({
      funding: { rate: 0.001, intervalHours: 1, asOf: ctxTime() },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ armId: FUNDING_CARRY_ARM_ID, side: "sell" });
    expect(out[0]!.size).toBeGreaterThan(0);
    expect(out[0]!.size * out[0]!.limitPrice).toBeLessThanOrEqual(ctx.limits.maxNotionalQuote + 1e-9);
  });

  it("enters LONG when shorts pay longs (negative rate)", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({ funding: { rate: -0.001, intervalHours: 1, asOf: ctxTime() } });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("buy");
  });

  it("stands aside with zero available capacity even when the edge clears cost", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: { rate: 0.001, intervalHours: 1, asOf: ctxTime() },
      inventory: { netBaseQty: 0, avgEntryPrice: null, availableQuoteBalance: 0, availableBaseBalance: 0 },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("opens a SHORT on a FLAT PERP account (quote margin only, zero base units)", async () => {
    // Regression for the review's P1: a perp account holds USDC margin and NO
    // base units, so sizing a short against availableBaseBalance made every
    // positive-funding (short-earning) entry size to 0 — silently killing the
    // more common half of the carry strategy. The old fixture masked this by
    // carrying a spot-style base balance. (Review 2026-08-04, strategy-arms P1.)
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: { rate: 0.001, intervalHours: 1, asOf: ctxTime() }, // rate>0 -> earn by shorting
      inventory: {
        netBaseQty: 0,
        avgEntryPrice: null,
        availableQuoteBalance: 100_000,
        availableBaseBalance: 0, // a flat perp account
      },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("sell");
    expect(out[0]!.size).toBeGreaterThan(0);
    expect(Number.isFinite(out[0]!.size)).toBe(true);
    expect(out[0]!.size * out[0]!.limitPrice).toBeLessThanOrEqual(ctx.limits.maxNotionalQuote + 1e-9);
  });

  it("refuses look-ahead funding (asOf after decisionTime)", async () => {
    // Review 2026-08-04, strategy-arms P2 — belt-and-suspenders no-look-ahead.
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: {
        rate: 0.001,
        intervalHours: 1,
        asOf: new Date(Date.parse(ctxTime()) + 60_000).toISOString(),
      },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("fundingCarry — exit rules while holding", () => {
  it("holds (no intent) while still earning and within the loss bound", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: { rate: 0.001, intervalHours: 1, asOf: ctxTime() }, // rate>0, earning side = sell
      inventory: { netBaseQty: -50, avgEntryPrice: 100, availableQuoteBalance: 100_000, availableBaseBalance: 0 },
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("exits when the rate has normalized", async () => {
    const arm = makeFundingCarryArm();
    const ctx = baseCtx({
      funding: {
        rate: 0.0002,
        trailingMeanRate: DEFAULT_FUNDING_CARRY_PARAMS.exitRateThreshold / 2,
        intervalHours: 1,
        asOf: ctxTime(),
      },
      inventory: { netBaseQty: -50, avgEntryPrice: 100, availableQuoteBalance: 100_000, availableBaseBalance: 0 },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ side: "buy", size: 50 }); // closes the short by buying back
    expect(out[0]!.rationale).toMatch(/normalized/i);
  });

  it("exits when funding flips away from the held side", async () => {
    const arm = makeFundingCarryArm();
    // Holding a SHORT (was earning while rate>0); rate has flipped negative -
    // shorts now PAY, the position no longer earns.
    const ctx = baseCtx({
      funding: { rate: -0.001, intervalHours: 1, asOf: ctxTime() },
      inventory: { netBaseQty: -50, avgEntryPrice: 100, availableQuoteBalance: 100_000, availableBaseBalance: 0 },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("buy");
    expect(out[0]!.rationale).toMatch(/flipped/i);
  });

  it("exits on an adverse move past the loss bound, regardless of funding", async () => {
    const arm = makeFundingCarryArm();
    // Holding a LONG; price has crashed past maxAdverseMovePct even though
    // funding still favors holding (rate very negative -> long still earns).
    const ctx = baseCtx({
      market: {
        base: "hyperliquid:BTC-PERP",
        quote: "USDC",
        lastClose: 100 * (1 - (DEFAULT_FUNDING_CARRY_PARAMS.maxAdverseMovePct + 1) / 100),
        bestBid: null,
        bestAsk: null,
        spreadBps: null,
        baseVolume24h: null,
      },
      funding: { rate: -0.01, intervalHours: 1, asOf: ctxTime() },
      inventory: { netBaseQty: 50, avgEntryPrice: 100, availableQuoteBalance: 100_000, availableBaseBalance: 0 },
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("sell");
    expect(out[0]!.rationale).toMatch(/adverse move/i);
  });
});

function ctxTime(): string {
  return "2026-08-04T00:00:00.000Z";
}
