import { describe, it, expect } from "vitest";
import { synthesisArm, SYNTHESIS_ARM_ID } from "./synthesis";
import type { StrategyContext, CatalystEvent } from "./types";

/**
 * Pure unit tests for the synthesis arm. No mocks needed - synthesis only
 * calls the other (also pure) arms' propose() and combines the results, so
 * this exercises the real fusion logic end to end against hand-built
 * StrategyContext fixtures.
 */

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
    indicators: {
      // Neutral/ranging by default - the directional rulebook stands aside
      // on this (rangePos 0.5 is neither range edge), so a bare baseCtx()
      // fires no sub-arm at all.
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
      maxSlippageBps: 5,
      minRiskReward: 1,
    },
    decisionTime: ctxTime(),
    ...overrides,
  };
}

/** A strong, high-confidence catalyst read for "XLM": three full-severity,
 *  same-direction events at decisionTime (recency weight 1) so
 *  scoreAsset's aggregate confidence clears news-reaction's 65% floor
 *  (0.7 sourceWeight x 1 severity x 3 events -> confidence ~0.677) and the
 *  score saturates to +-1 (all events agree on direction). */
function makeCatalysts(direction: "positive" | "negative", asset = "XLM"): CatalystEvent[] {
  return [0, 1, 2].map((i) => ({
    id: `test:${direction}-${i}`,
    source: "test-source",
    kind: "listing",
    assets: [asset],
    headline: `Test ${direction} catalyst ${i}`,
    url: "https://example.test/catalyst",
    publishedAt: ctxTime(),
    ingestedAt: ctxTime(),
    rawSummary: "test catalyst",
    contentHash: `hash-${direction}-${i}`,
    severity: 1,
    direction,
  }));
}

function ctxTime(): string {
  return "2026-08-04T00:00:00.000Z";
}

describe("synthesis - unconditional volatile veto", () => {
  it("stands aside on a volatile regime even when a sub-arm would otherwise fire", async () => {
    const ctx = baseCtx({
      indicators: {
        rsi14: 50,
        ema8: null,
        ema24: null,
        atrPct: 1,
        realizedVolPct: 5,
        efficiencyRatio: 0.3,
        rangePos: 0.5,
        volRatio: 3,
        regime: "volatile",
      },
      catalysts: makeCatalysts("positive"), // would fire news-reaction on its own
    });
    expect(await synthesisArm.propose(ctx)).toEqual([]);
  });
});

describe("synthesis - no sub-arm fires", () => {
  it("stands aside (empty) when nothing fires", async () => {
    const ctx = baseCtx(); // ranging/neutral indicators, no catalysts
    expect(await synthesisArm.propose(ctx)).toEqual([]);
  });
});

describe("synthesis - agreement fuses to one intent", () => {
  it("fuses directional + news-reaction into a single buy intent when both agree", async () => {
    const ctx = baseCtx({
      chain: "stellar",
      indicators: {
        rsi14: 40, // <= trendPullbackRsi (45) -> directional buys the pullback
        ema8: null,
        ema24: null,
        atrPct: 1,
        realizedVolPct: 1,
        efficiencyRatio: 0.3,
        rangePos: 0.5,
        volRatio: 1,
        regime: "trending-up",
      },
      catalysts: makeCatalysts("positive"), // news-reaction also buys
    });

    const out = await synthesisArm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.armId).toBe(SYNTHESIS_ARM_ID);
    expect(intent.side).toBe("buy");
    expect(intent.base).toBe("XLM");
    expect(intent.quote).toBe("USDC");

    // Size/notional invariants.
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
    expect(Number.isFinite(intent.limitPrice)).toBe(true);
    expect(intent.size * intent.limitPrice).toBeLessThanOrEqual(ctx.limits.maxNotionalQuote + 1e-9);

    // Confidence bound.
    expect(intent.confidence).toBeGreaterThanOrEqual(0);
    expect(intent.confidence).toBeLessThanOrEqual(100);

    // Bracket must sit on the correct sides of the entry for a BUY.
    expect(intent.targetPrice).toBeGreaterThan(intent.limitPrice);
    expect(intent.invalidationPrice).toBeLessThan(intent.limitPrice);

    // Two arms agreeing (directional + news-reaction; funding-carry is
    // excluded on a stellar chain) - rationale should say so.
    expect(intent.rationale).toMatch(/2 arms agree/i);
    expect(intent.rationale).toMatch(/directional-baseline/);
    expect(intent.rationale).toMatch(/news-reaction/);
  });

  it("fuses to a single sell intent when both sub-arms agree on sell", async () => {
    const ctx = baseCtx({
      chain: "stellar",
      indicators: {
        rsi14: 60, // >= trendBounceRsi (55) -> directional sells the bounce
        ema8: null,
        ema24: null,
        atrPct: 1,
        realizedVolPct: 1,
        efficiencyRatio: 0.3,
        rangePos: 0.5,
        volRatio: 1,
        regime: "trending-down",
      },
      catalysts: makeCatalysts("negative"),
    });

    const out = await synthesisArm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.side).toBe("sell");
    // Bracket must sit on the correct sides of the entry for a SELL.
    expect(intent.targetPrice).toBeLessThan(intent.limitPrice);
    expect(intent.invalidationPrice).toBeGreaterThan(intent.limitPrice);
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
  });
});

describe("synthesis - an EXIT is never fused into a fresh open (reduceOnly)", () => {
  // Regression for the review's P1. Setup: on hyperliquid, funding-carry HOLDS
  // a short and funding has flipped, so it emits "buy to CLOSE". Without the
  // reduceOnly carve-out synthesis saw a unanimous "buy" and sized a brand-new
  // LONG off quote balance - adding risk when the signal meant "flatten".
  const heldShortFlipped = (): StrategyContext =>
    baseCtx({
      chain: "hyperliquid",
      // rate < 0 = shorts PAY longs, so the held short no longer earns -> exit.
      funding: { rate: -0.001, intervalHours: 1, asOf: ctxTime() },
      inventory: {
        netBaseQty: -50, // short 50
        avgEntryPrice: 100,
        availableQuoteBalance: 100_000,
        availableBaseBalance: 0, // flat perp account
      },
    });

  it("passes the close through as reduceOnly instead of opening a new position", async () => {
    const out = await synthesisArm.propose(heldShortFlipped());
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.reduceOnly).toBe(true);
    expect(intent.side).toBe("buy"); // buying back the short
    // The give-away of the old bug: a fresh long would be sized off the
    // 100k quote balance, not capped at the 50 units actually held.
    expect(intent.size).toBe(50);
    expect(intent.armId).toBe(SYNTHESIS_ARM_ID);
  });
});

describe("synthesis - conflict is a veto", () => {
  it("stands aside when sub-arms propose opposite sides", async () => {
    const ctx = baseCtx({
      chain: "stellar",
      indicators: {
        rsi14: 60, // directional: trending-down bounce -> sell
        ema8: null,
        ema24: null,
        atrPct: 1,
        realizedVolPct: 1,
        efficiencyRatio: 0.3,
        rangePos: 0.5,
        volRatio: 1,
        regime: "trending-down",
      },
      catalysts: makeCatalysts("positive"), // news-reaction: buy
    });

    expect(await synthesisArm.propose(ctx)).toEqual([]);
  });
});

describe("synthesis - chain filter", () => {
  it("only consults sub-arms that support ctx.chain (excludes directional on hyperliquid)", async () => {
    // Indicators here WOULD make directional fire a buy if it were consulted
    // (trending-up + rsi<=45), which would conflict with funding-carry's sell
    // below and force a veto. Directional does not support "hyperliquid", so
    // it must never be called - only funding-carry (and news-reaction, which
    // stands aside here with no catalysts) are consulted, and the solo
    // funding-carry sell should pass straight through.
    const ctx = baseCtx({
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
        rsi14: 40,
        ema8: null,
        ema24: null,
        atrPct: 1,
        realizedVolPct: 1,
        efficiencyRatio: 0.3,
        rangePos: 0.5,
        volRatio: 1,
        regime: "trending-up",
      },
      funding: { rate: 0.001, intervalHours: 1, asOf: ctxTime() }, // rate>0 -> earning side is short ("sell")
      catalysts: [],
    });

    const out = await synthesisArm.propose(ctx);
    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.side).toBe("sell");
    expect(intent.rationale).toMatch(/funding-carry/);
    expect(intent.rationale).not.toMatch(/directional-baseline/);
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
  });
});
