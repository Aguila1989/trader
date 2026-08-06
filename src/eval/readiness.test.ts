import { describe, it, expect } from "vitest";
import type { ArmAttribution, EvalArmKey, RegimeBreakdown } from "./types";
import { armKeyOf } from "./types";
import {
  adjustedConfidenceLevel,
  bootstrapCI,
  detectPlateau,
  evaluateReadiness,
  requiredResamplesFor,
  trailingConfirmationRun,
  DEFAULT_READINESS_CONFIG,
  type ArmIterationResult,
  type ReadinessConfig,
} from "./readiness";
import { sidakAlpha } from "./stats";

const KEY: EvalArmKey = { arm: "rsi-meanrev", venue: "stellar-sdex" };

/** A ready-made, marginal-but-real edge: mean +0.102R, calibrated (see the
 *  file banner in readiness.ts) so its 95% bootstrap CI clears zero but its
 *  Bonferroni-tightened 99.5% CI (heavy multiple-comparisons correction) does
 *  NOT - i.e. it's exactly the shape of dataset that should flip from "ready"
 *  to "not ready" purely because more variants were tried. */
const PATTERN: number[] = [0.25, 0.35, -0.3, 0.3, 0.15, -0.35, 0.4, 0.2, -0.25, 0.27];

function regimeBucket(trades: number, netPnlXlm: number): RegimeBreakdown {
  return { trades, netPnlXlm, hitRatePct: netPnlXlm > 0 ? 60 : 40 };
}

/** Builds a plausible ArmAttribution around just the two fields readiness.ts
 *  actually reads (netReturns, byRegime) - the rest are filled with internally
 *  consistent placeholder values since ArmAttribution has no optional fields. */
function makeAttribution(
  netReturns: number[],
  byRegime: Record<string, RegimeBreakdown> = {},
): ArmAttribution {
  const trades = netReturns.length;
  const wins = netReturns.filter((r) => r > 0).length;
  const losses = netReturns.filter((r) => r < 0).length;
  const netPnlXlm = netReturns.reduce((s, r) => s + r, 0);
  return {
    key: KEY,
    trades,
    wins,
    losses,
    scratches: trades - wins - losses,
    hitRatePct: trades ? (wins / trades) * 100 : 0,
    grossPnlXlm: netPnlXlm,
    feesXlm: 0,
    rebatesXlm: 0,
    slippageXlm: 0,
    netPnlXlm,
    avgRMultiple: trades ? netPnlXlm / trades : null,
    netReturns,
    maxDrawdownXlm: 0,
    equityCurveXlm: [],
    byRegime,
    byQuote: {},
    modeledTrades: 0,
    openLots: [],
  };
}

/** One PATTERN-shaped iteration, split 5/5 across two regimes so the regime
 *  -stability gate passes (both buckets positive, minTradesPerRegimeBucket=5). */
function patternIteration(iteration: number, tunedThisIteration = false): ArmIterationResult {
  const attribution = makeAttribution(PATTERN, {
    "trending-up": regimeBucket(5, 0.15 * 5),
    ranging: regimeBucket(5, 0.054 * 5),
  });
  return { iteration, key: KEY, isOutOfSample: true, tunedThisIteration, attribution };
}

describe("readiness — minimum independent round-trips gate (P0)", () => {
  // Strongly positive returns so the CI WOULD clear zero — the ONLY thing that
  // should hold these back is too few INDEPENDENT round trips. Two regimes,
  // 5 trades each net-positive; means flat, so every other gate passes.
  function shortIter(iteration: number): ArmIterationResult {
    const attribution = makeAttribution([0.2, 0.25, 0.2, 0.3], {
      "trending-up": regimeBucket(5, 1),
      ranging: regimeBucket(5, 1),
    });
    return { iteration, key: KEY, isOutOfSample: true, tunedThisIteration: false, attribution };
  }

  it("refuses significance below minIndependentTrades even if the CI clears zero", () => {
    const history = [1, 2, 3, 4, 5].map((i) => shortIter(i)); // pooled = 20 < 30
    const res = evaluateReadiness(
      { [armKeyOf(KEY)]: history },
      { [armKeyOf(KEY)]: 1 },
      { exhausted: false, iterationsUsed: 5, maxIterations: 50 },
    );
    const arm = res.perArm[0]!;
    expect(arm.significant).toBe(false);
    expect(res.recommendation).not.toBe("ready-for-tiny-live");
    expect(arm.reasons.join(" ")).toMatch(/independent round-trip/i);
  });

  it("clears the gate once >= minIndependentTrades pooled (8 iters x 4 = 32)", () => {
    const history = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => shortIter(i)); // pooled = 32
    const res = evaluateReadiness(
      { [armKeyOf(KEY)]: history },
      { [armKeyOf(KEY)]: 1 },
      { exhausted: false, iterationsUsed: 8, maxIterations: 50 },
    );
    const arm = res.perArm[0]!;
    expect(arm.significant).toBe(true);
    expect(res.recommendation).toBe("ready-for-tiny-live");
  });
});

describe("detectPlateau", () => {
  it("is false when there isn't enough history to judge yet", () => {
    expect(detectPlateau([0.1, 0.1], 3, 0.02)).toBe(false);
  });

  it("is false while a trail is still materially improving", () => {
    expect(detectPlateau([0.1, 0.3, 0.5, 0.7, 0.9], 3, 0.02)).toBe(false);
  });

  it("is true once a trail has flattened out", () => {
    expect(detectPlateau([0.1, 0.1, 0.1, 0.1], 3, 0.02)).toBe(true);
  });

  it("tolerates noise below the materialImprovement threshold", () => {
    expect(detectPlateau([0.1, 0.105, 0.098, 0.101], 3, 0.02)).toBe(true);
  });
});

describe("adjustedConfidenceLevel", () => {
  it("equals the base level at variantsTried=1 (or 0)", () => {
    expect(adjustedConfidenceLevel(0.95, 1)).toBeCloseTo(0.95, 6);
    expect(adjustedConfidenceLevel(0.95, 0)).toBeCloseTo(0.95, 6);
  });

  it("tightens monotonically as variantsTried grows", () => {
    const l2 = adjustedConfidenceLevel(0.95, 2);
    const l5 = adjustedConfidenceLevel(0.95, 5);
    expect(l2).toBeGreaterThan(0.95);
    expect(l5).toBeGreaterThan(l2);
  });

  it("keeps tightening past 10 variants — the correction never saturates", () => {
    // Review 2026-08-04 (eval-honesty P1): the old 0.995 clamp meant a
    // 10,000-variant search was corrected as if only ~10 were tried, so a
    // noise winner from a wide sweep could pass. The bar must keep biting.
    const l10 = adjustedConfidenceLevel(0.95, 10);
    const l10k = adjustedConfidenceLevel(0.95, 10_000);
    expect(l10).toBeGreaterThan(0.99);
    // The old clamp pinned everything at 0.995; a 10k-variant sweep must now
    // land far beyond it, and strictly tighter than the 10-variant bar.
    expect(l10k).toBeGreaterThan(0.995);
    expect(l10k).toBeGreaterThan(l10);
    expect(l10k).toBeLessThan(1);
  });

  it("matches stats.ts's Šidák correction exactly (one shared bar)", () => {
    for (const variants of [1, 2, 10, 500]) {
      expect(adjustedConfidenceLevel(0.95, variants)).toBeCloseTo(
        1 - sidakAlpha(0.05, variants),
        12,
      );
    }
  });
});

describe("bootstrapCI — resamples scale to the level, else fail closed", () => {
  it("auto-raises resamples so a tight level's tail is a real order statistic", () => {
    const repeated = [...PATTERN, ...PATTERN, ...PATTERN, ...PATTERN];
    const tight = bootstrapCI(repeated, 0.999, 1_000)!; // 1k would floor the tail index to 0
    expect(tight).not.toBeNull();
    expect(tight.resamples).toBeGreaterThan(1_000);
    expect(tight.resamples).toBeGreaterThanOrEqual(requiredResamplesFor(0.999));
  });

  it("returns null (NOT significant) when no feasible resample count resolves the level", () => {
    // A million-variant search corrects to a level far beyond what a bootstrap
    // can resolve. The honest answer is "cannot establish significance", never
    // a degenerate CI that happens to look positive.
    const level = adjustedConfidenceLevel(0.95, 1_000_000);
    expect(bootstrapCI(PATTERN, level, 10_000)).toBeNull();
  });
});

describe("bootstrapCI", () => {
  it("is deterministic given the same input", () => {
    const a = bootstrapCI(PATTERN, 0.95, 2000);
    const b = bootstrapCI(PATTERN, 0.95, 2000);
    expect(a).toEqual(b);
  });

  it("returns null below 2 samples", () => {
    expect(bootstrapCI([0.1], 0.95, 2000)).toBeNull();
  });

  it("widens (tail excludes-zero flips) as the level is tightened", () => {
    const repeated = [...PATTERN, ...PATTERN, ...PATTERN, ...PATTERN]; // n=40
    const at95 = bootstrapCI(repeated, 0.95, 10_000)!;
    const at995 = bootstrapCI(repeated, 0.995, 10_000)!;
    expect(at95.excludesZero).toBe(true);
    expect(at995.excludesZero).toBe(false);
  });
});

describe("trailingConfirmationRun", () => {
  it("stops at the first tuned-or-in-sample iteration walking backward", () => {
    const iters: ArmIterationResult[] = [
      patternIteration(1, true), // tuned - should be excluded
      patternIteration(2, false),
      patternIteration(3, false),
    ];
    const tail = trailingConfirmationRun(iters);
    expect(tail.map((i) => i.iteration)).toEqual([2, 3]);
  });

  it("is empty when the LAST iteration itself was tuned", () => {
    const iters: ArmIterationResult[] = [patternIteration(1, false), patternIteration(2, true)];
    expect(trailingConfirmationRun(iters)).toEqual([]);
  });
});

const READY_SCENARIO_CONFIG: ReadinessConfig = {
  ...DEFAULT_READINESS_CONFIG,
  minConsecutiveIterations: 4,
};

function readyHistory(): Record<string, ArmIterationResult[]> {
  return {
    "rsi-meanrev::stellar-sdex": [
      patternIteration(1),
      patternIteration(2),
      patternIteration(3),
      patternIteration(4),
    ],
  };
}

describe("evaluateReadiness", () => {
  it("a single lucky iteration must NOT be ready, even if it looks great", () => {
    const history = { "rsi-meanrev::stellar-sdex": [patternIteration(1)] };
    const result = evaluateReadiness(
      history,
      { "rsi-meanrev::stellar-sdex": 1 },
      { exhausted: false, iterationsUsed: 1, maxIterations: 50 },
    );
    expect(result.ready).toBe(false);
    expect(result.recommendation).toBe("keep-iterating");
    expect(result.reasons.join(" ")).toMatch(/consecutive/);
  });

  it("is ready once K consecutive untouched iterations plateau and clear significance", () => {
    const result = evaluateReadiness(
      readyHistory(),
      { "rsi-meanrev::stellar-sdex": 1 },
      { exhausted: false, iterationsUsed: 4, maxIterations: 50 },
      READY_SCENARIO_CONFIG,
    );
    expect(result.recommendation).toBe("ready-for-tiny-live");
    expect(result.ready).toBe(true);
    expect(result.perArm[0]!.plateaued).toBe(true);
    expect(result.perArm[0]!.significant).toBe(true);
  });

  it("the SAME history is rejected once enough variants have been tried (multiple-comparisons bar)", () => {
    const result = evaluateReadiness(
      readyHistory(),
      { "rsi-meanrev::stellar-sdex": 100 }, // wide search -> Bonferroni-tightened bar
      { exhausted: false, iterationsUsed: 4, maxIterations: 50 },
      READY_SCENARIO_CONFIG,
    );
    expect(result.ready).toBe(false);
    expect(result.recommendation).toBe("keep-iterating");
    expect(result.perArm[0]!.significant).toBe(false);
  });

  it("a trail that is still visibly improving is not plateaued and therefore not ready", () => {
    const means = [0.1, 0.3, 0.5, 0.7, 0.9];
    const iterations: ArmIterationResult[] = means.map((m, i) => ({
      iteration: i + 1,
      key: KEY,
      isOutOfSample: true,
      tunedThisIteration: false,
      attribution: makeAttribution(
        Array.from({ length: 10 }, () => m),
        { "trending-up": regimeBucket(10, m * 10) },
      ),
    }));
    const result = evaluateReadiness(
      { "rsi-meanrev::stellar-sdex": iterations },
      { "rsi-meanrev::stellar-sdex": 1 },
      { exhausted: false, iterationsUsed: 5, maxIterations: 50 },
    );
    expect(result.ready).toBe(false);
    expect(result.perArm[0]!.plateaued).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/not plateaued/);
  });

  it("budget exhaustion forces no-proven-edge even over a partial pass", () => {
    const result = evaluateReadiness(
      readyHistory(),
      { "rsi-meanrev::stellar-sdex": 100 }, // fails significance -> partial pass at best
      { exhausted: true, iterationsUsed: 50, maxIterations: 50 },
      READY_SCENARIO_CONFIG,
    );
    expect(result.ready).toBe(false);
    expect(result.recommendation).toBe("no-proven-edge");
    expect(result.reasons.join(" ")).toMatch(/budget exhausted/);
  });

  it("no history at all + budget exhausted is still an honest no-proven-edge", () => {
    const result = evaluateReadiness(
      {},
      {},
      { exhausted: true, iterationsUsed: 50, maxIterations: 50 },
    );
    expect(result.recommendation).toBe("no-proven-edge");
  });
});
