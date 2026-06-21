import { config } from "../config";
import { getOrderbook, getTradeAggregations, listAssets } from "../stellar/market";
import type { LiquiditySnapshotRow } from "../types";

/**
 * Liquidity collector for the hourly scanner. Decoupled from trading: it only
 * READS Horizon and returns ranked observations - it never builds, signs or
 * submits anything, and imports no orchestrator/policy/signer code.
 *
 * "Liquidity" here is MEASURED 24h XLM-pair SDEX volume (the real signal),
 * not Horizon's /assets holder count (which can't be sorted server-side and is
 * only used as a discovery proxy). Assets with no XLM-pair trading are dropped
 * - their real liquidity may live against USDC or in AMM pools the SDEX scan
 * can't see, a documented limitation.
 */

const QUOTE = "XLM";

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/** Run async tasks with bounded concurrency (Horizon has no backoff here, so a
 *  small pool keeps the hourly fan-out from tripping 429s). */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]!);
    }
  };
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}

export interface ScanOptions {
  topN?: number;
  discoveryPages?: number;
  discoveryTop?: number;
  concurrency?: number;
}

interface Measured {
  asset: string;
  baseVolume24h: number;
  numTrades24h: number;
  spreadBps: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

/** Measure one candidate's 24h XLM-pair volume + top-of-book spread. Returns
 *  null when the pair has no XLM trading (not "liquid" by this metric). */
async function measure(asset: string): Promise<Measured | null> {
  try {
    const candles = await getTradeAggregations(asset, QUOTE, 3_600_000, 24);
    const baseVolume24h = candles.reduce((s, c) => s + (c.baseVolume || 0), 0);
    const numTrades24h = candles.reduce((s, c) => s + (c.tradeCount || 0), 0);
    if (!(baseVolume24h > 0)) return null;
    let spreadBps: number | null = null;
    let bestBid: number | null = null;
    let bestAsk: number | null = null;
    try {
      const ob = await getOrderbook(asset, QUOTE, 1);
      spreadBps = ob.spreadBps;
      bestBid = ob.bestBid;
      bestAsk = ob.bestAsk;
    } catch {
      /* spread is best-effort; volume already qualified the asset */
    }
    return { asset, baseVolume24h, numTrades24h, spreadBps, bestBid, bestAsk };
  } catch {
    return null;
  }
}

/**
 * Collect the current top-N most XLM-liquid assets. Candidate set = the curated
 * universe + the operator whitelist + a bounded Horizon /assets discovery sweep
 * (ranked by holders). Each candidate is ranked by MEASURED 24h XLM-pair
 * volume; zero-volume candidates are dropped. Returns rows stamped with the
 * current time and rank 1..N.
 */
export async function collectTopLiquidity(
  opts: ScanOptions = {},
): Promise<LiquiditySnapshotRow[]> {
  const topN = opts.topN ?? 10;
  const discoveryPages = opts.discoveryPages ?? 0;
  const discoveryTop = opts.discoveryTop ?? 25;
  const concurrency = opts.concurrency ?? 4;

  const seen = new Set<string>();
  const candidates: string[] = [];
  const add = (spec: string): void => {
    const s = spec.trim();
    if (!s || s.toUpperCase() === "XLM" || s.toLowerCase() === "native") return;
    const key = s.toUpperCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(s);
  };
  for (const s of config.scanAssets) add(s);
  for (const s of config.limits.assetWhitelist) add(s);

  // Bounded best-effort discovery of NEW (non-whitelisted) assets: page
  // /assets, keep the highest-holder ones as extra candidates to measure.
  if (discoveryPages > 0) {
    const discovered = await listAssets({ pages: discoveryPages, limit: 200 });
    discovered.sort((a, b) => b.numAccounts - a.numAccounts);
    for (const d of discovered.slice(0, discoveryTop)) add(d.asset);
  }

  const measured = await mapLimit(candidates, concurrency, measure);
  const ts = new Date().toISOString();
  const ranked = measured
    .filter((m): m is Measured => m != null)
    .sort((a, b) => b.baseVolume24h - a.baseVolume24h)
    .slice(0, topN);

  return ranked.map((r, i): LiquiditySnapshotRow => {
    const [assetCode = r.asset, assetIssuer = ""] = r.asset.split(":");
    return {
      ts,
      asset: r.asset,
      assetCode,
      assetIssuer,
      quoteAsset: QUOTE,
      rank: i + 1,
      baseVolume24h: round7(r.baseVolume24h),
      numTrades24h: r.numTrades24h,
      spreadBps: r.spreadBps,
      bestBid: r.bestBid,
      bestAsk: r.bestAsk,
    };
  });
}
