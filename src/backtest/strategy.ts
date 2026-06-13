import type { IndicatorSet, Regime } from "../stellar/indicators";
import type { TradeConfidence, TradeSide } from "../types";

/**
 * Deterministic baseline strategy.
 *
 * This is a pure-TypeScript encoding of the SAME playbook the live AI analyst
 * is instructed to follow in its system prompt (see src/claude/agent.ts:133 and
 * :220), expressed as explicit rules over the SAME server-computed indicators
 * (src/stellar/indicators.ts). The point is measurement, not cleverness:
 *
 *  - It is FREE and INSTANT, so a multi-month backtest is feasible.
 *  - It is REPRODUCIBLE: same candles in -> same trades out, every run. An LLM
 *    is not, which makes its backtests neither comparable nor cheap.
 *  - It is a STRICT BASELINE. If this rule set has no edge on real history, an
 *    LLM reading the same precomputed numbers and the same rules almost
 *    certainly won't manufacture one either. If it DOES have an edge, that edge
 *    is the thing the LLM overlay should be measured against - not "did the bot
 *    trade", but "did it beat this".
 *
 * The playbook (identical to the prompt):
 *  - trending-up   -> trade WITH the trend: buy a PULLBACK (RSI cooled), never fade.
 *  - trending-down -> trade WITH the trend: sell a BOUNCE (RSI heated), never fade.
 *  - ranging       -> mean-reversion at the range EDGES only (rangePos near 0/1).
 *  - volatile / null -> stand aside (spreads + slippage eat the edge).
 *
 * Brackets are ATR-based and constructed to clear MIN_RISK_REWARD by design, so
 * the policy engine's reward/risk gate never rejects a signal from here.
 */

/**
 * Tunable thresholds. THESE ARE THE OVERFITTING SURFACE. Every knob you turn
 * while staring at the same backtest is a degree of freedom you are spending to
 * fit noise (the literature puts ~82% of backtest-optimized strategies failing
 * live, almost always from exactly this). Treat the defaults as a hypothesis:
 * change them only with an out-of-sample / walk-forward reason, never to chase
 * a prettier equity curve on the data you already looked at.
 */
export interface StrategyParams {
  /** trending-up: buy only when RSI has cooled to a pullback at/below this. */
  trendPullbackRsi: number;
  /** trending-down: sell only when RSI has heated to a bounce at/above this. */
  trendBounceRsi: number;
  /** ranging: buy only when the close sits in the bottom of the range (<=). */
  rangeLowPos: number;
  /** ranging: sell only when the close sits at the top of the range (>=). */
  rangeHighPos: number;
  /** ranging buy also needs RSI at/below this (oversold confirmation). */
  rangeBuyRsi: number;
  /** ranging sell also needs RSI at/above this (overbought confirmation). */
  rangeSellRsi: number;
  /** Stop distance from entry, as a multiple of ATR (the invalidation level). */
  atrStopMult: number;
  /** Target distance as a multiple of the risk (reward/risk ratio by design). */
  rewardRiskMult: number;
}

export const DEFAULT_PARAMS: StrategyParams = {
  trendPullbackRsi: 45,
  trendBounceRsi: 55,
  rangeLowPos: 0.25,
  rangeHighPos: 0.75,
  rangeBuyRsi: 40,
  rangeSellRsi: 60,
  atrStopMult: 1,
  rewardRiskMult: 1.5,
};

export interface StrategySignal {
  side: TradeSide;
  /** Reference entry price (the signal bar's close; quote per base). */
  entry: number;
  /** Profit target (quote per base). */
  target: number;
  /** Invalidation / stop level (quote per base). */
  invalidation: number;
  /** Realized-by-construction reward/risk ratio (== rewardRiskMult). */
  rewardRisk: number;
  regime: Regime;
  confidence: TradeConfidence;
  reason: string;
}

/**
 * Decide whether to OPEN a position given the indicator set computed over the
 * trailing window and the last close. Returns null to stand aside.
 *
 * No look-ahead: every input here is knowable at the close of the signal bar.
 */
export function decide(
  ind: IndicatorSet,
  lastClose: number,
  params: StrategyParams = DEFAULT_PARAMS,
): StrategySignal | null {
  if (!(lastClose > 0)) return null;
  const { regime, rsi14, atrPct, rangePos, ema8, ema24, efficiencyRatio } = ind;
  // Need a regime tag, an RSI read and a volatility read to size the bracket.
  if (regime == null || rsi14 == null || atrPct == null) return null;
  // "volatile" -> stand aside, exactly as the prompt instructs.
  if (regime === "volatile") return null;

  const atr = (atrPct / 100) * lastClose;
  if (!(atr > 0)) return null;

  let side: TradeSide | null = null;
  let reason = "";
  let confidence: TradeConfidence = "medium";

  if (regime === "trending-up") {
    // Buy a pullback IN the uptrend; never fade it.
    if (rsi14 <= params.trendPullbackRsi) {
      side = "buy";
      reason = `Uptrend pullback: regime trending-up, RSI ${rsi14} <= ${params.trendPullbackRsi}.`;
      // Strong, efficient trend with EMA structure intact = higher conviction.
      confidence =
        (efficiencyRatio ?? 0) >= 0.6 && ema8 != null && ema24 != null && ema8 >= ema24
          ? "high"
          : "medium";
    }
  } else if (regime === "trending-down") {
    // Sell a bounce IN the downtrend; never fade it.
    if (rsi14 >= params.trendBounceRsi) {
      side = "sell";
      reason = `Downtrend bounce: regime trending-down, RSI ${rsi14} >= ${params.trendBounceRsi}.`;
      confidence =
        (efficiencyRatio ?? 0) >= 0.6 && ema8 != null && ema24 != null && ema8 <= ema24
          ? "high"
          : "medium";
    }
  } else if (regime === "ranging" && rangePos != null) {
    // Mean-reversion at the edges only.
    if (rangePos <= params.rangeLowPos && rsi14 <= params.rangeBuyRsi) {
      side = "buy";
      reason = `Range low: rangePos ${rangePos} <= ${params.rangeLowPos}, RSI ${rsi14} <= ${params.rangeBuyRsi}.`;
      confidence = rangePos <= 0.1 ? "high" : "medium";
    } else if (rangePos >= params.rangeHighPos && rsi14 >= params.rangeSellRsi) {
      side = "sell";
      reason = `Range high: rangePos ${rangePos} >= ${params.rangeHighPos}, RSI ${rsi14} >= ${params.rangeSellRsi}.`;
      confidence = rangePos >= 0.9 ? "high" : "medium";
    }
  }

  if (!side) return null;

  const risk = params.atrStopMult * atr;
  const invalidation = side === "buy" ? lastClose - risk : lastClose + risk;
  const target =
    side === "buy"
      ? lastClose + params.rewardRiskMult * risk
      : lastClose - params.rewardRiskMult * risk;

  // A bracket that puts the stop at/through zero is nonsense on a price series.
  if (!(invalidation > 0) || !(target > 0)) return null;

  return {
    side,
    entry: lastClose,
    target,
    invalidation,
    rewardRisk: params.rewardRiskMult,
    regime,
    confidence,
    reason,
  };
}
