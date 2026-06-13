import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { horizon } from "../stellar/client";
import { parseAsset } from "../stellar/assets";
import { config } from "../config";
import type { Candle } from "../stellar/market";

/**
 * Historical OHLC loader for the backtester.
 *
 * Horizon's trade-aggregation endpoint caps a single page at 200 buckets, so a
 * multi-month window needs paging. We page FORWARD in time by stepping the
 * start cursor past the last bucket we received (ascending order, no overlap),
 * which is more robust on this endpoint than relying on cursor links.
 *
 * Results are cached to disk per (network, pair, resolution) so reruns are
 * instant and REPRODUCIBLE - a backtest you can't reproduce is an anecdote, not
 * a measurement. Pass refresh:true (CLI --refresh) to re-pull from Horizon.
 */

export const RESOLUTION_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "15m": 900_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
};

const PAGE_LIMIT = 200;
const CACHE_DIR = join(process.cwd(), ".backtest-cache");

interface TradeAggregationLike {
  timestamp?: number | string;
  trade_count?: number | string;
  base_volume?: string;
  counter_volume?: string;
  avg?: string;
  high?: string;
  low?: string;
  open?: string;
  close?: string;
}

function safeName(spec: string): string {
  return spec.replace(/[^a-zA-Z0-9]+/g, "_").slice(0, 40);
}

function cachePath(base: string, quote: string, resolutionMs: number): string {
  return join(
    CACHE_DIR,
    `${config.network}-${safeName(base)}-${safeName(quote)}-${resolutionMs}.json`,
  );
}

interface CacheFile {
  base: string;
  quote: string;
  resolutionMs: number;
  fetchedAtMs: number;
  candles: Candle[];
}

/** One ascending page of candles starting at/after `startMs`, up to `endMs`. */
async function fetchPage(
  base: string,
  quote: string,
  startMs: number,
  endMs: number,
  resolutionMs: number,
): Promise<Candle[]> {
  const b = parseAsset(base);
  const q = parseAsset(quote);
  const page = await horizon
    .tradeAggregation(b, q, startMs, endMs, resolutionMs, 0)
    .order("asc")
    .limit(PAGE_LIMIT)
    .call();
  const records = page.records as unknown as TradeAggregationLike[];
  return records.map((r) => ({
    time: new Date(Number(r.timestamp ?? 0)).toISOString(),
    open: Number(r.open ?? 0),
    high: Number(r.high ?? 0),
    low: Number(r.low ?? 0),
    close: Number(r.close ?? 0),
    baseVolume: Number(r.base_volume ?? 0),
    tradeCount: Number(r.trade_count ?? 0),
  }));
}

export interface FetchOptions {
  /** Ignore any cached file and re-pull the whole window from Horizon. */
  refresh?: boolean;
  /** Reference "now" in ms (defaults to wall clock). Pinning it makes a run reproducible. */
  nowMs?: number;
  /** Called with a short progress note per page (for CLI feedback). */
  onProgress?: (msg: string) => void;
}

/**
 * Load `lookbackMs` of candles for base/quote at the given resolution, oldest
 * first. Best-effort: returns whatever Horizon has (thin Stellar markets skip
 * empty buckets, so the real span can be shorter/sparser than requested).
 */
export async function loadCandles(
  base: string,
  quote: string,
  resolutionMs: number,
  lookbackMs: number,
  opts: FetchOptions = {},
): Promise<Candle[]> {
  const nowMs = opts.nowMs ?? Date.now();
  const startMs = nowMs - lookbackMs;
  const path = cachePath(base, quote, resolutionMs);

  if (!opts.refresh && existsSync(path)) {
    try {
      const cached = JSON.parse(readFileSync(path, "utf8")) as CacheFile;
      const inWindow = cached.candles.filter(
        (c) => Date.parse(c.time) >= startMs,
      );
      if (inWindow.length > 0) {
        opts.onProgress?.(
          `${base}/${quote}: ${inWindow.length} candles from cache`,
        );
        return inWindow;
      }
    } catch {
      // Corrupt cache - fall through and re-fetch.
    }
  }

  const all: Candle[] = [];
  let cursor = startMs;
  // Guard against a pathological non-advancing loop on sparse data.
  for (let guard = 0; guard < 10_000; guard++) {
    let page: Candle[] = [];
    try {
      page = await fetchPage(base, quote, cursor, nowMs, resolutionMs);
    } catch (err) {
      opts.onProgress?.(
        `${base}/${quote}: fetch error (${(err as Error).message}) - stopping with ${all.length} candles`,
      );
      break;
    }
    if (page.length === 0) break;
    all.push(...page);
    const lastTime = Date.parse(page[page.length - 1]!.time);
    opts.onProgress?.(
      `${base}/${quote}: +${page.length} (total ${all.length}, through ${page[page.length - 1]!.time})`,
    );
    if (page.length < PAGE_LIMIT) break;
    const next = lastTime + resolutionMs;
    if (!(next > cursor)) break; // no forward progress; bail
    cursor = next;
    if (cursor >= nowMs) break;
  }

  // De-dup by timestamp (paging boundaries can rarely repeat a bucket) and sort.
  const byTime = new Map<number, Candle>();
  for (const c of all) byTime.set(Date.parse(c.time), c);
  const candles = [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, c]) => c)
    .filter((c) => c.close > 0);

  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    const file: CacheFile = {
      base,
      quote,
      resolutionMs,
      fetchedAtMs: nowMs,
      candles,
    };
    writeFileSync(path, JSON.stringify(file));
  } catch {
    // Caching is a nicety; a write failure shouldn't fail the backtest.
  }

  return candles;
}
