import { describe, it, expect } from "vitest";
import { kellySizing } from "./sizing";

describe("kellySizing", () => {
  it("recommends zero when the edge is negative (a coin flip at even money)", () => {
    // p=0.5, b=1 -> fullKelly = 0.5 - 0.5/1 = 0.
    const k = kellySizing(0.5, 1, 1);
    expect(k.fullKelly).toBe(0);
    expect(k.recommendedRiskFraction).toBe(0);
  });

  it("recommends zero when win rate is below the payoff break-even", () => {
    // p=0.3, b=1 -> negative Kelly -> bet nothing.
    const k = kellySizing(0.3, 1, 1);
    expect(k.fullKelly).toBeLessThan(0);
    expect(k.recommendedRiskFraction).toBe(0);
  });

  it("sizes up a real edge but respects the cap", () => {
    // Strong edge: p=0.6, win 2R, lose 1R -> b=2, fullKelly = 0.6 - 0.4/2 = 0.4.
    const k = kellySizing(0.6, 2, 1, { fraction: 0.5, cap: 0.02 });
    expect(k.payoffRatio).toBe(2);
    expect(k.fullKelly).toBeCloseTo(0.4, 9);
    // Half-Kelly = 0.2 but capped at 0.02.
    expect(k.recommendedRiskFraction).toBe(0.02);
  });

  it("honors a higher cap and the fractional multiplier", () => {
    const k = kellySizing(0.6, 2, 1, { fraction: 0.25, cap: 0.5 });
    // quarter-Kelly = 0.1, under a 50% cap.
    expect(k.recommendedRiskFraction).toBeCloseTo(0.1, 9);
  });

  it("returns zero with no measurable wins or losses", () => {
    expect(kellySizing(0.5, 0, 1).recommendedRiskFraction).toBe(0);
    expect(kellySizing(0.5, 1, 0).recommendedRiskFraction).toBe(0);
  });
});
