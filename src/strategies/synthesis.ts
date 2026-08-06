/**
 * The synthesis arm - "AI as risk manager, not scalper".
 *
 * Every other arm answers a narrow question in isolation (directional: does
 * the rulebook see a trend/range edge?; funding-carry: is there a payment to
 * harvest?; news-reaction: is there a high-confidence catalyst?). This arm
 * does not invent a fourth opinion - it FUSES the others' answers plus the
 * shared regime/funding/catalyst context into exactly one risk-framed
 * decision:
 *
 *  - AGREEMENT (>=2 arms propose the same side) scales conviction UP.
 *  - CONFLICT (arms propose opposite sides) is an explicit VETO - stand aside.
 *    Reconciling a conflict by picking a "winner" would just be a fifth,
 *    unmeasurable opinion; standing aside is the only choice that keeps this
 *    arm's own behavior attributable to the others' agreement, not to a
 *    hidden tiebreak rule.
 *  - A VOLATILE regime is a second, unconditional VETO (mirrors decide()'s own
 *    "volatile -> stand aside" rule) - spreads/slippage eat any edge here
 *    regardless of what the sub-arms think.
 *  - Sizing scales by (a) how many arms agree and their average conviction,
 *    and (b) whether the regime supports the direction (trending WITH the
 *    proposed side amplifies it; ranging dampens a directional push, since a
 *    range regime is exactly what the directional arm itself already treats
 *    as mean-reversion-only, not breakout territory).
 *
 * This is fully DETERMINISTIC and pure - it only calls the other arms'
 * `propose()` (themselves pure) and combines the results; it never signs,
 * submits, or writes anything.
 */
import { directionalArm } from "./directional";
import { fundingCarryArm } from "./fundingCarry";
import { newsReactionArm } from "./newsReaction";
import type { StrategyArm, StrategyContext, StrategyIntent } from "./types";
import type { TradeSide } from "../types";

export const SYNTHESIS_ARM_ID = "synthesis";

const SUB_ARMS: StrategyArm[] = [directionalArm, fundingCarryArm, newsReactionArm];

export interface SynthesisParams {
  /** Size multiplier when only one sub-arm fires. */
  soloSizeMultiplier: number;
  /** Size multiplier when >=2 sub-arms agree on the same side. */
  agreementSizeMultiplier: number;
  /** Extra multiplier when the regime trends WITH the agreed side. */
  regimeAlignedMultiplier: number;
  /** Dampening multiplier when the regime is "ranging" (mean-reversion
   *  territory - a directional push isn't the range arm's own trade). */
  rangingDampener: number;
}

export const DEFAULT_SYNTHESIS_PARAMS: SynthesisParams = {
  soloSizeMultiplier: 1,
  agreementSizeMultiplier: 1.5,
  regimeAlignedMultiplier: 1.2,
  rangingDampener: 0.7,
};

interface FiredIntent {
  arm: StrategyArm;
  intent: StrategyIntent;
}

// TODO(review 2026-08-04, strategy-arms P1 — before wiring synthesis live):
// StrategyIntent has no reduceOnly/isExit flag, so a sub-arm's CLOSE intent
// (e.g. funding-carry "buy to close a short") is fused below as a fresh
// directional OPEN and can open a brand-new position in the closing direction.
// Add reduceOnly to StrategyIntent and exclude/pass-through exit intents here
// rather than fusing them into a directional consensus.
/** Only call a sub-arm when the chain is one it declares support for - the
 *  same filter a live router would apply, and what keeps funding-carry's
 *  "wrong chain" throw from ever firing here. */
async function collectFired(ctx: StrategyContext): Promise<FiredIntent[]> {
  const fired: FiredIntent[] = [];
  for (const arm of SUB_ARMS) {
    if (!arm.supportedChains.includes(ctx.chain)) continue;
    const intents = await arm.propose(ctx);
    const first = intents[0];
    if (first) fired.push({ arm, intent: first });
  }
  return fired;
}

export function makeSynthesisArm(params: SynthesisParams = DEFAULT_SYNTHESIS_PARAMS): StrategyArm {
  return {
    id: SYNTHESIS_ARM_ID,
    label: "Synthesis (risk-managed fusion)",
    description:
      "Fuses the directional, funding-carry and news-reaction arms into one risk-framed " +
      "decision: agreement scales conviction up, conflicting signals or a volatile regime " +
      "veto the trade outright. Deterministic - no independent opinion of its own.",
    kind: "synthesis",
    supportedChains: ["stellar", "hyperliquid"],
    async propose(ctx: StrategyContext): Promise<StrategyIntent[]> {
      // Unconditional veto #1: a volatile regime overrides every sub-arm,
      // exactly as the directional rulebook already treats it.
      if (ctx.indicators.regime === "volatile") return [];

      const fired = await collectFired(ctx);
      if (fired.length === 0) return [];

      const sides = new Set<TradeSide>(fired.map((f) => f.intent.side));
      // Unconditional veto #2: the sub-arms disagree on direction. Standing
      // aside (rather than picking a "winner") is the whole point - this
      // arm's decisions must be explainable purely by AGREEMENT, never by a
      // hidden tiebreak rule that would itself need separate measurement.
      if (sides.size > 1) return [];

      const side = fired[0]!.intent.side;
      const regime = ctx.indicators.regime;
      const regimeAligned =
        (regime === "trending-up" && side === "buy") || (regime === "trending-down" && side === "sell");
      const isRanging = regime === "ranging";

      const avgConfidence = fired.reduce((s, f) => s + f.intent.confidence, 0) / fired.length;
      const agreementCount = fired.length;

      let sizeMultiplier = agreementCount >= 2 ? params.agreementSizeMultiplier : params.soloSizeMultiplier;
      if (regimeAligned) sizeMultiplier *= params.regimeAlignedMultiplier;
      if (isRanging) sizeMultiplier *= params.rangingDampener;

      // The bracket (target/invalidation/entry) is taken from the
      // highest-confidence firing arm - fusing brackets numerically across
      // arms with different theses (a payment vs. a price target) would
      // produce a number that reflects neither.
      const lead = fired.reduce((best, f) => (f.intent.confidence > best.intent.confidence ? f : best), fired[0]!);
      const entry = lead.intent.limitPrice;
      if (!(entry > 0)) return [];

      const availableCapacity =
        side === "buy" ? ctx.inventory.availableQuoteBalance : ctx.inventory.availableBaseBalance * entry;
      const desiredNotional = lead.intent.size * entry * sizeMultiplier;
      const notional = Math.min(ctx.limits.maxNotionalQuote, availableCapacity, desiredNotional);
      if (!(notional > 0)) return [];
      const size = notional / entry;
      if (!(size > 0)) return [];

      const confidenceBoost = agreementCount >= 2 ? 1.15 : 1;
      const confidence = Math.max(0, Math.min(100, Math.round(avgConfidence * confidenceBoost)));

      const agreeingArms = fired.map((f) => f.arm.id).join(", ");
      const rationale =
        agreementCount >= 2
          ? `Synthesis: ${agreementCount} arms agree on ${side} (${agreeingArms}); regime ${regime ?? "unknown"}.`
          : `Synthesis: solo signal from ${agreeingArms} on ${side}; regime ${regime ?? "unknown"}.`;

      return [
        {
          armId: SYNTHESIS_ARM_ID,
          side,
          base: ctx.market.base,
          quote: ctx.market.quote,
          size,
          limitPrice: entry,
          orderStyle: lead.intent.orderStyle,
          confidence,
          targetPrice: lead.intent.targetPrice,
          invalidationPrice: lead.intent.invalidationPrice,
          rationale,
        },
      ];
    },
  };
}

/** The default instance, registered in registry.ts. */
export const synthesisArm: StrategyArm = makeSynthesisArm();
