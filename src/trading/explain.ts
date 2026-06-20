import { DEFAULT_PARAMS, decide, type StrategyParams } from "../backtest/strategy";
import type { IndicatorSet } from "../stellar/indicators";
import type { TradeSide } from "../types";

/**
 * Deterministic "why no trade" explainer.
 *
 * When the AI analyst proposes nothing it often returns no prose ("(no
 * commentary)"), which leaves the operator guessing whether the bot is broken
 * or correctly standing aside. This module turns that silence into a concrete
 * reason, derived from the SAME server-computed indicators the analyst sees and
 * the SAME thresholds the baseline strategy uses (src/backtest/strategy.ts).
 *
 * It is the PLAYBOOK's read, not a transcript of the LLM's exact reasoning (the
 * analyst has discretion) - but it's the deterministic skeleton the analyst is
 * told to follow, so it names the overwhelmingly likely cause: e.g. "uptrend
 * but RSI too hot - waiting for a pullback, not chasing".
 */

export interface NoEntryInput {
  label: string;
  regime: string | null;
  rsi14: number | null;
  rangePos: number | null;
  spreadBps: number | null;
  baseVolume24h: number | null;
}

export interface GateLimits {
  maxEntrySpreadBps: number;
  minVolume24h: number;
}

function num(x: number | null): string {
  if (x == null) return "n/a";
  return `${Number(x.toFixed(Math.abs(x) >= 100 ? 0 : 2))}`;
}

/** Plain-English reason the playbook would NOT open a position on a market. */
export function explainNoEntry(
  m: NoEntryInput,
  gates: GateLimits,
  params: StrategyParams = DEFAULT_PARAMS,
): string {
  const { label, regime, rsi14, rangePos } = m;

  // Liquidity gates first - these block regardless of any signal.
  if (
    m.spreadBps != null &&
    gates.maxEntrySpreadBps > 0 &&
    m.spreadBps > gates.maxEntrySpreadBps
  ) {
    return `${label}: spread ${num(m.spreadBps)}bps exceeds the ${gates.maxEntrySpreadBps}bps entry cap - the book is too wide; crossing it would eat the edge.`;
  }
  if (
    m.baseVolume24h != null &&
    gates.minVolume24h > 0 &&
    m.baseVolume24h < gates.minVolume24h
  ) {
    return `${label}: 24h volume ${num(m.baseVolume24h)} is under the ${gates.minVolume24h} floor - too thin to trade.`;
  }

  if (regime == null) {
    return `${label}: too little history to classify a regime yet - standing aside.`;
  }

  const head = `${label}: regime ${regime}, RSI ${num(rsi14)}`;

  if (regime === "volatile") {
    return `${head} - VOLATILE (recent range expanded sharply); the playbook stands aside here, because wide spreads and slippage eat the thin edge.`;
  }
  if (regime === "trending-up") {
    return rsi14 != null && rsi14 > params.trendPullbackRsi
      ? `${head} - uptrend, but RSI is above the ${params.trendPullbackRsi} pullback line, so there's no dip to buy: it waits for a pullback rather than chasing the run-up.`
      : `${head} - uptrend WITH a pullback (RSI <= ${params.trendPullbackRsi}); a buy setup is present, so a skip here is analyst discretion or a downstream gate (confidence / reward-risk).`;
  }
  if (regime === "trending-down") {
    return rsi14 != null && rsi14 < params.trendBounceRsi
      ? `${head} - downtrend, but RSI is below the ${params.trendBounceRsi} bounce line, so there's no rally to sell: it waits for a bounce rather than chasing the drop.`
      : `${head} - downtrend WITH a bounce (RSI >= ${params.trendBounceRsi}); a sell setup is present, so a skip here is analyst discretion or a downstream gate.`;
  }
  if (regime === "ranging") {
    if (rangePos == null) {
      return `${head} - ranging, but range position is unknown; standing aside.`;
    }
    if (rangePos > params.rangeLowPos && rangePos < params.rangeHighPos) {
      return `${head}, rangePos ${num(rangePos)} - mid-channel; it waits for price to reach an edge (<= ${params.rangeLowPos} or >= ${params.rangeHighPos}) before a mean-reversion entry.`;
    }
    if (rangePos <= params.rangeLowPos && rsi14 != null && rsi14 > params.rangeBuyRsi) {
      return `${head}, rangePos ${num(rangePos)} - at the range low but RSI isn't oversold (needs <= ${params.rangeBuyRsi}); waiting for confirmation.`;
    }
    if (rangePos >= params.rangeHighPos && rsi14 != null && rsi14 < params.rangeSellRsi) {
      return `${head}, rangePos ${num(rangePos)} - at the range high but RSI isn't overbought (needs >= ${params.rangeSellRsi}); waiting for confirmation.`;
    }
    return `${head}, rangePos ${num(rangePos)} - at an edge with RSI confirming; a setup is present, so a skip is discretion or a downstream gate.`;
  }
  return `${head} - no playbook setup right now.`;
}

/** Compact facts-only form for a one-line scan summary across many markets. */
export function briefNoEntry(m: NoEntryInput): string {
  const rsi = m.rsi14 == null ? "n/a" : `${Math.round(m.rsi14)}`;
  return `${m.label} (${m.regime ?? "n/a"}, RSI ${rsi})`;
}

export interface BaselineCall {
  /** The rulebook's side, or null to stand aside. */
  side: TradeSide | null;
  reason: string;
}

/**
 * What the DETERMINISTIC rulebook (backtest strategy.decide) would do on a
 * market - the same playbook the AI is told to follow, run mechanically over
 * the same server-computed indicators. Used to surface where the AI's judgment
 * DIVERGES from the rules (e.g. a range-high sell the rules would take but the
 * AI passed on). It is a read-only check; it never changes what the bot does.
 */
export function baselineCall(
  stats: IndicatorSet,
  lastClose: number,
  params: StrategyParams = DEFAULT_PARAMS,
): BaselineCall {
  const sig = decide(stats, lastClose, params);
  return sig
    ? { side: sig.side, reason: sig.reason }
    : { side: null, reason: "no rulebook setup (stand aside)" };
}

export interface DivergenceCheck {
  /** True when the rulebook and the AI disagree - the interesting case. */
  diverged: boolean;
  /**
   * True when the rulebook would trade but the WALLET can't fund that side, so
   * the AI's pass is correct-by-constraint, not a real missed opportunity.
   * These are noise in the divergence count and should be reported separately.
   */
  phantom: boolean;
  note: string;
}

/**
 * Can the wallet fund the rulebook's side of this pair? Buying BASE spends QUOTE
 * (need QUOTE); selling BASE gives up BASE (need BASE). `held(spec)` reports
 * whether the wallet holds a usable (>0) amount of an asset.
 */
export function isFundable(
  side: TradeSide,
  base: string,
  quote: string,
  held: (assetSpec: string) => boolean,
): boolean {
  return side === "buy" ? held(quote) : held(base);
}

/**
 * Compare the rulebook's call to what the AI actually did on a market. Returns
 * null when both stand aside (a non-event). The headline divergence is
 * "rulebook would trade, AI passed" - a signal the AI skipped. When `fundable`
 * is false, that skip is tagged PHANTOM (the wallet couldn't have taken it
 * anyway), so it can be filtered out of the real misses. `fundable` undefined =
 * unknown (treated as a real divergence, so a possible miss is never hidden).
 */
export function divergenceNote(
  label: string,
  baseline: BaselineCall,
  aiSide: TradeSide | null,
  fundable?: boolean,
): DivergenceCheck | null {
  const rule = baseline.side ? baseline.side.toUpperCase() : "stand aside";
  const ai = aiSide ? aiSide.toUpperCase() : "passed";
  if (baseline.side === null && aiSide === null) return null;
  if (baseline.side === aiSide) {
    return {
      diverged: false,
      phantom: false,
      note: `${label}: rulebook ${rule}, AI ${ai} - agree.`,
    };
  }
  if (baseline.side !== null && aiSide === null) {
    const phantom = fundable === false;
    const tail = phantom
      ? `PHANTOM - rulebook ${rule} but the wallet can't fund it; passing was correct-by-constraint, not a real miss.`
      : `DIVERGENCE - AI skipped a signal the rules would take (${baseline.reason}).`;
    return { diverged: true, phantom, note: `${label}: rulebook ${rule}, AI passed -> ${tail}` };
  }
  if (baseline.side === null && aiSide !== null) {
    return {
      diverged: true,
      phantom: false,
      note: `${label}: rulebook stand aside, AI ${ai} -> DIVERGENCE - AI took a trade the rules wouldn't.`,
    };
  }
  return {
    diverged: true,
    phantom: false,
    note: `${label}: rulebook ${rule}, AI ${ai} -> DIVERGENCE - opposite sides.`,
  };
}
