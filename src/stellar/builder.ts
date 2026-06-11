import {
  BASE_FEE,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { parseAsset } from "./assets";
import type { TradeProposal } from "../types";

/**
 * Per-operation fee (stroops) to bid. Stellar uses SURGE PRICING: the fee you
 * set is the MAXIMUM you're willing to pay, and you're only actually charged
 * the market-clearing fee - the network BASE_FEE whenever the ledger has spare
 * capacity. So we bid the full MAX_FEE_STROOPS cap: it costs nothing extra in
 * calm conditions and maximizes the chance a trade still confirms during
 * congestion (instead of getting stuck at a stale p90). Floored at BASE_FEE.
 *
 * (This replaces the old p90-of-recently-charged-fees heuristic, which under
 * congestion could bid below the clearing price and leave the offer stuck.)
 */
function recommendedFee(): string {
  const base = Number(BASE_FEE);
  return String(Math.max(base, Math.floor(config.limits.maxFeeStroops)));
}

/**
 * Build an UNSIGNED DEX offer transaction from a proposal.
 *
 * Price convention: limitPrice is quote units per 1 base unit.
 * - sell base -> manageSellOffer(selling=base, buying=quote, price = quote/base)
 * - buy  base -> manageBuyOffer (selling=quote, buying=base, price = quote/base)
 * Both Stellar operations interpret `price` as buying-per-selling for sell and
 * selling-per-buying for buy, which both equal quote-per-base here.
 */
export async function buildOfferTransaction(
  proposal: TradeProposal,
): Promise<Transaction> {
  if (!config.stellarPublic) {
    throw new Error("STELLAR_PUBLIC is not configured.");
  }

  const account = await horizon.loadAccount(config.stellarPublic);
  const base = parseAsset(proposal.baseAsset);
  const quote = parseAsset(proposal.quoteAsset);

  const op =
    proposal.side === "sell"
      ? Operation.manageSellOffer({
          selling: base,
          buying: quote,
          amount: proposal.amount,
          price: proposal.limitPrice,
        })
      : Operation.manageBuyOffer({
          selling: quote,
          buying: base,
          buyAmount: proposal.amount,
          price: proposal.limitPrice,
        });

  return new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();
}

/**
 * Build an UNSIGNED transaction that CANCELS a resting offer: the same
 * manage*Offer operation with amount 0 + the offer id deletes it on-chain.
 * Note the 120s tx timeout above only bounds SUBMISSION - once included, an
 * offer rests forever until filled or cancelled; this is the cancel half of
 * the position monitor's stale-offer management.
 */
export async function buildCancelOfferTransaction(
  proposal: TradeProposal,
  offerId: string,
): Promise<Transaction> {
  if (!config.stellarPublic) {
    throw new Error("STELLAR_PUBLIC is not configured.");
  }
  if (!offerId) {
    throw new Error("Cannot cancel: proposal has no tracked offer id.");
  }

  const account = await horizon.loadAccount(config.stellarPublic);
  const base = parseAsset(proposal.baseAsset);
  const quote = parseAsset(proposal.quoteAsset);

  // Mirror the original operation type so selling/buying line up with the
  // on-chain offer. Price is required by the op but irrelevant for a delete;
  // reuse the original limit so it always parses as a valid fraction.
  const op =
    proposal.side === "sell"
      ? Operation.manageSellOffer({
          selling: base,
          buying: quote,
          amount: "0",
          price: proposal.limitPrice,
          offerId,
        })
      : Operation.manageBuyOffer({
          selling: quote,
          buying: base,
          buyAmount: "0",
          price: proposal.limitPrice,
          offerId,
        });

  return new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();
}
