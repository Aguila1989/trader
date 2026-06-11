import type { EvolutionPoint, PositionSummary, TradeSide } from "../types";

export type { PositionSummary };

/**
 * Realized-PnL ledger using signed FIFO lot matching, per base/quote pair.
 *
 * Scope + honesty: this measures the realized PnL of the trades THIS system
 * makes (a buy then a later sell, or vice-versa). FIFO matching is done in the
 * pair's quote asset, but every realized delta is then NORMALIZED TO XLM (see
 * realizedToXlm) before it leaves the ledger, so figures from different markets
 * (XLM/USDC vs XLM/NGNT) are summable - 1 USD of profit and 1 Naira of profit
 * are no longer naively added together. It assumes each submitted proposal
 * fills fully at its limit price - the same granularity the rest of the app
 * already uses for volume - and does NOT mark-to-market pre-existing holdings
 * (their cost basis is unknown). It exists primarily to (a) give the analyst
 * feedback on how its calls performed and (b) make the MAX_DAILY_LOSS guard
 * live (it reads daily.realizedPnl, now in XLM).
 */

export interface Fill {
  side: TradeSide;
  base: string;
  quote: string;
  /** Base-asset units, > 0. */
  amount: number;
  /** Quote units per 1 base unit, > 0. */
  price: number;
  /** ISO timestamp (used by computeEvolution / today's-PnL replay). */
  ts?: string;
}

/** A FIFO lot. qty is signed: positive = long base, negative = short base. */
interface Lot {
  qty: number;
  price: number;
}

// Stellar amounts carry 7 decimals; treat anything smaller as zero.
const EPS = 1e-7;

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/**
 * Apply a signed fill (buy = +qty, sell = -qty) to a pair's FIFO lots,
 * matching against opposite-sign lots first. Returns realized PnL (quote units)
 * and mutates `lots` in place.
 */
function applyFill(lots: Lot[], signedQty: number, price: number): number {
  let remaining = signedQty;
  let realized = 0;

  while (Math.abs(remaining) > EPS && lots.length > 0) {
    const lot = lots[0];
    if (!lot) break;
    const opposite =
      (lot.qty > 0 && remaining < 0) || (lot.qty < 0 && remaining > 0);
    if (!opposite) break;

    const matched = Math.min(Math.abs(lot.qty), Math.abs(remaining));
    // Closing a long lot with a sell: gain = (sell - entry) * qty.
    // Closing a short lot with a buy: gain = (entry - buy) * qty.
    realized +=
      lot.qty > 0
        ? (price - lot.price) * matched
        : (lot.price - price) * matched;

    lot.qty += lot.qty > 0 ? -matched : matched;
    remaining += remaining > 0 ? -matched : matched;
    if (Math.abs(lot.qty) < EPS) lots.shift();
  }

  // Anything left opens (or extends) a position at this price.
  if (Math.abs(remaining) > EPS) lots.push({ qty: remaining, price });
  return realized;
}

function signedQty(side: TradeSide, amount: number): number {
  return side === "buy" ? amount : -amount;
}

/** True for the native asset in any spelling ("XLM" / "native"). */
export function isXlmSpec(spec: string): boolean {
  const s = spec.trim().toLowerCase();
  return s === "xlm" || s === "native";
}

/**
 * Best-effort XLM exchange rates (XLM per 1 unit) for non-XLM assets, fed by
 * the chain scan and the position monitor from the live XLM order books they
 * already fetch. This is what lets CROSS-pair figures (USDC/EURC, yUSDC/USDC)
 * convert into the single XLM unit the daily-loss, volume and exposure caps
 * are denominated in - without it, 1 EURC of loss would count as 1 XLM.
 * In-memory only; conversions fall back to the raw value when no rate is
 * known yet (the pre-existing documented cross-pair approximation).
 */
const xlmRates = new Map<string, number>();

export function setXlmRate(spec: string, xlmPerUnit: number): void {
  if (!(xlmPerUnit > 0) || !Number.isFinite(xlmPerUnit) || isXlmSpec(spec)) return;
  xlmRates.set(spec.trim().toUpperCase(), xlmPerUnit);
}

/** XLM per 1 unit of `spec` (1 for XLM itself), or undefined when unknown. */
export function xlmRateFor(spec: string): number | undefined {
  if (isXlmSpec(spec)) return 1;
  return xlmRates.get(spec.trim().toUpperCase());
}

/**
 * XLM-equivalent notional of `amount` BASE units traded at `price` (quote per
 * base). Lets the daily volume cap and the open-exposure cap sum trades across
 * pairs in ONE unit instead of naively adding XLM, USDC and Naira together.
 *  - base is XLM  -> amount IS the XLM notional (every XLM-based scan trade).
 *  - quote is XLM -> amount x price converts.
 *  - neither      -> convert via the live XLM rate map (base rate preferred,
 *                    quote rate via price otherwise); raw amount only when no
 *                    rate is known yet.
 */
export function xlmNotional(
  base: string,
  quote: string,
  amount: number,
  price: number,
): number {
  const abs = Math.abs(amount);
  if (isXlmSpec(base)) return abs;
  if (isXlmSpec(quote) && price > 0) return abs * price;
  const baseRate = xlmRateFor(base);
  if (baseRate !== undefined) return abs * baseRate;
  const quoteRate = xlmRateFor(quote);
  if (quoteRate !== undefined && price > 0) return abs * price * quoteRate;
  return abs;
}

/**
 * Convert a realized PnL delta (expressed in the pair's QUOTE asset) into XLM,
 * so deltas from different markets can be summed and compared against a single
 * XLM-denominated MAX_DAILY_LOSS.
 *
 *  - quote is XLM  -> the delta is already in XLM (e.g. USDC/XLM).
 *  - base is XLM   -> `price` is quote-per-XLM, so 1 quote unit = 1/price XLM
 *                     (e.g. XLM/USDC, XLM/NGNT - the chain-scan shape).
 *  - neither is XLM -> convert via the live XLM rate map (fed by the chain
 *                     scan / monitor from the XLM books). Only when no rate is
 *                     known yet does the raw quote delta pass through - the
 *                     pre-existing documented limitation, now a rare fallback.
 *
 * `price` is the price of the fill that realized the PnL - the best single rate
 * we have at the moment of realization.
 */
export function realizedToXlm(
  realizedQuote: number,
  base: string,
  quote: string,
  price: number,
): number {
  if (Math.abs(realizedQuote) < EPS) return 0;
  if (isXlmSpec(quote)) return realizedQuote;
  if (isXlmSpec(base) && price > EPS) return realizedQuote / price;
  const quoteRate = xlmRateFor(quote);
  if (quoteRate !== undefined) return realizedQuote * quoteRate;
  return realizedQuote;
}

function pairKey(base: string, quote: string): string {
  return `${base}/${quote}`;
}

/** Live, process-wide ledger. Rebuilt from persisted history on boot. */
class Ledger {
  private byPair = new Map<string, Lot[]>();

  /** Record a fill; returns realized PnL delta normalized to XLM. */
  recordFill(f: Fill): number {
    const key = pairKey(f.base, f.quote);
    let lots = this.byPair.get(key);
    if (!lots) {
      lots = [];
      this.byPair.set(key, lots);
    }
    const realizedQuote = applyFill(lots, signedQty(f.side, f.amount), f.price);
    return round7(realizedToXlm(realizedQuote, f.base, f.quote, f.price));
  }

  /** Current open positions from trading (zero-net pairs omitted). */
  positions(): PositionSummary[] {
    const out: PositionSummary[] = [];
    for (const [key, lots] of this.byPair) {
      const netQty = lots.reduce((s, l) => s + l.qty, 0);
      if (Math.abs(netQty) < EPS) continue;
      const totAbs = lots.reduce((s, l) => s + Math.abs(l.qty), 0);
      const avgPrice =
        totAbs > 0
          ? lots.reduce((s, l) => s + Math.abs(l.qty) * l.price, 0) / totAbs
          : 0;
      const [base = "", quote = ""] = key.split("/");
      out.push({
        pair: key,
        base,
        quote,
        netQty: round7(netQty),
        avgPrice: round7(avgPrice),
      });
    }
    return out;
  }

  reset(): void {
    this.byPair.clear();
  }

  /**
   * Reset, then replay fills in order, returning the realized PnL accrued from
   * fills at/after `sinceIso` (used to restore today's realizedPnl on boot).
   */
  replay(fills: Fill[], sinceIso?: string): number {
    this.reset();
    let since = 0;
    for (const f of fills) {
      const delta = this.recordFill(f);
      if (!sinceIso || (f.ts && f.ts >= sinceIso)) since += delta;
    }
    return round7(since);
  }
}

export const ledger = new Ledger();

/**
 * Replay an ordered list of fills through a throwaway ledger to produce the
 * cumulative volume / trade-count / realized-PnL series for the charts.
 */
export function computeEvolution(fills: Fill[]): EvolutionPoint[] {
  const byPair = new Map<string, Lot[]>();
  let vol = 0;
  let count = 0;
  let pnl = 0;
  return fills.map((f) => {
    const key = pairKey(f.base, f.quote);
    let lots = byPair.get(key);
    if (!lots) {
      lots = [];
      byPair.set(key, lots);
    }
    const realizedQuote = applyFill(lots, signedQty(f.side, f.amount), f.price);
    pnl += realizedToXlm(realizedQuote, f.base, f.quote, f.price);
    vol += f.amount;
    count += 1;
    return {
      ts: f.ts ?? "",
      cumulativeVolume: round7(vol),
      cumulativeTrades: count,
      cumulativePnl: round7(pnl),
    };
  });
}
