import type { Candle } from "../stellar/market";
import type { BacktestConfig } from "../backtest/engine";
import { walkForward } from "../backtest/walkforward";
import type { StrategyParams } from "../backtest/strategy";
import { armKeyOf, type ArmAttribution, type EvalArmKey } from "./types";
import {
  detectPlateau,
  evaluateReadiness,
  type ArmIterationResult,
  type BudgetStatus,
  type ReadinessConfig,
  type ReadinessResult,
} from "./readiness";

/**
 * The ITERATE-UNTIL-READY loop controller.
 *
 * This is the "run the paper test, read the report, improve, run it again...
 * until it's ready for tiny-live" behavior, made deterministic and
 * tick-driven so it can self-drive without a human in the loop for every
 * cycle - and so it is testable without a clock or network in sight.
 *
 * THE OVERFITTING DISCIPLINE (see ITERATION.md for the full rationale, which
 * cites this repo's own backtest lesson: src/backtest/search.ts + walkforward.ts
 * exist because tune-and-rescore-on-the-same-data manufactures a fake edge):
 *
 *  - Every iteration confirms on a FRESH forward window (`WindowSource`) that
 *    has never been used to tune or confirm anything before. Replaying one is
 *    a hard error (`seenConfirmationWindowIds` tripwire below).
 *  - The AUTO-tier tuner (`Tuner`) may only ever search a TRAINING slice that
 *    is provably distinct from this iteration's confirmation window - handing
 *    it the same window is also a hard error.
 *  - Once an arm's results PLATEAU (tuning has stopped materially improving
 *    it - `detectPlateau`, reused from readiness.ts), that arm is LOCKED: no
 *    further tuner calls, ever, for the rest of this run. That is what makes
 *    "the final confirmation iterations apply NO further tuning" an enforced
 *    invariant rather than a convention - see the lock check below and the
 *    tests that assert the tuner is never called again post-lock.
 *  - `variantsTried` counts every DISTINCT parameter variant the tuner has
 *    proposed for an arm; readiness.ts uses it to tighten the significance
 *    bar (Bonferroni-style) as the search widens - the wider you look, the
 *    less you're allowed to believe the best thing you found.
 *  - GATED-tier ideas (new signal logic, anything outside a bounded parameter
 *    tweak) are recorded as a to-do for a human/Claude pass and are NEVER
 *    auto-applied.
 *
 * This loop NEVER arms real money. It only ever produces a readiness verdict
 * (`ReadinessResult`) for a human (Kevin) to act on - Phase 5 is his switch.
 */

export interface Arm {
  key: EvalArmKey;
  params: StrategyParams;
  enabled: boolean;
}

export interface EvalWindow {
  /** Unique identity for this slice of history/paper-trading time. Two
   *  windows with the same id are the SAME data as far as this loop is
   *  concerned, whatever their contents actually are. */
  windowId: string;
  candles: Candle[];
}

/**
 * Collaborator: supplies the next FRESH forward window to confirm against,
 * plus (separately) a training slice the tuner may search over. Injected so
 * the loop is deterministic in tests; the real wiring wraps whatever the
 * Phase-4 paper-trading harness has accumulated since the last iteration.
 */
export interface WindowSource {
  /** Returns null when no new confirmation data has accumulated yet this
   *  tick - the loop holds, it never fabricates a window. */
  nextConfirmationWindow(key: EvalArmKey, iteration: number): EvalWindow | null;
  /** Historical/training data the tuner may search. MUST be disjoint from
   *  every confirmation window already handed out for this arm; iterate.ts
   *  asserts the two windowIds differ every iteration as a tripwire. */
  nextTrainingSlice(key: EvalArmKey, iteration: number): EvalWindow | null;
}

/**
 * Collaborator: runs the Phase-4 eval (paper-fill simulation) for one arm's
 * params over one window and returns its attribution. This is the seam where
 * the real paper-trading harness (src/eval/*, once its fills/attribution
 * modules land) plugs in; tests inject a deterministic fake.
 */
export interface Evaluator {
  evaluate(key: EvalArmKey, params: StrategyParams, window: EvalWindow): ArmAttribution;
}

export type TuningOutcome =
  | { kind: "no-change" }
  | { kind: "tune"; params: StrategyParams; variantId: string; rationale: string }
  | { kind: "disable"; rationale: string }
  | { kind: "gated"; description: string };

/**
 * Collaborator: the AUTO-tier tuner. Proposes a bounded parameter/config
 * adjustment (or arm disable) using ONLY `trainingCandles` - it must never see
 * this iteration's confirmation window. Returning "gated" records a
 * structured to-do instead of acting (new logic / code changes are never
 * auto-applied - see GatedTodo).
 */
export interface Tuner {
  propose(arm: Arm, trainingCandles: Candle[]): TuningOutcome;
}

/**
 * The default AUTO-tier tuner: reuses src/backtest/walkforward.ts (itself
 * built on search.ts's grid) over the training slice ONLY. Its own internal
 * train/test folds are still in-sample relative to THIS loop (that's exactly
 * why iterate.ts re-confirms the result on a genuinely fresh window before
 * trusting it) - this tuner is a hypothesis generator, not a verdict.
 */
export function createWalkForwardTuner(
  cfg: BacktestConfig,
  trainBars: number,
  testBars: number,
  minTrainTrades = 8,
): Tuner {
  return {
    propose(arm, trainingCandles) {
      const minLength = cfg.window + trainBars + testBars;
      if (trainingCandles.length < minLength) return { kind: "no-change" };

      const wf = walkForward(
        arm.key.arm,
        arm.key.venue,
        trainingCandles,
        cfg,
        trainBars,
        testBars,
        minTrainTrades,
      );
      if (wf.oosMetrics.trades === 0 || wf.oosMetrics.expectancyR <= 0) {
        return { kind: "no-change" };
      }
      const lastFold = wf.folds[wf.folds.length - 1];
      if (!lastFold?.params) return { kind: "no-change" };
      return {
        kind: "tune",
        params: lastFold.params,
        variantId: JSON.stringify(lastFold.params),
        rationale: `walk-forward over ${wf.folds.length} training folds: OOS expectancy ${wf.oosMetrics.expectancyR}R across ${wf.oosMetrics.trades} trades; proposing its most recently frozen params.`,
      };
    },
  };
}

export interface GatedTodo {
  iteration: number;
  key: EvalArmKey;
  description: string;
}

export interface ArmLoopState {
  arm: Arm;
  iterations: ArmIterationResult[];
  variantsTried: Set<string>;
  /** Once set, this arm never receives another tuner call for the rest of
   *  the run (the permanent confirmation lock - see file banner). */
  lockedAtIteration: number | null;
  seenConfirmationWindowIds: Set<string>;
}

export interface IterateConfig {
  maxIterations: number;
  /** Extra exhaustion signal beyond the iteration cap (e.g. a wall-clock
   *  budget). Injected so the loop stays deterministic/hermetic - the real
   *  wiring passes something like `() => Date.now() - startedAt > budgetMs`. */
  isBudgetExhausted?: (state: LoopState) => boolean;
  readiness: ReadinessConfig;
}

export interface LoopState {
  iteration: number;
  armStates: Map<string, ArmLoopState>;
  gatedTodos: GatedTodo[];
  stopped: boolean;
  outcome: ReadinessResult | null;
}

export interface StepDeps {
  windowSource: WindowSource;
  evaluator: Evaluator;
  tuner: Tuner;
  config: IterateConfig;
}

export function initLoopState(arms: Arm[]): LoopState {
  const armStates = new Map<string, ArmLoopState>();
  for (const arm of arms) {
    armStates.set(armKeyOf(arm.key), {
      arm,
      iterations: [],
      variantsTried: new Set(),
      lockedAtIteration: null,
      seenConfirmationWindowIds: new Set(),
    });
  }
  return { iteration: 0, armStates, gatedTodos: [], stopped: false, outcome: null };
}

/**
 * Advance the loop by exactly one iteration across every enabled arm. Pure
 * given its injected collaborators (no timers, no I/O) - the same state +
 * deps always produce the same next state, which is what makes the tests
 * below deterministic.
 */
export function step(state: LoopState, deps: StepDeps): LoopState {
  if (state.stopped) return state;

  const iteration = state.iteration + 1;
  const armStates = new Map(state.armStates);
  const gatedTodos = [...state.gatedTodos];

  for (const [label, prev] of state.armStates) {
    if (!prev.arm.enabled) continue;

    const confirmWindow = deps.windowSource.nextConfirmationWindow(
      prev.arm.key,
      iteration,
    );
    if (!confirmWindow) continue; // stall: no fresh confirmation data this tick

    if (prev.seenConfirmationWindowIds.has(confirmWindow.windowId)) {
      throw new Error(
        `iterate: WindowSource replayed confirmation window "${confirmWindow.windowId}" for arm "${label}" - fresh-window discipline violated. Every iteration must confirm on data never used before.`,
      );
    }

    let params = prev.arm.params;
    let enabled: boolean = prev.arm.enabled;
    let tunedThisIteration = false;
    let variantsTried = prev.variantsTried;
    let lockedAtIteration = prev.lockedAtIteration;

    // Only try to tune while unlocked. Once locked, this branch never runs
    // again for this arm - see the file banner.
    if (lockedAtIteration === null) {
      const trainingSlice = deps.windowSource.nextTrainingSlice(
        prev.arm.key,
        iteration,
      );
      if (trainingSlice) {
        if (trainingSlice.windowId === confirmWindow.windowId) {
          throw new Error(
            `iterate: training slice and confirmation window are the SAME window ("${confirmWindow.windowId}") for arm "${label}" - tuning on the confirmation data is exactly the overfitting this loop must refuse.`,
          );
        }
        const outcome = deps.tuner.propose(
          { key: prev.arm.key, params, enabled },
          trainingSlice.candles,
        );
        if (outcome.kind === "tune") {
          params = outcome.params;
          tunedThisIteration = true;
          if (!variantsTried.has(outcome.variantId)) {
            variantsTried = new Set(variantsTried);
            variantsTried.add(outcome.variantId);
          }
        } else if (outcome.kind === "disable") {
          enabled = false;
        } else if (outcome.kind === "gated") {
          gatedTodos.push({ iteration, key: prev.arm.key, description: outcome.description });
        }
        // "no-change" -> keep the current frozen params.
      }
    }

    const attribution = deps.evaluator.evaluate(prev.arm.key, params, confirmWindow);

    const result: ArmIterationResult = {
      iteration,
      key: prev.arm.key,
      isOutOfSample: true, // confirmWindow is fresh by WindowSource's contract
      tunedThisIteration,
      attribution,
    };
    const iterations = [...prev.iterations, result];

    // Lock into permanent confirmation once tuning has stopped materially
    // helping. Uses the FULL history (not just untouched iterations) because
    // the question here is "did the search plateau", which is exactly what
    // tuned iterations are evidence of.
    if (lockedAtIteration === null) {
      const trail = iterations.map((r) => mean(r.attribution.netReturns));
      if (
        detectPlateau(
          trail,
          deps.config.readiness.plateauWindow,
          deps.config.readiness.materialImprovementFraction,
        )
      ) {
        lockedAtIteration = iteration;
      }
    }

    armStates.set(label, {
      arm: { key: prev.arm.key, params, enabled },
      iterations,
      variantsTried,
      lockedAtIteration,
      seenConfirmationWindowIds: new Set(prev.seenConfirmationWindowIds).add(
        confirmWindow.windowId,
      ),
    });
  }

  const historyByArm: Record<string, ArmIterationResult[]> = {};
  const variantsTriedByArm: Record<string, number> = {};
  for (const [label, s] of armStates) {
    historyByArm[label] = s.iterations;
    variantsTriedByArm[label] = s.variantsTried.size;
  }

  const priorState: LoopState = { ...state, iteration, armStates, gatedTodos };
  const budget: BudgetStatus = {
    exhausted:
      iteration >= deps.config.maxIterations ||
      (deps.config.isBudgetExhausted?.(priorState) ?? false),
    iterationsUsed: iteration,
    maxIterations: deps.config.maxIterations,
  };

  const outcome = evaluateReadiness(
    historyByArm,
    variantsTriedByArm,
    budget,
    deps.config.readiness,
  );
  const stopped = outcome.ready || budget.exhausted;

  return { iteration, armStates, gatedTodos, stopped, outcome };
}

/** Drive `step` until it stops (ready or budget-exhausted) or `maxTicks` is
 *  hit as a last-resort safety cap (defaults to the configured iteration
 *  budget, so a misconfigured collaborator can't spin forever). */
export function runLoop(
  initial: LoopState,
  deps: StepDeps,
  maxTicks = deps.config.maxIterations,
): LoopState {
  let state = initial;
  for (let i = 0; i < maxTicks && !state.stopped; i++) {
    state = step(state, deps);
  }
  return state;
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
