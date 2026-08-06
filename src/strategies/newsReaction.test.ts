import { describe, it, expect } from "vitest";
import { makeNewsReactionArm, DEFAULT_NEWS_REACTION_PARAMS, NEWS_REACTION_ARM_ID } from "./newsReaction";
import type { StrategyContext } from "./types";
import type { CatalystEvent } from "../catalyst/types";

/**
 * Pure unit tests for the news-reaction arm. No mocks needed - the arm has no
 * collaborators beyond the pure scorer in src/catalyst/score.ts, so this
 * exercises the real logic end to end against hand-built StrategyContext +
 * CatalystEvent fixtures.
 */

const DECISION_TIME = "2026-08-04T00:00:00.000Z";

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
    decisionTime: DECISION_TIME,
    ...overrides,
  };
}

/** A CatalystEvent fixture with sane defaults - full severity, explicit
 *  direction, published exactly at decision time (recency weight 1.0) - so
 *  callers only need to override what the test actually varies. */
function makeEvent(idx: number, overrides: Partial<CatalystEvent> = {}): CatalystEvent {
  return {
    id: `test-source:hash${idx}`,
    source: "test-source",
    kind: "other",
    assets: ["XLM"],
    headline: `Test catalyst headline ${idx}`,
    url: `https://example.com/${idx}`,
    publishedAt: DECISION_TIME,
    ingestedAt: DECISION_TIME,
    rawSummary: "raw summary text",
    contentHash: `hash${idx}`,
    severity: 1,
    direction: "positive",
    ...overrides,
  };
}

/** Three full-severity, full-recency, same-direction events - enough
 *  aggregate weight (see score.ts confidenceFromWeight) to clear both the
 *  default minConfidence (65) and minScoreMagnitude (40) thresholds with a
 *  score of the given direction. */
function strongEvents(direction: "positive" | "negative"): CatalystEvent[] {
  return [0, 1, 2].map((i) => makeEvent(i, { direction }));
}

describe("newsReaction — degenerate / absent input", () => {
  it("stands aside with no catalysts", async () => {
    const arm = makeNewsReactionArm();
    const ctx = baseCtx({ catalysts: [] });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when lastClose is not a positive price", async () => {
    const arm = makeNewsReactionArm();
    const ctx = baseCtx({
      market: { base: "XLM", quote: "USDC", lastClose: 0, bestBid: null, bestAsk: null, spreadBps: null, baseVolume24h: null },
      catalysts: strongEvents("positive"),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("newsReaction — directional proposals", () => {
  it("proposes a BUY on a strong positive catalyst read", async () => {
    const arm = makeNewsReactionArm();
    const ctx = baseCtx({ catalysts: strongEvents("positive") });
    const out = await arm.propose(ctx);

    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.armId).toBe(NEWS_REACTION_ARM_ID);
    expect(intent.side).toBe("buy");
    expect(intent.base).toBe("XLM");
    expect(intent.quote).toBe("USDC");

    // confidence is bounded 0..100 and strictly positive for an acted-on signal
    expect(intent.confidence).toBeGreaterThan(0);
    expect(intent.confidence).toBeLessThanOrEqual(100);

    // size/notional invariants: positive, finite, within the notional cap
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
    expect(intent.size * intent.limitPrice).toBeLessThanOrEqual(ctx.limits.maxNotionalQuote + 1e-9);

    // a BUY brackets the entry with target ABOVE and invalidation BELOW
    expect(intent.targetPrice).toBeGreaterThan(intent.limitPrice);
    expect(intent.invalidationPrice).toBeLessThan(intent.limitPrice);
    expect(Number.isFinite(intent.targetPrice)).toBe(true);
    expect(Number.isFinite(intent.invalidationPrice)).toBe(true);
  });

  it("proposes a SELL on a strong negative catalyst read", async () => {
    const arm = makeNewsReactionArm();
    const ctx = baseCtx({ catalysts: strongEvents("negative") });
    const out = await arm.propose(ctx);

    expect(out).toHaveLength(1);
    const intent = out[0]!;
    expect(intent.side).toBe("sell");
    expect(intent.confidence).toBeGreaterThan(0);
    expect(intent.confidence).toBeLessThanOrEqual(100);
    expect(intent.size).toBeGreaterThan(0);
    expect(Number.isFinite(intent.size)).toBe(true);
    expect(intent.size * intent.limitPrice).toBeLessThanOrEqual(ctx.limits.maxNotionalQuote + 1e-9);

    // a SELL brackets the entry with target BELOW and invalidation ABOVE
    expect(intent.targetPrice).toBeLessThan(intent.limitPrice);
    expect(intent.invalidationPrice).toBeGreaterThan(intent.limitPrice);
  });
});

describe("newsReaction — confidence / magnitude gating", () => {
  it("stands aside on a single low-severity, direction-mixed catalyst (too weak / low-confidence)", async () => {
    const arm = makeNewsReactionArm();
    // A single "governance" event with no overrides falls back to
    // KIND_DEFAULTS (severity 0.3, direction "mixed") - both the resulting
    // confidence and the (zero, since "mixed" contributes no sign) score
    // magnitude land well under the defaults (minConfidence 65,
    // minScoreMagnitude 40).
    const ctx = baseCtx({
      catalysts: [
        {
          id: "test-source:weak",
          source: "test-source",
          kind: "governance",
          assets: ["XLM"],
          headline: "Minor governance vote",
          url: "https://example.com/weak",
          publishedAt: DECISION_TIME,
          ingestedAt: DECISION_TIME,
          rawSummary: "raw summary text",
          contentHash: "weakhash",
        },
      ],
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("stands aside when confidence clears the bar but score magnitude does not (offsetting events)", async () => {
    const arm = makeNewsReactionArm();
    // Equal-and-opposite full-severity events: plenty of aggregate weight
    // (confidence clears the threshold) but they cancel out directionally,
    // so |score| collapses toward 0 - below minScoreMagnitude.
    const ctx = baseCtx({
      catalysts: [
        makeEvent(0, { direction: "positive" }),
        makeEvent(1, { direction: "negative" }),
        makeEvent(2, { direction: "positive" }),
        makeEvent(3, { direction: "negative" }),
      ],
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });
});

describe("newsReaction — no-look-ahead", () => {
  it("ignores a catalyst published after decisionTime, even an otherwise-strong one", async () => {
    const arm = makeNewsReactionArm();
    const future = new Date(Date.parse(DECISION_TIME) + 60_000).toISOString(); // 1 min after decisionTime
    const ctx = baseCtx({
      catalysts: strongEvents("positive").map((e) => ({ ...e, publishedAt: future })),
    });
    expect(await arm.propose(ctx)).toEqual([]);
  });

  it("still acts when at least one strong event remains at/before decisionTime alongside a future one", async () => {
    const arm = makeNewsReactionArm();
    const future = new Date(Date.parse(DECISION_TIME) + 60_000).toISOString();
    const ctx = baseCtx({
      catalysts: [
        ...strongEvents("positive"), // published at decisionTime - admissible
        makeEvent(99, { direction: "negative", publishedAt: future }), // future - must be ignored
      ],
    });
    const out = await arm.propose(ctx);
    expect(out).toHaveLength(1);
    expect(out[0]!.side).toBe("buy"); // the future negative event must not flip the read
  });
});
