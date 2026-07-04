/**
 * XLM/EUR rate for tax records (2026-07 Feature 2). LEGAL REQUIREMENT: the
 * rate is captured AT receipt time, stored on the dbo.FeeLedger row, and never
 * recomputed from a later price. Sources, in order:
 *
 *   1. Kraken public ticker (no API key, EUR-native book) - the primary.
 *   2. CoinGecko simple price - fallback when Kraken is unreachable.
 *   3. Kraken 1-minute OHLC *at the transaction timestamp* - used only by the
 *      gap-repair path when BOTH live sources were down at collection time.
 *      That is still "the rate at time of transaction" (the minute close of
 *      the receipt minute), never the current rate.
 *
 * A 60s in-process cache keeps a burst of fee collections from hammering the
 * public endpoints. All failures return null - the caller keeps the ledger row
 * rate-less ('pending' repair) rather than guessing.
 */

export interface EurRate {
  rate: number;
  source: "kraken" | "coingecko" | "kraken-hist";
}

const CACHE_MS = 60_000;
let cached: { at: number; value: EurRate } | null = null;

const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function krakenLive(): Promise<number | null> {
  try {
    const j = (await fetchJson("https://api.kraken.com/0/public/Ticker?pair=XLMEUR")) as {
      error?: string[];
      result?: Record<string, { c?: [string, string] }>;
    };
    if (j.error && j.error.length > 0) return null;
    const first = j.result ? Object.values(j.result)[0] : undefined;
    const rate = Number(first?.c?.[0]);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

async function coingeckoLive(): Promise<number | null> {
  try {
    const j = (await fetchJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=eur",
    )) as { stellar?: { eur?: number } };
    const rate = Number(j.stellar?.eur);
    return Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

/** Current XLM/EUR rate for a fee being collected RIGHT NOW, or null. */
export async function currentXlmEurRate(): Promise<EurRate | null> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
  const kraken = await krakenLive();
  if (kraken != null) {
    cached = { at: Date.now(), value: { rate: kraken, source: "kraken" } };
    return cached.value;
  }
  const gecko = await coingeckoLive();
  if (gecko != null) {
    cached = { at: Date.now(), value: { rate: gecko, source: "coingecko" } };
    return cached.value;
  }
  return null;
}

/**
 * Gap repair: the 1-minute Kraken close AT `tsMs` (the receipt moment), for
 * ledger rows whose collection succeeded while both live feeds were down.
 * Kraken keeps ~12h of 1-minute candles; older gaps fall back to the 1-hour
 * close of the receipt hour, which is still the receipt-time rate window.
 */
export async function historicalXlmEurRate(tsMs: number): Promise<EurRate | null> {
  for (const interval of [1, 60]) {
    try {
      const since = Math.floor(tsMs / 1000) - interval * 60;
      const j = (await fetchJson(
        `https://api.kraken.com/0/public/OHLC?pair=XLMEUR&interval=${interval}&since=${since}`,
      )) as { error?: string[]; result?: Record<string, unknown> };
      if (j.error && j.error.length > 0) continue;
      const series = j.result
        ? (Object.entries(j.result).find(([k]) => k !== "last")?.[1] as unknown[][] | undefined)
        : undefined;
      if (!series || series.length === 0) continue;
      const bucket = Math.floor(tsMs / 1000 / (interval * 60)) * interval * 60;
      const row =
        series.find((r) => Number(r[0]) === bucket) ??
        // Nearest candle at-or-before the receipt moment.
        [...series].reverse().find((r) => Number(r[0]) <= Math.floor(tsMs / 1000));
      const close = Number(row?.[4]);
      if (Number.isFinite(close) && close > 0) return { rate: close, source: "kraken-hist" };
    } catch {
      /* try the coarser interval */
    }
  }
  return null;
}

/** Test hook. */
export function __resetPriceFeedCacheForTests(): void {
  cached = null;
}
