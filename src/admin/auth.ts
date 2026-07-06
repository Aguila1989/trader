/**
 * Admin backoffice authentication (Feature 4). COMPLETELY separate from user
 * auth by design:
 *
 *  - credentials come from env (ADMIN_EMAIL / ADMIN_PASSWORD_HASH bcrypt /
 *    ADMIN_TOTP_SECRET base32) - no dbo.Users row, no registration path;
 *  - TOTP (RFC 6238) is MANDATORY on every login;
 *  - the session is its own short-lived JWT (4h, no remember-me) with an
 *    "aud":"atrium-admin" claim and its OWN cookie name, so an admin token can
 *    never pass the user gate and vice versa (both verifiers check aud);
 *  - lockout: 5 failed attempts -> 30 minutes, tracked in-process (a restart
 *    clears it - acceptable: restarting the server is already game over for an
 *    attacker without the box), independent from the per-IP rate limiter;
 *  - every login attempt is written to the immutable dbo.AdminAudit trail.
 *
 * The reused primitives (signJwt/verifyJwt, bcrypt verifyPassword, cookie
 * serialization) are the vetted ones from the user-auth stack - only the
 * IDENTITY store differs.
 */
import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { signJwt, verifyJwt } from "../auth/jwt";
import { parseCookies, serializeCookie, clearCookie, type CookieOptions } from "../auth/cookies";
import { verifyPassword } from "../users/password";
import { verifyTotp } from "./totp";

export const ADMIN_COOKIE = "atrium_admin";
const ADMIN_AUD = "atrium-admin";
const SESSION_TTL_SEC = 4 * 3600; // 4h, spec: short expiry, no remember-me
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60_000;

export function adminConfigured(): boolean {
  return (
    config.admin.email.trim() !== "" &&
    config.admin.passwordHash.trim() !== "" &&
    config.admin.totpSecret.trim() !== ""
  );
}

// --- lockout (in-process) ----------------------------------------------------
let failedAttempts = 0;
let lockedUntilMs = 0;

export function adminLockedUntil(): number | null {
  return Date.now() < lockedUntilMs ? lockedUntilMs : null;
}

function registerFailure(): void {
  failedAttempts += 1;
  if (failedAttempts >= MAX_ATTEMPTS) {
    lockedUntilMs = Date.now() + LOCKOUT_MS;
    failedAttempts = 0;
  }
}

/** Test hook. */
export function __resetAdminLockoutForTests(): void {
  failedAttempts = 0;
  lockedUntilMs = 0;
}

// --- login/session -----------------------------------------------------------

export type AdminLoginResult =
  | { ok: true; jwt: string; ttlSec: number }
  | { ok: false; status: number; error: string };

export async function adminLogin(
  email: unknown,
  password: unknown,
  totp: unknown,
): Promise<AdminLoginResult> {
  if (!adminConfigured()) {
    return { ok: false, status: 503, error: "Admin access is not configured on this server." };
  }
  if (adminLockedUntil() != null) {
    return { ok: false, status: 429, error: "Too many failed attempts. Try again later." };
  }
  const e = String(email ?? "").trim().toLowerCase();
  const p = String(password ?? "");
  const code = String(totp ?? "");

  // Evaluate EVERY factor before answering (no early exits): the response
  // never reveals which factor failed, and timing stays uniform.
  const emailOk = e === config.admin.email.trim().toLowerCase();
  const passwordOk = await verifyPassword(p, config.admin.passwordHash);
  const totpOk = verifyTotp(config.admin.totpSecret, code);

  if (!(emailOk && passwordOk && totpOk)) {
    registerFailure();
    return { ok: false, status: 401, error: "Invalid credentials." };
  }
  failedAttempts = 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const jwt = signJwt(
    { sub: "admin", email: e, jti: `admin-${nowSec}`, aud: ADMIN_AUD },
    config.jwtSecret,
    { nowSec, ttlSec: SESSION_TTL_SEC },
  );
  return { ok: true, jwt, ttlSec: SESSION_TTL_SEC };
}

const cookieBase = (): Pick<CookieOptions, "secure" | "sameSite" | "path"> => ({
  secure: config.auth.cookieSecure,
  sameSite: "Strict",
  path: "/", // the admin SPA at /admin and the API at /api/admin both need it
});

export function setAdminCookie(res: Response, jwt: string, ttlSec: number): void {
  res.append("Set-Cookie", serializeCookie(ADMIN_COOKIE, jwt, { ...cookieBase(), httpOnly: true, maxAgeSec: ttlSec }));
}

export function clearAdminCookie(res: Response): void {
  res.append("Set-Cookie", clearCookie(ADMIN_COOKIE, { ...cookieBase(), httpOnly: true }));
}

/** The verified admin email for a request, or null. AUD is enforced: a normal
 *  user JWT (no aud) in this cookie never passes, and vice versa. */
export function adminFromRequest(req: Request): string | null {
  const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  if (!token) return null;
  const v = verifyJwt(token, config.jwtSecret, Math.floor(Date.now() / 1000));
  if (!v.ok) return null;
  const claims = v.claims as { email?: string; aud?: string };
  return claims.aud === ADMIN_AUD && claims.email ? claims.email : null;
}

/**
 * Gate for /api/admin/*: only /api/admin/login (+logout) pass unauthenticated.
 * Mounted BEFORE the user requireAuth in server.ts, so admin requests never
 * touch the user gate (and carry no user context).
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const path = req.path.toLowerCase();
  if (path === "/login" || path === "/logout") {
    next();
    return;
  }
  const email = adminFromRequest(req);
  if (!email) {
    res.status(401).json({ error: "admin authentication required" });
    return;
  }
  (req as Request & { adminEmail?: string }).adminEmail = email;
  next();
}
