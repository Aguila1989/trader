/**
 * Thin POST-JSON helper shared by the Hyperliquid `info.ts` (read) and
 * `exchange.ts` (write) clients. Hyperliquid's whole REST surface is two
 * endpoints (`/info`, `/exchange`) that both take a JSON body and return a
 * JSON (or HTTP-error) response - there is no SDK dependency here, just
 * `fetch` plus a small amount of retry/timeout/error-shaping discipline:
 *
 *  - READS (info.ts) are naturally idempotent, so they retry on 5xx/429/
 *    network/timeout with capped exponential backoff (default 3 attempts).
 *  - WRITES (exchange.ts) are NOT idempotent - a timed-out order submit may
 *    already have landed on Hyperliquid's matching engine. Blindly retrying
 *    could double-submit. Callers doing a write MUST pass `maxAttempts: 1`
 *    so any failure (including a timeout) surfaces immediately as an error
 *    instead of a silent retry; exchange.ts turns that into an UNKNOWN
 *    outcome (never a definite success/failure), the same shape the Stellar
 *    adapter uses for a submit timeout - see src/chains/stellar/reconcile.ts,
 *    where `fill === null` means "unknown, caller keeps its assume-full-fill
 *    fallback" rather than retrying the submit.
 *
 * Config (base URL, network) is passed in by callers - this module never
 * imports src/config.ts.
 */

export type HttpErrorKind = "timeout" | "network" | "http" | "invalid-json";

/** A structured failure from `postJson`. `kind` lets a caller decide whether
 *  a failure is safe to treat as "definitely did not happen" (`http` with a
 *  4xx the server actually answered) vs genuinely ambiguous (`timeout` /
 *  `network`, where the request may or may not have been processed). */
export class HttpClientError extends Error {
  readonly kind: HttpErrorKind;
  readonly status?: number;
  readonly body?: unknown;
  readonly attempts: number;

  constructor(
    kind: HttpErrorKind,
    message: string,
    opts: { status?: number; body?: unknown; attempts: number },
  ) {
    super(message);
    this.name = "HttpClientError";
    this.kind = kind;
    this.status = opts.status;
    this.body = opts.body;
    this.attempts = opts.attempts;
  }
}

/** Hard ceiling on attempts regardless of what a caller requests - a runaway
 *  retry loop against a live-trading venue is worse than a fast failure. */
const ABSOLUTE_MAX_ATTEMPTS = 5;
const DEFAULT_TIMEOUT_MS = 8_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_MS = 250;

export interface PostJsonOptions {
  /** Abort the request after this many ms. Default 8_000. */
  timeoutMs?: number;
  /** Total attempts including the first. Default 3. Callers making a WRITE
   *  must pass 1 (see the module comment). Clamped to ABSOLUTE_MAX_ATTEMPTS. */
  maxAttempts?: number;
  /** Base delay for exponential backoff between retries (ms). Default 250;
   *  tests pass 0 to keep the suite fast. */
  retryBaseMs?: number;
  /** Extra headers merged over the default `content-type: application/json`. */
  headers?: Record<string, string>;
  /** Dependency-injection seam for tests; defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return ms <= 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST `body` as JSON to `url`, retrying retryable failures with capped
 * exponential backoff. Always throws `HttpClientError` on final failure -
 * never resolves with a partial or garbage value.
 */
export async function postJson<T>(url: string, body: unknown, opts: PostJsonOptions = {}): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = Math.max(1, Math.min(opts.maxAttempts ?? DEFAULT_MAX_ATTEMPTS, ABSOLUTE_MAX_ATTEMPTS));
  const retryBaseMs = opts.retryBaseMs ?? DEFAULT_RETRY_BASE_MS;
  const doFetch = opts.fetchImpl ?? fetch;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await doFetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", ...opts.headers },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let parsedBody: unknown = text;
        try {
          parsedBody = text ? JSON.parse(text) : undefined;
        } catch {
          // Not JSON - keep the raw text as the error body.
        }
        const err = new HttpClientError("http", `Hyperliquid request failed: ${res.status} ${res.statusText}`, {
          status: res.status,
          body: parsedBody,
          attempts: attempt,
        });
        if (isRetryableStatus(res.status) && attempt < maxAttempts) {
          await delay(retryBaseMs * 2 ** (attempt - 1));
          continue;
        }
        throw err;
      }

      const text = await res.text();
      try {
        return text ? (JSON.parse(text) as T) : (undefined as T);
      } catch (e) {
        // A malformed 200 is never worth retrying - the server is answering,
        // just not with JSON.
        throw new HttpClientError(
          "invalid-json",
          `Hyperliquid response was not valid JSON: ${(e as Error).message}`,
          { attempts: attempt },
        );
      }
    } catch (e) {
      clearTimeout(timer);
      if (e instanceof HttpClientError) throw e; // already a final decision above
      const aborted = e instanceof Error && e.name === "AbortError";
      const kind: HttpErrorKind = aborted ? "timeout" : "network";
      const err = new HttpClientError(
        kind,
        aborted ? `Hyperliquid request timed out after ${timeoutMs}ms` : `Hyperliquid request failed: ${(e as Error).message}`,
        { attempts: attempt },
      );
      if (attempt < maxAttempts) {
        await delay(retryBaseMs * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }
  // Unreachable - the loop above always either returns or throws - but keeps
  // the function's declared return type honest for the compiler.
  throw new HttpClientError("network", "Hyperliquid request failed with no attempts made", { attempts: 0 });
}
