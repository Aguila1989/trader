/**
 * StrategyArm — the pluggable "arm" contract (personal-build plan, Phase 3.2/3.3).
 *
 * WHY arms exist: every trading idea today is either baked into the AI
 * system prompt or hand-coded into the deterministic rulebook
 * (src/backtest/strategy.ts), with no way to isolate "did THIS idea make
 * money" from "did the system make money". Phase 4's eval needs each idea
 * measurable on its own — same market data in, one arm's intents out, scored
 * independently, so a losing idea can be KILLED without touching the others.
 *
 * That requires a hard boundary: an arm is a PURE FUNCTION of the data it is
 * handed.
 *  - It MAY read `ctx` and its own internal params.
 *  - It MUST NOT sign, submit, call a ChainAdapter, read/write the store or
 *    DB, log, or read wall-clock time / randomness outside `ctx.decisionTime`.
 *    That purity is what makes a backtest and a live run over the same data
 *    give the same answer, and what lets an arm be swapped or killed without
 *    touching orchestrator.ts.
 *  - It MUST NOT look past `ctx.decisionTime` in anything it consumes — the
 *    same no-look-ahead invariant src/backtest/strategy.ts already keeps.
 *
 * Turning a StrategyIntent into a live TradeProposal (checkPolicy, prepare ->
 * sign -> submit via the ChainAdapter, persistence) is a LATER wiring step,
 * not part of this phase, and not something an arm ever does itself.
 */
import type { ChainId } from "../chains/assetId";
import type { IndicatorSet } from "../stellar/indicators";
import type { TradeSide } from "../types";
// The catalyst module (src/catalyst) is the source of truth for the event
// shape + scorer; the news arm consumes it. (An earlier draft declared a
// local CatalystEvent/CatalystScore contract here — replaced by the real one.)
import type { CatalystEvent } from "../catalyst/types";

export type { CatalystEvent };

export type StrategyArmKind =
  | "baseline"
  | "directional"
  | "funding-carry"
  | "news-reaction"
  | "synthesis";

/** "maker" = priced to rest at/through the touch (never cross); "taker" = may
 *  cross and fill immediately. Mirrors TradeProposal.postOnly's intent. */
export type OrderStyle = "maker" | "taker";

/** Chain-neutral top-of-book + volume readout for one pair, as of decisionTime. */
export interface MarketReadout {
  base: string; // AssetRef, e.g. "XLM" | "CODE:ISSUER" | "hyperliquid:BTC-PERP"
  quote: string; // AssetRef
  lastClose: number;
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  baseVolume24h: number | null;
}

/**
 * What the account already holds in this pair. Arms size entries/exits
 * against this snapshot — they never read a shared mutable position object,
 * which is what keeps them side-effect-free.
 */
export interface HeldInventory {
  /** Signed net base units already open in this pair (+long, -short). 0 = flat. */
  netBaseQty: number;
  /** Weighted-average entry price of the open lots; null when flat. */
  avgEntryPrice: number | null;
  /** Free quote-asset balance available to size a NEW entry. */
  availableQuoteBalance: number;
  /** Free base-asset balance available to size an exit/sell. */
  availableBaseBalance: number;
}

/**
 * Perp funding readout for one asset on a funding-charging venue (Hyperliquid
 * is the first target for fundingCarry.ts; see src/chains/hyperliquid).
 * Sign convention: POSITIVE `rate` means longs pay shorts (a SHORT earns the
 * payment); NEGATIVE means shorts pay longs (a LONG earns it). This field
 * being absent (`ctx.funding === undefined`) means "no perp venue/funding
 * data available for this asset" — an arm that needs it must stand aside, it
 * must never assume a rate of zero.
 */
export interface FundingSnapshot {
  /** Rate for ONE funding interval, as a fraction (0.0001 = 1bp per interval). */
  rate: number;
  /** Funding interval length in hours (Hyperliquid = 1h). */
  intervalHours: number;
  /** Trailing mean rate over a recent window (same sign convention as `rate`),
   *  used to judge persistence / a normalize-or-flip exit. Absent when there
   *  isn't enough history yet. */
  trailingMeanRate?: number;
  /** ISO timestamp this reading is as-of. Must be <= ctx.decisionTime. */
  asOf: string;
}

/**
 * Hard risk limits an arm must size within. Arms take these only through
 * `ctx.limits` — never by importing src/config.ts or src/policy/riskProfile.ts
 * themselves — so an arm stays usable unchanged inside the backtest engine
 * (which has no live config) and swappable without a config-shape coupling.
 */
export interface StrategyRiskLimits {
  /** Max notional (quote units) any single intent may size to. */
  maxNotionalQuote: number;
  /** Max accepted slippage, in bps, for a taker-style intent. */
  maxSlippageBps: number;
  /** Minimum reward/risk ratio a directional intent's bracket must clear. */
  minRiskReward: number;
}

/**
 * Everything an arm is allowed to see. Deliberately narrow: no store, no
 * config, no ChainAdapter, no clock. Everything time-sensitive an arm needs
 * has already been resolved AS OF `decisionTime` by the caller (the backtest
 * engine or a later live-wiring step) — the arm itself never reaches out.
 */
export interface StrategyContext {
  chain: ChainId;
  market: MarketReadout;
  indicators: IndicatorSet;
  inventory: HeldInventory;
  /** Present only when a funding-charging venue exists for this asset. */
  funding?: FundingSnapshot;
  /** Catalyst events already filtered to <= decisionTime by the caller. An
   *  arm MUST still re-check `publishedAt` itself — belt and suspenders. */
  catalysts: CatalystEvent[];
  limits: StrategyRiskLimits;
  /** The instant this decision is being made (ISO). The ONLY clock an arm may
   *  use; never `Date.now()` or `new Date()` without an argument. */
  decisionTime: string;
}

/**
 * A chain-neutral trade proposal from one arm. A later orchestrator wiring
 * step turns this into a TradeProposal for checkPolicy + execution — an arm
 * itself never does that.
 */
export interface StrategyIntent {
  /** Id of the arm that produced this (StrategyArm.id). */
  armId: string;
  side: TradeSide;
  base: string; // AssetRef
  quote: string; // AssetRef
  /** Size in base units. */
  size: number;
  /** Limit price, quote units per 1 base unit. */
  limitPrice: number;
  orderStyle: OrderStyle;
  /** 0..100 conviction. Drives sizing scale and the auto-execute confidence gate. */
  confidence: number;
  /** Price the intent is targeting (quote per base). */
  targetPrice: number;
  /** Price that invalidates the thesis (quote per base) — the stop level. */
  invalidationPrice: number;
  /**
   * TRUE when this intent CLOSES/reduces an existing position rather than
   * opening new risk (e.g. funding-carry buying back a short it holds).
   *
   * Why it must exist: without it, "buy to close a short" and "open a new
   * long" are indistinguishable — synthesis.ts would fuse an exit into a
   * fresh directional open, and a downstream executor would ADD risk when the
   * signal meant "flatten". Any arm that emits a close MUST set this, and any
   * consumer (fusion, executor) MUST honor it. Absent/false = opens risk.
   * (Review 2026-08-04, strategy-arms P1.)
   *
   * TODO(wiring): the live executor must translate this to the venue's
   * reduce-only flag (Hyperliquid `r: true`) once the orchestrator routes
   * StrategyIntents — until then no executor consumes intents at all.
   */
  reduceOnly?: boolean;
  /** Plain-language explanation, for logs/audit (mirrors StrategySignal.reason). */
  rationale: string;
}

/**
 * A pluggable, independently-measurable strategy. Pure w.r.t. I/O: it reads
 * `ctx` and returns intents (an empty array = stand aside). No signing,
 * submitting, or store writes — see the file header for the full contract.
 */
export interface StrategyArm {
  id: string;
  label: string;
  description: string;
  kind: StrategyArmKind;
  /** Chains this arm can operate on. "stellar" today; funding-carry declares
   *  "hyperliquid" once that venue lands (src/chains/hyperliquid). */
  supportedChains: ChainId[];
  propose(ctx: StrategyContext): Promise<StrategyIntent[]>;
}
