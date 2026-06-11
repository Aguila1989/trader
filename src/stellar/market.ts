import { horizon } from "./client";
import { parseAsset } from "./assets";
import {
  computeIndicators,
  takerBuyPct,
  type IndicatorSet,
} from "./indicators";
import type { BookLevel } from "../types";

export interface Balance {
  asset: string;
  balance: string;
}

export interface OrderbookLevel {
  price: string;
  amount: string;
}

export interface OpenOffer {
  id: string;
  selling: string;
  buying: string;
  amount: string;
  price: string;
  /** Horizon's last_modified_time for the offer (age/staleness checks). */
  lastModified?: string;
}

export interface RecentTrade {
  id: string;
  /** Decimal price (quote units per 1 base unit). */
  price: string;
  baseAmount: string;
  counterAmount: string;
  ledgerCloseTime: string;
  /** True when the base asset was SOLD in this trade (sell-pressure proxy). */
  baseIsSeller?: boolean;
}

/** One OHLC candle from Horizon trade aggregations. */
export interface Candle {
  /** ISO timestamp of the segment start. */
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Volume in base-asset units traded during the segment. */
  baseVolume: number;
  tradeCount: number;
}

/**
 * Rolling summary derived from a window of candles (default last 24h), plus
 * server-computed technical indicators and a regime tag. Indicators are
 * computed HERE (not by the model) so the analyst reasons over reliable
 * numbers instead of doing mental math on raw OHLC rows.
 */
export interface MarketStats extends IndicatorSet {
  /** Most recent close (quote units per 1 base unit). */
  lastPrice: number | null;
  /** % change from the first open to the last close over the window. */
  change24hPct: number | null;
  high24h: number | null;
  low24h: number | null;
  /** Total base-asset volume traded over the window. */
  baseVolume24h: number | null;
  tradeCount24h: number | null;
  /**
   * ACTUAL hours spanned by the candle window. Horizon aggregations skip empty
   * buckets, so on a thin market "24 hourly candles" can span days - this keeps
   * the change% honest about the window it covers.
   */
  windowHours: number | null;
}

export interface MarketSnapshot {
  base: string;
  quote: string;
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  /** 24h trend/volatility summary (best-effort; nulls when no trade history). */
  stats: MarketStats;
  /**
   * 7-day summary from DAILY candles - the longer lens that shows real levels
   * (weekly range, multi-day trend) the 24h window can't. Null when the pair
   * has no daily history.
   */
  stats7d: MarketStats | null;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  recentTrades: RecentTrade[];
  /** % of recent traded base volume that was BUYING (taker-flow proxy). */
  flowBuyPct: number | null;
}

// Horizon responses are read through loose shapes at this external boundary
// to avoid wrestling with the SDK's enum-discriminated unions.
interface RawBalance {
  asset_type: string;
  balance: string;
  asset_code?: string;
  asset_issuer?: string;
  liquidity_pool_id?: string;
}

interface AssetStub {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

interface TradeRecordLike {
  id?: string;
  price?: { n: number; d: number };
  base_amount?: string;
  counter_amount?: string;
  ledger_close_time?: string;
  base_is_seller?: boolean;
}

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

/** Format a JS number as a clean decimal string (<=7 dp, no trailing zeros). */
function trimNum(n: number): string {
  if (!Number.isFinite(n)) return "";
  return Number(n.toFixed(7)).toString();
}

/** Convert Horizon's {n,d} price fraction into a clean decimal string. */
function fracToDecimal(p?: { n: number; d: number }): string {
  if (!p || !p.d) return "";
  return trimNum(p.n / p.d);
}

function assetFromHorizon(a: AssetStub): string {
  if (a.asset_type === "native") return "XLM";
  return `${a.asset_code}:${a.asset_issuer}`;
}

export async function getBalances(accountId: string): Promise<Balance[]> {
  const account = await horizon.loadAccount(accountId);
  return (account.balances as unknown as RawBalance[]).map((b) => {
    if (b.asset_type === "native") return { asset: "XLM", balance: b.balance };
    if (b.asset_code && b.asset_issuer) {
      return { asset: `${b.asset_code}:${b.asset_issuer}`, balance: b.balance };
    }
    if (b.liquidity_pool_id) {
      return { asset: `LP:${b.liquidity_pool_id}`, balance: b.balance };
    }
    return { asset: b.asset_type, balance: b.balance };
  });
}

export async function getOpenOffers(accountId: string): Promise<OpenOffer[]> {
  const page = await horizon.offers().forAccount(accountId).limit(50).call();
  return page.records.map((o) => ({
    id: String(o.id),
    selling: assetFromHorizon(o.selling as unknown as AssetStub),
    buying: assetFromHorizon(o.buying as unknown as AssetStub),
    amount: o.amount,
    price: o.price,
    lastModified: (o as unknown as { last_modified_time?: string })
      .last_modified_time,
  }));
}

/**
 * OHLC candles for the base/quote pair via Horizon trade aggregations.
 * `resolutionMs` is the candle width (must be a Horizon-allowed value:
 * 60000, 300000, 900000, 3600000, 86400000, 604800000). Returns oldest-first.
 * Best-effort: returns [] if the pair has no trade history or the call fails.
 */
export async function getTradeAggregations(
  baseSpec: string,
  quoteSpec: string,
  resolutionMs = 3_600_000,
  limit = 24,
): Promise<Candle[]> {
  const base = parseAsset(baseSpec);
  const quote = parseAsset(quoteSpec);
  const end = Date.now();
  const start = end - resolutionMs * limit;

  try {
    const page = await horizon
      .tradeAggregation(base, quote, start, end, resolutionMs, 0)
      .order("desc")
      .limit(limit)
      .call();
    const records = page.records as unknown as TradeAggregationLike[];
    return records
      .map((r) => ({
        time: new Date(Number(r.timestamp ?? 0)).toISOString(),
        open: Number(r.open ?? 0),
        high: Number(r.high ?? 0),
        low: Number(r.low ?? 0),
        close: Number(r.close ?? 0),
        baseVolume: Number(r.base_volume ?? 0),
        tradeCount: Number(r.trade_count ?? 0),
      }))
      .reverse(); // Horizon returns newest-first; hand back chronological.
  } catch {
    return [];
  }
}

/**
 * Roll a window of candles up into a trend/volatility summary + indicators.
 * `resolutionMs` (the candle width) lets windowHours report the TRUE span the
 * stats cover, since Horizon omits empty buckets on thin markets.
 */
export function summarizeCandles(
  candles: Candle[],
  resolutionMs = 3_600_000,
): MarketStats {
  const indicators = computeIndicators(candles);
  const empty: MarketStats = {
    ...indicators,
    lastPrice: null,
    change24hPct: null,
    high24h: null,
    low24h: null,
    baseVolume24h: null,
    tradeCount24h: null,
    windowHours: null,
  };
  const first = candles[0];
  const last = candles[candles.length - 1];
  if (!first || !last) return empty;

  const high = Math.max(...candles.map((c) => c.high));
  const low = Math.min(...candles.map((c) => c.low));
  const baseVolume = candles.reduce((s, c) => s + c.baseVolume, 0);
  const tradeCount = candles.reduce((s, c) => s + c.tradeCount, 0);
  const change =
    first.open > 0 ? ((last.close - first.open) / first.open) * 100 : null;

  const t0 = Date.parse(first.time);
  const t1 = Date.parse(last.time);
  const windowHours =
    Number.isFinite(t0) && Number.isFinite(t1)
      ? Number(((t1 - t0 + resolutionMs) / 3_600_000).toFixed(1))
      : null;

  return {
    ...indicators,
    lastPrice: last.close,
    change24hPct: change,
    high24h: high,
    low24h: low,
    baseVolume24h: baseVolume,
    tradeCount24h: tradeCount,
    windowHours,
  };
}

/**
 * Numeric orderbook levels with amounts normalized to BASE units, best-first -
 * the shape walkBook() and the policy engine's size-aware slippage check need.
 * Horizon convention: ask amounts are already in the base asset; bid amounts
 * are in the COUNTER (quote) asset, so they are converted via the level price.
 */
export function bookLevelsBase(snap: MarketSnapshot): {
  bids: BookLevel[];
  asks: BookLevel[];
} {
  const asks: BookLevel[] = snap.asks
    .map((a) => ({ price: Number(a.price), amount: Number(a.amount) }))
    .filter((l) => l.price > 0 && l.amount > 0);
  const bids: BookLevel[] = snap.bids
    .map((b) => {
      const price = Number(b.price);
      const counter = Number(b.amount);
      return { price, amount: price > 0 ? counter / price : 0 };
    })
    .filter((l) => l.price > 0 && l.amount > 0);
  return { bids, asks };
}

/**
 * Orderbook + recent trades + 24h summary for the base/quote pair.
 * Prices are quote units per 1 base unit:
 *   asks[0] = lowest price to BUY base, bids[0] = highest price to SELL base.
 */
export async function getMarketSnapshot(
  baseSpec: string,
  quoteSpec: string,
  depth = 10,
): Promise<MarketSnapshot> {
  const base = parseAsset(baseSpec);
  const quote = parseAsset(quoteSpec);

  // Fetch orderbook, recent trades and 24h candles concurrently. The orderbook
  // is the only hard dependency; trades and candles are best-effort (-> []).
  const tradesPromise = horizon
    .trades()
    .forAssetPair(base, quote)
    .order("desc")
    .limit(depth)
    .call()
    .then((t) => t.records as unknown as TradeRecordLike[])
    .catch(() => [] as TradeRecordLike[]);

  const [book, tradeRecords, candles, candles7d] = await Promise.all([
    horizon.orderbook(base, quote).limit(depth).call(),
    tradesPromise,
    getTradeAggregations(baseSpec, quoteSpec, 3_600_000, 24),
    getTradeAggregations(baseSpec, quoteSpec, 86_400_000, 7),
  ]);

  const stats = summarizeCandles(candles);
  const stats7d =
    candles7d.length > 0 ? summarizeCandles(candles7d, 86_400_000) : null;

  const bids: OrderbookLevel[] = book.bids.map((b) => ({
    price: b.price,
    amount: b.amount,
  }));
  const asks: OrderbookLevel[] = book.asks.map((a) => ({
    price: a.price,
    amount: a.amount,
  }));

  const bestBid = bids[0] ? Number(bids[0].price) : null;
  const bestAsk = asks[0] ? Number(asks[0].price) : null;
  const spreadBps =
    bestBid !== null && bestAsk !== null && bestAsk > 0
      ? ((bestAsk - bestBid) / bestAsk) * 10_000
      : null;

  const recentTrades: RecentTrade[] = tradeRecords.map((t) => ({
    id: String(t.id ?? ""),
    price: fracToDecimal(t.price),
    baseAmount: t.base_amount ?? "",
    counterAmount: t.counter_amount ?? "",
    ledgerCloseTime: t.ledger_close_time ?? "",
    baseIsSeller: t.base_is_seller,
  }));

  const flowBuyPct = takerBuyPct(
    recentTrades.map((t) => ({
      baseAmount: Number(t.baseAmount),
      baseIsSeller: t.baseIsSeller,
    })),
  );

  return {
    base: baseSpec,
    quote: quoteSpec,
    bestBid,
    bestAsk,
    spreadBps,
    stats,
    stats7d,
    bids,
    asks,
    recentTrades,
    flowBuyPct,
  };
}
