import { describe, it, expect } from "vitest";
import { evaluateDeterioration } from "./trustlineScanner";
import { fallbackScores } from "./trustlineAnalyst";
import { nextWeeklyOccurrenceUtc } from "../time";
import type { TokenRawData, TokenScanResult } from "../types";

function raw(overrides: Partial<TokenRawData> = {}): TokenRawData {
  return {
    volume24h: 100,
    volume7d: 700,
    activeTraders: 50,
    orderBookDepth: 1000,
    spreadPct: 1,
    priceTrend7d: "stable",
    trustlineCount: 1000,
    homeDomain: "example.com",
    tomlMissing: false,
    ...overrides,
  };
}

function scan(overrides: Partial<TokenScanResult> = {}): TokenScanResult {
  return {
    scanDate: "2026-06-29T00:00:00.000Z",
    asset: "FOO:GISSUER",
    assetCode: "FOO",
    assetIssuer: "GISSUER",
    liquidityScore: 7,
    legitimacyScore: 7,
    trendScore: 7,
    riskScore: 7,
    overallScore: 7,
    summary: "Looks fine.",
    redFlags: [],
    rawData: raw(),
    held: true,
    ...overrides,
  };
}

describe("evaluateDeterioration", () => {
  it("fires nothing when nothing meaningfully changed", () => {
    const prev = scan();
    const cur = scan();
    expect(evaluateDeterioration(cur, prev).triggers).toEqual([]);
  });

  it("flags an overall score drop of >= 2 week over week", () => {
    const prev = scan({ overallScore: 8 });
    const cur = scan({ overallScore: 6 });
    expect(evaluateDeterioration(cur, prev).triggers).toContain("score_drop");
  });

  it("does NOT flag a 1-point overall drop", () => {
    const prev = scan({ overallScore: 8 });
    const cur = scan({ overallScore: 7 });
    expect(evaluateDeterioration(cur, prev).triggers).not.toContain("score_drop");
  });

  it("flags low liquidity (< 3) even on the first scan (no previous)", () => {
    const cur = scan({ liquidityScore: 2 });
    expect(evaluateDeterioration(cur, undefined).triggers).toContain("liquidity_low");
  });

  it("flags a >50% 7-day volume drop", () => {
    const prev = scan({ rawData: raw({ volume7d: 1000 }) });
    const cur = scan({ rawData: raw({ volume7d: 400 }) });
    expect(evaluateDeterioration(cur, prev).triggers).toContain("volume_drop");
  });

  it("does NOT flag a modest (<50%) volume drop", () => {
    const prev = scan({ rawData: raw({ volume7d: 1000 }) });
    const cur = scan({ rawData: raw({ volume7d: 700 }) });
    expect(evaluateDeterioration(cur, prev).triggers).not.toContain("volume_drop");
  });

  it("flags red flags that are new since the previous scan", () => {
    const prev = scan({ redFlags: ["thin book"] });
    const cur = scan({ redFlags: ["thin book", "anonymous issuer"] });
    const { triggers } = evaluateDeterioration(cur, prev);
    expect(triggers).toContain("new_red_flags");
  });

  it("does NOT flag red flags that were already present", () => {
    const prev = scan({ redFlags: ["thin book"] });
    const cur = scan({ redFlags: ["thin book"] });
    expect(evaluateDeterioration(cur, prev).triggers).not.toContain("new_red_flags");
  });

  it("flags a >10% drop in trustline holders", () => {
    const prev = scan({ rawData: raw({ trustlineCount: 1000 }) });
    const cur = scan({ rawData: raw({ trustlineCount: 850 }) });
    expect(evaluateDeterioration(cur, prev).triggers).toContain("trustline_count_drop");
  });

  it("flags a TOML that existed before but is now gone", () => {
    const prev = scan({ rawData: raw({ tomlMissing: false }) });
    const cur = scan({ rawData: raw({ tomlMissing: true }) });
    expect(evaluateDeterioration(cur, prev).triggers).toContain("toml_lost");
  });

  it("flags a trend that flipped from up/stable to down", () => {
    const prev = scan({ rawData: raw({ priceTrend7d: "up" }) });
    const cur = scan({ rawData: raw({ priceTrend7d: "down" }) });
    expect(evaluateDeterioration(cur, prev).triggers).toContain("trend_down");
  });

  it("combines multiple triggers and produces a human-readable line per trigger", () => {
    const prev = scan({ overallScore: 9, rawData: raw({ volume7d: 1000, trustlineCount: 1000 }) });
    const cur = scan({
      overallScore: 6,
      rawData: raw({ volume7d: 100, trustlineCount: 500 }),
    });
    const { triggers, changed } = evaluateDeterioration(cur, prev);
    expect(triggers).toEqual(
      expect.arrayContaining(["score_drop", "volume_drop", "trustline_count_drop"]),
    );
    expect(changed.length).toBe(triggers.length);
  });
});

describe("fallbackScores", () => {
  it("returns valid 1-10 scores and at least one red flag", () => {
    const s = fallbackScores("no AI key");
    for (const v of [s.liquidityScore, s.legitimacyScore, s.trendScore, s.riskScore, s.overallScore]) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(10);
    }
    expect(s.redFlags.length).toBeGreaterThan(0);
    expect(s.summary).toContain("no AI key");
  });
});

describe("nextWeeklyOccurrenceUtc", () => {
  // Default config.timezone is UTC in tests, so local == UTC here.
  const from = new Date("2026-06-29T12:00:00.000Z");

  it("lands on the requested weekday and minute-of-day, strictly in the future", () => {
    const dow = 1; // Monday
    const minute = 3 * 60; // 03:00
    const next = nextWeeklyOccurrenceUtc(dow, minute, from);
    expect(next.getTime()).toBeGreaterThan(from.getTime());
    expect(next.getUTCDay()).toBe(dow);
    expect(next.getUTCHours() * 60 + next.getUTCMinutes()).toBe(minute);
    // Always within the next 7 days.
    expect(next.getTime() - from.getTime()).toBeLessThanOrEqual(8 * 86_400_000);
  });

  it("advances to the next week when today's slot has already passed", () => {
    // from is a Monday 12:00; asking for Monday 03:00 must roll to next Monday.
    const fromMon = new Date("2026-06-29T12:00:00.000Z");
    if (fromMon.getUTCDay() === 1) {
      const next = nextWeeklyOccurrenceUtc(1, 3 * 60, fromMon);
      expect(next.getUTCDay()).toBe(1);
      expect(next.getTime() - fromMon.getTime()).toBeGreaterThan(6 * 86_400_000);
    }
  });
});
