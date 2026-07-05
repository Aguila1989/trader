import { describe, it, expect, afterEach } from "vitest";
import { effectiveLimits, effectiveMinRiskReward } from "./riskProfile";
import { config } from "../config";
import type { RiskProfile } from "../types";

const profile = (over: Partial<RiskProfile> = {}): RiskProfile => ({
  positionSize: "low",
  stopLossDistance: "low",
  tradeFrequency: "low",
  volatilityTolerance: "low",
  drawdownTolerance: "low",
  slippageTolerance: "low",
  expertMode: false,
  ...over,
});

/**
 * FIX-PLAN Fix 6 (Kevin's sign-off 2026-07-04): the reward/risk bar scales
 * with the risk profile - HIGH stop-distance or position-size relaxes 1.2 to
 * 1.1, MEDIUM to 1.15 - but ONLY while the configured value is the shipped
 * default; a user/env-set value is never overwritten.
 */
describe("policy/riskProfile effectiveMinRiskReward", () => {
  const bootValue = config.limits.minRiskReward;
  afterEach(() => {
    config.limits.minRiskReward = bootValue;
  });

  it("keeps the base 1.2 at all-LOW", () => {
    expect(effectiveMinRiskReward(profile())).toBe(1.2);
  });

  it("scales to 1.1 when STOP_LOSS_DISTANCE or POSITION_SIZE is HIGH", () => {
    expect(effectiveMinRiskReward(profile({ stopLossDistance: "high" }))).toBe(1.1);
    expect(effectiveMinRiskReward(profile({ positionSize: "high" }))).toBe(1.1);
    // HIGH elsewhere does not relax the bar.
    expect(effectiveMinRiskReward(profile({ volatilityTolerance: "high" }))).toBe(1.2);
  });

  it("scales to 1.15 at MEDIUM (when neither factor is HIGH)", () => {
    expect(effectiveMinRiskReward(profile({ stopLossDistance: "medium" }))).toBe(1.15);
    expect(effectiveMinRiskReward(profile({ positionSize: "medium" }))).toBe(1.15);
    // HIGH wins over MEDIUM.
    expect(
      effectiveMinRiskReward(profile({ stopLossDistance: "medium", positionSize: "high" })),
    ).toBe(1.1);
  });

  it("never overwrites a user/env-set value (runtime Settings edit)", () => {
    config.limits.minRiskReward = 1.5; // settings.ts mutates config.limits live
    expect(effectiveMinRiskReward(profile({ stopLossDistance: "high" }))).toBe(1.5);
  });

  it("threads into effectiveLimits so prompt AND policy see the same bar", () => {
    const limits = effectiveLimits(profile({ stopLossDistance: "high" }));
    expect(limits.minRiskReward).toBe(1.1);
  });
});
