/**
 * Client-side transaction signing (non-custodial). The server builds an UNSIGNED
 * transaction; this module reconstructs it, HARD-VALIDATES the operation set
 * against an allowlist (refusing anything unexpected BEFORE the user is ever asked
 * to sign), signs it with the user's key, and returns the signed XDR.
 *
 * The structural allowlist is the first line of defence against a compromised or
 * MITM'd server handing the client a fund-draining envelope; the review dialog
 * (TxReviewDialog.vue) is the second. See the non-custodial engineering plan
 * §8.5 / §9.2. UNVERIFIED against a live network — needs a testnet pass.
 */
import { Keypair, TransactionBuilder, type Transaction } from "@stellar/stellar-base";

/** Operation types the app can legitimately ask a user to sign. Anything else
 *  (setOptions, accountMerge, ...) is refused outright — no signing, no display. */
export const ALLOWED_OP_TYPES = new Set<string>([
  "payment",
  "pathPaymentStrictSend",
  "pathPaymentStrictReceive",
  "manageSellOffer",
  "manageBuyOffer",
  "createPassiveSellOffer",
  "changeTrust",
  "claimClaimableBalance",
]);

export class UnsafeTransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeTransactionError";
  }
}

/**
 * Parse an unsigned XDR and refuse it unless every operation is on the allowlist,
 * the tx source is `expectedSource`, and no operation overrides that source.
 * Throws UnsafeTransactionError on any violation. Returns the parsed Transaction.
 */
export function parseAndValidate(
  xdr: string,
  networkPassphrase: string,
  expectedSource: string,
  /** Optional per-action allowlist: the exact op types this action may contain
   *  (e.g. `["payment"]` for a send). Narrows the global allowlist so a build for
   *  one action can't smuggle an operation legitimate for another. */
  allowedOps?: readonly string[],
): Transaction {
  let parsed: Transaction | { innerTransaction: unknown };
  try {
    parsed = TransactionBuilder.fromXDR(xdr, networkPassphrase);
  } catch {
    throw new UnsafeTransactionError("Could not parse the transaction (bad XDR or wrong network).");
  }
  if ("innerTransaction" in parsed) {
    throw new UnsafeTransactionError("Fee-bump envelopes are not signed on the client.");
  }
  const tx: Transaction = parsed;
  if (tx.source !== expectedSource) {
    throw new UnsafeTransactionError("This transaction is not from your wallet — refusing to sign.");
  }
  const perAction = allowedOps ? new Set(allowedOps) : null;
  for (const op of tx.operations) {
    if (op.source && op.source !== expectedSource) {
      throw new UnsafeTransactionError(
        `An operation would act on a different account (${op.source}) — refusing to sign.`,
      );
    }
    if (!ALLOWED_OP_TYPES.has(op.type)) {
      throw new UnsafeTransactionError(`Operation type '${op.type}' is not allowed — refusing to sign.`);
    }
    if (perAction && !perAction.has(op.type)) {
      throw new UnsafeTransactionError(
        `Operation '${op.type}' is not expected for this action — refusing to sign.`,
      );
    }
  }
  return tx;
}

/** Validate + sign an unsigned XDR with the user's keypair; returns signed XDR.
 *  Pass `allowedOps` to pin the exact operation types this action should contain. */
export function signXdr(
  xdr: string,
  keypair: Keypair,
  networkPassphrase: string,
  allowedOps?: readonly string[],
): string {
  const tx = parseAndValidate(xdr, networkPassphrase, keypair.publicKey(), allowedOps);
  tx.sign(keypair);
  return tx.toXDR();
}
