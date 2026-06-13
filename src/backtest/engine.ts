import { computeIndicators } from "../stellar/indicators";
import type { Candle } from "../stellar/market";
import type { TradeConfidence, TradeSide } from "../types";
import {
  decide,
  DEFAULT_PARAMS,
  type StrategyParams,
  type StrategySignal,
} from "./strategy";

/**
 * Event-driven backtest engine.
 *
 * Walks a candle series bar by bar with NO look-ahead: at each bar i the
 * strategy sees only computeIndicators() over the trailing `window` candles
 * ending at i, and may open a position at the close of bar i. Exits are then
 * scanned strictly FROM bar i+1 onward (the signal bar's own high/low never
 * decides its own exit), against the bracket target/invalidation, with a
 * max-hold timeout.
 *
 * One position at a time per pair: when a trade opens, the walk resumes only
 * after it closes. That keeps the equity curve a clean sequence of independent
 * R-multiple outcomes - the honest unit for judging an edge - instead of an
 * overlapping book whose result depends on a sizing scheme we'd have to invent.
 *
 * Costs are modeled as a per-fill haircut in bps (entry AND exit each pay it),
 * standing in for spread + slippage + fee on a market that crosses. We have no
 * historical orderbook, so this is the honest knob: set it to roughly the
 * round-trip cost you'd actually pay on these books and watch the edge survive
 * it or not. Ignoring costs is the single most common way a backtest lies.
 */

export type ExitReason = "target" | "stop" | "timeout" | "end-of-data";

export interface BacktestTrade {
  pair: string;
  side: TradeSide;
  regime: string;
  confidence: TradeConfidence;
  reason: string;
  entryTime: string;
  /** Cost-adjusted price actually paid/received on entry (quote per base). */
  entryPrice: number;
  exitTime: string;
  /** Cost-adjusted price on exit (quote per base). */
  exitPrice: number;
  target: number;
  invalidation: number;
  /** Gross risk per unit (|entry - invalidation| at reference prices). */
  riskPerUnit: number;
  /** Net realized outcome in R units (cost-adjusted PnL / gross risk). */
  rMultiple: number;
  /** Net realized PnL as % of the entry reference price. */
  pnlPct: number;
  barsHeld: number;
  exitReason: ExitReason;
}

export interface GateCounts {
  /** Signals dropped because the trailing window's base volume was too thin. */
  volume: number;
}

export interface BacktestConfig {
  /** Trailing candle count for indicators (24 = the live bot's 1h window). */
  window: number;
  /** Max bars to hold before a forced timeout exit at that bar's close. */
  maxHoldBars: number;
  /** Per-fill cost in bps (entry and exit each pay it). */
  costBps: number;
  /** Apply the live MIN_VOLUME_24H-style liquidity gate over the window. */
  applyVolumeGate: boolean;
  /** Volume floor (base units summed over the window) when the gate is on. */
  minWindowVolume: number;
  /**
   * When a single bar's range straddles BOTH target and stop, assume the stop
   * filled first (true) - the conservative read, since we can't see intrabar
   * order. false assumes the target filled first (optimistic).
   */
  pessimisticIntrabar: boolean;
  params: StrategyParams;
}

export const DEFAULT_BACKTEST_CONFIG: BacktestConfig = {
  window: 24,
  maxHoldBars: 48,
  costBps: 10,
  applyVolumeGate: true,
  minWindowVolume: 500,
  pessimisticIntrabar: true,
  params: DEFAULT_PARAMS,
};

export interface BacktestResult {
  pair: string;
  base: string;
  quote: string;
  candles: number;
  firstTime: string | null;
  lastTime: string | null;
  /** Signals the strategy produced before the liquidity gate. */
  signals: number;
  skippedByGate: GateCounts;
  trades: BacktestTrade[];
  /** Buy-and-hold % over the same (post-warmup) window, for context. */
  buyHoldPct: number | null;
}

/** Apply a per-fill cost haircut: a buyer pays up, a seller receives less. */
function fillPrice(reference: number, side: TradeSide, costBps: number): number {
  const k = costBps / 10_000;
  return side === "buy" ? reference * (1 + k) : reference * (1 - k);
}

/** Simulate the forward life of one open position; returns its exit. */
function resolveExit(
  candles: Candle[],
  entryIdx: number,
  signal: StrategySignal,
  cfg: BacktestConfig,
): { idx: number; price: number; reason: ExitReason } {
  const { side, target, invalidation } = signal;
  const lastIdx = Math.min(entryIdx + cfg.maxHoldBars, candles.length - 1);
  for (let j = entryIdx + 1; j <= lastIdx; j++) {
    const bar = candles[j]!;
    const hitStop =
      side === "buy" ? bar.low <= invalidation : bar.high >= invalidation;
    const hitTarget =
      side === "buy" ? bar.high >= target : bar.low <= target;
    if (hitStop && hitTarget) {
      return cfg.pessimisticIntrabar
        ? { idx: j, price: invalidation, reason: "stop" }
        : { idx: j, price: target, reason: "target" };
    }
    if (hitStop) return { idx: j, price: invalidation, reason: "stop" };
    if (hitTarget) return { idx: j, price: target, reason: "target" };
  }
  // Never hit a bracket: close at the last bar we reached.
  const reason: ExitReason =
    lastIdx === candles.length - 1 && lastIdx < entryIdx + cfg.maxHoldBars
      ? "end-of-data"
      : "timeout";
  return { idx: lastIdx, price: candles[lastIdx]!.close, reason };
}

/** Run the deterministic strategy over one pair's candle series. */
export function runBacktest(
  base: string,
  quote: string,
  candles: Candle[],
  cfg: BacktestConfig = DEFAULT_BACKTEST_CONFIG,
): BacktestResult {
  const pair = `${base}/${quote}`;
  const trades: BacktestTrade[] = [];
  const skippedByGate: GateCounts = { volume: 0 };
  let signals = 0;

  const n = candles.length;
  // Need a full window of history before the first decision, and at least one
  // bar after it to enter/exit against.
  let i = cfg.window - 1;
  while (i <= n - 2) {
    const windowCandles = candles.slice(i - cfg.window + 1, i + 1);
    const ind = computeIndicators(windowCandles);
    const close = candles[i]!.close;
    const signal = decide(ind, close, cfg.params);
    if (!signal) {
      i++;
      continue;
    }
    signals++;

    if (cfg.applyVolumeGate) {
      const windowVolume = windowCandles.reduce((s, c) => s + c.baseVolume, 0);
      if (windowVolume < cfg.minWindowVolume) {
        skippedByGate.volume++;
        i++;
        continue;
      }
    }

    const entryPrice = fillPrice(signal.entry, signal.side, cfg.costBps);
    const exit = resolveExit(candles, i, signal, cfg);
    const exitSide: TradeSide = signal.side === "buy" ? "sell" : "buy";
    const exitPrice = fillPrice(exit.price, exitSide, cfg.costBps);

    const pnlPerUnit =
      signal.side === "buy" ? exitPrice - entryPrice : entryPrice - exitPrice;
    const riskPerUnit = Math.abs(signal.entry - signal.invalidation);
    const rMultiple = riskPerUnit > 0 ? pnlPerUnit / riskPerUnit : 0;
    const pnlPct = (pnlPerUnit / signal.entry) * 100;

    trades.push({
      pair,
      side: signal.side,
      regime: signal.regime,
      confidence: signal.confidence,
      reason: signal.reason,
      entryTime: candles[i]!.time,
      entryPrice,
      exitTime: candles[exit.idx]!.time,
      exitPrice,
      target: signal.target,
      invalidation: signal.invalidation,
      riskPerUnit,
      rMultiple,
      pnlPct,
      barsHeld: exit.idx - i,
      exitReason: exit.reason,
    });

    // Resume after the exit bar - no overlapping positions.
    i = exit.idx + 1;
  }

  const warmFirst = candles[cfg.window - 1];
  const last = candles[n - 1];
  const buyHoldPct =
    warmFirst && last && warmFirst.close > 0
      ? ((last.close - warmFirst.close) / warmFirst.close) * 100
      : null;

  return {
    pair,
    base,
    quote,
    candles: n,
    firstTime: candles[0]?.time ?? null,
    lastTime: last?.time ?? null,
    signals,
    skippedByGate,
    trades,
    buyHoldPct,
  };
}
