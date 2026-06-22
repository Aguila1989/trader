import { BASE_FEE } from "@stellar/stellar-sdk";
import { config } from "../config";

/**
 * Shared amount + fee helpers for everything that builds a Stellar transaction
 * (offers, payments, swaps, trustlines, claims). Consolidates what used to be
 * copy-pasted `feeStr`/`amt7` helpers across the stellar/* modules.
 */

/** Per-operation fee string: the network BASE_FEE, bumped to the configured
 *  ceiling so a congested submit can still get through. */
export function recommendedFee(): string {
  return String(Math.max(Number(BASE_FEE), Math.floor(config.limits.maxFeeStroops)));
}

/**
 * Format a value as a VALID Stellar amount string: at most 7 decimals, trailing
 * zeros trimmed, and crucially NEVER in exponential notation. `Number(x).toString()`
 * yields "1e-7" for 0.0000001, which the SDK's amount parser rejects - `toFixed(7)`
 * never does, so a dust amount or a small `destMin` no longer produces an invalid
 * transaction. Throws on a non-finite value rather than silently emitting "NaN".
 */
export function formatAmount(v: string | number): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new Error(`Invalid amount: ${String(v)}`);
  let s = n.toFixed(7);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "-0" ? "0" : s;
}
