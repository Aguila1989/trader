import { describe, it, expect } from "vitest";
import type { Candle } from "../stellar/market";
import { DEFAULT_PARAMS } from "../backtest/strategy";
import type { ArmAttribution, EvalArmKey, RegimeBreakdown } from "./types";
import { DEFAULT_READINESS_CONFIG, type ReadinessConfig } from "./readiness";
import {
  initLoopState,
  runLoop,
  step,
  type Arm,
  type Evaluator,
  type EvalWindow,
  type GatedTodo,
  type IterateConfig,
  type StepDeps,
  type Tuner,
  type TuningOutcome,
  type WindowSource,
} from "./iterate";

const KEY: EvalArmKey = { arm: "rsi-meanrev", venue: "stellar-sdex" };

/** Same calibrated pattern as readiness.test.ts: mean +0.102R, significant at
 *  95% but not once the multiple-comparisons bar tightens. Constant across
 *  iterations so the trail plateaus immediately (mirrors "tuning stopped
 *  helping" without needing a real search). */
const PATTERN: number[] = [0.25, 0.35, -0.3, 0.3, 0.15, -0.35, 0.4, 0.2, -0.25, 0.27];

function regimeBucket(trades: number, netPnlXlm: number): RegimeBreakdown {
  return { trades, netPnlXlm, hitRatePct: netPnlXlm > 0 ? 60 : 40 };
}

function candles(n: number): Candle[] {
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(i * 3_600_000).toISOString(),
    open: 1,
    high: 1.01,
    low: 0.99,
    close: 1,
    baseVolume: 1000,
  }));
}

function makeAttribution(netReturns: number[], byRegime: Record<string, RegimeBreakdown>): ArmAttribution {
  const trades = netReturns.length;
  const wins = netReturns.filter((r) => r > 0).length;
  const losses = netReturns.filter((r) => r < 0).length;
  const netPnlXlm = netReturns.reduce((s, r) => s + r, 0);
  return {
    key: KEY,
    trades,
    wins,
    losses,
    scratches: trades - wins - losses,
    hitRatePct: trades ? (wins / trades) * 100 : 0,
    grossPnlXlm: netPnlXlm,
    feesXlm: 0,
    rebatesXlm: 0,
    slippageXlm: 0,
    netPnlXlm,
    avgRMultiple: trades ? netPnlXlm / trades : null,
    netReturns,
    maxDrawdownXlm: 0,
    equityCurveXlm: [],
    byRegime,
    byQuote: {},
    modeledTrades: 0,
    openLots: [],
  };
}

const TWO_REGIME_BUCKETS: Record<string, RegimeBreakdown> = {
  "trending-up": regimeBucket(5, 0.15 * 5),
  ranging: regimeBucket(5, 0.054 * 5),
};

/** A constant-edge evaluator: ignores params entirely and always returns the
 *  calibrated PATTERN, so plateau is reached the moment enough iterations
 *  have accumulated (no real search needed to exercise the loop's discipline). */
const constantEvaluator: Evaluator = {
  evaluate: () => makeAttribution(PATTERN, TWO_REGIME_BUCKETS),
};

/** A no-edge evaluator: mean ~0, never clears significance, so the loop can
 *  only ever end in budget exhaustion / no-proven-edge. */
const noEdgeEvaluator: Evaluator = {
  evaluate: () => makeAttribution([0.05, -0.05, 0.04, -0.06, 0.03, -0.04], {}),
};

/** Same plateauing edge as constantEvaluator, but concentrated in a SINGLE
 *  regime bucket - so the regime-stability gate can never pass and the loop
 *  never auto-stops on readiness. Used by tests that need genuinely
 *  continuing iterations past the point where tuning locks, to prove the lock
 *  (not an incidental loop stop) is what silences the tuner. */
const singleRegimeEvaluator: Evaluator = {
  evaluate: () => makeAttribution(PATTERN, { "trending-up": regimeBucket(10, 1.02) }),
};

function noChangeTuner(): Tuner {
  return { propose: (): TuningOutcome => ({ kind: "no-change" }) };
}

function countingTuner(inner: Tuner): Tuner & { calls: number } {
  const wrapper = {
    calls: 0,
    propose(arm: Arm, trainingCandles: Candle[]) {
      wrapper.calls++;
      return inner.propose(arm, trainingCandles);
    },
  };
  return wrapper;
}

function baseConfig(overrides: Partial<ReadinessConfig> = {}): IterateConfig {
  return {
    maxIterations: 10,
    readiness: { ...DEFAULT_READINESS_CONFIG, minConsecutiveIterations: 4, ...overrides },
  };
}

function arm(params = DEFAULT_PARAMS): Arm {
  return { key: KEY, params, enabled: true };
}

describe("step - overfitting discipline tripwires", () => {
  it("throws when the tuner would be handed the SAME window it must confirm on", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: () => ({ windowId: "w1", candles: candles(10) }),
      nextTrainingSlice: () => ({ windowId: "w1", candles: candles(10) }),
    };
    const deps: StepDeps = {
      windowSource,
      evaluator: constantEvaluator,
      tuner: noChangeTuner(),
      config: baseConfig(),
    };
    expect(() => step(initLoopState([arm()]), deps)).toThrow(/SAME window/);
  });

  it("throws if a confirmation window is ever replayed", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: () => ({ windowId: "always-the-same", candles: candles(10) }),
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const deps: StepDeps = {
      windowSource,
      evaluator: constantEvaluator,
      tuner: noChangeTuner(),
      config: baseConfig(),
    };
    const s1 = step(initLoopState([arm()]), deps);
    expect(() => step(s1, deps)).toThrow(/replayed confirmation window/);
  });
});

describe("step - confirmation lock", () => {
  it("stops calling the tuner forever once the arm's trail plateaus", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: (_key, iteration) => ({
        windowId: `confirm-${iteration}`,
        candles: candles(10),
      }),
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const tuner = countingTuner(noChangeTuner());
    const deps: StepDeps = {
      windowSource,
      // Single-regime evaluator -> readiness can never fully pass, so the
      // loop keeps genuinely ticking past the lock instead of auto-stopping
      // (which would make "the tuner wasn't called" trivially true).
      evaluator: singleRegimeEvaluator,
      tuner,
      config: baseConfig(),
    };

    let state = initLoopState([arm()]);
    for (let i = 0; i < 4; i++) state = step(state, deps);
    expect(state.stopped).toBe(false); // still genuinely iterating
    const callsAtLock = tuner.calls;
    expect(callsAtLock).toBeGreaterThan(0);
    const armState = state.armStates.get("rsi-meanrev::stellar-sdex")!;
    expect(armState.lockedAtIteration).not.toBeNull();

    // Run several more REAL iterations - the tuner must NEVER be invoked again.
    for (let i = 0; i < 3; i++) state = step(state, deps);
    expect(state.stopped).toBe(false);
    expect(tuner.calls).toBe(callsAtLock);
  });

  it("every iteration in the confirmation tail is tunedThisIteration=false", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: (_key, iteration) => ({
        windowId: `confirm-${iteration}`,
        candles: candles(10),
      }),
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const deps: StepDeps = {
      windowSource,
      evaluator: constantEvaluator,
      tuner: noChangeTuner(),
      config: baseConfig(),
    };
    let state = initLoopState([arm()]);
    for (let i = 0; i < 6 && !state.stopped; i++) state = step(state, deps);
    const armState = state.armStates.get("rsi-meanrev::stellar-sdex")!;
    for (const it of armState.iterations) {
      expect(it.tunedThisIteration).toBe(false);
    }
  });
});

describe("runLoop - end-to-end outcomes", () => {
  it("reaches ready-for-tiny-live once the confirmation tail plateaus and clears significance", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: (_key, iteration) => ({
        windowId: `confirm-${iteration}`,
        candles: candles(10),
      }),
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const deps: StepDeps = {
      windowSource,
      evaluator: constantEvaluator,
      tuner: noChangeTuner(),
      config: baseConfig(),
    };
    const final = runLoop(initLoopState([arm()]), deps);
    expect(final.outcome?.recommendation).toBe("ready-for-tiny-live");
    expect(final.stopped).toBe(true);
    // Stops as soon as it's ready - never burns the full iteration budget.
    expect(final.iteration).toBeLessThan(deps.config.maxIterations);
  });

  it("an arm with no provable edge exhausts its budget honestly as no-proven-edge", () => {
    const windowSource: WindowSource = {
      nextConfirmationWindow: (_key, iteration) =>
        iteration <= 5 ? { windowId: `confirm-${iteration}`, candles: candles(10) } : null,
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const deps: StepDeps = {
      windowSource,
      evaluator: noEdgeEvaluator,
      tuner: noChangeTuner(),
      config: { maxIterations: 5, readiness: DEFAULT_READINESS_CONFIG },
    };
    const final = runLoop(initLoopState([arm()]), deps);
    expect(final.outcome?.recommendation).toBe("no-proven-edge");
    expect(final.stopped).toBe(true);
    expect(final.iteration).toBe(5);
  });

  it("records GATED-tier suggestions without ever applying them", () => {
    let proposeCalls = 0;
    const gatingTuner: Tuner = {
      propose: (): TuningOutcome => {
        proposeCalls++;
        return proposeCalls === 1
          ? { kind: "gated", description: "consider a regime-specific stop multiplier" }
          : { kind: "no-change" };
      },
    };
    const windowSource: WindowSource = {
      nextConfirmationWindow: (_key, iteration) => ({
        windowId: `confirm-${iteration}`,
        candles: candles(10),
      }),
      nextTrainingSlice: (_key, iteration) => ({
        windowId: `train-${iteration}`,
        candles: candles(50),
      }),
    };
    const initialArm = arm();
    const deps: StepDeps = {
      windowSource,
      evaluator: constantEvaluator,
      tuner: gatingTuner,
      config: baseConfig(),
    };
    let state = initLoopState([initialArm]);
    for (let i = 0; i < 2; i++) state = step(state, deps);

    const gated: GatedTodo[] = state.gatedTodos;
    expect(gated.length).toBe(1);
    expect(gated[0]!.description).toMatch(/regime-specific stop/);
    // A gated suggestion must never mutate the arm's live params.
    const armState = state.armStates.get("rsi-meanrev::stellar-sdex")!;
    expect(armState.arm.params).toEqual(initialArm.params);
  });
});
