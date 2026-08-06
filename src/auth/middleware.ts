/**
 * The API auth gate (replaces the old DASHBOARD_TOKEN Bearer check) and the
 * per-IP rate limiter for the auth endpoints.
 *
 * STRICT ALLOWLIST (default-deny): every /api/* request is rejected with 401
 * unless its exact path is in PUBLIC_API_PATHS. There is no denylist and no
 * prefix wildcard - a new route is protected automatically until someone
 * deliberately lists it as public. Non-/api requests (the static SPA bundle and
 * index.html) pass through so the login page and the Academy can render; they
 * expose no user data because the Academy's CONTENT is 100% client-rendered
 * static data. (Academy PROGRESS, added 2026-07, is served by /api/academy/*
 * which is default-deny like everything else, bar the one preview path below.)
 *
 * On success the request runs inside runWithUserId() so the data layer
 * (currentUserId()) scopes every read/write to the authenticated user, with
 * AsyncLocalStorage keeping concurrent users isolated across awaits.
 */
import type { Request, Response, NextFunction } from "express";
import { config } from "../config";
import { verifyJwt } from "./jwt";
import { isSessionActive } from "./store";
import { JWT_COOKIE, parseCookies } from "./cookies";
import { runWithUserId, DEFAULT_USER_ID } from "../users/context";
import { PREVIEW_PROGRESS_PUBLIC_PATH } from "../academy/constants";

/**
 * The ONLY API paths reachable without a valid JWT. Exact-match set (a strict
 * allowlist, never a prefix or denylist). Health + the unauthenticated auth
 * actions only. Notably NOT here: /api/auth/me (returns the logged-in user) and
 * /api/stream (the live feed) - both require a valid session.
 */
export const PUBLIC_API_PATHS: ReadonlySet<string> = new Set([
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  // End-user 2FA: this runs pre-session, with the pending-2FA challenge (from
  // a successful password check) carried in the request BODY, never a cookie
  // - so it can never be satisfied by a copied/forged session cookie. Notably
  // NOT here: /api/auth/2fa/setup|enable|disable (those require an existing
  // session, like /change-password).
  "/api/auth/2fa/verify",
  // Feature 2: Stripe calls this without any session cookie; authenticity is
  // the HMAC signature over the raw body, verified in the handler itself.
  "/api/billing/webhook",
  // Academy free-preview lesson (2026-07): the ONE lesson an anonymous visitor
  // may read. Exact PATCH path only - every other /api/academy/* route stays
  // default-deny. The handler resolves an OPTIONAL session itself (the gate
  // short-circuits public paths before reading the JWT) so a logged-in reader
  // is still tracked while a true anonymous call is silently ignored.
  PREVIEW_PROGRESS_PUBLIC_PATH,
]);

const nowSec = (): number => Math.floor(Date.now() / 1000);

/**
 * The main gate. Async because it checks the session is still active server-side
 * (so logout / password-reset revocation takes effect immediately, not only when
 * the JWT eventually expires).
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  // PERSONAL SOLO-OPERATOR MODE (SINGLE_USER=true): no sessions exist - scope
  // EVERY request (public paths included, so e.g. the academy preview PATCH is
  // attributed instead of anonymous) to the default operator account. This is
  // the same DEFAULT_USER_ID the background loops (autopilot/monitor) already
  // run as, so all data lands on one account. The product build (flag off) is
  // untouched below this line.
  if (config.singleUser) {
    runWithUserId(DEFAULT_USER_ID, () => next());
    return;
  }
  // Express routes are case-INSENSITIVE by default, so `/API/state` matches the
  // `/api/state` handler. Normalize the path here too, otherwise a case-varied
  // path would slip past a case-sensitive `startsWith("/api")` as "non-API" and
  // reach a protected handler unauthenticated. Lowercasing fails CLOSED: any
  // /api request that isn't an exact public path is gated.
  const path = req.path.toLowerCase();
  // Static assets + the SPA shell (needed to render login AND the Academy).
  if (!path.startsWith("/api")) return next();
  // Strict public allowlist (exact match against the normalized path).
  if (PUBLIC_API_PATHS.has(path)) return next();

  const token = parseCookies(req.headers.cookie)[JWT_COOKIE] ?? "";
  if (!token) {
    res.status(401).json({ error: "unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  const verdict = verifyJwt(token, config.jwtSecret, nowSec());
  if (!verdict.ok) {
    res.status(401).json({ error: "unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  // Feature 4 defense-in-depth: an ADMIN token (aud claim) copied into the
  // user cookie must never pass the user gate. (Its "admin" jti also has no
  // AuthSessions row, but reject on shape first - fail early, fail closed.)
  if (verdict.claims.aud) {
    res.status(401).json({ error: "unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  // Server-side session validity (revocation / logout / forced re-login).
  let active = false;
  try {
    active = await isSessionActive(verdict.claims.jti);
  } catch {
    // A DB hiccup must not silently grant access: fail closed.
    res.status(401).json({ error: "unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  if (!active) {
    res.status(401).json({ error: "unauthorized", code: "AUTH_REQUIRED" });
    return;
  }
  // Scope the rest of the request to this user (AsyncLocalStorage).
  runWithUserId(verdict.claims.sub, () => next());
}

/**
 * OPTIONAL authentication for the few PUBLIC paths that personalise when a
 * session happens to be present (the Academy preview lesson's progress PATCH).
 * Same checks as requireAuth (verify + aud rejection + server-side session
 * activity), but instead of answering 401 it returns null for "anonymous".
 *
 * NEVER falls back to DEFAULT_USER_ID - callers must treat null as anonymous
 * and skip per-user writes entirely, otherwise an unauthenticated visitor's
 * data would land on the operator's account.
 */
export async function resolveOptionalUserId(req: Request): Promise<string | null> {
  // PERSONAL SOLO-OPERATOR MODE: the operator IS the only user that exists, so
  // "anonymous" has no meaning - attribute the (public) preview-progress write
  // to the default account. This is a deliberately distinct, flag-gated branch:
  // the multi-user invariant below ("NEVER fall back to DEFAULT_USER_ID") stays
  // word-for-word intact when the flag is off.
  if (config.singleUser) return DEFAULT_USER_ID;
  const token = parseCookies(req.headers.cookie)[JWT_COOKIE] ?? "";
  if (!token) return null;
  const verdict = verifyJwt(token, config.jwtSecret, nowSec());
  if (!verdict.ok) return null;
  if (verdict.claims.aud) return null; // admin token must never act as a user
  try {
    if (!(await isSessionActive(verdict.claims.jti))) return null;
  } catch {
    return null; // DB hiccup: treat as anonymous, never guess an identity
  }
  return verdict.claims.sub;
}

// --- per-IP rate limiter for /api/auth/* (sliding window) -------------------
// Mirrors the existing inline limiter style in server.ts: a bounded Map of
// timestamp arrays, swept lazily. Spec: max 10 requests / minute / IP across the
// auth endpoints. Applied to ALL IPs (no loopback exemption) since brute-force
// of login/register/reset is the threat regardless of where it originates.
const WINDOW_MS = 60_000;
const authHits = new Map<string, number[]>();

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Lowercase the path: Express matches routes case-insensitively, so without
  // this `/API/AUTH/LOGIN` would skip the limiter yet still reach the login
  // handler - a brute-force bypass. (Same normalization as requireAuth.)
  // Feature 4: the admin login shares the same per-IP brute-force cap.
  const rlPath = req.path.toLowerCase();
  if (!rlPath.startsWith("/api/auth/") && rlPath !== "/api/admin/login") return next();
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const arr = authHits.get(ip) ?? [];
  // Drop timestamps outside the window.
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= config.auth.rateLimitPerMinute) {
    authHits.set(ip, fresh);
    res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
    return;
  }
  fresh.push(now);
  authHits.set(ip, fresh);
  // Opportunistic sweep so the map can't grow unbounded.
  if (authHits.size > 5_000) {
    for (const [k, v] of authHits) {
      const kept = v.filter((t) => now - t < WINDOW_MS);
      if (kept.length === 0) authHits.delete(k);
      else authHits.set(k, kept);
    }
  }
  next();
}

/** Test hook: clear the rate-limit window between cases. */
export function __resetAuthRateLimiterForTests(): void {
  authHits.clear();
}
