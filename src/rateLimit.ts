/**
 * Blanket rate limiter for state-changing API routes.
 *
 * Today only /api/auth/* (authRateLimiter, see src/auth/middleware.ts) and the
 * paid-LLM endpoints (/api/analyze, /api/scan, /api/ai-key/test - see the
 * llmGateAcquire gate in src/server.ts) are throttled. Every other mutation -
 * including the money-moving routes (/api/pay, /api/swap, /api/order,
 * /api/trustlines, /api/claimable, /api/offers, /api/stoploss, /api/wallet) -
 * has NO limit: an authed (or hijacked) client can hammer them as fast as the
 * network allows. This closes that gap with a coarse, fail-safe sliding-window
 * cap, mirroring the authRateLimiter pattern: a bounded Map of timestamp
 * arrays, swept lazily, wrapped in a factory so the sliding-window logic is
 * pure and unit-testable with a fake clock.
 *
 * Scope: ONLY non-GET/HEAD/OPTIONS requests under /api/ are ever counted -
 * reads, SSE (/api/stream) and polling are never throttled here.
 *
 * Keying: per authenticated user via currentUserId() (src/users/context.ts).
 * This middleware is mounted AFTER requireAuth (see src/server.ts), which
 * already ran the rest of the request inside runWithUserId() - so the
 * request-scoped AsyncLocalStorage value is in place and currentUserId()
 * resolves to the real caller, not a shared fallback. If resolving it ever
 * throws (no request scope - e.g. a test that calls this middleware directly,
 * or some future direct invocation outside requireAuth), fall back to the
 * caller's IP so the limiter degrades gracefully instead of the request
 * blowing up.
 */
import type { Request, Response, NextFunction } from "express";
import { currentUserId } from "./users/context";

const WINDOW_MS = 60_000;

/** Money-moving routes get a materially tighter budget than general mutations. */
const MONEY_LIMIT_PER_WINDOW = 12;
/** Every other POST/PUT/DELETE under /api/. */
const GENERAL_LIMIT_PER_WINDOW = 60;

/**
 * Path prefixes (matched against the lowercased req.path) that count against
 * the tighter MONEY budget instead of the general one.
 */
const MONEY_PREFIXES = [
  "/api/pay",
  "/api/swap",
  "/api/order",
  "/api/trustlines",
  "/api/claimable",
  "/api/offers",
  "/api/stoploss",
  "/api/wallet",
] as const;

/**
 * Hard exemptions, checked first, regardless of the money/general split:
 * these must NEVER be throttled by this limiter.
 *  - /api/kill            - the emergency stop. Blocking it would be
 *                            catastrophic in exactly the scenario (a runaway
 *                            or hijacked client) this limiter exists to
 *                            contain.
 *  - /api/auth/*          - already has its own dedicated limiter
 *                            (authRateLimiter in src/auth/middleware.ts).
 *  - /api/admin/*         - separate admin auth stack, mounted BEFORE
 *                            requireAuth in server.ts (so in production this
 *                            middleware never even sees admin traffic);
 *                            listed here too for defense-in-depth.
 *  - /api/billing/webhook - Stripe. Authenticated by its HMAC signature over
 *                            the raw body, not a user session; it is public
 *                            (PUBLIC_API_PATHS) and reaches this middleware.
 */
const EXEMPT_PATHS = ["/api/kill", "/api/auth", "/api/admin", "/api/billing/webhook"] as const;

function matchesPrefix(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * Resolve the rate-limit key for a request: the authenticated user id when
 * available, otherwise the caller's IP (see the module doc comment for when
 * that fallback triggers).
 */
function keyFor(req: Request): string {
  try {
    return `u:${currentUserId()}`;
  } catch {
    return `ip:${req.ip ?? "unknown"}`;
  }
}

/**
 * Factory returning the Express middleware. `nowFn` defaults to Date.now but
 * can be swapped for a fake clock in tests so the sliding window is
 * deterministic.
 */
export function createGeneralRateLimiter(nowFn: () => number = Date.now) {
  const hits = new Map<string, number[]>();

  return function generalRateLimiter(req: Request, res: Response, next: NextFunction): void {
    const method = (req.method ?? "GET").toUpperCase();
    // Never throttle reads, SSE, or polling - only state-changing verbs.
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      next();
      return;
    }

    // Express matches routes case-insensitively; normalize the same way
    // requireAuth/authRateLimiter do so a case-varied path can't dodge either
    // the exemption list or the budget it should otherwise count against.
    const path = (req.path ?? "").toLowerCase();
    if (!path.startsWith("/api/")) {
      next();
      return;
    }
    if (matchesPrefix(path, EXEMPT_PATHS)) {
      next();
      return;
    }

    const isMoney = matchesPrefix(path, MONEY_PREFIXES);
    const limit = isMoney ? MONEY_LIMIT_PER_WINDOW : GENERAL_LIMIT_PER_WINDOW;
    // Bucket is part of the key so a user's money and general budgets never
    // share (or steal from) each other.
    const key = `${isMoney ? "money" : "general"}:${keyFor(req)}`;

    const now = nowFn();
    const arr = hits.get(key) ?? [];
    const fresh = arr.filter((t) => now - t < WINDOW_MS);
    if (fresh.length >= limit) {
      hits.set(key, fresh);
      res.status(429).json({ error: "Too many requests - please slow down and try again shortly." });
      return;
    }
    fresh.push(now);
    hits.set(key, fresh);

    // Opportunistic sweep so the map can't grow unbounded (mirrors
    // authRateLimiter's defensive cap in src/auth/middleware.ts).
    if (hits.size > 5_000) {
      for (const [k, v] of hits) {
        const kept = v.filter((t) => now - t < WINDOW_MS);
        if (kept.length === 0) hits.delete(k);
        else hits.set(k, kept);
      }
    }

    next();
  };
}
