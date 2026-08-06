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
import {
  currentUserId,
  DEFAULT_USER_ID,
  DEFAULT_USER_EMAIL,
  DEFAULT_USER_DISPLAY_NAME,
} from "../users/context";
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
    if (r.ok === "2fa") {
      // Deliberately 200, not a session: the challenge lives ONLY in the
      // response body (never a cookie), so it can never pass requireAuth.
      res.json({ twoFactorRequired: true, challenge: r.challenge });
      return;
    }
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    setSessionCookies(res, r);
    res.json({
      user: { id: r.user.id, email: r.user.email, displayName: r.user.displayName ?? null },
    });
  });

  // POST /api/auth/2fa/verify - PUBLIC (runs pre-session; see PUBLIC_API_PATHS).
  // Completes login for an account with 2FA enabled: the challenge from
  // /login plus the authenticator code. On success this sets the SAME session
  // cookies /login would have set.
  router.post("/2fa/verify", async (req, res) => {
    const r = await auth.verifyTwoFactor({
      challenge: req.body?.challenge,
      code: req.body?.code,
      rememberMe: Boolean(req.body?.rememberMe),
      ip: req.ip ?? null,
    });
    // verifyTwoFactor never actually returns the "2fa" variant (that only
    // comes out of login()) - narrow it away so the success branch below has
    // the same shape setSessionCookies expects from /login.
    if (r.ok === "2fa") {
      res.status(500).json({ error: "Unexpected 2FA state." });
      return;
    }
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
        onboardingCompleted: user.onboardingCompleted,
        totpEnabled: user.totpEnabled,
      },
    });
  });

  // --- end-user 2FA (TOTP), opt-in - all three are authenticated (requireAuth
  // already ran; NOT in PUBLIC_API_PATHS), mirroring /change-password. ---

  // POST /api/auth/2fa/setup - (re)start enrollment: generates + persists a
  // pending secret and returns it plus the otpauth:// URI for the QR code.
  router.post("/2fa/setup", async (_req: Request, res: Response) => {
    const r = await auth.setupTwoFactor(currentUserId());
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ secret: r.secret, otpauthUri: r.otpauthUri });
  });

  // POST /api/auth/2fa/enable {code} - confirm enrollment with a valid code.
  // Returns the 10 backup codes in PLAINTEXT exactly once - the client must
  // show them to the user immediately; they cannot be retrieved again later.
  router.post("/2fa/enable", async (req: Request, res: Response) => {
    const r = await auth.enableTwoFactor(currentUserId(), req.body?.code);
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ ok: true, backupCodes: r.backupCodes });
  });

  // POST /api/auth/2fa/backup-codes {code} - regenerate the backup-code set,
  // invalidating every previously-issued code. Requires a valid CURRENT TOTP
  // code (not a backup code - see regenerateBackupCodes). Returns the new
  // codes in PLAINTEXT exactly once, same as /2fa/enable.
  router.post("/2fa/backup-codes", async (req: Request, res: Response) => {
    const r = await auth.regenerateBackupCodes(currentUserId(), req.body?.code);
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ backupCodes: r.backupCodes });
  });

  // POST /api/auth/2fa/disable {password, code} - requires BOTH.
  router.post("/2fa/disable", async (req: Request, res: Response) => {
    const r = await auth.disableTwoFactor({
      userId: currentUserId(),
      password: req.body?.password,
      code: req.body?.code,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    res.json({ ok: true });
  });

  // POST /api/auth/onboarding {completed: boolean} - mark the interactive tour
  // done/skipped (true) or reset it so it auto-starts again (false, the
  // Settings > Account "Restart Tutorial" action). Authenticated (default-deny
  // gate) and self-scoped: a user can only ever flip their own flag.
  router.post("/onboarding", async (req: Request, res: Response) => {
    const completed = req.body?.completed;
    if (typeof completed !== "boolean") {
      res.status(400).json({ error: "completed must be a boolean" });
      return;
    }
    await auth.setOnboardingCompleted(currentUserId(), completed);
    res.json({ ok: true, onboardingCompleted: completed });
  });

  // GET /api/auth/export - GDPR data export. Assembles everything the app
  // stores for the signed-in user into one JSON object and returns it as a
  // downloadable attachment (never inline - the browser always saves it).
  router.get("/export", async (_req: Request, res: Response) => {
    const data = await auth.exportUserData(currentUserId());
    if (!data) {
      res.status(404).json({ error: "account not found" });
      return;
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="atrium-data-export-${Date.now()}.json"`);
    res.send(JSON.stringify(data, null, 2));
  });

  // POST /api/auth/delete-account {password} - GDPR account deletion
  // (anonymize; see auth/store.ts deleteUserAndData for why). Requires the
  // current password (generic error on mismatch, mirroring /change-password).
  // On success every cookie is cleared so the client is logged out immediately
  // - there is no account left to hold a session for.
  router.post("/delete-account", async (req: Request, res: Response) => {
    const r = await auth.deleteAccount({
      userId: currentUserId(),
      password: req.body?.password,
    });
    if (!r.ok) {
      res.status(r.status).json({ error: r.error });
      return;
    }
    clearSessionCookies(res);
    res.json({ ok: true });
  });

  return router;
}

/**
 * PERSONAL SOLO-OPERATOR MODE (SINGLE_USER=true): the tiny /api/auth surface
 * the SPA still expects when the full auth router is not mounted. Exactly two
 * endpoints - GET /me (the onboarding tour + Account tab identity read; the
 * SPA's authApi.account() hits the same path) and POST /onboarding (persist
 * the tour's completed flag). Nothing else: no login/register/2FA/reset/
 * delete-account surface exists in single-user mode. Every request already
 * runs as DEFAULT_USER_ID via the requireAuth bypass, so currentUserId() is
 * the operator. Resilient to a missing Users row (in-memory boot): falls back
 * to the DEFAULT-account constants with onboardingCompleted=true so the tour
 * never nags when nothing can persist.
 */
export function createSingleUserAuthRouter(): Router {
  const router = Router();

  router.get("/me", async (_req: Request, res: Response) => {
    const user = await auth.getAccount(currentUserId()).catch(() => null);
    res.json({
      user: user
        ? {
            id: user.id,
            email: user.email,
            displayName: user.displayName ?? null,
            createdAt: user.createdAt,
            onboardingCompleted: user.onboardingCompleted,
            totpEnabled: user.totpEnabled,
          }
        : {
            id: DEFAULT_USER_ID,
            email: DEFAULT_USER_EMAIL,
            displayName: DEFAULT_USER_DISPLAY_NAME,
            createdAt: null,
            onboardingCompleted: true,
            totpEnabled: false,
          },
    });
  });

  router.post("/onboarding", async (req: Request, res: Response) => {
    const completed = req.body?.completed;
    if (typeof completed !== "boolean") {
      res.status(400).json({ error: "completed must be a boolean" });
      return;
    }
    // Best-effort: without a Users row (in-memory boot) there is nothing to
    // persist - still answer ok so the tour UI never errors for the operator.
    await auth.setOnboardingCompleted(currentUserId(), completed).catch(() => {});
    res.json({ ok: true, onboardingCompleted: completed });
  });

  return router;
}
