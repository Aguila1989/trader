import type {
  ArmAttribution,
  EvalArm,
  EvalArmKey,
  EvalConfig,
  EvalVenue,
  OrderLiquidity,
  PaperFill,
  PaperOrder,
} from "./types";
import { armKeyOf } from "./types";
import type { BookLevel, TradeSide } from "../types";
import type { IndicatorSet, Regime } from "../stellar/indicators";
import { DEFAULT_PARAMS, decide } from "../backtest/strategy";
import { isFundable } from "../trading/explain";
import {
  type CellState,
  type EvalStateStore,
  type OpenLotTracker,
  type RunState,
  type RunStatus,
  hitHardLimit,
  meetsStoppingCriteria,
  reduce,
  resumeOrCreate,
} from "./state";

/**
 * Phase 4 paper-evaluation controller.
 *
 * PAPER-ONLY, STRUCTURALLY. `PaperDataReader` below has exactly one method,
 * `read()`, and it returns plain data - there is no `submit()`, `sign()`, or
 * `prepareOrder()` anywhere on the type this controller talks to (contrast
 * `ChainAdapter` in src/chains/types.ts, which has all three). That is not a
 * policy choice this code enforces at runtime; it is a type the controller
 * has no way to call an execution method on, even by mistake. Fills are
 * produced by an injected pure function (`simulateFill`, src/eval/fills.ts)
 * against LIVE MAINNET market data read through that same interface - real
 * data, simulated outcome, nothing ever leaves this process.
 *
 * Collaborators (`simulateFill`, `attribute`) are taken as constructor
 * dependencies rather than imported by static path. This keeps the module
 * typed against the SHARED vocabulary in ./types (which is real and stable)
 * while staying decoupled from the exact export shape of the sibling
 * src/eval/{fills,attribution,stats}.ts modules, which are being written in
 * parallel - see the assumptions this builder returned for the exact
 * contract expected of each, and integrationSpec for how the composition
 * root (wherever the real controller is instantiated) wires the real
 * functions in. It also makes this file - and its tests - independent of
 * whether those sibling files exist yet.
 *
 * SEEDING BOTH LEGS. A real trading wallet usually holds only one leg of a
 * pair, which makes half of every rulebook signal structurally untradeable -
 * see src/trading/explain.ts `isFundable` / the PHANTOM-divergence concept.
 * That bias would make a paper evaluator lie about the AI "never trading" for
 * a wallet reason that has nothing to do with the strategy. This controller
 * has NO wallet-holding precondition anywhere: every arm may propose either
 * side at any time. The `isFundable` calls below are a permanent regression
 * tripwire for that invariant, not a real balance check (there is no wallet
 * to check - PnL is a FIFO match over the fill ledger, per src/eval/types.ts
 * ClosedTrade, not a spendable balance).
 */

// --- baseline arms (always added; never configured) -----------------------

export const RULEBOOK_ARM_ID: EvalArm = "baseline:rulebook";
export const BUYHOLD_ARM_ID: EvalArm = "baseline:buy-hold";
export const COINFLIP_ARM_ID: EvalArm = "baseline:coin-flip";
const BASELINE_IDS: ReadonlySet<EvalArm> = new Set([
  RULEBOOK_ARM_ID,
  BUYHOLD_ARM_ID,
  COINFLIP_ARM_ID,
]);
const DEFAULT_COINFLIP_SEED = 0x2f6e2b1;

// --- the read-only data seam ------------------------------------------------

/** One read-only market observation for a venue/pair at a tick. Everything an
 *  arm or the fill simulator needs, and nothing they don't (in particular: no
 *  handle to place an order). */
export interface MarketContext {
  venue: EvalVenue;
  base: string;
  quote: string;
  /** Mid price, quote per base - becomes PaperOrder.decisionPrice. */
  mid: number;
  bids: BookLevel[];
  asks: BookLevel[];
  indicators: IndicatorSet;
  regime: Regime | null;
  /** ISO timestamp of this read (== the tick time for a live provider). */
  ts: string;
  /**
   * Recent tape prints (price + base volume), best-effort, most-recent last.
   * Shape matches src/eval/fills.ts's `MarketTrade` structurally on purpose:
   * a real PaperDataReader (see integrationSpec) can pass this straight
   * through to `observedThroughVolume`/`fillMaker` with no conversion.
   * Empty when the venue can't supply a tape - fillMaker treats that as zero
   * observed through-volume (a maker order simply won't be marked filled).
   */
  recentTrades: ReadonlyArray<{ price: number; baseAmount: number }>;
}

export interface PaperDataReader {
  /**
   * READ-ONLY. Returns null when there's no data this tick (a gap, a closed
   * market): the controller simply skips that cell - not an error, and it
   * contributes nothing to a cell's D_min coverage clock.
   */
  read(
    venue: EvalVenue,
    base: string,
    quote: string,
    nowMs: number,
  ): Promise<MarketContext | null> | MarketContext | null;
}

// --- arms --------------------------------------------------------------

export interface ArmDecision {
  side: TradeSide;
  /** Base units to (paper-)order. */
  amount: number;
  limitPrice: number;
  liquidity: OrderLiquidity;
  /** Absent = never force-closed by the controller's stop check. */
  stopPrice?: number;
}

/**
 * A strategy variant under test. Pure and stateless by convention - the
 * controller re-derives everything it needs to know (is there an open lot,
 * what iteration is this) from RunState each call, so an ArmDecider never
 * needs its own closure state to stay crash-resumable. `iteration` is passed
 * only so a baseline (coin-flip) can derive a deterministic pseudo-random
 * choice without keeping a stateful RNG across restarts.
 */
export type ArmDecider = (
  ctx: MarketContext,
  openLot: OpenLotTracker | null,
  iteration: number,
) => ArmDecision | null;

export interface ArmSpec {
  id: EvalArm;
  label: string;
  decide: ArmDecider;
}

/** Position size from a fixed risk budget: risk `riskFraction` of
 *  `seedNotionalQuote` per trade, sized by the entry-to-stop distance -
 *  same convention as src/backtest strategies (ATR-based bracket sizing). */
function sizeFromRisk(
  seedNotionalQuote: number,
  riskFraction: number,
  entry: number,
  stop: number,
): number {
  const riskPerUnit = Math.abs(entry - stop);
  if (!(riskPerUnit > 0)) return 0;
  const riskBudget = seedNotionalQuote * riskFraction;
  return riskBudget / riskPerUnit;
}

/** Deterministic pseudo-random bit from (seed, iteration, venue) - a PURE
 *  hash, not a stateful generator, so the coin-flip baseline is reproducible
 *  across a crash/resume without carrying its own RNG state in RunState. */
function pseudoRandomBit(seed: number, iteration: number, venue: string): boolean {
  let h = (seed ^ iteration) >>> 0;
  for (let i = 0; i < venue.length; i++) {
    h = Math.imul(h ^ venue.charCodeAt(i), 0x9e3779b1) >>> 0;
  }
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h ^= h >>> 16;
  return (h & 1) === 0;
}

/** The deterministic rulebook baseline: the SAME playbook src/backtest/
 *  strategy.ts encodes, run over the SAME server-computed indicators every
 *  configured arm sees. One lot at a time - rides to its own stop or the
 *  run's hard stop, never adds. */
function rulebookArm(seedNotionalQuote: number, riskFraction: number): ArmSpec {
  return {
    id: RULEBOOK_ARM_ID,
    label: "Deterministic rulebook",
    decide: (ctx, openLot) => {
      if (openLot) return null;
      const sig = decide(ctx.indicators, ctx.mid, DEFAULT_PARAMS);
      if (!sig) return null;
      const amount = sizeFromRisk(seedNotionalQuote, riskFraction, sig.entry, sig.invalidation);
      if (!(amount > 0)) return null;
      return { side: sig.side, amount, limitPrice: sig.entry, liquidity: "maker", stopPrice: sig.invalidation };
    },
  };
}

/** Buy & hold: opens once (the first tick it's flat) and never adds or exits
 *  early - it rides to the run's hard stop. No `stopPrice`, so the
 *  controller's stop-breach check never force-closes it. */
function buyHoldArm(seedNotionalQuote: number): ArmSpec {
  return {
    id: BUYHOLD_ARM_ID,
    label: "Buy & hold",
    decide: (ctx, openLot) => {
      if (openLot) return null;
      const amount = seedNotionalQuote / ctx.mid;
      if (!(amount > 0)) return null;
      return { side: "buy", amount, limitPrice: ctx.mid, liquidity: "taker" };
    },
  };
}

/** Coin flip: fires at the SAME decision points the rulebook would (so it's a
 *  fair "would a random direction have done as well here" baseline), but
 *  picks the side via a deterministic hash instead of the rulebook's read. */
function coinFlipArm(seedNotionalQuote: number, riskFraction: number, seed: number): ArmSpec {
  return {
    id: COINFLIP_ARM_ID,
    label: "Coin flip",
    decide: (ctx, openLot, iteration) => {
      if (openLot) return null;
      const sig = decide(ctx.indicators, ctx.mid, DEFAULT_PARAMS);
      if (!sig) return null;
      const side: TradeSide = pseudoRandomBit(seed, iteration, ctx.venue) ? "buy" : "sell";
      const amount = sizeFromRisk(seedNotionalQuote, riskFraction, sig.entry, sig.invalidation);
      if (!(amount > 0)) return null;
      return { side, amount, limitPrice: sig.entry, liquidity: "maker", stopPrice: sig.invalidation };
    },
  };
}

function stopBreached(lot: OpenLotTracker, mid: number): boolean {
  if (lot.stopPrice == null) return false;
  return lot.side === "buy" ? mid <= lot.stopPrice : mid >= lot.stopPrice;
}

// --- controller wiring -------------------------------------------------

export interface ControllerConfig extends EvalConfig {
  /** Equal-value notional (quote units) the built-in baselines size against;
   *  a configured arm's ArmDecision.amount is taken as-is (it sizes itself). */
  seedNotionalQuote: number;
  /** Fraction of seedNotionalQuote the built-in baselines risk per trade. */
  riskFraction: number;
}

export interface VenueSpec {
  id: EvalVenue;
  base: string;
  quote: string;
}

export interface ControllerDeps {
  dataReader: PaperDataReader;
  store: EvalStateStore;
  /** Strategy variants under test, EXCLUDING the three built-ins (rulebook /
   *  buy-hold / coin-flip), which this controller always adds itself so
   *  every configured arm is measured against the SAME reference points. */
  arms: ArmSpec[];
  venues: VenueSpec[];
  config: ControllerConfig;
  /** src/eval/fills.ts, injected (see the class doc for why). */
  simulateFill(order: PaperOrder, ctx: MarketContext): Promise<PaperFill> | PaperFill;
  /** src/eval/attribution.ts, injected. FIFO-matches ONE cell's fill ledger
   *  into its attribution (trades / PnL / R / regime breakdown / open lots). */
  attribute(fills: PaperFill[]): Promise<ArmAttribution> | ArmAttribution;
  /** Seed for the built-in coin-flip baseline's deterministic hash. */
  coinFlipSeed?: number;
}

export interface TickResult {
  state: RunState;
  done: boolean;
}

function buildArms(deps: ControllerDeps): Map<EvalArm, ArmSpec> {
  const m = new Map<EvalArm, ArmSpec>();
  for (const a of deps.arms) m.set(a.id, a);
  m.set(RULEBOOK_ARM_ID, rulebookArm(deps.config.seedNotionalQuote, deps.config.riskFraction));
  m.set(BUYHOLD_ARM_ID, buyHoldArm(deps.config.seedNotionalQuote));
  m.set(
    COINFLIP_ARM_ID,
    coinFlipArm(deps.config.seedNotionalQuote, deps.config.riskFraction, deps.coinFlipSeed ?? DEFAULT_COINFLIP_SEED),
  );
  return m;
}

const alwaysHeld = () => true;

export class EvalController {
  private state: RunState;
  private readonly deps: ControllerDeps;
  private readonly armsById: Map<EvalArm, ArmSpec>;
  private readonly venuesById: Map<EvalVenue, VenueSpec>;
  private orderSeq = 0;

  private constructor(state: RunState, deps: ControllerDeps, armsById: Map<EvalArm, ArmSpec>) {
    this.state = state;
    this.deps = deps;
    this.armsById = armsById;
    this.venuesById = new Map(deps.venues.map((v) => [v.id, v]));
  }

  /** Resume-or-create a run and return a controller ready to `tick()`. Never
   *  starts a timer; the caller drives ticks (a real interval in server.ts,
   *  or a fake clock loop in tests). */
  static async start(deps: ControllerDeps, runId: string, nowIso: string): Promise<EvalController> {
    const armsById = buildArms(deps);
    const keys: Array<{ key: EvalArmKey; kind: "arm" | "baseline" }> = [];
    for (const arm of armsById.values()) {
      const kind: "arm" | "baseline" = BASELINE_IDS.has(arm.id) ? "baseline" : "arm";
      for (const v of deps.venues) {
        keys.push({ key: { arm: arm.id, venue: v.id }, kind });
      }
    }
    const fullConfig: EvalConfig = {
      ...deps.config,
      arms: deps.arms.map((a) => a.id),
      venues: deps.venues.map((v) => v.id),
    };
    const state = await resumeOrCreate(deps.store, runId, fullConfig, keys, nowIso);
    return new EvalController(state, deps, armsById);
  }

  getState(): RunState {
    return this.state;
  }

  async stop(): Promise<RunState> {
    this.state = reduce(this.state, { type: "set-status", status: "stopped-manual" });
    await this.deps.store.save(this.state);
    return this.state;
  }

  /**
   * Advance the whole evaluation by one step at caller-supplied `nowMs`. No
   * internal timer - this method is pure stepping, safe to drive with a fake
   * clock in tests and a real interval in production. A no-op once the run
   * has stopped (for any reason): `done` stays true forever after.
   */
  async tick(nowMs: number): Promise<TickResult> {
    if (this.state.status !== "running") {
      return { state: this.state, done: true };
    }

    this.state = reduce(this.state, { type: "tick", nowIso: new Date(nowMs).toISOString() });

    const closedCounts: Record<string, number> = {};

    for (const cell of Object.values(this.state.cells)) {
      const k = armKeyOf(cell.key);
      const arm = this.armsById.get(cell.key.arm);
      const venue = this.venuesById.get(cell.key.venue);
      if (!arm || !venue) {
        closedCounts[k] = 0;
        continue;
      }

      const ctx = await this.deps.dataReader.read(cell.key.venue, venue.base, venue.quote, nowMs);
      if (!ctx) {
        const attribution = await this.deps.attribute(this.state.cells[k]!.fills);
        closedCounts[k] = attribution.trades;
        continue;
      }

      if (cell.firstDataAtMs === null) {
        this.state = reduce(this.state, { type: "data-seen", key: cell.key, nowMs });
        this.assertBothLegsFundable(venue);
      }

      const freshCell = this.state.cells[k]!;
      const priorAttribution = await this.deps.attribute(freshCell.fills);
      const openLotQty =
        priorAttribution.openLots.find((l) => l.base === venue.base && l.quote === venue.quote)?.netQty ?? 0;

      let decision: ArmDecision | null = null;
      if (freshCell.openLot && stopBreached(freshCell.openLot, ctx.mid) && openLotQty !== 0) {
        // A breached stop always wins over whatever the arm would otherwise
        // decide this tick - mirrors the real stop-loss priority in
        // trading/monitor.ts (risk-reducing, never waits its turn).
        decision = {
          side: freshCell.openLot.side === "buy" ? "sell" : "buy",
          amount: Math.abs(openLotQty),
          limitPrice: ctx.mid,
          liquidity: "taker",
        };
      } else {
        decision = arm.decide(ctx, freshCell.openLot, this.state.iteration);
      }

      if (decision && decision.amount > 0) {
        await this.placeOrder(cell.key, arm.id, venue, ctx, decision);
      }

      const afterCell = this.state.cells[k]!;
      const finalAttribution =
        afterCell.fills.length !== freshCell.fills.length
          ? await this.deps.attribute(afterCell.fills)
          : priorAttribution;
      closedCounts[k] = finalAttribution.trades;
    }

    const done = this.evaluateStop(nowMs, closedCounts);
    await this.deps.store.save(this.state);
    return { state: this.state, done };
  }

  private assertBothLegsFundable(venue: VenueSpec): void {
    if (!isFundable("buy", venue.base, venue.quote, alwaysHeld) || !isFundable("sell", venue.base, venue.quote, alwaysHeld)) {
      throw new Error(
        `eval/controller: pair ${venue.base}/${venue.quote} failed the both-legs-fundable invariant - a paper evaluator must never inherit the wallet-holding PHANTOM bias (src/trading/explain.ts isFundable).`,
      );
    }
  }

  private async placeOrder(
    key: EvalArmKey,
    armId: EvalArm,
    venue: VenueSpec,
    ctx: MarketContext,
    decision: ArmDecision,
  ): Promise<void> {
    this.orderSeq += 1;
    const order: PaperOrder = {
      id: `${armKeyOf(key)}#${this.orderSeq}`,
      arm: armId,
      venue: venue.id,
      side: decision.side,
      base: venue.base,
      quote: venue.quote,
      liquidity: decision.liquidity,
      amount: decision.amount,
      limitPrice: decision.limitPrice,
      decisionPrice: ctx.mid,
      ts: ctx.ts,
      stopPrice: decision.stopPrice,
      regime: ctx.regime,
    };
    const fill = await this.deps.simulateFill(order, ctx);
    this.state = reduce(this.state, { type: "fill", key, fill });

    const k = armKeyOf(key);
    const existingLot = this.state.cells[k]!.openLot;
    if (existingLot && existingLot.side !== decision.side) {
      this.state = reduce(this.state, { type: "clear-lot", key });
    } else if (!existingLot) {
      this.state = reduce(this.state, {
        type: "open-lot",
        key,
        lot: { side: decision.side, stopPrice: decision.stopPrice, sinceTs: order.ts },
      });
    }
    // existingLot && same side => an ADD; the tracker stays as-is (still
    // guards the SAME direction's stop).
  }

  private evaluateStop(nowMs: number, closedCounts: Record<string, number>): boolean {
    if (hitHardLimit(this.state, nowMs)) {
      this.state = reduce(this.state, { type: "set-status", status: "stopped-hard-limit" });
      return true;
    }
    if (meetsStoppingCriteria(this.state, nowMs, closedCounts)) {
      this.state = reduce(this.state, { type: "set-status", status: "stopped-criteria-met" });
      return true;
    }
    return false;
  }
}

export type { RunState, RunStatus, CellState };
