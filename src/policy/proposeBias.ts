import { DEFAULT_PARAMS, type StrategyParams } from "../backtest/strategy";
import { minConfidenceScore, positionSizeMultiplier } from "./riskProfile";
import type { RiskProfile } from "../types";

/**
 * PHASE 3.1 — give risk appetite a REAL lever on the PROPOSE decision.
 *
 * Diagnosis (risk-profile-no-lever-on-ai-propose.md, 2026-07-03): every
 * existing `effective*()` knob in riskProfile.ts governs either a
 * POST-proposal gate (size cap, slippage, cooldown, drawdown pause) or a
 * submit-time veto (minConfidenceScore). None of them touch what counts as a
 * candidate setup in the first place: the deterministic rulebook
 * (backtest/strategy.ts) and the prompt's rendering of it
 * (claude/agent.ts's old rulebookLine()) were frozen at module-level
 * DEFAULT_PARAMS regardless of risk profile. An all-HIGH operator therefore
 * got a LOOSER post-hoc gate on the SAME candidate setups a LOW operator saw
 * — never a genuinely wider net of candidates. That is the asymmetry the
 * memory note names: "risk profile can veto more, never propose more."
 *
 * This module is the propose-stage lever. `biasedStrategyParams` nudges the
 * rulebook's entry bands (RSI / rangePos thresholds) so a higher trade
 * appetite genuinely surfaces MORE candidate setups — not just accepts the
 * same ones at a lower confidence bar. LOW/base reproduces DEFAULT_PARAMS
 * bit-for-bit, the same backward-compatibility invariant every `effective*()`
 * function in riskProfile.ts already holds, so a default (all-LOW,
 * non-expert) deployment is byte-for-byte unchanged.
 *
 * `proposeBias` re-exports (never re-implements) minConfidenceScore and
 * positionSizeMultiplier so a caller reaches for ONE bias object instead of
 * stitching three modules together, and `promptDirectives` renders the AI
 * prompt block from that object's live values ONLY — never a module-level
 * constant — which is the direct fix for the OTHER half of the diagnosed bug
 * (prompts baking stale limits at import time). Call `proposeBias` at REQUEST
 * time, per the SAME "read LIVE, never cache" convention riskProfile.ts's own
 * doc comment states.
 */

/** How permissive the rulebook's entry bands get nudged: 0 = LOW/base
 *  (DEFAULT_PARAMS unchanged), 1 = fully loosened toward the safe extreme. */
function aggressiveness(p: RiskProfile): number {
  const e = p.expertMode && p.expert ? p.expert : null;
  if (e) {
    // Expert mode: minConfidence (range 50-99) IS the operator's explicit
    // aggressiveness dial - reuse it directly instead of adding a second,
    // possibly-conflicting number. 90+ -> 0 (as conservative as basic LOW);
    // 50 (the floor) -> 1 (fully aggressive).
    return clamp01((90 - e.minConfidence) / (90 - 50));
  }
  // Basic mode: tradeFrequency is the existing "how readily the AI trades /
  // how short the cooldown" factor (riskProfile.ts:effectiveCooldownSeconds)
  // - the natural home for "how permissive is the entry rulebook" too.
  if (p.tradeFrequency === "high") return 1;
  if (p.tradeFrequency === "medium") return 0.5;
  return 0;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Linear nudge of `base` toward `loosened` by `aggr` (0-1). Clamped so the
 *  result can never overshoot `loosened`, even if `aggr` somehow exceeded 1
 *  upstream - a hard safety rail, not just a convenience clamp. */
function nudge(base: number, loosened: number, aggr: number): number {
  const a = clamp01(aggr);
  const v = base + (loosened - base) * a;
  return loosened >= base ? Math.min(v, loosened) : Math.max(v, loosened);
}

/**
 * The rulebook's RSI/rangePos entry bands, nudged by the risk profile.
 * LOW/base returns DEFAULT_PARAMS UNCHANGED (bit-identical). Only the
 * entry-quality bands move; atrStopMult/rewardRiskMult (the bracket
 * construction) are left untouched - sizing/stop levers already live in
 * riskProfile.ts and stay there, this module owns entry-band permissiveness
 * only.
 */
export function biasedStrategyParams(p: RiskProfile): StrategyParams {
  const aggr = aggressiveness(p);
  // Return a COPY on the neutral path too, never the shared DEFAULT_PARAMS by
  // reference: a caller mutating the result would otherwise corrupt the
  // process-wide strategy constant. (Review 2026-08-04, phase31 P2.)
  if (aggr <= 0) return { ...DEFAULT_PARAMS };
  const d = DEFAULT_PARAMS;
  return {
    ...d,
    // Uptrend pullback: accept a shallower cool-off (raise the RSI ceiling).
    trendPullbackRsi: nudge(d.trendPullbackRsi, 60, aggr),
    // Downtrend bounce: accept a smaller heat-up (lower the RSI floor).
    trendBounceRsi: nudge(d.trendBounceRsi, 40, aggr),
    // Range edges move toward center -> more of the range counts as an edge.
    rangeLowPos: nudge(d.rangeLowPos, 0.4, aggr),
    rangeHighPos: nudge(d.rangeHighPos, 0.6, aggr),
    // Oversold/overbought confirmation loosens toward neutral (50).
    rangeBuyRsi: nudge(d.rangeBuyRsi, 55, aggr),
    rangeSellRsi: nudge(d.rangeSellRsi, 45, aggr),
  };
}

export interface ProposeBias {
  /** Minimum numeric AI confidence (0-100) to auto-submit - identical to
   *  policy/riskProfile.ts:minConfidenceScore (re-exported, not duplicated),
   *  so aggressive genuinely lowers the bar and conservative raises it. */
  minConfidence: number;
  /** Per-order size-cap multiplier - identical to
   *  policy/riskProfile.ts:positionSizeMultiplier (re-exported). NOTE: expert
   *  mode always returns 1 here (its real size lever is %-of-balance via
   *  positionSizeCapFromBalance, which needs a live balance riskProfile.ts's
   *  caller supplies) - unchanged pre-existing behavior, not a regression. */
  sizeMultiplier: number;
  /** The rulebook's entry bands after the risk-profile nudge. */
  strategyParams: StrategyParams;
}

/**
 * The full propose-stage bias for a risk profile. Call at REQUEST time (never
 * cache/memoize across requests) so a profile change is reflected on the very
 * next proposal - exactly like every other `effective*()` reader in
 * riskProfile.ts.
 */
export function proposeBias(p: RiskProfile): ProposeBias {
  return {
    minConfidence: minConfidenceScore(p),
    sizeMultiplier: positionSizeMultiplier(p),
    strategyParams: biasedStrategyParams(p),
  };
}

/**
 * The AI-prompt block stating the CURRENT thresholds, built from the `bias`
 * argument only - no module-level constants, no import-time snapshot. A
 * caller that re-derives `bias` from the live risk profile on every request
 * (as claude/agent.ts's systemPrompt()/systemChainPrompt() already do for
 * effectiveLimits) can never go stale. This directly fixes the diagnosed bug:
 * the old rulebookLine() always rendered backtest/strategy.ts's DEFAULT_PARAMS
 * module constant, regardless of the operator's active risk profile.
 */
export function promptDirectives(bias: ProposeBias): string {
  const p = bias.strategyParams;
  return (
    `- CURRENT rulebook thresholds at your active risk profile (these ARE the ` +
    `candidate-setup bar - a signal inside them is a real candidate, not just ` +
    `a discretionary maybe): trend pullback/bounce RSI ${p.trendPullbackRsi}/${p.trendBounceRsi}; ` +
    `range edges <=${p.rangeLowPos}/>=${p.rangeHighPos} with RSI <=${p.rangeBuyRsi}/>=${p.rangeSellRsi}.\n` +
    `- Minimum confidence to auto-execute at your active risk profile: ${bias.minConfidence}/100. ` +
    `Size multiplier at your active risk profile: ${bias.sizeMultiplier}x the base per-trade cap ` +
    `(the per-trade cap sentence above already includes this - don't apply it twice).`
  );
}
