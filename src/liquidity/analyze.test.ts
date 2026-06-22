import { describe, it, expect } from "vitest";
import { analyzeLiquidity } from "./analyze";
import type { LiquiditySnapshotRow } from "../types";

const HOUR = 3_600_000;
const NOW = 1_700_000_000_000; // fixed epoch (keeps the test pure/deterministic)

/** Timestamp for the tick `k` hours before NOW (k=0 is the current tick). */
function ts(k: number): string {
  return new Date(NOW - k * HOUR).toISOString();
}

function row(
  t: string,
  asset: string,
  rank: number,
  vol: number,
): LiquiditySnapshotRow {
  const [assetCode = asset, assetIssuer = "ISS"] = asset.split(":");
  return {
    ts: t,
    asset,
    assetCode,
    assetIssuer,
    quoteAsset: "XLM",
    rank,
    baseVolume24h: vol,
    numTrades24h: 10,
    spreadBps: 5,
    bestBid: 1,
    bestAsk: 1.01,
  };
}

/** Build `ticks` hourly snapshots, one row per asset via the rank/vol fns. */
function history(
  ticks: number,
  assets: { asset: string; rank: (k: number) => number; vol: (k: number) => number }[],
): LiquiditySnapshotRow[] {
  const out: LiquiditySnapshotRow[] = [];
  for (let k = 0; k < ticks; k++) {
    for (const a of assets) out.push(row(ts(k), a.asset, a.rank(k), a.vol(k)));
  }
  return out;
}

describe("analyzeLiquidity", () => {
  it("emits no trend fields before minSnapshots ticks", () => {
    const h = history(5, [{ asset: "AAA:ISS", rank: () => 1, vol: () => 100 }]);
    const current = [row(ts(0), "AAA:ISS", 1, 100)];
    const [rec] = analyzeLiquidity(current, h, [], NOW, { minSnapshots: 24 });
    expect(rec.avgRank).toBeUndefined();
    expect(rec.rankTrend).toBeUndefined();
    expect(rec.recommended).toBe(false);
  });

  it("computes consistency as % of 7d ticks the asset appeared in", () => {
    // 30 ticks total; asset present in only the 20 most-recent ticks (k=0..19).
    const h: LiquiditySnapshotRow[] = [];
    for (let k = 0; k < 30; k++) {
      h.push(row(ts(k), "FILL:ISS", 1, 100)); // ensures all 30 ticks exist
      if (k < 20) h.push(row(ts(k), "PART:ISS", 2, 100));
    }
    const current = [row(ts(0), "PART:ISS", 2, 100)];
    const [rec] = analyzeLiquidity(current, h, [], NOW, { minSnapshots: 24 });
    expect(rec.consistencyPct).toBeCloseTo((20 / 30) * 100, 1);
    // 66.7% < 70% default threshold => not recommended.
    expect(rec.recommended).toBe(false);
  });

  it("classifies an improving rank and a growing volume", () => {
    const h = history(30, [
      { asset: "UP:ISS", rank: (k) => (k < 15 ? 2 : 8), vol: (k) => (k < 15 ? 200 : 100) },
    ]);
    const current = [row(ts(0), "UP:ISS", 2, 200)];
    const [rec] = analyzeLiquidity(current, h, [], NOW, { minSnapshots: 24 });
    expect(rec.rankTrend).toBe("improving"); // rank number fell 8 -> 2
    expect(rec.volumeTrend).toBe("growing"); // 100 -> 200
    expect(rec.avgRank).toBeCloseTo(5, 1);
  });

  it("classifies a declining rank and a shrinking volume", () => {
    const h = history(30, [
      { asset: "DN:ISS", rank: (k) => (k < 15 ? 9 : 3), vol: (k) => (k < 15 ? 100 : 300) },
    ]);
    const current = [row(ts(0), "DN:ISS", 9, 100)];
    const [rec] = analyzeLiquidity(current, h, [], NOW, { minSnapshots: 24 });
    expect(rec.rankTrend).toBe("declining"); // rank number rose 3 -> 9
    expect(rec.volumeTrend).toBe("shrinking"); // 300 -> 100
    expect(rec.recommended).toBe(false); // shrinking is never recommended
  });

  it("recommends a consistent, non-shrinking, non-whitelisted asset", () => {
    const h = history(30, [
      { asset: "NEW:ISS", rank: () => 3, vol: (k) => (k < 15 ? 220 : 200) },
    ]);
    const current = [row(ts(0), "NEW:ISS", 3, 220)];
    const [rec] = analyzeLiquidity(current, h, [], NOW, { minSnapshots: 24 });
    expect(rec.consistencyPct).toBe(100);
    expect(rec.volumeTrend).not.toBe("shrinking");
    expect(rec.recommended).toBe(true);
  });

  it("never recommends a whitelisted asset", () => {
    const h = history(30, [
      { asset: "USDC:ISS", rank: () => 1, vol: (k) => (k < 15 ? 220 : 200) },
    ]);
    const current = [row(ts(0), "USDC:ISS", 1, 220)];
    const [rec] = analyzeLiquidity(current, h, ["USDC:ISS"], NOW, { minSnapshots: 24 });
    expect(rec.consistencyPct).toBe(100);
    expect(rec.recommended).toBe(false);
  });
});
