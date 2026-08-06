import type { Balance } from "../chains/types";
import type { TradeSide } from "../types";
import { isXlmSpec } from "./positions";

/**
 * Two-sided inventory manager (PHASE 3.1 — the MECHANICS fix).
 *
 * Diagnosis (per the repo's own divergence logging, see trading/explain.ts):
 * the overnight watch that "looked" over-cautious ran 40 scans and executed
 * NOTHING, but EVERY skip was PHANTOM — isFundable() requires holding the
 * QUOTE asset to buy and the BASE asset to sell, and an all-XLM wallet simply
 * cannot fund a buy signal on any XLM-quoted pair. There were ZERO real
 * fundable misses. The AI was never the bottleneck; the wallet's one-sided
 * inventory was. This module turns that diagnosis into three pure, I/O-free
 * building blocks:
 *
 *  1. fundabilityReport  — which side(s) of which pairs are fundable RIGHT
 *     NOW, and why not (mirrors explain.ts:isFundable's exact rule, reported
 *     across a whole pair list at once).
 *  2. rebalancePlan      — a minimal-turnover, banded target-inventory model:
 *     hold both legs of a pair at a configurable split (default 50/50) with a
 *     tolerance band, and propose the SMALLEST chain-neutral intent (a
 *     buy/sell on the SAME pair, in the SAME vocabulary a TradeProposal uses)
 *     that brings a drifted pair back to the nearest band edge — never past
 *     it. Every intent is capped by both a per-trade ceiling and a share of
 *     total portfolio value, so a rebalance can never itself become the risk
 *     event it's meant to prevent.
 *  3. explainPhantomSkips — turns a PHANTOM skip into an actionable operator
 *     line: which asset is missing, and (when a matching rebalancePlan intent
 *     exists) exactly how much to move to unlock it.
 *
 * Everything here is a pure function over caller-supplied data: no network,
 * no DB, no chain SDK. Balances/pairs travel as the SAME canonical asset-spec
 * strings ("XLM" | "CODE:ISSUER") every other fundability-adjacent module
 * already assumes (explain.ts:isFundable, orchestrator.ts:walletHeld,
 * MarketSnapshot.base/quote) — canonicalization is the CALLER's job, exactly
 * as it already is for isFundable.
 */

// ------------------------------------------------------------------------
// (a) fundabilityReport — which sides of which pairs are fundable, and why not
// ------------------------------------------------------------------------

export interface PairSpec {
  base: string;
  quote: string;
}

export interface PairFundability {
  base: string;
  quote: string;
  /** Can the wallet fund a BUY (needs the quote asset)? */
  canBuy: boolean;
  /** Can the wallet fund a SELL (needs the base asset)? */
  canSell: boolean;
  /** Set only when canBuy is false. */
  buyBlockedReason?: string;
  /** Set only when canSell is false. */
  sellBlockedReason?: string;
}

export interface FundabilityReport {
  pairs: PairFundability[];
  /** Pairs where NEITHER side is fundable right now. */
  deadPairs: PairSpec[];
  /** Distinct asset specs (display form) held in NONE of the scanned pairs'
   *  legs — the concrete "go acquire these" list. */
  missingAssets: string[];
}

/** Display form: the native asset always reads "XLM", regardless of the
 *  caller's spelling ("XLM" | "native") — mirrors positions.ts:isXlmSpec. */
function displaySpec(spec: string): string {
  return isXlmSpec(spec) ? "XLM" : spec;
}

/** Core fundability logic, shared by both entry points below. `held` decides
 *  whether the wallet has a usable (>0) amount of an asset spec — the SAME
 *  boolean explain.ts:isFundable consults for a single side of a single pair. */
function buildFundabilityReport(
  held: (spec: string) => boolean,
  pairs: PairSpec[],
): FundabilityReport {
  const missing = new Set<string>();
  const deadPairs: PairSpec[] = [];
  const out: PairFundability[] = pairs.map(({ base, quote }) => {
    const hasBase = held(base);
    const hasQuote = held(quote);
    if (!hasBase) missing.add(displaySpec(base));
    if (!hasQuote) missing.add(displaySpec(quote));
    if (!hasBase && !hasQuote) deadPairs.push({ base, quote });
    const entry: PairFundability = { base, quote, canBuy: hasQuote, canSell: hasBase };
    if (!hasQuote) {
      entry.buyBlockedReason = `no ${displaySpec(quote)} held - a BUY spends the quote asset.`;
    }
    if (!hasBase) {
      entry.sellBlockedReason = `no ${displaySpec(base)} held - a SELL spends the base asset.`;
    }
    return entry;
  });
  return { pairs: out, deadPairs, missingAssets: Array.from(missing) };
}

/**
 * Which side(s) of each pair the wallet can currently fund, from a raw
 * balances snapshot (the SAME `Balance[]` shape chains/types.ts's
 * ChainAdapter.getBalances returns). A balance counts as "held" at exactly
 * the same bar orchestrator.ts:walletHeld already uses (`Number(balance) > 0`)
 * so the two never disagree.
 */
export function fundabilityReport(balances: Balance[], pairs: PairSpec[]): FundabilityReport {
  const byAsset = new Map<string, number>();
  for (const b of balances) {
    const key = displaySpec(b.asset);
    byAsset.set(key, (byAsset.get(key) ?? 0) + Number(b.balance));
  }
  const held = (spec: string): boolean => (byAsset.get(displaySpec(spec)) ?? 0) > 0;
  return buildFundabilityReport(held, pairs);
}

/**
 * Twin of `fundabilityReport` for callers that already hold a live "does the
 * wallet have this asset" predicate (e.g. orchestrator.ts's `walletHeld()`
 * closure) instead of a raw balances array — avoids a second balance fetch
 * for what is otherwise the identical report.
 */
export function fundabilityFromPredicate(
  held: (spec: string) => boolean,
  pairs: PairSpec[],
): FundabilityReport {
  return buildFundabilityReport(held, pairs);
}

// ------------------------------------------------------------------------
// (b) target-inventory model + minimal rebalance plan
// ------------------------------------------------------------------------

/** A wallet asset valued in XLM-equivalent terms. This module prices nothing
 *  itself (pure, no I/O) — callers derive `xlmValue` the same way the rest of
 *  the app already does (trading/positions.ts:xlmNotional / xlmRateFor). */
export interface PricedBalance {
  asset: string;
  xlmValue: number;
}

/** Target split for one pair's combined (base+quote) XLM value. */
export interface PairTarget {
  base: string;
  quote: string;
  /** Target share (0-1) of the pair's combined value held as the BASE asset.
   *  0.5 = hold both legs evenly (the default "always fundable both ways"
   *  split); asymmetric targets are fine too. */
  targetBaseSharePct: number;
  /** Tolerance band (0-0.5) either side of the target before a rebalance is
   *  proposed at all - absorbs ordinary price drift so every tick doesn't
   *  trigger churn. */
  bandPct: number;
}

export interface RebalanceLimits {
  /** Hard ceiling on a SINGLE rebalance intent, XLM-equivalent. */
  maxPerRebalanceXlm: number;
  /** Never move more than this share (0-1) of TOTAL portfolio XLM value in
   *  one intent - bounds the blast radius of a rebalance mistake, same
   *  spirit as config.limits.maxOpenExposure. */
  maxPortfolioSharePct: number;
  /** Skip intents smaller than this XLM-equivalent value - not worth the fee
   *  / spread cost of a dust-sized trade. */
  minRebalanceXlm: number;
}

export interface RebalanceIntent {
  base: string;
  quote: string;
  /**
   * "sell" the base for quote (raises quote share, unlocks BUY-fundability on
   * this pair) or "buy" base with quote (raises base share, unlocks
   * SELL-fundability). Same vocabulary a TradeProposal already uses, so this
   * intent can be handed straight to the existing propose/policy pipeline
   * once the caller converts `xlmValue` to a base-asset amount at the live
   * price.
   */
  side: TradeSide;
  /** XLM-equivalent value to move. */
  xlmValue: number;
  reason: string;
}

function normSpec(spec: string): string {
  return isXlmSpec(spec.trim()) ? "XLM" : spec.trim();
}

/**
 * Minimal chain-neutral rebalance plan: for each pair whose base/quote XLM
 * split has drifted outside its band, propose the SMALLEST intent that moves
 * it back to the NEAREST band edge (not all the way to the target) - the
 * standard band-rebalancing minimal-turnover rule, so routine drift doesn't
 * generate maximal churn. A pair already inside its band gets no intent.
 * Every intent is capped by BOTH the per-trade ceiling and the
 * portfolio-share ceiling (whichever is tighter); an intent that would round
 * to below `minRebalanceXlm` after capping is dropped rather than emitted as
 * dust. A pair with zero combined value (neither leg held at all) is a
 * FUNDING gap, not a rebalance - see fundabilityReport/explainPhantomSkips
 * for that case - and is skipped here.
 *
 * Simplifying assumption: moving value between legs is frictionless (no
 * price impact, no fees) - a planning-time approximation. The real fill still
 * goes through the existing policy engine / preflight when executed.
 */
export function rebalancePlan(
  balances: PricedBalance[],
  targets: PairTarget[],
  limits: RebalanceLimits,
): RebalanceIntent[] {
  const valueByAsset = new Map<string, number>();
  for (const b of balances) {
    const key = normSpec(b.asset);
    valueByAsset.set(key, (valueByAsset.get(key) ?? 0) + Math.max(0, b.xlmValue));
  }
  const totalPortfolioXlm = Array.from(valueByAsset.values()).reduce((s, v) => s + v, 0);
  const perTradeCap = Math.max(0, limits.maxPerRebalanceXlm);
  const shareCap = totalPortfolioXlm * Math.max(0, Math.min(1, limits.maxPortfolioSharePct));
  const cap = Math.min(perTradeCap, shareCap);

  const intents: RebalanceIntent[] = [];
  for (const t of targets) {
    const baseVal = valueByAsset.get(normSpec(t.base)) ?? 0;
    const quoteVal = valueByAsset.get(normSpec(t.quote)) ?? 0;
    const pairTotal = baseVal + quoteVal;
    if (pairTotal <= 0) continue; // funding gap, not a rebalance.

    const target = Math.max(0, Math.min(1, t.targetBaseSharePct));
    const band = Math.max(0, Math.min(0.5, t.bandPct));
    const bandHigh = Math.min(1, target + band);
    const bandLow = Math.max(0, target - band);
    const baseShare = baseVal / pairTotal;

    let side: TradeSide;
    let raw: number;
    if (baseShare > bandHigh) {
      // Too much base, not enough quote -> sell base back to the band edge.
      side = "sell";
      raw = baseVal - bandHigh * pairTotal;
    } else if (baseShare < bandLow) {
      // Too little base -> buy base back to the band edge.
      side = "buy";
      raw = bandLow * pairTotal - baseVal;
    } else {
      continue; // inside the band - no churn.
    }

    const sized = Math.min(raw, cap);
    if (sized < limits.minRebalanceXlm) continue;

    intents.push({
      base: t.base,
      quote: t.quote,
      side,
      xlmValue: Number(sized.toFixed(7)),
      reason:
        side === "sell"
          ? `${displaySpec(t.base)} is ${Math.round(baseShare * 100)}% of this pair's value (target ${Math.round(target * 100)}% +/- ${Math.round(band * 100)}pp) - sell some to fund BUY entries here.`
          : `${displaySpec(t.base)} is only ${Math.round(baseShare * 100)}% of this pair's value (target ${Math.round(target * 100)}% +/- ${Math.round(band * 100)}pp) - buy some to fund SELL entries here.`,
    });
  }
  return intents;
}

// ------------------------------------------------------------------------
// (c) explainPhantomSkips — turn "unfundable" into an actionable message
// ------------------------------------------------------------------------

/** A rulebook side the wallet couldn't fund - the exact shape
 *  trading/explain.ts's divergenceNote flags as `phantom`. */
export interface PhantomSkip {
  base: string;
  quote: string;
  side: TradeSide;
}

/**
 * Turn each PHANTOM skip (explain.ts:divergenceNote/isFundable) into an
 * actionable operator line: which asset is missing, and — when a matching
 * rebalancePlan intent exists — exactly how much (XLM-equivalent) to move to
 * unlock it. This is the fix for the diagnosed "AI looks over-cautious" bug:
 * the skip was never a judgment call, it was a wallet-funding gap the
 * operator can close in one trade.
 */
export function explainPhantomSkips(
  skips: PhantomSkip[],
  report: FundabilityReport,
  plan: RebalanceIntent[] = [],
): string[] {
  return skips.map((skip) => {
    const label = `${displaySpec(skip.base)}/${displaySpec(skip.quote)}`;
    const fundability = report.pairs.find((p) => p.base === skip.base && p.quote === skip.quote);
    const stillPhantom = fundability
      ? skip.side === "buy"
        ? !fundability.canBuy
        : !fundability.canSell
      : true; // no matching report entry - unknown, so still worth flagging.

    if (!stillPhantom) {
      return `${label}: rulebook wanted to ${skip.side.toUpperCase()} - the wallet CAN fund this now; this may no longer be a phantom skip, re-check.`;
    }

    const missingAsset = skip.side === "buy" ? skip.quote : skip.base;
    // Buying base is fed by selling base elsewhere / holding more quote is
    // wrong framing - the feeding trade on THIS pair is the opposite side:
    // a SELL raises quote (feeds a future BUY); a BUY raises base (feeds a
    // future SELL).
    const feedingSide: TradeSide = skip.side === "buy" ? "sell" : "buy";
    const match = plan.find(
      (i) =>
        normSpec(i.base) === normSpec(skip.base) &&
        normSpec(i.quote) === normSpec(skip.quote) &&
        i.side === feedingSide,
    );
    const hint = match
      ? ` A rebalance is already queued: ${match.side.toUpperCase()} ~${match.xlmValue} XLM-equivalent on this pair would fund it.`
      : ` Hold some ${displaySpec(missingAsset)} (or run a rebalance) to fund it.`;
    return `${label}: rulebook wanted to ${skip.side.toUpperCase()} but the wallet holds no ${displaySpec(missingAsset)} - PHANTOM skip, not caution.${hint}`;
  });
}
