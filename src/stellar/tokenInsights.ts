import { StellarToml } from "@stellar/stellar-sdk";
import {
  getTradeAggregations,
  getOrderbook,
  getAssetStat,
  getIssuerHomeDomain,
  countRecentTraders,
} from "./market";
import { assertDnsPublic } from "./safeHost";
import type { PriceTrend, TokenRawData, TokenTomlMeta } from "../types";

/**
 * Feature 4 — per-token data collector for the weekly trustline scan.
 *
 * Decoupled from trading, exactly like liquidity/scan.ts: it only READS Horizon
 * (and the issuer's stellar.toml) and returns the raw metrics the AI scores. It
 * builds NOTHING on-chain and imports no orchestrator/policy/signer code.
 *
 * Everything is best-effort: each Horizon / TOML lookup is wrapped so one slow
 * or missing source degrades a single field to null rather than failing the
 * whole token (a missing TOML, for instance, becomes the `tomlMissing` red-flag
 * input rather than an exception).
 */

const QUOTE = "XLM";
/** 7-day % move above/below which the trend is "up"/"down" (else "stable"). */
const TREND_PCT = 5;

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/** Read a string field from the loose TOML object (resolver returns `unknown`). */
function tomlStr(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Resolve project metadata from a home domain's stellar.toml. Reuses the SAME
 * SEC-06 guard as resolveIssuerByDomain (DNS-public check + https-only + 20s
 * timeout) so a user/issuer-controlled domain can't be used to probe internal
 * hosts or tarpit us. Returns null when nothing useful is published.
 */
export async function fetchTomlMeta(
  homeDomain: string,
  code: string,
): Promise<TokenTomlMeta | null> {
  await assertDnsPublic(homeDomain); // SEC-06: refuse IP-literals / private-resolving hosts
  const toml = (await StellarToml.Resolver.resolve(homeDomain.trim(), {
    allowHttp: false,
    timeout: 20_000,
  })) as Record<string, unknown>;

  const docs = (toml.DOCUMENTATION ?? {}) as Record<string, unknown>;
  const currencies = (toml.CURRENCIES ?? []) as Array<Record<string, unknown>>;
  const cur =
    currencies.find(
      (c) => tomlStr(c.code)?.toUpperCase() === code.trim().toUpperCase(),
    ) ?? {};

  // Documentation + social links worth surfacing on a suggestion card.
  const links: string[] = [];
  for (const key of ["ORG_URL", "ORG_GITHUB", "ORG_TWITTER", "ORG_OFFICIAL_EMAIL"]) {
    const v = tomlStr(docs[key]);
    if (v && !links.includes(v)) links.push(v);
  }

  const meta: TokenTomlMeta = {
    ...(tomlStr(docs.ORG_NAME) || tomlStr(docs.ORG_DBA) || tomlStr(cur.name)
      ? { projectName: tomlStr(docs.ORG_NAME) || tomlStr(docs.ORG_DBA) || tomlStr(cur.name) }
      : {}),
    ...(tomlStr(cur.desc) || tomlStr(docs.ORG_DESCRIPTION)
      ? { description: tomlStr(cur.desc) || tomlStr(docs.ORG_DESCRIPTION) }
      : {}),
    ...(tomlStr(docs.ORG_URL) ? { website: tomlStr(docs.ORG_URL) } : {}),
    ...(tomlStr(cur.conditions) ? { conditions: tomlStr(cur.conditions) } : {}),
    ...(tomlStr(cur.image) ? { image: tomlStr(cur.image) } : {}),
    ...(links.length ? { links } : {}),
  };

  // Only return metadata when the TOML actually carried something useful;
  // an empty object would mask a content-free TOML as "documented".
  return Object.keys(meta).length > 0 ? meta : null;
}

/**
 * Collect the full raw-data snapshot for one token (vs XLM). Independent Horizon
 * reads run concurrently; the issuer-account + TOML lookups run after (they need
 * the home_domain). Never throws - returns a TokenRawData with nulls for the
 * fields it couldn't measure.
 */
export async function collectTokenInsight(asset: string): Promise<TokenRawData> {
  const [code = asset, issuer = ""] = asset.split(":");

  const [candles24, candles7, book, stat, activeTraders] = await Promise.all([
    getTradeAggregations(asset, QUOTE, 3_600_000, 24).catch(() => []),
    getTradeAggregations(asset, QUOTE, 86_400_000, 7).catch(() => []),
    getOrderbook(asset, QUOTE, 10).catch(() => null),
    issuer ? getAssetStat(code, issuer).catch(() => null) : Promise.resolve(null),
    countRecentTraders(asset, QUOTE).catch(() => null),
  ]);

  const volume24h = candles24.length
    ? round7(candles24.reduce((s, c) => s + (c.baseVolume || 0), 0))
    : null;
  const volume7d = candles7.length
    ? round7(candles7.reduce((s, c) => s + (c.baseVolume || 0), 0))
    : null;

  // 7-day trend from the daily window's first open -> last close.
  let priceTrend7d: PriceTrend | null = null;
  if (candles7.length >= 2) {
    const first = candles7[0]!.open;
    const last = candles7[candles7.length - 1]!.close;
    if (first > 0) {
      const chgPct = ((last - first) / first) * 100;
      priceTrend7d = chgPct > TREND_PCT ? "up" : chgPct < -TREND_PCT ? "down" : "stable";
    }
  }

  // Depth = sum of the top-10 ask + bid amounts in BASE units (ask amounts are
  // already base; bid amounts are in the quote, so divide by the level price).
  let orderBookDepth: number | null = null;
  let spreadPct: number | null = null;
  if (book) {
    const askSum = book.asks.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const bidSum = book.bids.reduce((s, b) => {
      const price = Number(b.price) || 0;
      const amt = Number(b.amount) || 0;
      return s + (price > 0 ? amt / price : 0);
    }, 0);
    orderBookDepth = round7(askSum + bidSum);
    spreadPct = book.spreadBps != null ? round7(book.spreadBps / 100) : null;
  }

  const homeDomain = issuer ? await getIssuerHomeDomain(issuer) : null;
  let toml: TokenTomlMeta | undefined;
  let tomlMissing = true;
  if (homeDomain) {
    try {
      const meta = await fetchTomlMeta(homeDomain, code);
      if (meta) {
        toml = meta;
        tomlMissing = false;
      }
    } catch {
      // Unreachable / private / malformed TOML: leave tomlMissing = true.
    }
  }

  return {
    volume24h,
    volume7d,
    activeTraders,
    orderBookDepth,
    spreadPct,
    priceTrend7d,
    trustlineCount: stat?.numAccounts ?? null,
    homeDomain,
    ...(toml ? { toml } : {}),
    tomlMissing,
  };
}
