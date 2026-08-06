import { describe, expect, it } from "vitest";
import type { ArmAttribution, EvalArmKey, PaperFill } from "./types";
import { armKeyOf } from "./types";
import {
  EvalController,
  type ArmSpec,
  type ControllerConfig,
  type ControllerDeps,
  type MarketContext,
  type PaperDataReader,
} from "./controller";
import type { EvalStateStore, RunState } from "./state";

/**
 * Controller tests. Every collaborator is a hand-written fake with NO
 * submit()/sign()-shaped method anywhere - see the "never calls anything
 * resembling submit" test, which proves that by construction rather than by
 * spying on a call that could never have happened anyway.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MIN = 60 * 1000;

function fakeAttribution(overrides: Partial<ArmAttribution> = {}): ArmAttribution {
  return {
    key: { arm: "a", venue: "v" },
    trades: 0,
    wins: 0,
    losses: 0,
    scratches: 0,
    hitRatePct: 0,
    grossPnlXlm: 0,
    feesXlm: 0,
    rebatesXlm: 0,
    slippageXlm: 0,
    netPnlXlm: 0,
    avgRMultiple: null,
    netReturns: [],
    maxDrawdownXlm: 0,
    equityCurveXlm: [],
    byRegime: {},
    byQuote: {},
    modeledTrades: 0,
    openLots: [],
    ...overrides,
  };
}

/** Every 2 fills (one open, one opposite-side close) count as 1 closed trade -
 *  a deterministic stand-in for the real FIFO matcher (attribution.ts), which
 *  keeps these tests independent of that module's exact behavior. */
function pairCountingAttribute(fills: PaperFill[]): ArmAttribution {
  return fakeAttribution({ trades: Math.floor(fills.length / 2) });
}

function makeStore(initial: RunState | null = null): EvalStateStore & { saved: RunState[] } {
  let state = initial;
  const saved: RunState[] = [];
  return {
    load: () => state,
    save: (s) => {
      state = s;
      saved.push(s);
    },
    saved,
  };
}

function makeCtx(venue: string, base: string, quote: string, mid: number, tsMs: number): MarketContext {
  return {
    venue,
    base,
    quote,
    mid,
    bids: [],
    asks: [],
    recentTrades: [],
    regime: "ranging",
    indicators: {
      rsi14: 50,
      ema8: mid,
      ema24: mid,
      atrPct: 1,
      realizedVolPct: 1,
      efficiencyRatio: 0.2,
      rangePos: 0.5,
      volRatio: 1,
      regime: "ranging",
    },
    ts: new Date(tsMs).toISOString(),
  };
}

const VENUE = { id: "stellar-sdex", base: "XLM", quote: "USDC" };

function baseConfig(overrides: Partial<ControllerConfig> = {}): ControllerConfig {
  return {
    arms: [],
    venues: [],
    nMin: 2,
    dMin: 1,
    dMax: 30,
    alpha: 0.05,
    bootstrapResamples: 100,
    seed: 1,
    minRegimeSample: 5,
    seedNotionalQuote: 1000,
    riskFraction: 0.1,
    ...overrides,
  };
}

/** Opens on the first tick from flat (no stop - never force-closed), then
 *  flips to the opposite side the very next tick, guaranteeing exactly one
 *  closed round-trip every 2 ticks. */
const flippingArm: ArmSpec = {
  id: "test-arm",
  label: "Test arm",
  decide: (ctx, openLot) => {
    if (!openLot) {
      return { side: "buy", amount: 10, limitPrice: ctx.mid, liquidity: "taker" };
    }
    return { side: "sell", amount: 10, limitPrice: ctx.mid, liquidity: "taker" };
  },
};

/** Never trades - used to prove the hard D_max stop fires even when N_min is
 *  unreachable. */
const silentArm: ArmSpec = {
  id: "silent-arm",
  label: "Silent arm",
  decide: () => null,
};

function fakeFill(order: Parameters<ControllerDeps["simulateFill"]>[0]): PaperFill {
  return {
    orderId: order.id,
    arm: order.arm,
    venue: order.venue,
    side: order.side,
    base: order.base,
    quote: order.quote,
    liquidity: order.liquidity,
    filledBase: order.amount,
    avgPrice: order.limitPrice,
    feeQuote: 0,
    referencePrice: order.decisionPrice,
    fidelity: "observed-taker",
    ts: order.ts,
    assumptions: [],
    regime: order.regime,
  };
}

function makeDataReader(pricesByTick: Map<number, number>): PaperDataReader {
  return {
    read: (venue, base, quote, nowMs) => {
      const mid = pricesByTick.get(nowMs);
      if (mid === undefined) return null;
      return makeCtx(venue, base, quote, mid, nowMs);
    },
  };
}

describe("EvalController - hard D_max stop always terminates", () => {
  it("stops via stopped-hard-limit when N_min is never reachable", async () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    const prices = new Map<number, number>();
    for (let t = 0; t <= 3 * MS_PER_DAY; t += 6 * 60 * MS_PER_MIN) {
      prices.set(start + t, 0.1);
    }
    const deps: ControllerDeps = {
      dataReader: makeDataReader(prices),
      store: makeStore(),
      arms: [silentArm],
      venues: [VENUE],
      config: baseConfig({ nMin: 100, dMin: 1, dMax: 2 }),
      simulateFill: fakeFill,
      attribute: pairCountingAttribute,
    };

    const controller = await EvalController.start(deps, "run-hardstop", new Date(start).toISOString());

    let done = false;
    let t = start;
    let iterations = 0;
    while (!done && iterations < 5000) {
      t += 6 * 60 * MS_PER_MIN;
      const res = await controller.tick(t);
      done = res.done;
      iterations++;
      if (t - start > 5 * MS_PER_DAY) break; // safety valve for the test itself
    }

    expect(done).toBe(true);
    expect(controller.getState().status).toBe("stopped-hard-limit");
  });
});

describe("EvalController - N_min AND D_min gating", () => {
  it("does not finish before BOTH N_min trades and D_min coverage are satisfied, then finishes once both are", async () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    const prices = new Map<number, number>();
    // One data point per minute, out to well past D_min (1 day).
    for (let t = 0; t <= 2 * MS_PER_DAY; t += MS_PER_MIN) {
      prices.set(start + t, 0.1);
    }
    const deps: ControllerDeps = {
      dataReader: makeDataReader(prices),
      store: makeStore(),
      arms: [flippingArm],
      venues: [VENUE],
      config: baseConfig({ nMin: 2, dMin: 1, dMax: 30 }),
      simulateFill: fakeFill,
      attribute: pairCountingAttribute,
    };

    const controller = await EvalController.start(deps, "run-gating", new Date(start).toISOString());

    // flippingArm closes one round-trip every 2 ticks, so N_min=2 is met by
    // tick 4 - long before D_min (1 day) has elapsed at one tick per minute.
    let t = start;
    for (let i = 0; i < 6; i++) {
      t += MS_PER_MIN;
      const res = await controller.tick(t);
      expect(res.done).toBe(false);
    }
    expect(controller.getState().status).toBe("running");

    // Fast-forward past D_min (1 day) while continuing to tick.
    let done = false;
    let iterations = 0;
    while (!done && iterations < 3000) {
      t += MS_PER_MIN;
      const res = await controller.tick(t);
      done = res.done;
      iterations++;
    }

    expect(done).toBe(true);
    expect(controller.getState().status).toBe("stopped-criteria-met");
    expect(t - start).toBeGreaterThanOrEqual(MS_PER_DAY);
  });
});

describe("EvalController - resume", () => {
  it("continues from persisted state rather than restarting", async () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    const prices = new Map<number, number>();
    for (let t = 0; t <= 2 * MS_PER_DAY; t += MS_PER_MIN) {
      prices.set(start + t, 0.1);
    }
    const store = makeStore();
    const deps: ControllerDeps = {
      dataReader: makeDataReader(prices),
      store,
      arms: [flippingArm],
      venues: [VENUE],
      config: baseConfig({ nMin: 50, dMin: 1, dMax: 30 }),
      simulateFill: fakeFill,
      attribute: pairCountingAttribute,
    };

    const first = await EvalController.start(deps, "run-resume", new Date(start).toISOString());
    let t = start;
    for (let i = 0; i < 10; i++) {
      t += MS_PER_MIN;
      await first.tick(t);
    }
    const iterationAfterFirst = first.getState().iteration;
    const fillsAfterFirst = Object.values(first.getState().cells).reduce((n, c) => n + c.fills.length, 0);
    expect(iterationAfterFirst).toBe(10);
    expect(fillsAfterFirst).toBeGreaterThan(0);

    // Simulate a crash: throw away the in-memory controller, start a NEW one
    // against the SAME (persisted) store and runId.
    const resumed = await EvalController.start(deps, "run-resume", new Date(t).toISOString());
    expect(resumed.getState().iteration).toBe(iterationAfterFirst);
    expect(resumed.getState().status).toBe("running");
    const fillsAfterResume = Object.values(resumed.getState().cells).reduce((n, c) => n + c.fills.length, 0);
    expect(fillsAfterResume).toBe(fillsAfterFirst);

    // And it keeps advancing from there, not from zero.
    t += MS_PER_MIN;
    await resumed.tick(t);
    expect(resumed.getState().iteration).toBe(iterationAfterFirst + 1);
  });
});

describe("EvalController - structurally paper-only", () => {
  it("never calls anything resembling submit, sign, or prepareOrder", async () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    const prices = new Map<number, number>();
    for (let t = 0; t <= MS_PER_DAY; t += MS_PER_MIN) {
      prices.set(start + t, 0.1);
    }
    // A data reader whose `read` is the ONLY function on it - if the
    // controller ever tried `dataReader.submit(...)` or similar, this test
    // would throw "is not a function" rather than silently succeeding.
    const dataReader: PaperDataReader = { read: (v, b, q, now) => makeCtx(v, b, q, prices.get(now) ?? 0.1, now) };
    expect("submit" in dataReader).toBe(false);
    expect("sign" in dataReader).toBe(false);
    expect("prepareOrder" in dataReader).toBe(false);

    const deps: ControllerDeps = {
      dataReader,
      store: makeStore(),
      arms: [flippingArm],
      venues: [VENUE],
      config: baseConfig({ nMin: 1000, dMin: 1, dMax: 1 }),
      simulateFill: fakeFill,
      attribute: pairCountingAttribute,
    };

    const controller = await EvalController.start(deps, "run-no-submit", new Date(start).toISOString());
    let t = start;
    let done = false;
    let i = 0;
    while (!done && i < 3000) {
      t += MS_PER_MIN;
      const res = await controller.tick(t);
      done = res.done;
      i++;
    }
    expect(done).toBe(true); // terminates via D_max, having placed only simulated fills
  });
});

describe("EvalController - baselines are always present", () => {
  it("adds rulebook/buy-hold/coin-flip cells for every venue automatically", async () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    const deps: ControllerDeps = {
      dataReader: makeDataReader(new Map([[start, 0.1]])),
      store: makeStore(),
      arms: [flippingArm],
      venues: [VENUE],
      config: baseConfig(),
      simulateFill: fakeFill,
      attribute: pairCountingAttribute,
    };
    const controller = await EvalController.start(deps, "run-baselines", new Date(start).toISOString());
    const keys = Object.keys(controller.getState().cells);
    expect(keys).toContain(armKeyOf({ arm: "test-arm", venue: VENUE.id } satisfies EvalArmKey));
    expect(keys).toContain(armKeyOf({ arm: "baseline:rulebook", venue: VENUE.id } satisfies EvalArmKey));
    expect(keys).toContain(armKeyOf({ arm: "baseline:buy-hold", venue: VENUE.id } satisfies EvalArmKey));
    expect(keys).toContain(armKeyOf({ arm: "baseline:coin-flip", venue: VENUE.id } satisfies EvalArmKey));
    expect(controller.getState().cells[armKeyOf({ arm: "baseline:rulebook", venue: VENUE.id })]?.kind).toBe("baseline");
    expect(controller.getState().cells[armKeyOf({ arm: "test-arm", venue: VENUE.id })]?.kind).toBe("arm");
  });
});
