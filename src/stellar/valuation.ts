// Wallet valuation: turn raw balances into per-token + total value.
//
// Kept SEPARATE from the HTTP/display layer (server.ts) and from the raw price
// fetchers (market.ts) so the same priced-portfolio logic can be reused
// elsewhere (CLI, monitor, future endpoints). Pricing is USDC-primary: each
// holding is valued in USDC when a route exists, with an XLM-equivalent always
// computed against the (deep) XLM book, and null when neither is available.

import { getBalances, getMidPrice } from "./market";
import { USDC_SPEC } from "./universe";

/** One holding, valued in both USDC and XLM where a market exists. */
export interface PricedHolding {
  /** "XLM" or "CODE:ISSUER". */
  asset: string;
  /** Raw balance string from Horizon. */
  balance: string;
  /** Price of ONE unit in USDC, or null when no USD route exists. */
  priceUsd: number | null;
  /** Price of ONE unit in XLM, or null when the asset can't be priced. */
  priceXlm: number | null;
  /** balance × priceUsd, or null. */
  usdValue: number | null;
  /** balance × priceXlm, or null (kept for backward-compat with the old API). */
  xlmValue: number | null;
}

export interface PricedPortfolio {
  holdings: PricedHolding[];
  /** Sum of xlmValue over priced holdings. */
  totalXlm: number;
  /** Sum of usdValue, or null when nothing could be priced in USD. */
  totalUsd: number | null;
  /** USDC per 1 XLM (the conversion rate), or null when unavailable. */
  xlmPriceUsd: number | null;
  /** ISO timestamp the snapshot was computed. */
  updatedAt: string;
}

const USDC_UP = USDC_SPEC.toUpperCase();

function round(n: number | null, dp: number): number | null {
  if (n == null || !Number.isFinite(n)) return null;
  return Number(n.toFixed(dp));
}

/**
 * Price one funded holding. `xlmPriceUsd` (USDC per XLM) is fetched once by the
 * caller and threaded in so we never refetch it per holding. We compute the
 * XLM-per-unit price first (the XLM book is the deepest on Stellar and matches
 * the legacy /api/portfolio valuation), then derive USD from the XLM rate. For
 * a USDC-only token with no XLM book we fall back to its direct USDC market.
 */
async function priceHolding(
  asset: string,
  balance: string,
  xlmPriceUsd: number | null,
): Promise<PricedHolding> {
  const bal = Number(balance);
  let priceXlm: number | null = null;

  const up = asset.toUpperCase();
  if (up === "XLM" || up === "NATIVE") {
    priceXlm = 1;
  } else if (up === USDC_UP) {
    // 1 USDC is worth 1/(USDC per XLM) XLM.
    priceXlm =
      xlmPriceUsd && xlmPriceUsd > 0
        ? 1 / xlmPriceUsd
        : await getMidPrice(asset, "XLM");
  } else {
    // Primary: value against the XLM book (units of XLM per 1 token).
    priceXlm = await getMidPrice(asset, "XLM");
    if (priceXlm == null && xlmPriceUsd && xlmPriceUsd > 0) {
      // Fallback: no XLM book — price directly in USDC, convert to XLM.
      const pUsd = await getMidPrice(asset, USDC_SPEC);
      if (pUsd != null) priceXlm = pUsd / xlmPriceUsd;
    }
  }

  // USDC is the unit of account: pin it to 1 directly rather than deriving it
  // from the XLM rate (which may be momentarily unavailable / null on testnet).
  const priceUsd =
    up === USDC_UP
      ? 1
      : priceXlm != null && xlmPriceUsd != null
        ? priceXlm * xlmPriceUsd
        : null;

  return {
    asset,
    balance,
    priceUsd: round(priceUsd, 7),
    priceXlm: round(priceXlm, 7),
    usdValue: priceUsd != null ? round(bal * priceUsd, 2) : null,
    xlmValue: priceXlm != null ? round(bal * priceXlm, 7) : null,
  };
}

/**
 * Value an account's funded balances. Liquidity-pool shares (LP:*) and zero
 * balances are excluded. Best-effort: an unpriceable asset comes back with null
 * prices/values rather than failing the whole call.
 */
export async function getPricedPortfolio(
  accountId: string,
): Promise<PricedPortfolio> {
  const balances = await getBalances(accountId);
  const funded = balances.filter(
    (b) => Number(b.balance) > 0 && !b.asset.startsWith("LP:"),
  );

  // USDC per 1 XLM — the single conversion rate everything routes through.
  // null on networks without a Circle-USDC market (e.g. testnet).
  const xlmPriceUsd = await getMidPrice("XLM", USDC_SPEC);

  const holdings = await Promise.all(
    funded.map((b) => priceHolding(b.asset, b.balance, xlmPriceUsd)),
  );

  const totalXlm = holdings.reduce((s, h) => s + (h.xlmValue ?? 0), 0);
  const anyUsd = holdings.some((h) => h.usdValue != null);
  const totalUsd = anyUsd
    ? holdings.reduce((s, h) => s + (h.usdValue ?? 0), 0)
    : null;

  return {
    holdings,
    totalXlm: Number(totalXlm.toFixed(7)),
    totalUsd: totalUsd != null ? Number(totalUsd.toFixed(2)) : null,
    xlmPriceUsd: round(xlmPriceUsd, 7),
    updatedAt: new Date().toISOString(),
  };
}
