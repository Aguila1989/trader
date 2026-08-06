import type { EvalArm, EvalArmKey, EvalConfig, PaperFill } from "./types";
import { armKeyOf } from "./types";
import type { TradeSide } from "../types";

/**
 * Crash-safe run state for the Phase 4 self-driving paper-eval controller
 * (src/eval/controller.ts) and the report generator (src/eval/report.ts).
 *
 * Design constraints (all deliberate, all load-bearing for the always-
 * terminates / resumable / hermetic-testable requirements):
 *  - PURE. Every export here is a pure function over plain data - no I/O, no
 *    clock reads (`nowMs`/`nowIso` are always parameters), no randomness. The
 *    controller owns time and chance; this module only knows how to fold one
 *    event into a new RunState and how to read a stopping decision off it.
 *  - RESUMABLE. This module never touches disk/DB itself. Persistence goes
 *    through an INJECTED `EvalStateStore` ({ load, save }) so an in-memory
 *    (tests), file-backed, or DB-backed store all resume identically.
 *  - The fill LEDGER lives per-cell in RunState (`CellState.fills`), not a
 *    derived PnL ledger - realized PnL / R-multiples / closed-trade counts
 *    are computed on demand by FIFO-matching that ledger (src/eval/
 *    attribution.ts's `attribute`), so a crash never loses raw fills and a
 *    resumed run re-derives the SAME numbers deterministically.
 */

export type EvalSide = TradeSide;

/**
 * The controller's OWN lightweight bracket bookkeeping for ONE open lot per
 * cell - just enough to know whether a stop has been breached and which side
 * would flatten it. This is NOT a duplicate PnL ledger: the actual realized
 * PnL / net position always comes from FIFO-matching `CellState.fills`
 * (src/eval/attribution.ts). Losing this tracker on a crash only means a
 * stop-breach check has to be re-derived from the fill ledger on resume - it
 * never affects the honest PnL number.
 */
export interface OpenLotTracker {
  side: EvalSide;
  /** Absent = never force-closed by a stop (e.g. the buy&hold baseline). */
  stopPrice?: number;
  sinceTs: string;
}

/** Per (arm, venue) progress. `kind` distinguishes a configured arm under
 *  test from one of the controller's own built-in baselines - see the note
 *  on `meetsStoppingCriteria` for why that distinction matters for the N_min
 *  gate (a buy&hold baseline structurally never produces more than one
 *  closed trade, so it cannot be held to the same trade-count bar). */
export interface CellState {
  key: EvalArmKey;
  kind: "arm" | "baseline";
  /** First tick this cell observed live data - the D_min coverage clock
   *  starts HERE (per cell), not at run start, so a cell added mid-run is
   *  judged on its own observed window, not a stale run-wide clock. */
  firstDataAtMs: number | null;
  openLot: OpenLotTracker | null;
  /** The full paper-fill ledger for this cell (crash-safe). attribution.ts
   *  FIFO-matches this into ClosedTrade / ArmAttribution on demand - nothing
   *  in this module or the controller pre-aggregates it. */
  fills: PaperFill[];
}

export type RunStatus =
  | "running"
  | "stopped-criteria-met"
  | "stopped-hard-limit"
  | "stopped-manual";

export interface RunState {
  runId: string;
  /** ISO - injected at creation time, never Date.now(). */
  startedAt: string;
  lastTickAt: string | null;
  iteration: number;
  config: EvalConfig;
  /** Keyed by armKeyOf(cell.key). */
  cells: Record<string, CellState>;
  status: RunStatus;
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function createInitialState(
  runId: string,
  config: EvalConfig,
  keys: ReadonlyArray<{ key: EvalArmKey; kind: "arm" | "baseline" }>,
  nowIso: string,
): RunState {
  const cells: Record<string, CellState> = {};
  for (const { key, kind } of keys) {
    cells[armKeyOf(key)] = { key, kind, firstDataAtMs: null, openLot: null, fills: [] };
  }
  return {
    runId,
    startedAt: nowIso,
    lastTickAt: null,
    iteration: 0,
    config,
    cells,
    status: "running",
  };
}

/** The small vocabulary of things that can happen to a run. Kept
 *  intentionally minimal: the controller decides WHAT happened (a fill
 *  simulated, a lot opened/cleared); this module only folds that into the
 *  persisted shape. */
export type RunEvent =
  | { type: "tick"; nowIso: string }
  | { type: "data-seen"; key: EvalArmKey; nowMs: number }
  | { type: "fill"; key: EvalArmKey; fill: PaperFill }
  | { type: "open-lot"; key: EvalArmKey; lot: OpenLotTracker }
  | { type: "clear-lot"; key: EvalArmKey }
  | { type: "set-status"; status: RunStatus };

export function reduce(state: RunState, event: RunEvent): RunState {
  switch (event.type) {
    case "tick":
      return { ...state, iteration: state.iteration + 1, lastTickAt: event.nowIso };

    case "data-seen": {
      const k = armKeyOf(event.key);
      const cell = state.cells[k];
      if (!cell || cell.firstDataAtMs !== null) return state;
      return { ...state, cells: { ...state.cells, [k]: { ...cell, firstDataAtMs: event.nowMs } } };
    }

    case "fill": {
      const k = armKeyOf(event.key);
      const cell = state.cells[k];
      if (!cell) return state;
      return {
        ...state,
        cells: { ...state.cells, [k]: { ...cell, fills: [...cell.fills, event.fill] } },
      };
    }

    case "open-lot": {
      const k = armKeyOf(event.key);
      const cell = state.cells[k];
      if (!cell) return state;
      return { ...state, cells: { ...state.cells, [k]: { ...cell, openLot: event.lot } } };
    }

    case "clear-lot": {
      const k = armKeyOf(event.key);
      const cell = state.cells[k];
      if (!cell) return state;
      return { ...state, cells: { ...state.cells, [k]: { ...cell, openLot: null } } };
    }

    case "set-status":
      return { ...state, status: event.status };

    default:
      return state;
  }
}

/**
 * The N_min / D_min stopping gate: "continue until every arm has >= N_min
 * closed trades AND >= D_min elapsed live coverage, whichever is later."
 *
 * Baselines are exempt from the N_min (trade-count) half of that bar. A
 * buy&hold baseline opens exactly once and (by design) is never closed until
 * the run's hard stop - it can structurally never reach an N_min > 1, so
 * holding it to that bar would mean the run could NEVER finish via this path
 * (it would always fall through to the D_max hard stop instead). Baselines
 * still owe D_min coverage - they must have run over the SAME window as the
 * arms they're compared against - just not a trade-count minimum.
 *
 * `closedTradeCounts` is supplied by the caller (the controller has already
 * called attribute() this tick to decide whether to force-close a stop) so
 * this stays a pure function over data it doesn't have to re-derive.
 */
export function meetsStoppingCriteria(
  state: RunState,
  nowMs: number,
  closedTradeCounts: Record<string, number>,
): boolean {
  const cells = Object.values(state.cells);
  if (cells.length === 0) return false;
  const dMinMs = state.config.dMin * MS_PER_DAY;
  return cells.every((c) => {
    if (c.firstDataAtMs === null) return false;
    if (nowMs - c.firstDataAtMs < dMinMs) return false;
    if (c.kind === "baseline") return true;
    const n = closedTradeCounts[armKeyOf(c.key)] ?? 0;
    return n >= state.config.nMin;
  });
}

/** The ALWAYS-TERMINATES hard stop: the run is alive dMax days from
 *  `startedAt`, independent of trade counts, data gaps, or a stuck arm. */
export function hitHardLimit(state: RunState, nowMs: number): boolean {
  const dMaxMs = state.config.dMax * MS_PER_DAY;
  return nowMs - Date.parse(state.startedAt) >= dMaxMs;
}

export interface EvalStateStore {
  load(): Promise<RunState | null> | RunState | null;
  save(state: RunState): Promise<void> | void;
}

/**
 * Resume helper: reconcile a previously persisted state against the CURRENT
 * run id, cell set (arms x venues x baselines) and stopping thresholds. An
 * exact match resumes as-is; anything else (a resized arm/venue list, a
 * changed N_min/D_min/D_max, a different runId) starts fresh rather than
 * silently reinterpreting stale per-cell progress against parameters that no
 * longer apply.
 */
export async function resumeOrCreate(
  store: EvalStateStore,
  runId: string,
  config: EvalConfig,
  keys: ReadonlyArray<{ key: EvalArmKey; kind: "arm" | "baseline" }>,
  nowIso: string,
): Promise<RunState> {
  const loaded = await store.load();
  const wantKeys = new Set(keys.map((k) => armKeyOf(k.key)));
  const haveKeys = new Set(loaded ? Object.keys(loaded.cells) : []);
  const sameCells =
    wantKeys.size === haveKeys.size && [...wantKeys].every((k) => haveKeys.has(k));
  const sameThresholds =
    !!loaded &&
    loaded.config.nMin === config.nMin &&
    loaded.config.dMin === config.dMin &&
    loaded.config.dMax === config.dMax;

  if (loaded && loaded.runId === runId && sameCells && sameThresholds) {
    return loaded;
  }
  return createInitialState(runId, config, keys, nowIso);
}

/** Cells still holding an unrealized position when the run stopped - the
 *  report's Honesty block flags these (their PnL isn't final). */
export function openCellCount(state: RunState): number {
  return Object.values(state.cells).filter((c) => c.openLot !== null).length;
}

export type { EvalArm };
