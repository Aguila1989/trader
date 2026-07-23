/**
 * Non-custodial signing relay (migration P0).
 *
 * In the non-custodial model the server BUILDS an unsigned transaction, the user
 * signs it on their own device, and posts the signed XDR back here. This module
 * verifies a client-signed envelope and hands it to the existing submitSigned()
 * (which keeps all the 504-poll / fill-reconcile logic). It never holds a key.
 *
 * TRUST BOUNDARY: because the user signs the exact bytes the server built, the
 * server re-checks the envelope on the way back in — the source account must be
 * the caller's own trading account, no per-operation source override is allowed,
 * and a small denylist blocks the account-takeover operation types. The caller
 * (server route) additionally re-runs the egress whitelist/cap using the amounts
 * parsed HERE (never trusted from the request body). A fuller per-action
 * operation allowlist + the client-side refuse-to-sign check are still to come
 * (see the non-custodial engineering plan §8.5 / §9.2).
 */
import { TransactionBuilder, type Transaction } from "@stellar/stellar-sdk";
import { config } from "../config";
import { submitSigned, type SubmitResult } from "./signer";
import { assetToString } from "./assets";

// Operation types that can seize an account or change its signing config — never
// legitimate through the trade/pay build endpoints, so refuse them outright.
const BLOCKED_OP_TYPES = new Set(["setOptions", "accountMerge"]);

export interface ParsedSignedTx {
  tx: Transaction;
  /** Sum of payment-operation amounts leaving the account (for the egress cap). */
  egressAmount: number;
  /** Asset specs of the payment operations (for the egress whitelist gate). */
  egressAssets: string[];
}

/**
 * Parse + verify a client-signed transaction envelope. Throws a plain Error
 * (mapped to a 400 by the route) on any structural problem. Does NOT submit.
 */
export function parseSignedTx(signedXdr: string, expectedAccount: string): ParsedSignedTx {
  let parsed: Transaction | { innerTransaction: unknown };
  try {
    parsed = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
  } catch {
    throw new Error("Could not parse the signed transaction (bad XDR or wrong network).");
  }
  if ("innerTransaction" in parsed) {
    throw new Error("Fee-bump envelopes are not accepted at this endpoint.");
  }
  const tx: Transaction = parsed;
  const account = expectedAccount;
  if (tx.source !== account) {
    throw new Error("The signed transaction's source account does not match your wallet.");
  }
  let egressAmount = 0;
  const egressAssets: string[] = [];
  for (const op of tx.operations) {
    if (op.source && op.source !== account) {
      throw new Error("Per-operation source overrides are not allowed.");
    }
    if (BLOCKED_OP_TYPES.has(op.type)) {
      throw new Error(`Operation type '${op.type}' is not permitted through this endpoint.`);
    }
    if (op.type === "payment") {
      egressAmount += Number(op.amount) || 0;
      egressAssets.push(assetToString(op.asset));
    }
  }
  return { tx, egressAmount, egressAssets };
}

/** Submit an already-verified, client-signed transaction (reuses submitSigned). */
export async function submitSignedTx(tx: Transaction): Promise<SubmitResult> {
  return submitSigned(tx, tx.hash().toString("hex"));
}
