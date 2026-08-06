/**
 * Hyperliquid public "info" REST client (read-only, no auth/signing).
 *
 * One JSON-shaped endpoint (`POST {baseUrl}/info`) serves every read here -
 * the `type` field in the body selects the query. This module's only job is
 * to shape each request and convert Hyperliquid's wire response into the
 * repo's OWN types (BookLevel, the stellar/market Candle shape, OpenOrder) at
 * the boundary, so nothing upstream (orchestrator, monitor, indicators) ever
 * needs to know Hyperliquid's field abbreviations ("px"/"sz"/"szi"/...).
 *
 * Base URL is passed in by the caller (this module never imports
 * src/config.ts) - mainnet/testnet both speak the same shapes, they just
 * live at different hosts.
 *
 * Wire shapes below are sourced from Hyperliquid's public API docs and have
 * NOT been exercised against a live response in this build - assumptions are
 * marked `// TODO(hl-verify)`.
 */
import { postJson } from "./http";
import type { BookLevel, OpenOrder } from "../types";
import type { Candle } from "../../stellar/market";

export interface HyperliquidInfoOpts {
  /** Dependency-injection seam for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
  /** Abort after this many ms. Default 8_000 (http.ts's default). */
  timeoutMs?: number;
  /** Total attempts including the first. Default 3 (http.ts's default);
   *  reads are idempotent so retrying is safe. */
  maxAttempts?: number;
  /** Base backoff delay in ms between retries. Default 250 (http.ts's
   *  default); tests pass 0 to keep the suite fast. */
  retryBaseMs?: number;
}

/** POST the `/info` endpoint with a `{type: ...}` body. */
function postInfo<T>(baseUrl: string, body: Record<string, unknown>, opts: HyperliquidInfoOpts = {}): Promise<T> {
  return postJson<T>(`${baseUrl}/info`, body, {
    fetchImpl: opts.fetchImpl,
    timeoutMs: opts.timeoutMs,
    maxAttempts: opts.maxAttempts,
    retryBaseMs: opts.retryBaseMs,
  });
}

/* ------------------------------------------------------------------ *
 * meta / universe
 * ------------------------------------------------------------------ */

/** One tradable asset's metadata + its position (index) in the universe
 *  array - the index IS the wire "asset index" (`a` field) every order/
 *  cancel/modify action addresses it by, so callers must resolve it from
 *  here (or cache it) before placing an order. */
export interface HyperliquidAssetMeta {
  /** Position in the universe array = the wire "asset index". */
  index: number;
  name: string;
  szDecimals: number;
  maxLeverage: number | null;
  onlyIsolated: boolean;
  isDelisted: boolean;
}

// TODO(hl-verify): field names taken from public docs, not exercised against
// a live response in this build. `maxLeverage`/`onlyIsolated`/`isDelisted`
// are documented as optional on the wire; the defaults below assume a
// cross-margin, non-isolated, non-delisted asset when they're absent.
interface RawUniverseEntry {
  name: string;
  szDecimals: number;
  maxLeverage?: number;
  onlyIsolated?: boolean;
  isDelisted?: boolean;
}
interface RawMeta {
  universe: RawUniverseEntry[];
}

/** Perpetuals metadata: the full asset universe with each asset's wire index
 *  + szDecimals (needed to round order sizes before signing). */
export async function getMeta(baseUrl: string, opts: HyperliquidInfoOpts = {}): Promise<HyperliquidAssetMeta[]> {
  const raw = await postInfo<RawMeta>(baseUrl, { type: "meta" }, opts);
  return raw.universe.map((u, index) => ({
    index,
    name: u.name,
    szDecimals: u.szDecimals,
    maxLeverage: u.maxLeverage ?? null,
    onlyIsolated: u.onlyIsolated ?? false,
    isDelisted: u.isDelisted ?? false,
  }));
}

/* ------------------------------------------------------------------ *
 * L2 order book
 * ------------------------------------------------------------------ */

interface RawBookLevel {
  px: string;
  sz: string;
  n: number;
}
interface RawL2Book {
  coin: string;
  time: number;
  levels: [RawBookLevel[], RawBookLevel[]];
}

/** Order book for `coin`, converted to the repo's BookLevel[] shape (numeric
 *  price/amount). Hyperliquid already returns each side best-first. */
export async function getL2Book(
  baseUrl: string,
  coin: string,
  opts: HyperliquidInfoOpts = {},
): Promise<{ bids: BookLevel[]; asks: BookLevel[] }> {
  const raw = await postInfo<RawL2Book>(baseUrl, { type: "l2Book", coin, nSigFigs: null, mantissa: null }, opts);
  const [bidLevels, askLevels] = raw.levels;
  const toLevel = (l: RawBookLevel): BookLevel => ({ price: Number(l.px), amount: Number(l.sz) });
  return { bids: (bidLevels ?? []).map(toLevel), asks: (askLevels ?? []).map(toLevel) };
}

/* ------------------------------------------------------------------ *
 * Candles
 * ------------------------------------------------------------------ */

/** Interval strings Hyperliquid's candleSnapshot accepts (per public docs). */
export type HyperliquidCandleInterval =
  | "1m" | "3m" | "5m" | "15m" | "30m"
  | "1h" | "2h" | "4h" | "8h" | "12h"
  | "1d" | "3d" | "1w" | "1M";

interface RawCandle {
  t: number;
  T: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
  n: number;
  i: string;
  s: string;
}

/**
 * Recent OHLC candles for `coin`, converted to the repo's Candle shape
 * (stellar/market.ts). `open/high/low/close/baseVolume` are exactly the
 * subset src/stellar/indicators.ts's `OhlcCandle` needs for computeIndicators
 * - `time`/`tradeCount` ride along unused by the indicator math, same as the
 * Stellar candles do.
 */
export async function getCandles(
  baseUrl: string,
  coin: string,
  interval: HyperliquidCandleInterval,
  startTime: number,
  endTime: number,
  opts: HyperliquidInfoOpts = {},
): Promise<Candle[]> {
  const raw = await postInfo<RawCandle[]>(
    baseUrl,
    { type: "candleSnapshot", req: { coin, interval, startTime, endTime } },
    opts,
  );
  return raw.map((c) => ({
    time: new Date(c.t).toISOString(),
    open: Number(c.o),
    high: Number(c.h),
    low: Number(c.l),
    close: Number(c.c),
    baseVolume: Number(c.v),
    tradeCount: c.n,
  }));
}

/* ------------------------------------------------------------------ *
 * Mids
 * ------------------------------------------------------------------ */

/** Mid price for every listed coin, as a coin -> number map. */
export async function getAllMids(baseUrl: string, opts: HyperliquidInfoOpts = {}): Promise<Record<string, number>> {
  const raw = await postInfo<Record<string, string>>(baseUrl, { type: "allMids", dex: "" }, opts);
  const out: Record<string, number> = {};
  for (const [coin, px] of Object.entries(raw)) out[coin] = Number(px);
  return out;
}

/* ------------------------------------------------------------------ *
 * Funding (current + predicted)
 * ------------------------------------------------------------------ */

interface RawAssetCtx {
  funding: string;
  markPx: string;
  oraclePx: string;
}
// metaAndAssetCtxs replies [meta, assetCtxs[]] - assetCtxs[i] lines up 1:1
// with meta.universe[i] (same order, same index used everywhere else).
type RawMetaAndAssetCtxs = [RawMeta, RawAssetCtx[]];

export interface HyperliquidFundingRate {
  coin: string;
  /** Current funding rate as a fraction (e.g. 0.0001 = 1bp per interval). */
  fundingRate: number;
  markPx: number;
  oraclePx: number;
}

/**
 * Current funding rate for `coin`, read off `metaAndAssetCtxs` (one call
 * returns every asset's context - callers scanning multiple coins should
 * fetch once and filter rather than calling this per-coin in a loop).
 */
export async function getFundingRate(
  baseUrl: string,
  coin: string,
  opts: HyperliquidInfoOpts = {},
): Promise<HyperliquidFundingRate> {
  const [meta, ctxs] = await postInfo<RawMetaAndAssetCtxs>(baseUrl, { type: "metaAndAssetCtxs" }, opts);
  const index = meta.universe.findIndex((u) => u.name === coin);
  const ctx = index >= 0 ? ctxs[index] : undefined;
  if (!ctx) throw new Error(`Hyperliquid: no asset context for coin "${coin}"`);
  return { coin, fundingRate: Number(ctx.funding), markPx: Number(ctx.markPx), oraclePx: Number(ctx.oraclePx) };
}

// TODO(hl-verify): the venue key for Hyperliquid's own perp market inside
// predictedFundings. Public docs list example venue names "HlPerp",
// "BinPerp", "BybitPerp" without pinning down the canonical Hyperliquid one;
// "HlPerp" is assumed here - confirm against a live response before using
// this for anything execution-sensitive.
const HL_PERP_VENUE = "HlPerp";
type RawPredictedFunding = [string, [string, { fundingRate: string; nextFundingTime: number }][]][];

/** Hyperliquid's own predicted next funding rate for `coin` (null when the
 *  coin, or the HL_PERP_VENUE venue within it, isn't present). */
export async function getPredictedFunding(
  baseUrl: string,
  coin: string,
  opts: HyperliquidInfoOpts = {},
): Promise<number | null> {
  const raw = await postInfo<RawPredictedFunding>(baseUrl, { type: "predictedFundings" }, opts);
  const entry = raw.find(([c]) => c === coin);
  if (!entry) return null;
  const venue = entry[1].find(([name]) => name === HL_PERP_VENUE);
  return venue ? Number(venue[1].fundingRate) : null;
}

/* ------------------------------------------------------------------ *
 * User state: positions + balances
 * ------------------------------------------------------------------ */

interface RawPosition {
  coin: string;
  szi: string;
  entryPx: string | null;
  positionValue: string;
  unrealizedPnl: string;
  liquidationPx: string | null;
}
interface RawAssetPosition {
  type: string;
  position: RawPosition;
}
interface RawClearinghouseState {
  marginSummary: { accountValue: string; totalMarginUsed: string; totalNtlPos: string; totalRawUsd: string };
  withdrawable: string;
  assetPositions: RawAssetPosition[];
}

export interface HyperliquidPosition {
  coin: string;
  /** Signed size (+ long, - short) - mirrors PositionSummary.netQty's sign convention. */
  size: number;
  entryPx: number | null;
  positionValue: number;
  unrealizedPnl: number;
  liquidationPx: number | null;
}

export interface HyperliquidUserState {
  accountValue: number;
  /** USDC available to withdraw / free to size new orders with. */
  withdrawable: number;
  positions: HyperliquidPosition[];
}

/**
 * Perp account summary for `address`: margin account value, withdrawable
 * USDC, and open positions (zero-size legs dropped). There is no per-asset
 * spot "Balance[]" here in the Stellar sense - Hyperliquid perps margin
 * against one USDC account - so this returns its own neutral shape rather
 * than forcing a mismatched fit through the repo's Balance type.
 */
export async function getUserState(
  baseUrl: string,
  address: string,
  opts: HyperliquidInfoOpts = {},
): Promise<HyperliquidUserState> {
  const raw = await postInfo<RawClearinghouseState>(baseUrl, { type: "clearinghouseState", user: address }, opts);
  return {
    accountValue: Number(raw.marginSummary.accountValue),
    withdrawable: Number(raw.withdrawable),
    positions: raw.assetPositions
      .map((ap) => ap.position)
      .filter((p) => Number(p.szi) !== 0)
      .map((p) => ({
        coin: p.coin,
        size: Number(p.szi),
        entryPx: p.entryPx != null ? Number(p.entryPx) : null,
        positionValue: Number(p.positionValue),
        unrealizedPnl: Number(p.unrealizedPnl),
        liquidationPx: p.liquidationPx != null ? Number(p.liquidationPx) : null,
      })),
  };
}

/* ------------------------------------------------------------------ *
 * Open orders
 * ------------------------------------------------------------------ */

interface RawOpenOrder {
  coin: string;
  side: "B" | "A";
  limitPx: string;
  sz: string;
  oid: number;
  timestamp: number;
}

// TODO(hl-verify): Hyperliquid perp orders trade a `coin` against USD margin,
// not a Stellar-style base/quote asset pair. OpenOrder.sellAsset/buyAsset are
// pair-shaped, so this maps side B(uy)/A(sk) onto a synthetic "USD" quote
// leg - confirm this reads sanely once real orders exist, and revisit if the
// eventual adapter also trades Hyperliquid SPOT (different coin naming/
// index space from perps).
const HL_QUOTE_PLACEHOLDER = "USD";

/** Resting orders for `address`, converted to the repo's OpenOrder shape.
 *  `id` is the numeric `oid` (not a client order id) - cancel/modify address
 *  orders by oid on the public API. */
export async function getOpenOrders(
  baseUrl: string,
  address: string,
  opts: HyperliquidInfoOpts = {},
): Promise<OpenOrder[]> {
  const raw = await postInfo<RawOpenOrder[]>(baseUrl, { type: "openOrders", user: address, dex: "" }, opts);
  return raw.map((o) => ({
    id: String(o.oid),
    sellAsset: o.side === "A" ? o.coin : HL_QUOTE_PLACEHOLDER,
    buyAsset: o.side === "A" ? HL_QUOTE_PLACEHOLDER : o.coin,
    amount: o.sz,
    price: o.limitPx,
    lastModified: new Date(o.timestamp).toISOString(),
  }));
}
