// Maps the per-factor RiskProfile (LOW/MEDIUM/HIGH) onto concrete, enforceable
// knobs. INVARIANT: every factor at LOW reproduces the current config behavior
// exactly — MEDIUM/HIGH only scale risk UP. Read LIVE at proposal time (never
// cached) so a profile change takes effect on the next proposal.
//
// Split of responsibility (per "hard caps where checkable + prompt for the rest"):
//  - HARD (policy engine, via effectiveLimits): slippage cap, per-order size
//    envelope, entry-spread + volume liquidity gates, entry cooldown.
//  - HARD (separate gates): conviction threshold (frequency) + drawdown pause.
//  - ADVISORY (AI prompt): exact %-of-balance sizing, stop placement, whether to
//    trade a volatile token at all — the AI is told the active level per factor.

import { config } from "../config";
import type { RiskProfile, TradeConfidence } from "../types";

/** Risk-limits shape, inferred from config (single source of truth). */
type Limits = typeof config.limits;

/** Max slippage (bps) the AI accepts. LOW = current config (0.5% default). */
export function effectiveSlippageBps(p: RiskProfile): number {
  // Floored at the configured cap so a high MAX_SLIPPAGE_BPS is never TIGHTENED
  // by raising the profile (the "only raise risk" invariant; mirrors the
  // maxAmountPerTradeHigh floor in config.ts).
  const base = config.limits.maxSlippageBps;
  if (p.slippageTolerance === "high") return Math.max(base, 300); // ≥3%
  if (p.slippageTolerance === "medium") return Math.max(base, 150); // ≥1.5%
  return base; // LOW = current
}

/** Per-order size-cap multiplier on the base config cap. LOW = ×1 (current). */
export function positionSizeMultiplier(p: RiskProfile): number {
  if (p.positionSize === "high") return 6;
  if (p.positionSize === "medium") return 3;
  return 1;
}

/** Entry cooldown (seconds). LOW = current; higher frequency shortens it. */
export function effectiveCooldownSeconds(p: RiskProfile): number {
  const base = config.limits.cooldownSeconds;
  if (p.tradeFrequency === "high") return Math.round(base * 0.25);
  if (p.tradeFrequency === "medium") return Math.round(base * 0.5);
  return base;
}

/** Minimum AI confidence to AUTO-submit. LOW/MEDIUM = current ("medium"); HIGH allows "low". */
export function minAutoConfidence(p: RiskProfile): TradeConfidence {
  return p.tradeFrequency === "high" ? "low" : "medium";
}

/** Liquidity gate: min 24h volume to open. LOW = current; higher tolerance relaxes it. */
export function effectiveMinVolume24h(p: RiskProfile): number {
  const base = config.limits.minVolume24h;
  if (p.volatilityTolerance === "high") return 0; // no volume floor
  if (p.volatilityTolerance === "medium") return Number((base * 0.5).toFixed(4));
  return base;
}

/** Entry-spread gate (bps). LOW = current; higher tolerance widens it (0 stays disabled). */
export function effectiveMaxEntrySpreadBps(p: RiskProfile): number {
  const base = config.limits.maxEntrySpreadBps;
  if (base <= 0) return 0;
  if (p.volatilityTolerance === "high") return base * 3;
  if (p.volatilityTolerance === "medium") return Math.round(base * 1.8);
  return base;
}

/** Default stop-loss distance %. LOW = current; wider at MEDIUM/HIGH (advisory hint). */
export function effectiveStopLossPct(p: RiskProfile): number {
  const base = config.limits.stopLossPct;
  if (p.stopLossDistance === "high") return Number((base * 2.5).toFixed(4));
  if (p.stopLossDistance === "medium") return Number((base * 1.5).toFixed(4));
  return base;
}

/** Prefer a TRAILING stop at MEDIUM/HIGH stop-distance (more room, still protected). */
export function prefersTrailingStop(p: RiskProfile): boolean {
  return p.stopLossDistance === "medium" || p.stopLossDistance === "high";
}

/** 24h portfolio-drawdown % that PAUSES new AI entries; null = no pause (HIGH). */
export function drawdownPausePct(p: RiskProfile): number | null {
  if (p.drawdownTolerance === "high") return null;
  if (p.drawdownTolerance === "medium") return 10;
  return 5;
}

/**
 * Effective policy limits for a proposal: base config with the risk-scaled
 * overrides applied. The position-size cap is the config cap × multiplier (the
 * AI sizes the precise %-of-balance within this envelope); the preflight still
 * blocks anything beyond actually-held funds. LOW returns the config unchanged.
 */
export function effectiveLimits(p: RiskProfile): Limits {
  const mult = positionSizeMultiplier(p);
  return {
    ...config.limits,
    maxAmountPerTrade: config.limits.maxAmountPerTrade * mult,
    maxAmountPerTradeHigh: config.limits.maxAmountPerTradeHigh * mult,
    maxSlippageBps: effectiveSlippageBps(p),
    cooldownSeconds: effectiveCooldownSeconds(p),
    minVolume24h: effectiveMinVolume24h(p),
    maxEntrySpreadBps: effectiveMaxEntrySpreadBps(p),
  };
}

/** Overall label for the UI summary line. */
export function overallRiskLevel(p: RiskProfile): "LOW" | "MEDIUM" | "HIGH" | "MIXED" {
  const vals = Object.values(p);
  if (vals.every((v) => v === "low")) return "LOW";
  if (vals.every((v) => v === "high")) return "HIGH";
  if (vals.every((v) => v === "medium")) return "MEDIUM";
  return "MIXED";
}

/** One-line risk-profile description for the AI prompt + proposal log snapshot. */
export function riskProfileSummary(p: RiskProfile): string {
  return (
    `positionSize=${p.positionSize.toUpperCase()}, ` +
    `stopLossDistance=${p.stopLossDistance.toUpperCase()}, ` +
    `tradeFrequency=${p.tradeFrequency.toUpperCase()}, ` +
    `volatilityTolerance=${p.volatilityTolerance.toUpperCase()}, ` +
    `drawdownTolerance=${p.drawdownTolerance.toUpperCase()}, ` +
    `slippageTolerance=${p.slippageTolerance.toUpperCase()}`
  );
}
