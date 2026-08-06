/**
 * The baseline directional arm.
 *
 * This is a thin StrategyArm WRAPPER around the EXISTING deterministic
 * rulebook (src/backtest/strategy.ts `decide` + DEFAULT_PARAMS over
 * src/stellar/indicators.ts `IndicatorSet`). It does not change that rulebook
 * in any way — the point of this file is purely to make the strategy the
 * system already runs measurable as one selectable arm among several, so
 * Phase 4's eval can ask "does the current playbook actually beat holding /
 * beat the other arms?" using the SAME decision function already backtested
 * in src/backtest/*.
 *
 * Sizing (turning a StrategySignal into a sized StrategyIntent) is new here —
 * `decide()` only picks a direction + ATR bracket, it never sizes. The rule:
 * notional = min(ctx.limits.maxNotionalQuote, available capacity) scaled by
 * the signal's own confidence fraction (medium=60%, high=80%) — conviction
 * sizes the trade, the limits only cap it. Zero available capacity or a
 * near-zero notional means stand aside, same as any other gate here.
 */
import { decide, DEFAULT_PARAMS, type StrategyParams } from "../backtest/strategy";
import type { StrategyArm, StrategyContext, StrategyIntent } from "./types";

export const DIRECTIONAL_ARM_ID = "directional-baseline";

/** Build the directional arm with optional overridden rulebook params (tests /
 *  walk-forward search can pass a variant; defaults match the live rulebook). */
export function makeDirectionalArm(params: StrategyParams = DEFAULT_PARAMS): StrategyArm {
  return {
    id: DIRECTIONAL_ARM_ID,
    label: "Directional (rulebook baseline)",
    description:
      "Trend-following / range mean-reversion over server-computed indicators - " +
      "the same deterministic playbook the AI prompt is instructed to follow, " +
      "backtested in src/backtest/*. The measurement floor every other arm must beat.",
    kind: "directional",
    supportedChains: ["stellar"],
    async propose(ctx: StrategyContext): Promise<StrategyIntent[]> {
      const signal = decide(ctx.indicators, ctx.market.lastClose, params);
      if (!signal) return [];

      // Reward/risk is realized-by-construction in decide()'s bracket, but a
      // caller may run this arm under a stricter `ctx.limits.minRiskReward`
      // than the rulebook's own default - respect it as a hard gate here too.
      if (signal.rewardRisk < ctx.limits.minRiskReward) return [];

      const confidence = signal.confidence === "high" ? 80 : signal.confidence === "medium" ? 60 : 40;

      // Size scales WITH conviction: the cap is the ceiling, not the target -
      // a "medium" read sizes smaller than a "high" one, leaving headroom the
      // synthesis arm can legitimately scale up on cross-arm agreement.
      const availableCapacity =
        signal.side === "buy"
          ? ctx.inventory.availableQuoteBalance
          : ctx.inventory.availableBaseBalance * signal.entry;
      const cappedNotional = Math.min(ctx.limits.maxNotionalQuote, availableCapacity);
      const notional = cappedNotional * (confidence / 100);
      if (!(notional > 0)) return []; // no capacity to act on the signal - stand aside

      const size = notional / signal.entry;
      if (!(size > 0)) return [];

      return [
        {
          armId: DIRECTIONAL_ARM_ID,
          side: signal.side,
          base: ctx.market.base,
          quote: ctx.market.quote,
          size,
          limitPrice: signal.entry,
          orderStyle: "taker",
          confidence,
          targetPrice: signal.target,
          invalidationPrice: signal.invalidation,
          rationale: signal.reason,
        },
      ];
    },
  };
}

/** The default instance, registered in registry.ts. */
export const directionalArm: StrategyArm = makeDirectionalArm();
