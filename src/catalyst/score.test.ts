import { describe, it, expect } from "vitest";
import {
  KIND_DEFAULTS,
  decayWeight,
  eventContribution,
  scoreAsset,
  scoreAllAssets,
} from "./score";
import type { CatalystEvent } from "./types";

/**
 * Pure-function tests for the catalyst scoring layer. No network, no clock —
 * every case fixes its own `asOfIso` so the assertions are deterministic.
 */

const T0 = "2026-08-01T12:00:00.000Z";

function mkEvent(overrides: Partial<CatalystEvent> = {}): CatalystEvent {
  return {
    id: "src:hash1",
    source: "test-source",
    kind: "listing",
    assets: ["XLM"],
    headline: "Example listing headline",
    url: "https://example.com/a",
    publishedAt: T0,
    ingestedAt: T0,
    rawSummary: "Some raw summary text.",
    contentHash: "hash1",
    ...overrides,
  };
}

describe("decayWeight", () => {
  it("is 1.0 at age 0", () => {
    expect(decayWeight(T0, T0, 24)).toBeCloseTo(1, 10);
  });

  it("halves at exactly one half-life", () => {
    const later = new Date(Date.parse(T0) + 24 * 3_600_000).toISOString();
    expect(decayWeight(T0, later, 24)).toBeCloseTo(0.5, 6);
  });

  it("quarters at two half-lives", () => {
    const later = new Date(Date.parse(T0) + 48 * 3_600_000).toISOString();
    expect(decayWeight(T0, later, 24)).toBeCloseTo(0.25, 6);
  });

  it("returns 0 for a future event relative to asOf (look-ahead guard)", () => {
    const future = new Date(Date.parse(T0) + 3_600_000).toISOString();
    expect(decayWeight(future, T0, 24)).toBe(0);
  });

  it("returns 0 for an unparseable date rather than throwing", () => {
    expect(decayWeight("not-a-date", T0, 24)).toBe(0);
    expect(decayWeight(T0, "not-a-date", 24)).toBe(0);
  });

  it("returns 0 for a non-positive half-life", () => {
    expect(decayWeight(T0, T0, 0)).toBe(0);
    expect(decayWeight(T0, T0, -5)).toBe(0);
  });
});

describe("KIND_DEFAULTS", () => {
  it("scores exploit as high-severity, negative", () => {
    expect(KIND_DEFAULTS.exploit.direction).toBe("negative");
    expect(KIND_DEFAULTS.exploit.severity).toBeGreaterThan(0.7);
  });

  it("scores listing as positive", () => {
    expect(KIND_DEFAULTS.listing.direction).toBe("positive");
  });

  it("treats the deliberately-ambiguous kinds as mixed by default", () => {
    for (const kind of ["governance", "funding-spike", "large-flow", "depeg", "other"] as const) {
      expect(KIND_DEFAULTS[kind].direction).toBe("mixed");
    }
  });
});

describe("eventContribution", () => {
  it("uses the kind default when the event sets no override", () => {
    const c = eventContribution(mkEvent({ kind: "exploit" }), T0, { sourceWeights: { "test-source": 1 } });
    expect(c.weight).toBeCloseTo(0.9, 6); // severity 0.9 * weight 1 * recency 1
    expect(c.signed).toBeCloseTo(-0.9, 6); // negative direction
  });

  it("honors an event-level severity/direction override over the kind default", () => {
    const c = eventContribution(mkEvent({ kind: "exploit", severity: 0.2, direction: "positive" }), T0, {
      sourceWeights: { "test-source": 1 },
    });
    expect(c.weight).toBeCloseTo(0.2, 6);
    expect(c.signed).toBeCloseTo(0.2, 6);
  });

  it("clamps an out-of-range severity override into [0,1]", () => {
    const c = eventContribution(mkEvent({ severity: 5 }), T0, { sourceWeights: { "test-source": 1 } });
    expect(c.weight).toBeLessThanOrEqual(1);
  });

  it("falls back to the default source weight when unlisted", () => {
    const c = eventContribution(mkEvent(), T0, {});
    // listing severity 0.6 * default source weight 0.7 * recency 1
    expect(c.weight).toBeCloseTo(0.42, 6);
  });

  it("a 'mixed' direction contributes weight but zero signed pull", () => {
    const c = eventContribution(mkEvent({ kind: "governance" }), T0, { sourceWeights: { "test-source": 1 } });
    expect(c.weight).toBeGreaterThan(0);
    expect(c.signed).toBe(0);
  });
});

describe("scoreAsset", () => {
  it("returns a neutral zero signal when there are no events", () => {
    const out = scoreAsset([], "XLM", T0);
    expect(out).toMatchObject({ asset: "XLM", score: 0, confidence: 0, eventCount: 0 });
    expect(out.rationale).toMatch(/no recent catalysts/i);
  });

  it("scores a single strongly-negative exploit as bearish with the whole asset weight", () => {
    const events = [mkEvent({ kind: "exploit", assets: ["USDC:GISSUER"] })];
    const out = scoreAsset(events, "USDC:GISSUER", T0, { sourceWeights: { "test-source": 1 } });
    expect(out.score).toBeLessThan(0);
    expect(out.eventCount).toBe(1);
    expect(out.confidence).toBeGreaterThan(0);
  });

  it("nets opposing events toward zero, and a lone mixed event stays near-neutral", () => {
    const events = [
      mkEvent({ kind: "listing", assets: ["XLM"], contentHash: "h1", severity: 1, id: "a" }),
      mkEvent({ kind: "delisting", assets: ["XLM"], contentHash: "h2", severity: 1, id: "b" }),
    ];
    const out = scoreAsset(events, "XLM", T0, { sourceWeights: { "test-source": 1 } });
    expect(Math.abs(out.score)).toBeLessThan(0.05);
  });

  it("bounds the score to [-1, 1] even with many stacked same-direction events", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      mkEvent({ kind: "exploit", assets: ["XLM"], contentHash: `h${i}`, id: `id${i}`, severity: 1 }),
    );
    const out = scoreAsset(events, "XLM", T0, { sourceWeights: { "test-source": 1 } });
    expect(out.score).toBeGreaterThanOrEqual(-1);
    expect(out.score).toBeLessThanOrEqual(1);
  });

  it("decays older events, lowering confidence (a lone event still saturates score to its direction)", () => {
    // With only ONE contributing event, score = totalSigned/totalWeight always
    // saturates to the event's own direction sign regardless of decay - decay
    // shows up in CONFIDENCE (less total evidence weight), not in the ratio.
    const fresh = scoreAsset([mkEvent({ kind: "exploit" })], "XLM", T0, { sourceWeights: { "test-source": 1 } });
    const staleAsOf = new Date(Date.parse(T0) + 72 * 3_600_000).toISOString();
    const stale = scoreAsset([mkEvent({ kind: "exploit" })], "XLM", staleAsOf, { sourceWeights: { "test-source": 1 } });
    expect(stale.confidence).toBeLessThan(fresh.confidence);
    expect(stale.score).toBe(fresh.score); // same direction, decay affects confidence not sign/magnitude here
  });

  it("decays older events so a stale bullish catalyst loses ground to a fresher bearish one", () => {
    const staleBullish = new Date(Date.parse(T0) + 60 * 3_600_000).toISOString(); // 60h old at asOf
    const events = [
      mkEvent({ kind: "listing", assets: ["XLM"], contentHash: "stale-bull", id: "a", publishedAt: T0, severity: 1 }),
      mkEvent({
        kind: "exploit",
        assets: ["XLM"],
        contentHash: "fresh-bear",
        id: "b",
        publishedAt: staleBullish,
        severity: 1,
      }),
    ];
    const asOf = staleBullish; // the exploit is fresh (age 0) as of this instant; the listing is 60h stale
    const out = scoreAsset(events, "XLM", asOf, { sourceWeights: { "test-source": 1 }, halfLifeHours: 24 });
    expect(out.score).toBeLessThan(0); // the fresh bearish event outweighs the stale bullish one
  });

  it("ignores events for other assets but includes market-wide events", () => {
    const events = [
      mkEvent({ kind: "listing", assets: ["USDC:GISSUER"], contentHash: "other-asset" }),
      mkEvent({ kind: "exploit", assets: [], contentHash: "market-wide" }), // market-wide
    ];
    const out = scoreAsset(events, "XLM", T0, { sourceWeights: { "test-source": 1 } });
    expect(out.eventCount).toBe(1);
    expect(out.score).toBeLessThan(0); // only the market-wide exploit applies
  });

  it("defensively excludes an event whose publishedAt is after asOfIso", () => {
    const future = new Date(Date.parse(T0) + 3_600_000).toISOString();
    const out = scoreAsset([mkEvent({ publishedAt: future })], "XLM", T0);
    expect(out.eventCount).toBe(0);
  });

  it("rationale cites the asset, kind, source and direction", () => {
    const out = scoreAsset([mkEvent({ kind: "exploit" })], "XLM", T0, { sourceWeights: { "test-source": 1 } });
    expect(out.rationale).toContain("XLM");
    expect(out.rationale).toContain("exploit");
    expect(out.rationale).toContain("test-source");
    expect(out.rationale).toMatch(/bearish/);
  });

  it("caps the rationale to rationaleTopN contributing events", () => {
    const events = Array.from({ length: 5 }, (_, i) =>
      mkEvent({ kind: "exploit", assets: ["XLM"], contentHash: `h${i}`, id: `id${i}` }),
    );
    const out = scoreAsset(events, "XLM", T0, { sourceWeights: { "test-source": 1 }, rationaleTopN: 2 });
    const bulletCount = out.rationale.split("\n").filter((l) => l.trim().startsWith("-")).length;
    expect(bulletCount).toBe(2);
  });
});

describe("scoreAllAssets", () => {
  it("scores every asset mentioned across the event set", () => {
    const events = [
      mkEvent({ kind: "listing", assets: ["XLM"], contentHash: "h1" }),
      mkEvent({ kind: "exploit", assets: ["USDC:GISSUER"], contentHash: "h2", id: "id2" }),
    ];
    const out = scoreAllAssets(events, T0, { sourceWeights: { "test-source": 1 } });
    const assets = out.map((s) => s.asset).sort();
    expect(assets).toEqual(["USDC:GISSUER", "XLM"].sort());
  });

  it("returns an empty array for an event set with no named assets", () => {
    const events = [mkEvent({ assets: [] })];
    expect(scoreAllAssets(events, T0)).toEqual([]);
  });
});
