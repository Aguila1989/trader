import type {
  LiquidityRec,
  LiquiditySnapshotRow,
  RankTrend,
  VolumeTrend,
} from "../types";

/**
 * Pure trend analysis over persisted liquidity snapshots - no I/O, fully
 * unit-tested. Turns the current top-N observation plus its history into the
 * dashboard recommendations: average rank, rank/volume trend, top-N
 * consistency, and the "worth watching" flag.
 *
 * A "snapshot" is one hourly TICK (a distinct timestamp); trend fields are
 * emitted only once at least `minSnapshots` ticks of history exist (the spec's
 * "24+ snapshots" gate). All time math takes `now` as an argument so the
 * function stays pure and deterministic in tests.
 */

export interface AnalyzeOptions {
  /** Ticks of history required before any trend/consistency is reported. */
  minSnapshots?: number;
  /** Top-N appearance % over the 7d window required to recommend. */
  consistencyThresholdPct?: number;
  /** The "7 days" window in ms (overridable for tests). */
  sevenDayMs?: number;
  /** Rank-delta (between older/newer halves) below which rank is "stable". */
  trendEps?: number;
  /** Fractional volume band (0.1 = ±10%) within which volume is "stable". */
  volumeBandPct?: number;
}

function mean(a: number[]): number {
  return a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0;
}

function halves<T>(arr: T[]): [T[], T[]] {
  const mid = Math.floor(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
}

/** Rank trend: a FALLING rank number (1 is best) over time is "improving". */
function rankTrendOf(ranksOldToNew: number[], eps: number): RankTrend {
  if (ranksOldToNew.length < 2) return "stable";
  const [older, newer] = halves(ranksOldToNew);
  const delta = mean(newer) - mean(older);
  if (Math.abs(delta) <= eps) return "stable";
  return delta < 0 ? "improving" : "declining";
}

function volumeTrendOf(volsOldToNew: number[], band: number): VolumeTrend {
  if (volsOldToNew.length < 2) return "stable";
  const [older, newer] = halves(volsOldToNew);
  const o = mean(older);
  const n = mean(newer);
  if (o <= 0) return n > 0 ? "growing" : "stable";
  const change = (n - o) / o;
  if (change > band) return "growing";
  if (change < -band) return "shrinking";
  return "stable";
}

function round1(n: number): number {
  return Number(n.toFixed(1));
}

export function analyzeLiquidity(
  current: LiquiditySnapshotRow[],
  history: LiquiditySnapshotRow[],
  whitelist: Iterable<string>,
  now: number,
  opts: AnalyzeOptions = {},
): LiquidityRec[] {
  const minSnapshots = opts.minSnapshots ?? 24;
  const consistencyThreshold = opts.consistencyThresholdPct ?? 70;
  const sevenDayMs = opts.sevenDayMs ?? 7 * 86_400_000;
  const trendEps = opts.trendEps ?? 0.5;
  const volumeBand = (opts.volumeBandPct ?? 10) / 100;

  const wl = new Set([...whitelist].map((s) => s.toUpperCase()));

  const cutoff = now - sevenDayMs;
  const allTicks = new Set(history.map((r) => r.ts));
  const ticks7d = new Set(
    history.filter((r) => Date.parse(r.ts) >= cutoff).map((r) => r.ts),
  );
  const haveTrend = allTicks.size >= minSnapshots;

  const byAsset = new Map<string, LiquiditySnapshotRow[]>();
  for (const r of history) {
    const arr = byAsset.get(r.asset);
    if (arr) arr.push(r);
    else byAsset.set(r.asset, [r]);
  }

  return current.map((c): LiquidityRec => {
    const base: LiquidityRec = {
      asset: c.asset,
      assetCode: c.assetCode,
      assetIssuer: c.assetIssuer,
      rank: c.rank,
      baseVolume24h: c.baseVolume24h,
      numTrades24h: c.numTrades24h,
      spreadBps: c.spreadBps,
      recommended: false,
    };

    const rows = (byAsset.get(c.asset) ?? [])
      .slice()
      .sort((a, b) => a.ts.localeCompare(b.ts));
    if (!haveTrend || rows.length === 0) return base;

    const ranks = rows.map((r) => r.rank);
    const avgRank = round1(mean(ranks));
    const rankTrend = rankTrendOf(ranks, trendEps);
    const volumeTrend = volumeTrendOf(
      rows.map((r) => r.baseVolume24h ?? 0),
      volumeBand,
    );

    const appeared7d = new Set(
      rows.filter((r) => Date.parse(r.ts) >= cutoff).map((r) => r.ts),
    );
    const consistencyPct =
      ticks7d.size > 0 ? round1((appeared7d.size / ticks7d.size) * 100) : 0;

    const recommended =
      consistencyPct >= consistencyThreshold &&
      volumeTrend !== "shrinking" &&
      !wl.has(c.asset.toUpperCase());

    return { ...base, avgRank, rankTrend, consistencyPct, volumeTrend, recommended };
  });
}
