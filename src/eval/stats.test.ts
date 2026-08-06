import { describe, it, expect } from "vitest";
import {
  bonferroniAlpha,
  bootstrapCI,
  invNormalCdf,
  maxDrawdownFromReturns,
  powerMDE,
  sidakAlpha,
  summaryStats,
  verdictFor,
} from "./stats";

/**
 * Significance-layer tests. Pure (no imports beyond stats.ts). These pin the
 * decision contract: a positive point estimate whose CI includes zero is NOT an
 * edge; the multiple-comparisons bar rises with variants; costs flip a marginal
 * winner; too little data is inconclusive, never falsely "no-edge".
 */

/**
 * A left-skewed, marginally-significant sample: 45 small wins + 5 moderate
 * losses. Its plain 95% CI clears zero (edge at 1 variant), but the Šidák CI for
 * 50 variants does NOT (verified by replaying the exact bootstrap offline).
 */
function marginalEdgeSample(): number[] {
  return [...Array(45).fill(0.02), ...Array(5).fill(-0.06)];
}

describe("summaryStats mirrors the backtest math", () => {
  it("computes mean, ddof=1 stdev, t-stat and Sharpe", () => {
    const s = summaryStats([1, 2, 3, 4, 5]);
    expect(s.mean).toBeCloseTo(3, 6);
    expect(s.stdDev).toBeCloseTo(Math.sqrt(2.5), 6); // ddof=1
    expect(s.tStat).toBeCloseTo(3 / (Math.sqrt(2.5) / Math.sqrt(5)), 3);
    expect(s.sharpe).toBeCloseTo(3 / Math.sqrt(2.5), 4);
  });
  it("returns null t-stat below 2 samples", () => {
    expect(summaryStats([1]).tStat).toBeNull();
    expect(summaryStats([]).tStat).toBeNull();
  });
});

describe("bootstrapCI", () => {
  it("is deterministic (fixed seed -> identical interval)", () => {
    const r = marginalEdgeSample();
    expect(bootstrapCI(r)).toEqual(bootstrapCI(r));
  });
  it("widens (lower bound falls) as the confidence level rises", () => {
    const r = marginalEdgeSample();
    const lo95 = bootstrapCI(r, 0.95)!.lower;
    const lo999 = bootstrapCI(r, 0.999)!.lower;
    expect(lo999).toBeLessThanOrEqual(lo95);
  });
  it("returns null below 2 samples", () => {
    expect(bootstrapCI([0.1])).toBeNull();
  });
});

describe("multiple-comparisons adjustment", () => {
  it("Šidák and Bonferroni shrink alpha as variants grow", () => {
    expect(sidakAlpha(0.05, 1)).toBeCloseTo(0.05, 12);
    expect(sidakAlpha(0.05, 50)).toBeLessThan(0.05);
    expect(sidakAlpha(0.05, 100)).toBeLessThan(sidakAlpha(0.05, 50));
    expect(bonferroniAlpha(0.05, 10)).toBeCloseTo(0.005, 12);
  });
});

describe("verdictFor — the decision contract", () => {
  it("a positive mean whose adjusted CI clears zero on an adequate sample = EDGE", () => {
    const v = verdictFor({ netReturns: marginalEdgeSample(), variantsTried: 1, nMin: 30 });
    expect(v.stats.mean).toBeGreaterThan(0);
    expect(v.ci!.lower).toBeGreaterThan(0);
    expect(v.verdict).toBe("edge");
  });

  it("the SAME sample verdicts NO-EDGE once the multiple-comparisons bar rises", () => {
    const v = verdictFor({ netReturns: marginalEdgeSample(), variantsTried: 50, nMin: 30 });
    expect(v.adjustedAlpha).toBeLessThan(0.05);
    expect(v.ci!.lower).toBeLessThanOrEqual(0); // interval no longer clears zero
    expect(v.verdict).toBe("no-edge");
  });

  it("COSTS flip a marginal winner to NO-EDGE", () => {
    const gross = marginalEdgeSample();
    expect(verdictFor({ netReturns: gross, variantsTried: 1, nMin: 30 }).verdict).toBe("edge");
    // Subtract a per-trade cost of 0.012 -> mean ~0 -> CI spans zero.
    const net = gross.map((x) => x - 0.012);
    expect(verdictFor({ netReturns: net, variantsTried: 1, nMin: 30 }).verdict).toBe("no-edge");
  });

  it("a positive point estimate with a CI spanning zero is NOT an edge", () => {
    // High-variance small-mean sample: mean > 0 but the interval includes 0.
    const noisy = [0.2, -0.18, 0.19, -0.17, 0.21, -0.19, 0.05, -0.03, 0.15, -0.13];
    const v = verdictFor({ netReturns: noisy, variantsTried: 1, nMin: 5 });
    expect(v.stats.mean).toBeGreaterThan(0);
    expect(v.ci!.excludesZero).toBe(false);
    expect(v.verdict).toBe("no-edge");
  });

  it("too few trades = INCONCLUSIVE (never falsely no-edge)", () => {
    const v = verdictFor({ netReturns: [0.02, 0.03, 0.01], variantsTried: 1, nMin: 30 });
    expect(v.verdict).toBe("inconclusive-need-more-data");
  });

  it("an unmet horizon = INCONCLUSIVE even with an adequate sample", () => {
    const v = verdictFor({
      netReturns: marginalEdgeSample(),
      variantsTried: 1,
      nMin: 30,
      daysObserved: 3,
      dMin: 14,
    });
    expect(v.verdict).toBe("inconclusive-need-more-data");
  });

  it("a losing sample verdicts NO-EDGE", () => {
    const losing = [...Array(30).fill(-0.02), ...Array(20).fill(0.005)];
    const v = verdictFor({ netReturns: losing, variantsTried: 1, nMin: 20 });
    expect(v.stats.mean).toBeLessThan(0);
    expect(v.verdict).toBe("no-edge");
  });

  it("emits itemized overfitting warnings", () => {
    const v = verdictFor({
      netReturns: marginalEdgeSample(),
      variantsTried: 20,
      nMin: 30,
      inSampleOnly: true,
      regimeCounts: { ranging: 3, "trending-up": 47 },
      minRegimeSample: 10,
    });
    expect(v.overfittingWarnings.some((w) => /variants tried/i.test(w))).toBe(true);
    expect(v.overfittingWarnings.some((w) => /in-sample/i.test(w))).toBe(true);
    expect(v.overfittingWarnings.some((w) => /thin regime "ranging"/i.test(w))).toBe(true);
  });
});

describe("power / MDE + helpers", () => {
  it("invNormalCdf approximates the standard probit", () => {
    expect(invNormalCdf(0.975)).toBeCloseTo(1.959964, 4);
    expect(invNormalCdf(0.5)).toBeCloseTo(0, 6);
  });
  it("flags an underpowered sample when |mean| < MDE", () => {
    const p = powerMDE(20, 0.05, 0.001); // tiny mean, modest n
    expect(p.underpowered).toBe(true);
    expect(p.mde).toBeGreaterThan(0.001);
  });
  it("maxDrawdownFromReturns tracks the worst peak-to-trough of the equity curve", () => {
    // cum: 1,3,2,-2,0 -> peak 3 -> trough -2 -> DD 5
    expect(maxDrawdownFromReturns([1, 2, -1, -4, 2])).toBeCloseTo(5, 6);
  });
});
