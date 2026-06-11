import { Keypair, type Transaction } from "@stellar/stellar-sdk";
import { config, isReadOnly } from "../config";
import { horizon } from "./client";

// The secret key lives ONLY here, in your backend process.
// It is never serialized into any AI prompt or tool result.
let keypair: Keypair | null = null;

function getKeypair(): Keypair {
  if (isReadOnly) {
    throw new Error(
      "Read-only mode: no STELLAR_SECRET configured, cannot sign.",
    );
  }
  if (!keypair) {
    keypair = Keypair.fromSecret(config.stellarSecret);
    if (config.stellarPublic && keypair.publicKey() !== config.stellarPublic) {
      throw new Error(
        "STELLAR_SECRET does not match STELLAR_PUBLIC. Refusing to sign.",
      );
    }
  }
  return keypair;
}

/** Public key we trade from (works in read-only mode too). */
export function signerPublicKey(): string | null {
  if (config.stellarPublic) return config.stellarPublic;
  if (isReadOnly) return null;
  return getKeypair().publicKey();
}

// When Horizon returns a 504 the transaction may STILL land on the ledger, so
// we poll by hash before declaring failure - never blind-resubmit (that risks a
// duplicate trade). 24 * 5s = 120s covers the transaction's FULL timebound
// (builder sets setTimeout(120)): a tx that hasn't landed by then can never be
// included, so "not found after the window" is a real verdict, not a guess.
// (The position monitor still re-checks failed-by-timeout hashes later as a
// belt-and-suspenders, since this poll blocks the serial execute queue.)
const POLL_ATTEMPTS = 24;
const POLL_INTERVAL_MS = 5000;

interface TxRecordLike {
  successful?: boolean;
  hash?: string;
}

/** A single "trade" effect from Horizon, narrowed to the fields we read. */
interface TradeEffectLike {
  type?: string;
  account?: string;
  bought_amount?: string;
  sold_amount?: string;
}

/**
 * A single manageOffer result from Horizon's submit response, narrowed to the
 * fields we use for fill reconciliation. `amountBought` / `amountSold` are in
 * asset units (already scaled by the SDK). Present only on a synchronous submit
 * of a tx that contained manageOffer ops.
 */
export interface OfferResultLike {
  effect?: string;
  wasImmediatelyFilled?: boolean;
  wasImmediatelyDeleted?: boolean;
  wasPartiallyFilled?: boolean;
  isFullyOpen?: boolean;
  amountBought?: number;
  amountSold?: number;
  operationIndex?: number;
  /**
   * The RESTING offer created/updated by this operation (absent when the order
   * filled completely or was deleted). Its id is what lets the position
   * monitor track later fills of the remainder and cancel stale offers.
   */
  currentOffer?: {
    offerId?: string | number;
    amount?: string;
    price?: string;
  };
}

export interface SubmitResult {
  hash: string;
  /**
   * Per-operation offer outcomes, used to book the ACTUAL fill. Absent on the
   * timeout/poll path (the polled tx record carries no offerResults), in which
   * case the caller falls back to assuming a full fill at the limit price.
   */
  offerResults?: OfferResultLike[];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** A 504 (or network timeout) from Horizon: outcome is unknown, not failed. */
function isTimeout(err: unknown): boolean {
  const e = err as { response?: { status?: number }; message?: string };
  if (e.response?.status === 504) return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("timeout") || msg.includes("timed out");
}

/** Poll Horizon for a transaction by hash. Resolves the record once visible. */
async function pollForTx(hash: string): Promise<TxRecordLike | null> {
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await delay(POLL_INTERVAL_MS);
    try {
      return (await horizon
        .transactions()
        .transaction(hash)
        .call()) as unknown as TxRecordLike;
    } catch {
      // Not visible yet (404) - keep waiting for the next ledger.
    }
  }
  return null;
}

/**
 * Reconstruct the REAL fill of a landed transaction from its "trade" effects.
 * Used when the submit response (and its offerResults) was lost to a timeout:
 * each trade effect for OUR account carries bought_amount/sold_amount, so the
 * sum is exactly what the order filled. Zero trade effects means the offer
 * rested without matching - i.e. NOTHING filled (the old behaviour wrongly
 * assumed a full fill at the limit here). Returns null only when the effects
 * cannot be fetched at all, in which case the caller keeps the conservative
 * full-fill fallback rather than booking nothing for a possibly-filled trade.
 */
export async function fillFromEffects(
  hash: string,
  account: string,
): Promise<OfferResultLike | null> {
  try {
    const page = await horizon.effects().forTransaction(hash).limit(200).call();
    let bought = 0;
    let sold = 0;
    for (const rec of page.records as unknown as TradeEffectLike[]) {
      if (rec.type !== "trade" || rec.account !== account) continue;
      bought += Number(rec.bought_amount) || 0;
      sold += Number(rec.sold_amount) || 0;
    }
    return { amountBought: bought, amountSold: sold };
  } catch {
    return null;
  }
}

/**
 * Sign the prepared transaction and submit it to Horizon. Returns the tx hash
 * plus the manageOffer results (when Horizon answers synchronously) so the
 * caller can reconcile how much actually filled vs. what was requested.
 */
export async function signAndSubmit(tx: Transaction): Promise<SubmitResult> {
  const kp = getKeypair();
  tx.sign(kp);
  // Capture the hash BEFORE submitting so we can reconcile a timeout.
  const hash = tx.hash().toString("hex");

  try {
    const res = (await horizon.submitTransaction(tx)) as {
      hash: string;
      offerResults?: OfferResultLike[];
    };
    return res.offerResults
      ? { hash: res.hash, offerResults: res.offerResults }
      : { hash: res.hash };
  } catch (err) {
    if (!isTimeout(err)) throw err;
    const rec = await pollForTx(hash);
    if (rec) {
      if (rec.successful === false) {
        throw new Error(`Transaction ${hash} was included but FAILED on-ledger.`);
      }
      // The polled tx record carries no offerResults - reconstruct the actual
      // fill from the trade effects so a resting order isn't booked as filled.
      const fill = await fillFromEffects(hash, kp.publicKey());
      return fill ? { hash, offerResults: [fill] } : { hash };
    }
    throw new Error(
      `Submit timed out and transaction ${hash} was not found on-ledger within the polling window; it may still settle. Check the explorer before retrying.`,
    );
  }
}
