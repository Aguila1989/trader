/**
 * Authentication business logic. HTTP/cookie concerns live in src/auth/routes.ts
 * and src/auth/middleware.ts; this module is pure-ish orchestration over the
 * store, the JWT signer, bcrypt, the password policy, and the mailer, so it can
 * be unit-tested without booting Express.
 *
 * Security properties enforced here (cross-checked against the repo's pentest
 * findings):
 *  - Anti-enumeration: register + forgot-password ALWAYS return the same generic
 *    result whether or not the email exists; login returns a single generic
 *    "Invalid email or password" for both unknown-email and wrong-password, and
 *    runs a dummy bcrypt compare on the unknown-email path so timing can't leak
 *    existence (mirrors the constant-time DASHBOARD_TOKEN compare).
 *  - Account lockout: N consecutive failures lock the account for a window; the
 *    "locked" state is only revealed to a caller who supplied the CORRECT
 *    password (i.e. the real owner), never to a guesser.
 *  - Email verification gates login when SMTP is configured; without SMTP the
 *    account is auto-verified and a warning is logged (per spec).
 *  - Passwords are never logged and never returned; only bcrypt hashes persist.
 */
import { config } from "../config";
import { store } from "../trading/store";
import { hashPassword, verifyPassword } from "../users/password";
import { signJwt } from "./jwt";
import { validatePasswordOrError } from "./passwordPolicy";
import {
  generateLinkToken,
  hashToken,
  isValidEmail,
  newId,
  normalizeEmail,
} from "./tokens";
import { buildLink, sendMail, smtpConfigured } from "./mailer";
import * as authStore from "./store";
import type { User } from "../users/types";

/** The neutral message the spec mandates for every login failure. */
const GENERIC_LOGIN_ERROR = "Invalid email or password";
/** Neutral, identical responses for the enumeration-sensitive flows. */
const GENERIC_REGISTER_MSG = "If this email is available, your account has been created.";
const GENERIC_FORGOT_MSG = "If an account exists for that email, a password reset link has been sent.";

const nowSec = (): number => Math.floor(Date.now() / 1000);

// A FIXED valid bcrypt hash (cost 12) used ONLY to equalize timing on the
// unknown-email login path: verifyPassword runs a full bcrypt compare whether or
// not the email exists, AND there is no first-request lazy-init delta (a prior
// version computed the hash on first use, leaking a timing signal). The value is
// a hash of a throwaway string and is never a usable credential.
const DUMMY_HASH = "$2b$12$iqH0sn0OxzcszWua.YD9ke4vfTIuXooe6IhzQbSgBdqej9h/5Onmy";
async function dummyCompare(password: string): Promise<void> {
  try {
    await verifyPassword(password, DUMMY_HASH);
  } catch {
    /* timing best-effort */
  }
}

// --- registration -----------------------------------------------------------

export type RegisterResult =
  | { ok: true; message: string; verificationRequired: boolean }
  | { ok: false; status: number; error: string };

export async function registerUser(input: {
  email: unknown;
  password: unknown;
  confirmPassword: unknown;
}): Promise<RegisterResult> {
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "");
  const confirm = String(input.confirmPassword ?? "");

  // These validation errors do NOT reveal whether an account exists, so they are
  // returned verbatim (good UX) rather than folded into the generic message.
  if (!isValidEmail(email)) return { ok: false, status: 400, error: "Please enter a valid email address." };
  if (password !== confirm) return { ok: false, status: 400, error: "Passwords do not match." };
  const pwError = validatePasswordOrError(password);
  if (pwError) return { ok: false, status: 400, error: pwError };

  const passwordHash = await hashPassword(password);
  // No SMTP => auto-verify and warn (spec). With SMTP => require verification.
  const autoVerify = !smtpConfigured;
  const created = await authStore.createAccount({
    id: newId(),
    email,
    passwordHash,
    displayName: undefined,
    emailVerified: autoVerify,
  });

  if (created && !autoVerify) {
    // Send a verification link. Failures are swallowed (logged) so the response
    // stays generic and never reveals the account was actually created.
    const { raw, hash } = generateLinkToken();
    await authStore.createLinkToken({
      userId: created.id,
      type: "verify",
      tokenHash: hash,
      expiresAt: Date.now() + config.auth.verifyTokenHours * 3_600_000,
    });
    const link = buildLink("verify-email", raw);
    // Fire-and-forget: do NOT await the send, so the response time does not depend
    // on whether an account was created (anti-enumeration). sendMail never throws.
    void sendMail({
      to: email,
      subject: "Verify your Atrium account",
      text: `Welcome! Confirm your email to activate your account:\n\n${link}\n\nThis link expires in ${config.auth.verifyTokenHours} hours.`,
      html: `<p>Welcome! Confirm your email to activate your account:</p><p><a href="${link}">Verify my email</a></p><p>This link expires in ${config.auth.verifyTokenHours} hours.</p>`,
    });
  } else if (created && autoVerify) {
    store.log(
      "warn",
      `Registered ${email} WITHOUT email verification: no SMTP configured (set SMTP_HOST to require verification).`,
    );
  }

  return { ok: true, message: GENERIC_REGISTER_MSG, verificationRequired: !autoVerify };
}

// --- login ------------------------------------------------------------------

export type LoginResult =
  | { ok: true; user: User; jwt: string; jti: string; ttlSec: number; expSec: number }
  | { ok: false; status: number; error: string };

export async function login(input: {
  email: unknown;
  password: unknown;
  rememberMe?: boolean;
  ip: string | null;
}): Promise<LoginResult> {
  if (!config.jwtSecret) {
    // Defensive: the boot guard prevents this, but never sign with an empty key.
    return { ok: false, status: 500, error: "Server auth is not configured." };
  }
  const email = normalizeEmail(input.email);
  const password = String(input.password ?? "");
  const ip = input.ip;

  const cred = await authStore.findCredentialByEmail(email);

  if (!cred) {
    await dummyCompare(password); // equalize timing vs the found-user path
    await authStore.recordLoginAttempt({ email: email || null, userId: null, ip, success: false, reason: "unknown-email" });
    return { ok: false, status: 401, error: GENERIC_LOGIN_ERROR };
  }

  const passwordOk = await verifyPassword(password, cred.passwordHash);
  const locked = cred.lockedUntil != null && cred.lockedUntil > Date.now();

  if (!passwordOk) {
    // Don't pile more failures onto an already-locked account; just reject.
    if (!locked) {
      const r = await authStore.registerFailedLogin(cred.user.id, config.auth.maxFailedLogins, config.auth.lockoutMinutes * 60_000);
      await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: r.locked ? "bad-password-locked" : "bad-password" });
    } else {
      await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "bad-password-while-locked" });
    }
    return { ok: false, status: 401, error: GENERIC_LOGIN_ERROR };
  }

  // Password is correct from here -> safe to reveal owner-only states.
  if (locked) {
    await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "locked" });
    return {
      ok: false,
      status: 403,
      error: `Account temporarily locked due to repeated failed logins. Try again in about ${config.auth.lockoutMinutes} minutes.`,
    };
  }
  if (!cred.isActive) {
    await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "disabled" });
    return { ok: false, status: 403, error: "This account is disabled." };
  }
  // Feature 4: an admin-disabled account cannot log in (same generic message -
  // the backoffice action is deliberately not distinguishable to the user).
  if (cred.disabledByAdmin) {
    await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "admin-disabled" });
    return { ok: false, status: 403, error: "This account is disabled." };
  }
  if (!cred.emailVerified) {
    await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "unverified" });
    return { ok: false, status: 403, error: "Please verify your email address before logging in. Check your inbox for the verification link." };
  }

  // Success: mint a session + JWT.
  const ttlSec = input.rememberMe
    ? config.auth.rememberMeDays * 86_400
    : config.auth.sessionHours * 3_600;
  const issued = nowSec();
  const jti = newId();
  await authStore.createSession({
    id: jti,
    userId: cred.user.id,
    expiresAt: (issued + ttlSec) * 1000,
    ip: ip ?? undefined,
  });
  const jwt = signJwt({ sub: cred.user.id, email: cred.user.email, jti }, config.jwtSecret, { nowSec: issued, ttlSec });
  await authStore.recordSuccessfulLogin(cred.user.id);
  await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: true, reason: input.rememberMe ? "ok-remember" : "ok" });

  return { ok: true, user: cred.user, jwt, jti, ttlSec, expSec: issued + ttlSec };
}

// --- logout -----------------------------------------------------------------

/** Revoke the session behind a (valid) JWT. Cookie clearing is the route's job. */
export async function logout(jti: string | null): Promise<void> {
  if (jti) await authStore.revokeSession(jti);
}

// --- forgot / reset password -----------------------------------------------

export async function forgotPassword(input: { email: unknown }): Promise<{ message: string }> {
  const email = normalizeEmail(input.email);
  if (isValidEmail(email)) {
    const cred = await authStore.findCredentialByEmail(email);
    if (cred) {
      await authStore.invalidateLinkTokens(cred.user.id, "reset");
      const { raw, hash } = generateLinkToken();
      await authStore.createLinkToken({
        userId: cred.user.id,
        type: "reset",
        tokenHash: hash,
        expiresAt: Date.now() + config.auth.resetTokenMinutes * 60_000,
      });
      const link = buildLink("reset-password", raw);
      if (smtpConfigured) {
        // Fire-and-forget so timing doesn't reveal whether the account exists.
        void sendMail({
          to: email,
          subject: "Reset your Atrium password",
          text: `Reset your password with this link (valid ${config.auth.resetTokenMinutes} minutes):\n\n${link}\n\nIf you did not request this, you can ignore this email.`,
          html: `<p>Reset your password with this link (valid ${config.auth.resetTokenMinutes} minutes):</p><p><a href="${link}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>`,
        });
      } else if (config.network !== "public" || config.auth.devResetLinks) {
        // No SMTP, non-production (testnet) or explicit opt-in: surface the
        // link on the SERVER CONSOLE only (stdout), so a single-operator dev
        // setup can still complete a reset. Deliberately NOT via store.log -
        // that persists to dbo.Logs, which is readable by any authenticated
        // user through /api/logs (a token-disclosure / account-takeover risk
        // now that the app is multi-user).
        console.warn(`[auth] Password-reset link for ${email} (SMTP disabled, dev only): ${link}`);
      } else {
        // AUDIT-010: on MAINNET the raw reset link is a full account-takeover
        // credential - never write it to stdout (process managers and log
        // shippers persist stdout). Without SMTP the reset simply cannot be
        // delivered; say so operator-side without leaking anything usable.
        console.warn(
          `[auth] Password reset requested for ${email}, but SMTP is not configured - ` +
            "no reset link can be delivered on mainnet. Configure SMTP_HOST (or set " +
            "AUTH_DEV_RESET_LINKS=true to print reset links to stdout AT YOUR OWN RISK).",
        );
      }
    }
  }
  return { message: GENERIC_FORGOT_MSG };
}

export type ResetResult = { ok: true } | { ok: false; status: number; error: string };

export async function resetPassword(input: {
  token: unknown;
  password: unknown;
  confirmPassword: unknown;
}): Promise<ResetResult> {
  const token = String(input.token ?? "");
  const password = String(input.password ?? "");
  const confirm = String(input.confirmPassword ?? "");
  if (!token) return { ok: false, status: 400, error: "This reset link is invalid or has expired." };
  if (password !== confirm) return { ok: false, status: 400, error: "Passwords do not match." };
  const pwError = validatePasswordOrError(password);
  if (pwError) return { ok: false, status: 400, error: pwError };

  const userId = await authStore.consumeLinkToken("reset", hashToken(token));
  if (!userId) return { ok: false, status: 400, error: "This reset link is invalid or has expired." };

  const passwordHash = await hashPassword(password);
  await authStore.setPasswordHash(userId, passwordHash); // also revokes all sessions
  store.log("info", "A password was reset; all existing sessions for that account were revoked.");
  return { ok: true };
}

// --- change password (authenticated, self-service) --------------------------

/** Neutral error for a wrong current-password, mirroring GENERIC_LOGIN_ERROR. */
const GENERIC_CHANGE_PW_ERROR = "Current password is incorrect.";

export type ChangePasswordResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Change the signed-in user's password. Runs behind requireAuth, so `userId`
 * comes from the verified JWT (currentUserId()) and the route is already
 * rate-limited by authRateLimiter.
 *
 * Order matters for anti-enumeration / no-state-leak:
 *  1) Verify the CURRENT password FIRST. On any mismatch (or a missing account)
 *     return the SAME generic error, before revealing anything else (e.g. we do
 *     not surface lockout state here - only the real owner reaches step 2).
 *  2) Validate the NEW password against the same policy as register/reset.
 *  3) Persist the new bcrypt hash and revoke every OTHER session, KEEPING the
 *     caller's current session (`keepJti`) alive so the browser stays logged in.
 *     The existing JWT/cookie is intentionally NOT re-minted or rotated.
 *
 * The plaintext passwords are never logged or echoed anywhere.
 */
export async function changePassword(input: {
  userId: string;
  currentJti: string | null;
  currentPassword: unknown;
  newPassword: unknown;
}): Promise<ChangePasswordResult> {
  const currentPassword = String(input.currentPassword ?? "");
  const newPassword = String(input.newPassword ?? "");

  // 1) Verify the current password first (owner check, no state leak). The
  // credential (with the bcrypt hash) is keyed by email, so resolve the account
  // from the verified JWT's userId, then load its credential.
  const account = await authStore.findUserById(input.userId);
  const cred = account ? await authStore.findCredentialByEmail(account.email) : null;
  if (!cred || !(await verifyPassword(currentPassword, cred.passwordHash))) {
    return { ok: false, status: 400, error: GENERIC_CHANGE_PW_ERROR };
  }

  // 2) New password must satisfy the policy (same as register/reset).
  const pwError = validatePasswordOrError(newPassword);
  if (pwError) return { ok: false, status: 400, error: pwError };

  // 3) Persist + revoke all OTHER sessions, keeping the current one alive.
  const passwordHash = await hashPassword(newPassword);
  await authStore.setPasswordHash(cred.user.id, passwordHash, input.currentJti ?? undefined);
  // Fire-and-forget audit (never await; no password in the payload).
  store.log("info", "User password changed", { userId: cred.user.id });
  return { ok: true };
}

// --- email verification -----------------------------------------------------

export type VerifyResult = { ok: true } | { ok: false; status: number; error: string };

export async function verifyEmail(input: { token: unknown }): Promise<VerifyResult> {
  const token = String(input.token ?? "");
  if (!token) return { ok: false, status: 400, error: "This verification link is invalid or has expired." };
  const userId = await authStore.consumeLinkToken("verify", hashToken(token));
  if (!userId) return { ok: false, status: 400, error: "This verification link is invalid or has expired." };
  await authStore.setEmailVerified(userId);
  return { ok: true };
}

// --- current account (for /api/auth/me) ------------------------------------

export async function getAccount(userId: string): Promise<User | null> {
  return authStore.findUserById(userId);
}

// --- onboarding tutorial flag (Feature 1, 2026-07) --------------------------

export async function setOnboardingCompleted(userId: string, completed: boolean): Promise<void> {
  await authStore.setOnboardingCompleted(userId, completed);
}
