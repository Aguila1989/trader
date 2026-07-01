/**
 * The /api/auth/* router. Thin HTTP layer over src/auth/service.ts: it owns
 * cookies and status codes; the service owns the logic. The CSRF origin guard
 * and the per-IP auth rate limiter (server.ts) run BEFORE this router.
 *
 * On login two cookies are set (see src/auth/cookies.ts):
 *   - JWT_COOKIE     httpOnly  : the signed session JWT (the credential).
 *   - SESSION_COOKIE readable  : a non-sensitive {email,displayName,exp} marker
 *                                the SPA reads to know it is logged in WITHOUT an
 *                                authenticated API call (per the spec). It is
 *                                ignored by the server for auth.
 */
import { Router, type Request, type Response } from "express";
import { config } from "../config";
import {
  JWT_COOKIE,
  SESSION_COOKIE,
  clearCookie,
  parseCookies,
  serializeCookie,
  type CookieOptions,
} from "./cookies";
import { verifyJwt } from "./jwt";
import { currentUserId } from "../users/context";
import * as auth from "./service";

const cookieBase = (): Pick<CookieOptions, "secure" | "sameSite" | "path"> => ({
  secure: config.auth.cookieSecure,
  // Strict: a same-origin SPA never needs the cookie on a cross-site request, and
  // this is our CSRF defence-in-depth on top of the Origin guard.
  sameSite: "Strict",
  path: "/",
});

/** Set the httpOnly JWT cookie + the readable session marker. */
function setSessionCookies(res: Response, r: Extract<auth.LoginResult, { ok: true }>): void {
  const base = cookieBase();
  const jwtCookie = serializeCookie(JWT_COOKIE, r.jwt, { ...base, httpOnly: true, maxAgeSec: r.ttlSec });
  const marker = Buffer.from(
    JSON.stringify({
      email: r.user.email,
      displayName: r.user.displayName ?? null,
      exp: r.expSec,
    }),
  ).toString("base64url");
  const sessionCookie = serializeCookie(SESSION_COOKIE, marker, { ...base, httpOnly: false, maxAgeSec: r.ttlSec });
  res.append("Set-Cookie", jwtCookie);
  res.append("Set-Cookie", sessionCookie);
}

/** Clear both session cookies (logout / password reset). */
function clearSessionCookies(res: Response): void {
  const base = cookieBase();
  res.append("Set-Cookie", clearCookie(JWT_COOKIE, { ...base, httpOnly: true }));
  res.append("Set-Cookie", clearCookie(SESSION_COOKIE, { ...base, httpOnly: false }));
}

export function createAuthRouter(): Router {
  const router = Router();

  // POST /api/auth/register
  router.post("/register", async (req, res) => {
    const r = await auth.registerUser({
      email: req.body?.email,
      password: req.body?.password,
      confirmPassword: req.body?.confirmPassword ?? req.body?.confirm,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ message: r.message, verificationRequired: r.verificationRequired });
  });

  // POST /api/auth/login
  router.post("/login", async (req, res) => {
    const r = await auth.login({
      email: req.body?.email,
      password: req.body?.password,
      rememberMe: Boolean(req.body?.rememberMe),
      ip: req.ip ?? null,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    setSessionCookies(res, r);
    res.json({
      user: { id: r.user.id, email: r.user.email, displayName: r.user.displayName ?? null },
    });
  });

  // POST /api/auth/logout - revoke the session server-side + clear cookies.
  router.post("/logout", async (req, res) => {
    const token = parseCookies(req.headers.cookie)[JWT_COOKIE] ?? "";
    if (token) {
      const v = verifyJwt(token, config.jwtSecret, Math.floor(Date.now() / 1000));
      if (v.ok) {
        // Best effort: even if revocation fails (e.g. DB hiccup), still clear the
        // cookies and return 200 - the user must end up logged out client-side.
        try {
          await auth.logout(v.claims.jti);
        } catch {
          /* swallow - cookies are cleared below regardless */
        }
      }
    }
    clearSessionCookies(res);
    res.json({ ok: true });
  });

  // POST /api/auth/forgot-password - always generic.
  router.post("/forgot-password", async (req, res) => {
    const r = await auth.forgotPassword({ email: req.body?.email });
    res.json({ message: r.message });
  });

  // POST /api/auth/reset-password
  router.post("/reset-password", async (req, res) => {
    const r = await auth.resetPassword({
      token: req.body?.token,
      password: req.body?.password,
      confirmPassword: req.body?.confirmPassword ?? req.body?.confirm,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    // A reset revokes all sessions; make sure this browser is logged out too.
    clearSessionCookies(res);
    res.json({ ok: true, message: "Your password has been reset. You can now log in." });
  });

  // POST /api/auth/verify-email
  router.post("/verify-email", async (req, res) => {
    const r = await auth.verifyEmail({ token: req.body?.token });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ ok: true, message: "Your email is verified. You can now log in." });
  });

  // POST /api/auth/change-password - authenticated self-service password change.
  // Behind requireAuth (so currentUserId() is set) and already rate-limited by
  // authRateLimiter (it lives under /api/auth/*). The current session is KEPT
  // alive (keepJti) so the browser stays logged in; the cookie is NOT re-minted.
  router.post("/change-password", async (req: Request, res: Response) => {
    // Extract the current session's jti from the (already-verified) JWT so the
    // service can preserve THIS session while revoking all the user's others.
    let currentJti: string | null = null;
    const token = parseCookies(req.headers.cookie)[JWT_COOKIE] ?? "";
    if (token) {
      const v = verifyJwt(token, config.jwtSecret, Math.floor(Date.now() / 1000));
      if (v.ok) currentJti = v.claims.jti;
    }
    const r = await auth.changePassword({
      userId: currentUserId(),
      currentJti,
      currentPassword: req.body?.currentPassword,
      newPassword: req.body?.newPassword,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ ok: true });
  });

  // GET /api/auth/me - the authenticated user (this route is NOT in the public
  // allowlist, so the gate has already validated the session + set the context).
  router.get("/me", async (_req: Request, res: Response) => {
    const user = await auth.getAccount(currentUserId());
    if (!user) {
      res.status(404).json({ error: "account not found" });
      return;
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? null,
        createdAt: user.createdAt,
      },
    });
  });

  return router;
}
