import { Horizon } from "@stellar/stellar-sdk";
import { config } from "../config";

/** Shared read/write Horizon client. Reads are safe; writes require a signed tx. */
export const horizon = new Horizon.Server(config.horizonUrl);

/**
 * AUDIT-028: retry-with-backoff+jitter for READ-ONLY Horizon calls made by the
 * background jobs (monitor marks, liquidity scan, offer reconciliation). A
 * single transient failure / rate-limit used to silently void a whole tick's
 * work; one or two spaced retries ride out the blip. Jitter de-synchronizes
 * the concurrent fan-outs so they don't re-hammer Horizon in lockstep. NEVER
 * use this for tx submission — resubmitting a signed tx is not idempotent at
 * this layer (the signer has its own hash-based recovery).
 */
export async function withHorizonRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = base * 2 ** attempt * (0.5 + Math.random());
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Fast, best-effort reachability check for the Horizon server backing this
 * app. Used by /api/health — intentionally a raw timed fetch (not the SDK
 * client) so a slow/unreachable Horizon can never hang the health endpoint.
 * Never throws: any error or timeout resolves to false.
 */
export async function pingHorizon(timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(config.horizonUrl, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
