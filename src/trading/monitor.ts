import { config, isReadOnly } from "../config";
import { store } from "./store";
import { realizedToXlm, setXlmRate } from "./positions";
import {
  getMarketSnapshot,
  getOpenOffers,
  type MarketSnapshot,
} from "../stellar/market";
import { horizon } from "../stellar/client";
import {
  signerPublicKey,
  signAndSubmit,
  fillFromEffects,
} from "../stellar/signer";
import { buildCancelOfferTransaction } from "../stellar/builder";
import {
  recoverRestingOfferId,
  runExclusive,
  submitSystemProposal,
} from "./orchestrator";
import type { ProposedTrade } from "../claude/agent";
import type { PositionSummary, TradeProposal } from "../types";

/**
 * The position monitor: a background loop that owns everything that happens to
 * a trade AFTER submit - the half of the lifecycle the orchestrator doesn't
 * cover. Each tick it:
 *
 *  1. Reconciles RESTING offers: books later fills of a partial order into the
 *     PnL ledger / daily volume (closing the "resting remainders are never
 *     reconciled" gap), and CANCELS offers older than MAX_OFFER_AGE_MINUTES -
 *     a stale resting order is free optionality for the rest of the market.
 *  2. Marks open positions to market and publishes unrealized PnL (which the
 *     policy engine folds into the daily-loss halt + size taper), and proposes
 *     a CLOSING trade when a position breaches its stop distance. The close
 *     runs through the normal policy pipeline: auto-trade submits it, manual
 *     mode queues it for approval.
 *  3. Records +1h / +24h outcome marks on submitted trades, so every call the
 *     analyst makes gets a measurable forward return (per provider/model and
 *     confidence - the data that tells you whether changes actually help).
 *  4. Re-checks trades that FAILED on a submit timeout: if the transaction
 *     landed after the polling window, it is booked instead of silently
 *     leaving real on-chain exposure outside every ledger and cap.
 *
 * Like the autopilot, it is deliberately thin on authority: it never bypasses
 * the policy engine, the kill switch, or the live-trading arm switch. Cancels
 * and closes are submitted through the orchestrator's serial execution lock so
 * they can't race a trade onto the same Horizon sequence number.
 */

const EPS = 1e-7;
/** Min gap between stop-loss attempts on the same pair (avoid re-spam while
 *  a close is pending approval or the market is gapping). */
const STOP_RETRY_MS = 5 * 60_000;
/** How far back the late-landing recheck looks (Horizon retention is ample). */
const RECHECK_WINDOW_MS = 24 * 3_600_000;
/**
 * A proposal stuck in "submitting" longer than this is a crash artifact, not
 * an in-flight submit: the live path resolves within the signer's 120s poll
 * window. Its tx hash was persisted BEFORE the submit, so it can be settled
 * definitively - booked if the tx landed, failed if the timebound expired.
 * Measured from updatedAt (bumped when the hash was persisted at submit
 * start) - NOT createdAt: a manually-approved proposal can legitimately be
 * ~10 min old (maxProposalAgeSeconds) when its submit BEGINS, and treating an
 * in-flight submit as stuck would double-book the trade.
 */
const STUCK_SUBMITTING_MS = 10 * 60_000;

let timer: ReturnType<typeof setTimeout> | null = null;
let stopped = false;
let running = false;

/** pair -> last stop-loss attempt (ms epoch). */
const stopAttempts = new Map<string, number>();
/** Offer ids we've already warned about as untracked (warn once each). */
const warnedOffers = new Set<string>();
/** pair -> last successfully-marked unrealized contribution (XLM). Carried
 *  forward when a pair can't be priced on a tick, so a momentary Horizon /
 *  liquidity gap can't make store.unrealizedPnl spring toward 0 and loosen the
 *  MAX_DAILY_LOSS halt + size taper. Cleared when the book goes flat. */
const lastMark = new Map<string, number>();

function round7(n: number): number {
  return Number(n.toFixed(7));
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

/** Per-tick snapshot cache so positions/marks on the same pair share fetches. */
class SnapCache {
  private cache = new Map<string, Promise<MarketSnapshot | null>>();

  get(base: string, quote: string): Promise<MarketSnapshot | null> {
    const key = `${base}/${quote}`;
    let p = this.cache.get(key);
    if (!p) {
      p = getMarketSnapshot(base, quote, 5).catch(() => null);
      this.cache.set(key, p);
    }
    return p;
  }

  /** Mid price: average of touch, falling back to last trade / one side. */
  async mid(base: string, quote: string): Promise<number | null> {
    const snap = await this.get(base, quote);
    if (!snap) return null;
    if (snap.bestBid != null && snap.bestAsk != null) {
      return (snap.bestBid + snap.bestAsk) / 2;
    }
    return snap.stats.lastPrice ?? snap.bestBid ?? snap.bestAsk ?? null;
  }
}

/* ------------------------------------------------------------------ *
 * 1. Resting-offer reconciliation + stale-offer cancellation
 *
 * MAKER-FIRST: with post_only the EXPECTED case, a resting offer is the normal
 * outcome of an entry, not a fallback - most entries are priced to rest at the
 * touch and capture the spread, so they sit on the book until the market comes
 * to them. recordIncrementalFill books later fills at the proposal's
 * limitPrice, which the orchestrator already overwrote with the actual resting
 * (repriced) maker price before submit - so the ledger books at the price the
 * offer truly rests at, not the analyst's original worst-acceptable bound.
 * ------------------------------------------------------------------ */

/** Base units still open on-chain for a tracked proposal's offer. The on-chain
 *  offer for a BUY proposal sells the QUOTE asset, so its amount converts to
 *  base via the offer's own price (base per quote). */
function remainingBaseOf(
  p: TradeProposal,
  offer: { amount: string; price: string },
): number {
  const amount = Number(offer.amount) || 0;
  if (p.side === "sell") return amount;
  const price = Number(offer.price) || 0;
  return amount * price;
}

/** A trade row from Horizon's per-offer trade history, narrowed. */
interface OfferTradeLike {
  base_asset_type?: string;
  base_asset_code?: string;
  base_asset_issuer?: string;
  counter_asset_type?: string;
  counter_asset_code?: string;
  counter_asset_issuer?: string;
  base_amount?: string;
  counter_amount?: string;
}

function tradeAssetSpec(type?: string, code?: string, issuer?: string): string {
  if (type === "native") return "XLM";
  return code && issuer ? `${code}:${issuer}` : (type ?? "");
}

/**
 * Base-asset units this proposal's offer ACTUALLY traded, proven by Horizon's
 * per-offer trade history - never inferred from the offer's absence from the
 * book, because a cancel (ours with lost bookkeeping after a crash, or the
 * operator's from a wallet) removes an offer without filling it. Returns null
 * when the history cannot be fetched right now.
 */
async function verifiedOfferFilledBase(p: TradeProposal): Promise<number | null> {
  try {
    const page = await horizon
      .trades()
      .forOffer(p.offerId as string)
      .limit(200)
      .call();
    let total = 0;
    for (const t of page.records as unknown as OfferTradeLike[]) {
      const baseSpec = tradeAssetSpec(
        t.base_asset_type,
        t.base_asset_code,
        t.base_asset_issuer,
      );
      const counterSpec = tradeAssetSpec(
        t.counter_asset_type,
        t.counter_asset_code,
        t.counter_asset_issuer,
      );
      // Horizon's base/counter ordering is its own canonical one, not the
      // proposal's - pick whichever leg is the proposal's base asset.
      if (baseSpec === p.baseAsset) total += Number(t.base_amount) || 0;
      else if (counterSpec === p.baseAsset) total += Number(t.counter_amount) || 0;
    }
    return round7(total);
  } catch {
    return null;
  }
}

async function reconcileOffers(): Promise<void> {
  const tracked = store
    .listProposals()
    .filter((p) => p.offerId && p.status === "submitted");
  const pub = signerPublicKey();
  if (!pub || tracked.length === 0) return;

  const offers = await getOpenOffers(pub);
  const byId = new Map(offers.map((o) => [o.id, o]));
  const trackedIds = new Set(tracked.map((p) => p.offerId as string));
  const maxAgeMs = config.limits.maxOfferAgeMinutes * 60_000;

  for (const p of tracked) {
    const requested = Number(p.amount) || 0;
    const booked = Number(p.filledAmount ?? 0) || 0;
    const remainingBooked = round7(requested - booked);
    const offer = byId.get(p.offerId as string);

    if (!offer) {
      // The offer left the book - but absence does NOT mean it filled: our
      // own cancel may have landed with the bookkeeping lost to a crash, or
      // the operator cancelled it from a wallet. Book only what the offer's
      // on-chain TRADE HISTORY proves, then stop tracking.
      const traded = await verifiedOfferFilledBase(p);
      if (traded == null) continue; // Horizon unavailable - retry next tick
      const delta = round7(traded - booked);
      if (delta > EPS) {
        // Book under the execution lock so daily counters can't be mutated
        // mid-flight while an executeInner sits between its policy gate and
        // its own record() - otherwise a cap could be marginally overshot.
        await runExclusive(async () =>
          store.recordIncrementalFill(p.id, delta, Number(p.limitPrice) || 0),
        );
        store.log(
          "trade",
          `Offer ${p.offerId} (proposal ${shortId(p.id)}) left the book - booked ${delta} ${p.baseAsset} of VERIFIED fills.`,
        );
      } else if (remainingBooked > EPS) {
        store.log(
          "info",
          `Offer ${p.offerId} (proposal ${shortId(p.id)}) left the book with ${remainingBooked} ${p.baseAsset} unfilled (cancelled) - nothing booked.`,
        );
      }
      store.updateProposal(p.id, { offerId: undefined });
      continue;
    }

    // Still on the book: book any partial fill since the last look.
    const remainingChain = remainingBaseOf(p, offer);
    const delta = round7(remainingBooked - remainingChain);
    if (delta > EPS) {
      await runExclusive(async () =>
        store.recordIncrementalFill(p.id, delta, Number(p.limitPrice) || 0),
      );
    }
    if (remainingChain <= EPS) {
      store.updateProposal(p.id, { offerId: undefined });
      continue;
    }

    // Stale-offer cancel: a resting order whose price the market has moved
    // away from fills exactly when it turns against us (adverse selection).
    if (maxAgeMs > 0) {
      const ageMs = Date.now() - Date.parse(p.createdAt);
      if (Number.isFinite(ageMs) && ageMs > maxAgeMs) {
        if (isReadOnly || !store.liveTrading || store.killSwitch) {
          continue; // cannot (or must not) submit a cancel right now
        }
        try {
          await runExclusive(async () => {
            const tx = await buildCancelOfferTransaction(p, p.offerId as string);
            await signAndSubmit(tx);
          });
          // Deliberately KEEP offerId: the next tick finds the offer gone and
          // books any fills that landed in the snapshot->cancel race window
          // from the offer's verified trade history, then clears tracking.
          store.log(
            "trade",
            `Cancelled stale offer ${offer.id} (proposal ${shortId(p.id)}): ` +
              `~${remainingChain} ${p.baseAsset} unfilled after ${Math.round(ageMs / 60000)}min (final fills reconcile next tick).`,
          );
        } catch (err) {
          store.log(
            "warn",
            `Failed to cancel stale offer ${offer.id}: ${(err as Error).message}`,
          );
        }
      }
    }
  }

  // Offers on the account we are NOT tracking (e.g. created before tracking
  // existed, or placed manually). Deliberately warn-only: this wallet should
  // be bot-dedicated, but cancelling something we didn't place is not ours to
  // decide.
  for (const o of offers) {
    if (trackedIds.has(o.id) || warnedOffers.has(o.id)) continue;
    warnedOffers.add(o.id);
    store.log(
      "warn",
      `Untracked open offer ${o.id} on the account (${o.amount} ${o.selling} -> ${o.buying}). The monitor won't touch it - review it manually.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 2. Mark-to-market + stop-loss exits
 * ------------------------------------------------------------------ */

function hasActiveClose(pos: PositionSummary): boolean {
  const closeSide = pos.netQty > 0 ? "sell" : "buy";
  return store.listProposals().some(
    (q) =>
      q.baseAsset === pos.base &&
      q.quoteAsset === pos.quote &&
      q.side === closeSide &&
      q.reason.startsWith("[stop-loss]") &&
      (q.status === "proposed" ||
        q.status === "pending_approval" ||
        q.status === "submitting" ||
        // A submitted close whose remainder still RESTS on the book is very
        // much active: without this, the still-breached position re-triggers
        // after STOP_RETRY_MS and a duplicate full-size close stacks on top
        // of the resting one - both filling would overshoot through zero
        // into an unintended opposite position.
        (q.status === "submitted" && q.offerId != null)),
  );
}

/**
 * Base units already promised by LIVE resting [stop-loss] closes on this pair.
 * Only stop closes count: they are priced through the touch and will fill
 * barring gaps. An analyst's passive take-profit order must NOT reduce the
 * stop size - in a falling market it sits above the price and never fills.
 */
function restingCloseRemainder(pos: PositionSummary): number {
  const closeSide = pos.netQty > 0 ? "sell" : "buy";
  let sum = 0;
  for (const q of store.listProposals()) {
    if (
      q.status === "submitted" &&
      q.offerId != null &&
      q.side === closeSide &&
      q.baseAsset === pos.base &&
      q.quoteAsset === pos.quote &&
      q.reason.startsWith("[stop-loss]")
    ) {
      sum += Math.max(
        0,
        (Number(q.amount) || 0) - (Number(q.filledAmount ?? 0) || 0),
      );
    }
  }
  return sum;
}

/**
 * The analyst's OWN stop for this position: the invalidation_price of the most
 * recent submitted proposal that opened/extended it. This is what makes the
 * reward/risk gate honest - the risk distance the model stated (and policy
 * validated) is the one that actually triggers the exit. The fixed
 * STOP_LOSS_PCT remains as the hard backstop for positions without one.
 */
function statedInvalidation(pos: PositionSummary): number | null {
  const openSide = pos.netQty > 0 ? "buy" : "sell";
  for (const q of store.listProposals()) {
    // listProposals is newest-first; the first match is the latest thesis.
    if (
      q.status === "submitted" &&
      q.side === openSide &&
      q.baseAsset === pos.base &&
      q.quoteAsset === pos.quote &&
      q.invalidationPrice != null
    ) {
      const inv = Number(q.invalidationPrice);
      if (inv > 0) return inv;
    }
  }
  return null;
}

async function proposeStopClose(
  pos: PositionSummary,
  snap: MarketSnapshot,
  movePct: number,
  invalidation?: number,
): Promise<void> {
  const now = Date.now();
  const last = stopAttempts.get(pos.pair) ?? 0;
  if (now - last < STOP_RETRY_MS) return;
  if (hasActiveClose(pos)) return;
  // Close only what no live resting stop already covers (a partially-filled
  // earlier close keeps working its remainder on the book).
  const uncovered = round7(Math.abs(pos.netQty) - restingCloseRemainder(pos));
  if (uncovered <= EPS) return;
  stopAttempts.set(pos.pair, now);

  // Cross the touch deliberately (half the slippage budget) so the close
  // FILLS now instead of resting next to a falling market. The policy
  // engine's deviation check still bounds the price.
  const margin = (config.limits.maxSlippageBps / 10_000) * 0.5;
  const closingLong = pos.netQty > 0;
  const ref = closingLong ? snap.bestBid : snap.bestAsk;
  if (ref == null || !(ref > 0)) return;
  const limit = closingLong ? ref * (1 - margin) : ref * (1 + margin);

  const trigger =
    invalidation != null
      ? `crossed the analyst's invalidation level ${invalidation}`
      : `moved ${movePct.toFixed(2)}% against the avg entry`;
  const trade: ProposedTrade = {
    side: closingLong ? "sell" : "buy",
    baseAsset: pos.base,
    quoteAsset: pos.quote,
    amount: String(uncovered),
    limitPrice: String(round7(limit)),
    maxSlippageBps: config.limits.maxSlippageBps,
    confidence: "high",
    reason:
      `[stop-loss] ${pos.pair} ${trigger} ` +
      `(avg entry ${pos.avgPrice}, mark ~${round7(ref)}). Closing ${uncovered} ${pos.base} to cap the loss.`,
  };
  store.log(
    "warn",
    `Stop-loss triggered on ${pos.pair}: ${trigger} - proposing close.`,
  );
  await submitSystemProposal(trade, "monitor");
}

async function markPositions(snaps: SnapCache): Promise<void> {
  const positions = store.getPositions();
  if (positions.length === 0) {
    store.setUnrealizedPnl(0);
    // No positions: clear stop history + carried marks so a fresh position
    // starts clean.
    stopAttempts.clear();
    lastMark.clear();
    return;
  }

  // Prune carried marks for pairs no longer open, so a pair that CLOSED and
  // REOPENED opposite-side can't carry its prior (wrong-sign) mark into the new
  // position on an unpriced tick - a stale positive could otherwise cancel a
  // real loss elsewhere and loosen the loss halt. Also bounds the map's growth.
  const live = new Set(positions.map((p) => p.pair));
  for (const k of lastMark.keys()) if (!live.has(k)) lastMark.delete(k);

  let total = 0;
  for (const pos of positions) {
    const snap = await snaps.get(pos.base, pos.quote);
    const mid = await snaps.mid(pos.base, pos.quote);
    if (mid == null || !(mid > 0) || !(pos.avgPrice > 0)) {
      // Can't price this position right now (Horizon hiccup or a momentarily
      // empty book). Carry its last known mark forward so the published
      // unrealized PnL doesn't UNDER-read the open loss - dropping it to 0 would
      // loosen the loss halt and the size taper exactly when pricing is flaky.
      // The stop check is necessarily skipped (nothing to close into); it
      // re-runs on the next tick.
      const carried = lastMark.get(pos.pair);
      if (carried !== undefined) total += carried;
      continue;
    }

    // Keep the XLM rate map fresh from the marks we fetch anyway, so
    // cross-pair conversions stay current between chain scans.
    if (pos.base === "XLM") setXlmRate(pos.quote, 1 / mid);
    else if (pos.quote === "XLM") setXlmRate(pos.base, mid);

    // Signed unrealized PnL in quote units, then normalized to XLM exactly
    // like realized deltas, so the loss gate compares one unit.
    const unrealizedQuote = (mid - pos.avgPrice) * pos.netQty;
    const contributionXlm = realizedToXlm(unrealizedQuote, pos.base, pos.quote, mid);
    lastMark.set(pos.pair, contributionXlm);
    total += contributionXlm;

    const movePct =
      pos.netQty > 0
        ? ((mid - pos.avgPrice) / pos.avgPrice) * 100
        : ((pos.avgPrice - mid) / pos.avgPrice) * 100;
    // Two stop triggers: the analyst's own invalidation level (the risk the
    // reward/risk gate validated), and the fixed % stop as the hard backstop.
    const invalidation = statedInvalidation(pos);
    const invalidated =
      invalidation != null &&
      (pos.netQty > 0 ? mid <= invalidation : mid >= invalidation);
    const pctBreached =
      config.limits.stopLossPct > 0 && movePct <= -config.limits.stopLossPct;
    if (snap && (invalidated || pctBreached)) {
      await proposeStopClose(
        pos,
        snap,
        movePct,
        invalidated ? (invalidation as number) : undefined,
      );
    }
  }
  store.setUnrealizedPnl(round7(total));
}

/* ------------------------------------------------------------------ *
 * 3. Forward outcome marks (+1h / +24h)
 * ------------------------------------------------------------------ */

async function outcomeMarks(snaps: SnapCache): Promise<void> {
  const now = Date.now();
  for (const p of store.listProposals()) {
    if (p.status !== "submitted") continue;
    const t0 = Date.parse(p.createdAt);
    if (!Number.isFinite(t0)) continue;
    const need1h = !p.mark1hPrice && now - t0 >= 3_600_000;
    const need24h = !p.mark24hPrice && now - t0 >= 86_400_000;
    if (!need1h && !need24h) continue;

    const fillPrice = Number(p.filledPrice ?? p.limitPrice);
    if (!(fillPrice > 0)) continue;
    const mid = await snaps.mid(p.baseAsset, p.quoteAsset);
    if (mid == null || !(mid > 0)) continue;

    // Side-adjusted: + means the market moved the way the trade bet.
    const pct =
      p.side === "buy"
        ? ((mid - fillPrice) / fillPrice) * 100
        : ((fillPrice - mid) / fillPrice) * 100;
    const patch: Partial<TradeProposal> = {};
    if (need1h) {
      patch.mark1hPrice = String(round7(mid));
      patch.mark1hPnlPct = round7(pct);
    }
    if (need24h) {
      patch.mark24hPrice = String(round7(mid));
      patch.mark24hPnlPct = round7(pct);
    }
    store.updateProposal(p.id, patch);
  }
}

/* ------------------------------------------------------------------ *
 * 4. Late-landing recheck for failed-by-timeout submissions
 * ------------------------------------------------------------------ */

async function recheckTimedOut(): Promise<void> {
  const pub = signerPublicKey();
  if (!pub) return;
  const candidates = store.listProposals().filter((p) => {
    if (!p.txHash) return false;
    const age = Date.now() - Date.parse(p.createdAt);
    if (!Number.isFinite(age) || age >= RECHECK_WINDOW_MS) return false;
    // Recheck ANY failed row whose tx might still have landed: a NON-timeout
    // transport error (ECONNRESET / "socket hang up" / 503) re-thrown by
    // submitSigned marks the row "failed" even when the tx is already on-ledger,
    // and the old /not found on-ledger/ filter never matched those - stranding
    // real exposure outside the PnL ledger and MAX_DAILY_LOSS. Skip only rows
    // already PROVEN failed on-ledger (settled definitively in the loop below).
    if (p.status === "failed") return !/FAILED on-ledger/i.test(p.error ?? "");
    // Crash recovery: the hash was persisted before submit, so a row stuck in
    // "submitting" past the live path's window can be settled by hash. Age
    // since the LAST update (the hash persist at submit start) - createdAt
    // would misclassify an in-flight submit of an older approved proposal.
    if (p.status === "submitting") {
      const inFlight = Date.now() - Date.parse(p.updatedAt);
      return Number.isFinite(inFlight) && inFlight > STUCK_SUBMITTING_MS;
    }
    return false;
  });

  for (const p of candidates) {
    let successful: boolean;
    try {
      const rec = (await horizon
        .transactions()
        .transaction(p.txHash as string)
        .call()) as unknown as { successful?: boolean };
      successful = rec.successful !== false;
    } catch {
      // Not on-ledger. For a crash-stranded "submitting" row the tx timebound
      // (120s) is long gone - it can never land; close it out as failed.
      if (p.status === "submitting") {
        store.updateProposal(p.id, {
          status: "failed",
          error: `Submit was interrupted (crash/restart) and transaction ${p.txHash} never reached the ledger.`,
        });
        store.log(
          "warn",
          `Proposal ${shortId(p.id)} was stranded in "submitting"; its tx never landed - marked failed.`,
        );
      }
      continue; // failed rows keep their status and retry next tick
    }

    if (!successful) {
      // Definitive: it landed and FAILED on-ledger. Mark terminal (status +
      // error) so a crash-stranded "submitting" row ALSO leaves the recheck set
      // - the error no longer matches the retry filter for either status.
      store.updateProposal(p.id, {
        status: "failed",
        error: `Transaction ${p.txHash} was included but FAILED on-ledger.`,
      });
      continue;
    }

    // It landed after the polling window gave up: book the REAL fill so the
    // exposure exists in the ledger, daily counters and loss cap.
    const fill = await fillFromEffects(p.txHash as string, pub);
    const filledBase =
      fill == null
        ? Number(p.amount) || 0 // effects unavailable: conservative full fill
        : p.side === "sell"
          ? Number(fill.amountSold) || 0
          : Number(fill.amountBought) || 0;
    const quoteLeg =
      fill == null
        ? filledBase * (Number(p.limitPrice) || 0)
        : p.side === "sell"
          ? Number(fill.amountBought) || 0
          : Number(fill.amountSold) || 0;
    const avgPrice =
      filledBase > 0 && quoteLeg > 0 ? quoteLeg / filledBase : Number(p.limitPrice) || 0;

    // If part of the order rests on the book, recover the offer id so the
    // remainder is tracked (later fills booked, stale-cancel applies) instead
    // of orphaned - the effects-based fill carries no currentOffer.
    let offerId: string | undefined;
    if ((Number(p.amount) || 0) - filledBase > EPS) {
      offerId = await recoverRestingOfferId(p);
    }
    const updated = store.updateProposal(p.id, {
      status: "submitted",
      error: undefined,
      submittedAt: new Date().toISOString(),
      filledAmount: String(round7(filledBase)),
      filledPrice: String(round7(avgPrice)),
      ...(offerId ? { offerId } : {}),
    });
    // Book under the execution lock (consistent daily-counter snapshot vs a
    // concurrent in-flight executeInner).
    if (updated) await runExclusive(async () => store.recordSubmittedTrade(updated));
    store.log(
      "trade",
      `Late landing reconciled: ${shortId(p.id)} (tx ${p.txHash}) actually settled - booked ${round7(filledBase)} ${p.baseAsset}.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Loop scaffolding (same shape as the autopilot)
 * ------------------------------------------------------------------ */

async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const snaps = new SnapCache();
    // Order matters: late fills first so positions/marks see current lots.
    await reconcileOffers().catch((err) =>
      store.log("error", `Monitor offer reconcile failed: ${(err as Error).message}`),
    );
    await recheckTimedOut().catch((err) =>
      store.log("error", `Monitor timeout recheck failed: ${(err as Error).message}`),
    );
    await markPositions(snaps).catch((err) =>
      store.log("error", `Monitor mark-to-market failed: ${(err as Error).message}`),
    );
    await outcomeMarks(snaps).catch((err) =>
      store.log("error", `Monitor outcome marks failed: ${(err as Error).message}`),
    );
  } finally {
    running = false;
  }
}

/**
 * Start the monitor loop. Interval floored at 15s (each tick is a handful of
 * Horizon reads; no LLM calls). 0 disables it - but then NOTHING manages exits,
 * resting offers or outcome marks, so leaving it on is strongly recommended.
 */
export function startMonitor(): void {
  const sec = config.monitorIntervalSeconds;
  if (sec <= 0) {
    store.log(
      "warn",
      "Position monitor OFF (POSITION_MONITOR_INTERVAL_SECONDS=0): no stop-losses, no resting-offer management, no outcome marks.",
    );
    return;
  }
  const ms = Math.max(sec, 15) * 1000;
  store.log(
    "info",
    `Position monitor ON: marks positions, manages stops/offers and records outcomes every ${Math.round(ms / 1000)}s.`,
  );

  const loop = (): void => {
    if (stopped) return;
    void runOnce().finally(() => {
      if (!stopped) timer = setTimeout(loop, ms);
    });
  };
  // First tick shortly after boot (after hydration settles).
  timer = setTimeout(loop, 8_000);
}

export function stopMonitor(): void {
  stopped = true;
  if (timer) clearTimeout(timer);
  timer = null;
}
