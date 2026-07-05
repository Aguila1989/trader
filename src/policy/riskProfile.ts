// Maps the per-factor RiskProfile onto concrete, enforceable knobs.
//
// TWO modes:
//  - BASIC (expertMode off): LOW/MEDIUM/HIGH labels. INVARIANT: every factor at
//    LOW reproduces the current config behavior exactly; MEDIUM/HIGH only scale
//    risk UP. (Unchanged from before Expert Mode existed.)
//  - EXPERT (expertMode on): the numeric `expert` thresholds are authoritative
//    and honored exactly (clamped to range at the edge), overriding the labels.
//
// Read LIVE at proposal time (never cached) so a profile change takes effect on
// the next proposal.
//
// Split of responsibility ("hard caps where checkable + prompt for the rest"):
//  - HARD (policy engine, via effectiveLimits): slippage cap, per-order size
//    envelope, entry-spread + volume liquidity gates, entry cooldown.
//  - HARD (separate gates): confidence threshold (frequency), 24h-swing skip
//    (expert volatility) + drawdown pause.
//  - ADVISORY (AI prompt): exact %-of-balance sizing, stop placement, whether to
//    trade a volatile token at all — the AI is told the active values per factor.

import { config } from "../config";
import { RISK_FACTORS } from "../types";
import type { ExpertRiskProfile, RiskProfile, TradeConfidence } from "../types";

/** Risk-limits shape, inferred from config (single source of truth). */
type Limits = typeof config.limits;

/** The numeric thresholds when Expert Mode is active, else null (basic mode). */
function expertOf(p: RiskProfile): ExpertRiskProfile | null {
  return p.expertMode && p.expert ? p.expert : null;
}

/** Max slippage (bps) the AI accepts. Expert honors the exact %; basic = LOW
 *  reproduces config and MEDIUM/HIGH only loosen (never tighten by raising). */
export function effectiveSlippageBps(p: RiskProfile): number {
  const e = expertOf(p);
  if (e) return Math.round(e.maxSlippagePct * 100); // exact, may be tighter or looser
  const base = config.limits.maxSlippageBps;
  if (p.slippageTolerance === "high") return Math.max(base, 300); // ≥3%
  if (p.slippageTolerance === "medium") return Math.max(base, 150); // ≥1.5%
  return base; // LOW = current
}

/** Per-order size-cap multiplier on the base config cap. LOW = ×1 (current).
 *  Expert sizing is %-of-balance (see positionSizeCapFromBalance) so the
 *  multiplier is ×1 and the balance-based cap is applied where balance is known. */
export function positionSizeMultiplier(p: RiskProfile): number {
  if (expertOf(p)) return 1;
  if (p.positionSize === "high") return 6;
  if (p.positionSize === "medium") return 3;
  return 1;
}

/**
 * Expert-mode per-order cap = positionSizePct% of available balance, in the
 * units of the balance passed. Returns null in basic mode (use the multiplier
 * path instead). availableBalance ≤ 0 yields 0 (nothing to size).
 */
export function positionSizeCapFromBalance(
  p: RiskProfile,
  availableBalance: number,
): number | null {
  const e = expertOf(p);
  if (!e) return null;
  if (!Number.isFinite(availableBalance) || availableBalance <= 0) return 0;
  return Number((availableBalance * (e.positionSizePct / 100)).toFixed(7));
}

/** Entry cooldown (seconds). Basic: higher frequency shortens it. Expert: base
 *  (frequency is governed by the numeric confidence gate, not the cooldown). */
export function effectiveCooldownSeconds(p: RiskProfile): number {
  const base = config.limits.cooldownSeconds;
  if (expertOf(p)) return base;
  if (p.tradeFrequency === "high") return Math.round(base * 0.25);
  if (p.tradeFrequency === "medium") return Math.round(base * 0.5);
  return base;
}

/** Minimum AI confidence LABEL to AUTO-submit (basic mode). LOW/MEDIUM = current
 *  ("medium"); HIGH allows "low". */
export function minAutoConfidence(p: RiskProfile): TradeConfidence {
  return p.tradeFrequency === "high" ? "low" : "medium";
}

/** Minimum NUMERIC confidence (0-100) to auto-submit. Expert: the exact
 *  threshold; basic: derived from the label gate (medium≈70, low≈55). */
export function minConfidenceScore(p: RiskProfile): number {
  const e = expertOf(p);
  if (e) return e.minConfidence;
  return minAutoConfidence(p) === "low" ? 55 : 70;
}

/** Liquidity gate: min 24h volume to open. Basic: higher tolerance relaxes it.
 *  Expert: base (expert volatility is the 24h-swing gate, not the volume floor). */
export function effectiveMinVolume24h(p: RiskProfile): number {
  const base = config.limits.minVolume24h;
  if (expertOf(p)) return base;
  if (p.volatilityTolerance === "high") return 0; // no volume floor
  if (p.volatilityTolerance === "medium") return Number((base * 0.5).toFixed(4));
  return base;
}

/** Entry-spread gate (bps). Basic: higher tolerance widens it. Expert: base
 *  (0 stays disabled). */
export function effectiveMaxEntrySpreadBps(p: RiskProfile): number {
  const base = config.limits.maxEntrySpreadBps;
  if (base <= 0) return 0;
  if (expertOf(p)) return base;
  if (p.volatilityTolerance === "high") return base * 3;
  if (p.volatilityTolerance === "medium") return Math.round(base * 1.8);
  return base;
}

/** Expert: max accepted 24h |price change| % — the AI skips tokens above it.
 *  Returns null in basic mode (no 24h-swing gate, fully backward-compatible). */
export function maxVolatility24hPct(p: RiskProfile): number | null {
  const e = expertOf(p);
  return e ? e.maxVolatilityPct : null;
}

/** Default stop-loss distance %. Basic: wider at MEDIUM/HIGH. Expert: the exact
 *  % (or base when the expert chose fixed-amount mode — see effectiveStopLossAmount). */
export function effectiveStopLossPct(p: RiskProfile): number {
  const e = expertOf(p);
  if (e) return e.stopLossMode === "pct" ? e.stopLossPct : config.limits.stopLossPct;
  const base = config.limits.stopLossPct;
  if (p.stopLossDistance === "high") return Number((base * 2.5).toFixed(4));
  if (p.stopLossDistance === "medium") return Number((base * 1.5).toFixed(4));
  return base;
}

/** Expert amount-mode stop distance (quote units from entry); null otherwise. */
export function effectiveStopLossAmount(p: RiskProfile): number | null {
  const e = expertOf(p);
  return e && e.stopLossMode === "amount" ? e.stopLossAmount : null;
}

/** Prefer a TRAILING stop at MEDIUM/HIGH stop-distance (basic). Expert users
 *  set stops explicitly, so no implicit trailing preference. */
export function prefersTrailingStop(p: RiskProfile): boolean {
  if (expertOf(p)) return false;
  return p.stopLossDistance === "medium" || p.stopLossDistance === "high";
}

/**
 * FIX-PLAN Fix 6: minimum reward/risk, scaled with the risk profile. At HIGH
 * risk the spread/slippage allowances triple while the 1.2 bar stayed fixed -
 * causing pre-proposal self-censorship on marginal setups. Kevin's sign-off
 * (2026-07-04): STOP_LOSS_DISTANCE or POSITION_SIZE at HIGH -> 1.1, at MEDIUM
 * (neither high) -> 1.15, all-LOW -> the base 1.2.
 *
 * A user-set value always wins: scaling ONLY applies while the configured
 * value equals the shipped default (1.2). Anything else - env MIN_RISK_REWARD
 * or a runtime Settings edit (settings.ts mutates config.limits live) - is an
 * explicit operator choice and is returned untouched. Expert mode also returns
 * the base (expert users set exact numbers, same convention as the other
 * effective* functions).
 */
const SHIPPED_MIN_RISK_REWARD = 1.2;
export function effectiveMinRiskReward(p: RiskProfile): number {
  const base = config.limits.minRiskReward;
  if (expertOf(p)) return base;
  if (base !== SHIPPED_MIN_RISK_REWARD) return base; // user/env-set: never overwrite
  const high = p.stopLossDistance === "high" || p.positionSize === "high";
  const medium = p.stopLossDistance === "medium" || p.positionSize === "medium";
  if (high) return 1.1;
  if (medium) return 1.15;
  return base;
}

/** 24h portfolio-drawdown % that PAUSES new AI entries; null = no pause. */
export function drawdownPausePct(p: RiskProfile): number | null {
  const e = expertOf(p);
  if (e) return e.drawdownNeverPause ? null : e.drawdownPausePct;
  if (p.drawdownTolerance === "high") return null;
  if (p.drawdownTolerance === "medium") return 10;
  return 5;
}

/**
 * Effective policy limits for a proposal: base config with the risk-scaled
 * overrides applied. The position-size cap is the config cap × multiplier (the
 * AI sizes the precise %-of-balance within this envelope); the preflight still
 * blocks anything beyond actually-held funds. LOW returns the config unchanged.
 * (Expert-mode %-of-balance sizing is applied by the caller via
 * positionSizeCapFromBalance, where the live balance is known.)
 */
export function effectiveLimits(p: RiskProfile, availableBalanceXlm?: number): Limits {
  const mult = positionSizeMultiplier(p);
  // EXPERT mode sizes each order as a % of available balance. The cap is
  // XLM-calibrated for the XLM-base chain-scan shape; cross/inverted pairs fall
  // back to it as a conservative upper bound and preflight still blocks anything
  // beyond actually-held funds. null in basic mode (the multiplier path applies).
  const expertCap =
    availableBalanceXlm != null ? positionSizeCapFromBalance(p, availableBalanceXlm) : null;
  const maxAmt = expertCap != null ? expertCap : config.limits.maxAmountPerTrade * mult;
  const maxAmtHigh = expertCap != null ? expertCap : config.limits.maxAmountPerTradeHigh * mult;
  return {
    ...config.limits,
    maxAmountPerTrade: maxAmt,
    maxAmountPerTradeHigh: maxAmtHigh,
    maxSlippageBps: effectiveSlippageBps(p),
    cooldownSeconds: effectiveCooldownSeconds(p),
    minVolume24h: effectiveMinVolume24h(p),
    maxEntrySpreadBps: effectiveMaxEntrySpreadBps(p),
    minRiskReward: effectiveMinRiskReward(p), // FIX-PLAN Fix 6
  };
}

// AUDIT-030: overallRiskLevel() was removed — zero callers; the UI summary
// line computes its own label in RiskSettingsPanel.vue.

/** One-line risk-profile description for the AI prompt + proposal log snapshot.
 *  Expert mode emits the exact numbers; basic mode emits the labels. */
export function riskProfileSummary(p: RiskProfile): string {
  const e = expertOf(p);
  if (e) {
    const stop =
      e.stopLossMode === "pct" ? `${e.stopLossPct}%` : `${e.stopLossAmount} (fixed amount)`;
    return (
      `EXPERT — positionSize=${e.positionSizePct}% of available balance, ` +
      `stopLoss=${stop}, minConfidence=${e.minConfidence}/100, ` +
      `maxVolatility24h=${e.maxVolatilityPct}%, ` +
      `drawdownPause=${e.drawdownNeverPause ? "never" : `${e.drawdownPausePct}%`}, ` +
      `maxSlippage=${e.maxSlippagePct}%`
    );
  }
  return (
    `positionSize=${p.positionSize.toUpperCase()}, ` +
    `stopLossDistance=${p.stopLossDistance.toUpperCase()}, ` +
    `tradeFrequency=${p.tradeFrequency.toUpperCase()}, ` +
    `volatilityTolerance=${p.volatilityTolerance.toUpperCase()}, ` +
    `drawdownTolerance=${p.drawdownTolerance.toUpperCase()}, ` +
    `slippageTolerance=${p.slippageTolerance.toUpperCase()}`
  );
}
