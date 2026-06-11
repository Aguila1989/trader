// Curated universe of reputable Stellar credit assets to scan against XLM.
//
// "Scan the entire chain" is deliberately narrowed to a hand-picked set of
// well-known, creditable tokens rather than every asset Horizon knows about
// (the long tail is mostly dust, scams and dead issuers). Override the set
// with the SCAN_ASSETS env var (comma-separated "CODE:ISSUER").
//
// These are MAINNET (public network) issuers. On testnet they will not exist,
// so a scan there simply finds no liquid markets unless you supply your own
// SCAN_ASSETS. Markets with no orderbook are skipped gracefully either way.
//
// Every issuer below was verified against the live Stellar ledger: it is the
// DOMINANT issuer of its code (most trustlines + supply on Horizon) and its
// account resolves to the project's real home_domain. It also has a live XLM
// order book. Re-verify before adding a new token - a wrong issuer can point
// at a scam clone of a well-known ticker.

export type CuratedTier = "high" | "low";

export interface CuratedAsset {
  /** Canonical "CODE:ISSUER" spec used everywhere else in the app. */
  spec: string;
  /** Human label for logs / UI. */
  label: string;
  /**
   * Risk tier that drives the per-trade size cap:
   *  - "high": deep, low-volatility blue-chips (fiat stablecoins). A larger
   *    clip is the SAFEST place to size up, so they get MAX_AMOUNT_PER_TRADE_HIGH.
   *  - "low": smaller-cap / more volatile / exotic-fiat tokens. Kept to the
   *    standard MAX_AMOUNT_PER_TRADE so a thin book can't be over-traded.
   */
  tier: CuratedTier;
}

export const CURATED_SCAN_ASSETS: CuratedAsset[] = [
  // --- High tier: deep, fiat-backed Circle stablecoins -------------------
  {
    spec: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    label: "USD Coin (circle.com)",
    tier: "high",
  },
  {
    spec: "EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2",
    label: "Euro Coin (circle.com)",
    tier: "high",
  },

  // --- Low tier: reputable but smaller-cap / more volatile ---------------
  {
    spec: "AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    label: "Aquarius (aqua.network)",
    tier: "low",
  },
  {
    spec: "yXLM:GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55",
    label: "Ultra yield XLM (ultracapital.xyz)",
    tier: "low",
  },
  {
    spec: "yUSDC:GDGTVWSM4MGS4T7Z6W4RPWOCHE2I6RDFCIFZGS3DOA63LWQTRNZNTTFF",
    label: "Ultra yield USDC (ultracapital.xyz)",
    tier: "low",
  },
  {
    spec: "SHX:GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH",
    label: "Stronghold SHx (stronghold.co)",
    tier: "low",
  },
  {
    spec: "ARST:GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG",
    label: "Argentine Peso anchor (latamex.com)",
    tier: "low",
  },
  {
    spec: "NGNT:GAWODAROMJ33V5YDFY3NPYTHVYQG7MJXVJ2ND3AOGIHYRWINES6ACCPD",
    label: "Nigerian Naira anchor (cowrie.exchange)",
    tier: "low",
  },
  {
    spec: "LSP:GAB7STHVD5BDH3EEYXPI3OM7PCS4V443PYB5FNT6CFGJVPDLMKDM24WK",
    label: "Lumenswap (lumenswap.io)",
    tier: "low",
  },
  {
    spec: "AFR:GBX6YI45VU7WNAAKA3RBFDR3I3UKNFHTJPQ5F6KOOKSGYIAM4TRQN54W",
    label: "Afreum (afreum.com)",
    tier: "low",
  },
];

/** Upper-cased spec -> tier, for case-insensitive lookups. */
const TIER_BY_SPEC = new Map<string, CuratedTier>(
  CURATED_SCAN_ASSETS.map((a) => [a.spec.toUpperCase(), a.tier]),
);

/**
 * Tier of a curated asset by its "CODE:ISSUER" spec, or undefined when the
 * asset is not in the curated set (e.g. a custom SCAN_ASSETS entry). Callers
 * treat "unknown" as the conservative low tier.
 */
export function curatedTier(spec: string): CuratedTier | undefined {
  return TIER_BY_SPEC.get(spec.trim().toUpperCase());
}

/** Specs of the high-tier (larger-size) assets, for prompt/UI hints. */
export function highTierSpecs(): string[] {
  return CURATED_SCAN_ASSETS.filter((a) => a.tier === "high").map((a) => a.spec);
}

/** One non-XLM-based market the chain scan checks (e.g. USDC/EURC). */
export interface ScanPair {
  base: string;
  quote: string;
}

/**
 * Default CROSS pairs scanned alongside the XLM-based markets. Both verified
 * liquid on the live ledger (tight spread + real daily flow):
 *  - USDC/EURC: a EUR/USD fx proxy - moves on the fx rate, not on XLM, so it
 *    is a genuinely independent opportunity stream.
 *  - yUSDC/USDC: a redeemable PEG pair that should sit near 1.0 - bounded
 *    mean-reversion with a fundamental anchor. (Its XLM book is dead wide;
 *    its real liquidity lives against USDC, which an XLM-only scan misses.)
 */
const DEFAULT_SCAN_PAIRS = "USDC/EURC,yUSDC/USDC";

/** Curated spec lookup by bare code ("USDC" -> "USDC:GA5Z..."). */
const SPEC_BY_CODE = new Map<string, string>(
  CURATED_SCAN_ASSETS.map((a) => [a.spec.split(":")[0]!.toUpperCase(), a.spec]),
);

/**
 * Resolve SCAN_PAIRS ("BASE/QUOTE" comma-separated; legs are full
 * "CODE:ISSUER" specs, bare curated codes, or "XLM") into scan pairs.
 * Empty input uses the verified defaults; "none"/"off" disables cross pairs.
 */
export function resolveScanPairs(raw: string): ScanPair[] {
  const trimmed = raw.trim();
  if (["none", "off", "0"].includes(trimmed.toLowerCase())) return [];
  const src = trimmed || DEFAULT_SCAN_PAIRS;

  const resolveLeg = (s: string | undefined): string | null => {
    const t = (s ?? "").trim();
    if (!t) return null;
    if (t.toUpperCase() === "XLM" || t.toLowerCase() === "native") return "XLM";
    if (t.includes(":")) return t;
    return SPEC_BY_CODE.get(t.toUpperCase()) ?? null;
  };

  const out: ScanPair[] = [];
  const seen = new Set<string>();
  for (const part of src.split(",")) {
    const [b, q] = part.split("/");
    const base = resolveLeg(b);
    const quote = resolveLeg(q);
    if (!base || !quote) continue;
    if (base.toUpperCase() === quote.toUpperCase()) continue;
    const key = `${base}/${quote}`.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ base, quote });
  }
  return out;
}

/**
 * Resolve the scan universe from a raw SCAN_ASSETS string (or the curated
 * default when empty). Returns canonical specs, de-duplicated, with XLM
 * removed (XLM is always the base leg of a scan, never a scanned quote).
 */
export function resolveScanAssets(raw: string): string[] {
  const specs = raw.trim()
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : CURATED_SCAN_ASSETS.map((a) => a.spec);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of specs) {
    if (s.toUpperCase() === "XLM" || s.toLowerCase() === "native") continue;
    const key = s.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
