/**
 * Per-account transaction reservation for the non-custodial build→sign→submit
 * split (migration engineering plan §4.4).
 *
 * In the custodial path, build+sign+submit ran inside ONE synchronous
 * `runExclusive` block, so two requests never built on the same Horizon sequence
 * number (which would make the second submit fail with `tx_bad_seq`). The
 * non-custodial split inserts a human-paced signing gap between build and submit,
 * so that lock can no longer span the whole flow.
 *
 * This implements the conservative, safe default from the plan: AT MOST ONE
 * outstanding (built-but-not-yet-submitted) transaction per trading account at a
 * time. A second `/build` for the same account while one is outstanding is
 * refused — the client retries once the first submits or the reservation's TTL
 * lapses — so two envelopes can never bake the same sequence number. A
 * reservation auto-frees after `ttlMs` (a little beyond the tx timebound), so an
 * abandoned build never wedges the account.
 *
 * Purely in-memory and deterministic: a `now` parameter makes the TTL unit-
 * testable, and expiry is checked lazily (a stale entry is simply overwritten),
 * so no background sweeper is needed. Single-process by design (the app runs in
 * fork mode, never clustered — see deploy/ecosystem.config.cjs).
 */

/** A little over the builders' 120s `setTimeout` so a signable envelope's slot
 *  outlives its own validity window, then frees. */
const DEFAULT_TTL_MS = 150_000;

interface Reservation {
  account: string;
  expiresAt: number;
}

const reservations = new Map<string, Reservation>();

/**
 * Try to reserve the sequence slot for `account`. Returns true if reserved (the
 * caller may build), false if another build is already outstanding and unexpired.
 * Synchronous on purpose: the check-and-set is atomic under Node's single thread,
 * so two concurrent callers can never both win.
 */
export function reserveSequence(
  account: string,
  ttlMs: number = DEFAULT_TTL_MS,
  now: number = Date.now(),
): boolean {
  const existing = reservations.get(account);
  if (existing && existing.expiresAt > now) return false;
  reservations.set(account, { account, expiresAt: now + ttlMs });
  return true;
}

/** Release the reservation for `account` (on submit success/failure or cancel). */
export function releaseSequence(account: string): void {
  reservations.delete(account);
}

/** Whether `account` currently holds an outstanding, unexpired reservation. */
export function isSequenceReserved(account: string, now: number = Date.now()): boolean {
  const r = reservations.get(account);
  return !!r && r.expiresAt > now;
}

/** Test/ops helper: drop all reservations. */
export function clearAllReservations(): void {
  reservations.clear();
}
