/**
 * Pure fill reconciliation for the Stellar adapter.
 *
 * Faithfully reproduces the math of orchestrator.ts `reconcileOfferFill` — but
 * WITHOUT its store.log side effects — so it lives at the adapter boundary where
 * it belongs and stays unit-testable with no Horizon/store dependency. When the
 * orchestrator is rerouted (a later, green-lit phase), its copy is deleted and
 * the log lines move to the orchestrator around the returned Fill.
 */
import type { TradeProposal } from "../../types";
import type { OfferResultLike } from "../../stellar/signer";
import type { Fill } from "../types";

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/**
 * Translate Horizon's manageOffer result(s) into what actually traded.
 *  - sell: sold `amountSold` base, received `amountBought` quote -> price = bought/sold
 *  - buy:  received `amountBought` base, paid `amountSold` quote -> price = sold/bought
 *
 * Returns null when no offerResults are present (submit timed out -> the caller
 * keeps its assume-full-fill fallback). A resting-only outcome (nothing matched)
 * returns filledBase 0 at the limit price, carrying any resting offer id.
 */
export function reconcileStellarFill(
  p: TradeProposal,
  offerResults: OfferResultLike[] | undefined,
): Fill | null {
  if (!offerResults || offerResults.length === 0) return null;

  let bought = 0;
  let sold = 0;
  let restingOrderId: string | undefined;
  for (const r of offerResults) {
    bought += Number(r.amountBought) || 0;
    sold += Number(r.amountSold) || 0;
    const oid = r.currentOffer?.offerId;
    if (oid != null && restingOrderId === undefined) restingOrderId = String(oid);
  }

  const filledBase = p.side === "sell" ? sold : bought;
  const quoteLeg = p.side === "sell" ? bought : sold;

  if (!(filledBase > 0) || !(quoteLeg > 0)) {
    // Nothing matched immediately; the full order rests on the book.
    return { filledBase: 0, avgPrice: Number(p.limitPrice) || 0, restingOrderId };
  }

  return {
    filledBase: round7(filledBase),
    avgPrice: round7(quoteLeg / filledBase),
    restingOrderId,
  };
}
