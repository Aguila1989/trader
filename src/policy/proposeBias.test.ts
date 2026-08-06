import { describe, it, expect } from "vitest";
import { defaultRiskProfile, type RiskProfile } from "../types";
import { DEFAULT_PARAMS } from "../backtest/strategy";
import { biasedStrategyParams, proposeBias, promptDirectives, type ProposeBias } from "./proposeBias";

/**
 * proposeBias tests: the fundability bug's OTHER half (risk profile has no
 * lever on the propose decision). Covers the LOW/base backward-compat
 * invariant, monotonicity across the full profile, safe-range clamping, and
 * that promptDirectives renders live values only (never a cached constant).
 */

function profile(overrides: Partial<RiskProfile>): RiskProfile {
  return { ...defaultRiskProfile(), ...overrides };
}

describe("biasedStrategyParams", () => {
  it("LOW/base reproduces DEFAULT_PARAMS bit-for-bit (the invariant every effective*() in riskProfile.ts holds)", () => {
    expect(biasedStrategyParams(defaultRiskProfile())).toEqual(DEFAULT_PARAMS);
  });

  it("MEDIUM tradeFrequency loosens the bands exactly halfway toward the extremes", () => {
    const p = biasedStrategyParams(profile({ tradeFrequency: "medium" }));
    expect(p.trendPullbackRsi).toBeCloseTo((45 + 60) / 2, 5);
    expect(p.trendBounceRsi).toBeCloseTo((55 + 40) / 2, 5);
    expect(p.rangeLowPos).toBeCloseTo((0.25 + 0.4) / 2, 5);
    expect(p.rangeHighPos).toBeCloseTo((0.75 + 0.6) / 2, 5);
    expect(p.rangeBuyRsi).toBeCloseTo((40 + 55) / 2, 5);
    expect(p.rangeSellRsi).toBeCloseTo((60 + 45) / 2, 5);
  });

  it("HIGH tradeFrequency loosens fully to the extreme and never past it", () => {
    const p = biasedStrategyParams(profile({ tradeFrequency: "high" }));
    expect(p.trendPullbackRsi).toBe(60);
    expect(p.trendBounceRsi).toBe(40);
    expect(p.rangeLowPos).toBe(0.4);
    expect(p.rangeHighPos).toBe(0.6);
    expect(p.rangeBuyRsi).toBe(55);
    expect(p.rangeSellRsi).toBe(45);
  });

  it("leaves the bracket-construction params (atrStopMult/rewardRiskMult) untouched", () => {
    const p = biasedStrategyParams(profile({ tradeFrequency: "high" }));
    expect(p.atrStopMult).toBe(DEFAULT_PARAMS.atrStopMult);
    expect(p.rewardRiskMult).toBe(DEFAULT_PARAMS.rewardRiskMult);
  });

  it("expert mode derives aggressiveness from minConfidence, monotonically", () => {
    const expertBase = defaultRiskProfile().expert!;
    const conservative = profile({ expertMode: true, expert: { ...expertBase, minConfidence: 90 } });
    const aggressive = profile({ expertMode: true, expert: { ...expertBase, minConfidence: 50 } });

    const consParams = biasedStrategyParams(conservative);
    const aggrParams = biasedStrategyParams(aggressive);

    expect(consParams).toEqual(DEFAULT_PARAMS); // minConfidence 90 -> aggressiveness 0
    expect(aggrParams.trendPullbackRsi).toBeGreaterThan(consParams.trendPullbackRsi);
    expect(aggrParams.rangeLowPos).toBeGreaterThan(consParams.rangeLowPos);
    expect(aggrParams.rangeHighPos).toBeLessThan(consParams.rangeHighPos);
  });

  it("keeps every nudged value inside its safe range and never inverts the range edges", () => {
    for (const tf of ["low", "medium", "high"] as const) {
      const p = biasedStrategyParams(profile({ tradeFrequency: tf }));
      expect(p.trendPullbackRsi).toBeGreaterThanOrEqual(DEFAULT_PARAMS.trendPullbackRsi);
      expect(p.trendPullbackRsi).toBeLessThanOrEqual(60);
      expect(p.trendBounceRsi).toBeLessThanOrEqual(DEFAULT_PARAMS.trendBounceRsi);
      expect(p.trendBounceRsi).toBeGreaterThanOrEqual(40);
      expect(p.rangeLowPos).toBeLessThan(p.rangeHighPos);
    }
  });
});

describe("proposeBias — monotonic across the whole profile", () => {
  it("aggressive (all-HIGH) has a strictly lower confidence bar and a strictly larger size multiplier than conservative (all-LOW)", () => {
    const conservative = proposeBias(defaultRiskProfile()); // all-LOW
    const aggressive = proposeBias(profile({ tradeFrequency: "high", positionSize: "high" }));
    expect(aggressive.minConfidence).toBeLessThan(conservative.minConfidence);
    expect(aggressive.sizeMultiplier).toBeGreaterThan(conservative.sizeMultiplier);
  });

  it("never produces an out-of-range confidence or a non-positive size multiplier", () => {
    const combos: Partial<RiskProfile>[] = [
      {},
      { tradeFrequency: "medium" },
      { tradeFrequency: "high" },
      { positionSize: "medium" },
      { positionSize: "high" },
    ];
    for (const o of combos) {
      const bias = proposeBias(profile(o));
      expect(bias.minConfidence).toBeGreaterThanOrEqual(0);
      expect(bias.minConfidence).toBeLessThanOrEqual(100);
      expect(bias.sizeMultiplier).toBeGreaterThan(0);
    }
  });
});

describe("promptDirectives", () => {
  it("renders exactly the values passed in — never a module-load constant", () => {
    const fakeBias: ProposeBias = {
      minConfidence: 42,
      sizeMultiplier: 7,
      strategyParams: {
        ...DEFAULT_PARAMS,
        trendPullbackRsi: 99,
        trendBounceRsi: 3,
        rangeLowPos: 0.11,
        rangeHighPos: 0.88,
        rangeBuyRsi: 22,
        rangeSellRsi: 77,
      },
    };
    const text = promptDirectives(fakeBias);
    expect(text).toContain("99/3");
    expect(text).toContain("<=0.11/>=0.88");
    expect(text).toContain("<=22/>=77");
    expect(text).toContain("42/100");
    expect(text).toContain("7x");
    // Never leaks the unrelated DEFAULT_PARAMS pullback number.
    expect(text).not.toContain("45/55");
  });

  it("two different bias objects (different risk profiles) render two different strings", () => {
    const a = promptDirectives(proposeBias(defaultRiskProfile()));
    const b = promptDirectives(proposeBias(profile({ tradeFrequency: "high" })));
    expect(a).not.toBe(b);
  });
});
