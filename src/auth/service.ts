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
import { createHash, randomBytes } from "node:crypto";
import { config } from "../config";
import { store } from "../trading/store";
import * as repo from "../db/repo";
import { hashPassword, verifyPassword } from "../users/password";
import { signJwt, verifyJwt } from "./jwt";
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
import { verifyTotp, generateTotpSecret, otpauthUri } from "../admin/totp";
import { coerceRiskProfile } from "../types";
import { getUserAiKeyMeta } from "../ai/userKeys";
import { cancelSubscription } from "../billing/stripeClient";

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

/** Audience claim for the short-lived pending-2FA challenge token. */
const TWO_FA_PENDING_AUD = "atrium-2fa-pending";
/** The challenge is deliberately short-lived: it is a "prove you also have the
 *  password" ticket, not a session, and is never set as a cookie. */
const TWO_FA_CHALLENGE_TTL_SEC = 300;

export type LoginResult =
  | { ok: true; user: User; jwt: string; jti: string; ttlSec: number; expSec: number }
  | { ok: "2fa"; challenge: string }
  | { ok: false; status: number; error: string };

/**
 * Mint a real session (JWT + dbo.AuthSessions row) for an already-fully-
 * authenticated user. Shared by login() (the no-2FA path) and
 * verifyTwoFactor() (after a correct code), so the two paths can never drift
 * apart on TTL/claims/bookkeeping.
 */
async function mintSession(
  user: User,
  rememberMe: boolean | undefined,
  ip: string | null,
): Promise<Extract<LoginResult, { ok: true }>> {
  const ttlSec = rememberMe ? config.auth.rememberMeDays * 86_400 : config.auth.sessionHours * 3_600;
  const issued = nowSec();
  const jti = newId();
  await authStore.createSession({
    id: jti,
    userId: user.id,
    expiresAt: (issued + ttlSec) * 1000,
    ip: ip ?? undefined,
  });
  const jwt = signJwt({ sub: user.id, email: user.email, jti }, config.jwtSecret, { nowSec: issued, ttlSec });
  await authStore.recordSuccessfulLogin(user.id);
  return { ok: true, user, jwt, jti, ttlSec, expSec: issued + ttlSec };
}

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

  // End-user 2FA (opt-in): the password is correct and every other check has
  // passed, but the account has TOTP enabled. Do NOT create a session or set
  // any cookies yet - mint a short-lived, narrowly-scoped challenge token
  // (aud="atrium-2fa-pending") that only proves "this request already knew the
  // correct password"; verifyTwoFactor() below is the only thing that can turn
  // it into a real session, and only after a correct code.
  if (cred.totpEnabled) {
    const challenge = signJwt(
      { sub: cred.user.id, email: cred.user.email, jti: newId(), aud: TWO_FA_PENDING_AUD },
      config.jwtSecret,
      { nowSec: nowSec(), ttlSec: TWO_FA_CHALLENGE_TTL_SEC },
    );
    await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: false, reason: "2fa-required" });
    return { ok: "2fa", challenge };
  }

  // Success: mint a session + JWT.
  const result = await mintSession(cred.user, input.rememberMe, ip);
  await authStore.recordLoginAttempt({ email, userId: cred.user.id, ip, success: true, reason: input.rememberMe ? "ok-remember" : "ok" });
  return result;
}

// --- end-user 2FA (TOTP), opt-in --------------------------------------------

/**
 * Backup codes: 10 single-use recovery codes minted at /2fa/enable (and
 * wholesale-replaced by /2fa/backup-codes), shown to the user exactly once in
 * plaintext at generation time. Only a SHA-256 hash of each NORMALIZED code
 * (uppercased, dashes/spaces stripped) is ever persisted - see
 * authStore.setTotpBackupCodes / the totpBackupCodes column.
 *
 * Codes are high-entropy and never user-chosen, so a fast cryptographic hash
 * (not bcrypt's deliberately-slow KDF, which exists to blunt guessing of
 * LOW-entropy user-chosen secrets) is the right tool - same reasoning as the
 * link-token hashing in tokens.ts.
 *
 * The alphabet excludes visually-ambiguous characters (0/O, 1/I) and is
 * exactly 32 characters - a power of two - so mapping one random byte to one
 * character via a 5-bit mask (`byte & 0x1f`) is perfectly uniform with no
 * modulo bias.
 */
const BACKUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 chars, no 0/O/1/I
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10; // characters per code, before the "XXXXX-XXXXX" separator

/** One fresh code, formatted "XXXXX-XXXXX" for readability. */
function generateBackupCode(): string {
  const bytes = randomBytes(BACKUP_CODE_LENGTH);
  let raw = "";
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    raw += BACKUP_CODE_ALPHABET[bytes[i]! & 0x1f];
  }
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/** A fresh set of BACKUP_CODE_COUNT distinct plaintext codes. */
function generateBackupCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < BACKUP_CODE_COUNT) codes.add(generateBackupCode());
  return [...codes];
}

/** Canonical comparison/storage form: uppercase, no dashes or whitespace. */
function normalizeBackupCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, "");
}

/** SHA-256 hex hash of an already-normalized code. */
function hashBackupCode(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

/** Hash + persist a freshly-generated plaintext code set for a user. */
async function persistBackupCodes(userId: string, codes: string[]): Promise<void> {
  const hashes = codes.map((c) => hashBackupCode(normalizeBackupCode(c)));
  await authStore.setTotpBackupCodes(userId, JSON.stringify(hashes));
}

export type TwoFactorVerifyResult = LoginResult;

/**
 * Complete login for an account with 2FA enabled: verify the pending-2FA
 * challenge minted by login(), then the user-entered code, then mint the real
 * session exactly like the no-2FA path (mintSession is shared). A bad code
 * records a failed login attempt, same as a bad password.
 *
 * The code is EITHER a 6-digit TOTP code or a one-time backup code - a plain
 * `/^\d{6}$/` check on the trimmed input picks the path (backup codes are
 * 10 letters/digits, never all-digit-6, so the two formats never collide). A
 * successful backup code is immediately removed from the stored set (single
 * use) and logged as a security-relevant event, since it means the user's
 * authenticator app was unavailable.
 */
export async function verifyTwoFactor(input: {
  challenge: unknown;
  code: unknown;
  rememberMe?: boolean;
  ip: string | null;
}): Promise<TwoFactorVerifyResult> {
  const challenge = String(input.challenge ?? "");
  const code = String(input.code ?? "").trim();
  const ip = input.ip;

  const v = verifyJwt(challenge, config.jwtSecret, nowSec());
  if (!v.ok || v.claims.aud !== TWO_FA_PENDING_AUD) {
    return { ok: false, status: 401, error: "This code challenge is invalid or has expired. Please sign in again." };
  }

  const user = await authStore.findUserById(v.claims.sub);
  const cred = user ? await authStore.findCredentialByEmail(user.email) : null;
  if (!cred || !cred.totpEnabled || !cred.totpSecret) {
    // The account's 2FA state changed (e.g. an admin reset it) between login
    // and this call - fail closed rather than silently skipping the check.
    return { ok: false, status: 401, error: "This code challenge is invalid or has expired. Please sign in again." };
  }

  const isTotpFormat = /^\d{6}$/.test(code);
  let usedBackupCode = false;

  if (isTotpFormat) {
    if (!verifyTotp(cred.totpSecret, code)) {
      await authStore.recordLoginAttempt({ email: cred.user.email, userId: cred.user.id, ip, success: false, reason: "bad-2fa-code" });
      return { ok: false, status: 401, error: "Invalid authentication code." };
    }
  } else {
    const hashes: string[] = cred.totpBackupCodes ? JSON.parse(cred.totpBackupCodes) : [];
    const hash = hashBackupCode(normalizeBackupCode(code));
    const idx = hashes.indexOf(hash);
    if (idx === -1) {
      await authStore.recordLoginAttempt({ email: cred.user.email, userId: cred.user.id, ip, success: false, reason: "bad-2fa-code" });
      return { ok: false, status: 401, error: "Invalid authentication code." };
    }
    // Single-use: remove the consumed hash before minting the session.
    const remaining = hashes.filter((_, i) => i !== idx);
    await authStore.setTotpBackupCodes(cred.user.id, JSON.stringify(remaining));
    usedBackupCode = true;
    store.log("warn", `2FA backup code used to sign in (authenticator app was not used); ${remaining.length} backup code(s) remain.`, {
      userId: cred.user.id,
      remaining: remaining.length,
    });
  }

  const result = await mintSession(cred.user, input.rememberMe, ip);
  await authStore.recordLoginAttempt({
    email: cred.user.email,
    userId: cred.user.id,
    ip,
    success: true,
    reason: usedBackupCode ? "ok-2fa-backup" : input.rememberMe ? "ok-remember-2fa" : "ok-2fa",
  });
  return result;
}

export type TwoFactorSetupResult =
  | { ok: true; secret: string; otpauthUri: string }
  | { ok: false; status: number; error: string };

/**
 * Start (or restart) enrollment: generate a fresh secret, persist it as
 * PENDING (totpEnabled stays false until enableTwoFactor confirms a code),
 * and return it plus the otpauth:// URI for the authenticator-app QR code.
 * Safe to call again before confirming - each call replaces the pending secret.
 */
export async function setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
  const user = await authStore.findUserById(userId);
  if (!user) return { ok: false, status: 404, error: "Account not found." };
  const secret = generateTotpSecret();
  await authStore.setTotpSecret(userId, secret);
  return { ok: true, secret, otpauthUri: otpauthUri(secret, user.email, "Atrium") };
}

export type TwoFactorEnableResult =
  | { ok: true; backupCodes: string[] }
  | { ok: false; status: number; error: string };

/**
 * Confirm enrollment: the user must prove possession of the authenticator by
 * submitting a valid code for the secret setupTwoFactor() just stored. Only
 * then does totpEnabled flip to true and login start requiring a code.
 *
 * A fresh set of 10 backup codes is minted and persisted (hashed) in the same
 * call and returned in PLAINTEXT exactly once - the caller (the route) must
 * hand them to the user immediately; they can never be retrieved again, only
 * replaced via regenerateBackupCodes.
 */
export async function enableTwoFactor(userId: string, code: unknown): Promise<TwoFactorEnableResult> {
  const cred = await authStore.findCredentialByEmail((await authStore.findUserById(userId))?.email ?? "");
  if (!cred || !cred.totpSecret) {
    return { ok: false, status: 400, error: "Start 2FA setup before confirming a code." };
  }
  if (!verifyTotp(cred.totpSecret, String(code ?? ""))) {
    return { ok: false, status: 400, error: "Invalid authentication code." };
  }
  await authStore.setTotpEnabled(userId, true);
  const backupCodes = generateBackupCodes();
  await persistBackupCodes(userId, backupCodes);
  store.log("info", "User enabled 2FA (10 backup codes issued)", { userId });
  return { ok: true, backupCodes };
}

export type RegenerateBackupCodesResult =
  | { ok: true; backupCodes: string[] }
  | { ok: false; status: number; error: string };

/**
 * Replace the entire backup-code set with a fresh one (e.g. after the user has
 * used several, or suspects the old list leaked). Requires a valid CURRENT
 * TOTP code - deliberately NOT a backup code itself, so a compromised backup
 * code alone cannot be used to mint a whole new set for later use.
 */
export async function regenerateBackupCodes(userId: string, code: unknown): Promise<RegenerateBackupCodesResult> {
  const user = await authStore.findUserById(userId);
  const cred = user ? await authStore.findCredentialByEmail(user.email) : null;
  if (!cred || !cred.totpEnabled || !cred.totpSecret) {
    return { ok: false, status: 400, error: "2FA is not enabled on this account." };
  }
  if (!verifyTotp(cred.totpSecret, String(code ?? ""))) {
    return { ok: false, status: 400, error: "Invalid authentication code." };
  }
  const backupCodes = generateBackupCodes();
  await persistBackupCodes(cred.user.id, backupCodes);
  store.log("info", "User regenerated 2FA backup codes (old codes invalidated)", { userId: cred.user.id });
  return { ok: true, backupCodes };
}

export type TwoFactorDisableResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * Turn 2FA off. Requires BOTH the current password AND a valid TOTP code -
 * either alone is not enough to remove a security factor, and a backup code
 * deliberately does NOT satisfy this check (removing the factor entirely is a
 * bigger step than a one-time login, so it requires the authenticator itself).
 * A user who has lost BOTH the authenticator and every backup code is
 * recovered via the admin "reset 2FA" action (src/admin/routes.ts).
 */
export async function disableTwoFactor(input: {
  userId: string;
  password: unknown;
  code: unknown;
}): Promise<TwoFactorDisableResult> {
  const user = await authStore.findUserById(input.userId);
  const cred = user ? await authStore.findCredentialByEmail(user.email) : null;
  if (!cred) return { ok: false, status: 400, error: "Account not found." };
  if (!cred.totpEnabled || !cred.totpSecret) {
    return { ok: false, status: 400, error: "2FA is not enabled on this account." };
  }
  const passwordOk = await verifyPassword(String(input.password ?? ""), cred.passwordHash);
  const codeOk = verifyTotp(cred.totpSecret, String(input.code ?? ""));
  if (!passwordOk || !codeOk) {
    return { ok: false, status: 400, error: "Incorrect password or authentication code." };
  }
  await authStore.setTotpEnabled(cred.user.id, false);
  store.log("info", "User disabled 2FA", { userId: cred.user.id });
  return { ok: true };
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

// --- GDPR data export --------------------------------------------------------
// Runs INSIDE the authenticated request (requireAuth already scoped
// currentUserId() via runWithUserId), so every repo call below reads exactly
// this user's rows without any extra userId plumbing. Large append-only
// streams (trades, trade log, AI log) are capped to a recent window rather
// than dumped in full - the caps are documented on the payload itself so the
// user knows the export is a recent-history snapshot, not a full archive.
// Portfolio snapshots are bucketed to daily points for the same reason (the
// raw table can be tens of thousands of rows for an old account).
const EXPORT_RECENT_LIMIT = 500;
const EXPORT_TRUSTLINE_SCAN_DATES = 12; // ~12 weeks, matching the Suggestions UI window

export async function exportUserData(userId: string): Promise<Record<string, unknown> | null> {
  const user = await authStore.findUserById(userId);
  if (!user) return null;

  const [
    wallet,
    settings,
    trades,
    tradeLog,
    aiLog,
    priceAlerts,
    stopLosses,
    portfolioSnapshots,
    aiKey,
  ] = await Promise.all([
    repo.getActiveWallet(),
    repo.getSettings(["riskProfile", "aiEnabled", "tradingMode", "killSwitch"]),
    repo.listTrades({ limit: EXPORT_RECENT_LIMIT, offset: 0 }),
    repo.listTradeLog({ limit: EXPORT_RECENT_LIMIT, offset: 0 }),
    repo.listAiLog({ limit: EXPORT_RECENT_LIMIT, offset: 0 }),
    repo.listActivePriceAlerts(),
    repo.listActiveStopLosses(),
    // Daily buckets, full history: a coarse but complete value-over-time series
    // rather than the raw ~5-minute-cadence table.
    repo.getPortfolioSnapshots(null, 24 * 60),
    getUserAiKeyMeta(userId).catch(() => null),
  ]);

  const trustlineScanDates = await repo.distinctTrustlineScanDates(EXPORT_TRUSTLINE_SCAN_DATES);
  const trustlineScans = (
    await Promise.all(trustlineScanDates.map((d) => repo.listTrustlineScansForDate(d)))
  ).flat();

  const riskProfileRaw = settings.get("riskProfile");

  return {
    exportedAt: new Date().toISOString(),
    notes: {
      caps: `Trades, trade log, and AI log are capped to the most recent ${EXPORT_RECENT_LIMIT} entries each. ` +
        `Price alerts and stop-losses include only currently ACTIVE entries. ` +
        `Trustline scans cover the most recent ${EXPORT_TRUSTLINE_SCAN_DATES} scan dates. ` +
        `Portfolio value history is bucketed to one point per day.`,
    },
    profile: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
      createdAt: user.createdAt,
      onboardingCompleted: user.onboardingCompleted,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus,
    },
    settings: {
      riskProfile: riskProfileRaw ? coerceRiskProfile(JSON.parse(riskProfileRaw)) : null,
      aiEnabled: settings.get("aiEnabled") ?? null,
      tradingMode: settings.get("tradingMode") ?? null,
      killSwitch: settings.get("killSwitch") ?? null,
    },
    wallet: wallet
      ? {
          publicKey: wallet.publicKey,
          status: wallet.status,
          network: config.network,
          createdAt: wallet.createdAt,
        }
      : null,
    aiKey: aiKey ? { provider: aiKey.provider, keyLast4: aiKey.keyLast4, updatedAt: aiKey.updatedAt } : null,
    trades,
    tradeLog,
    aiLog,
    priceAlerts,
    stopLosses,
    trustlineScans,
    portfolioSnapshots,
  };
}

// --- GDPR account deletion (anonymize) ---------------------------------------
// The schema FK-references dbo.Users(id) from every per-user table INCLUDING
// the retained tax/legal ledgers (dbo.FeeLedger, dbo.AdminAudit references it
// only as an opaque string, not an FK - see below), so a hard DELETE of the
// Users row would either violate those FKs or require cascading deletes across
// a dozen tables. Anonymizing the Users row instead (tombstone email, blank
// credential, wipe 2FA) satisfies GDPR ("this identity is no longer linkable
// to the person") while keeping every FK intact and leaving the retained
// financial/audit trail (FeeLedger, Proposals, TradeLog, AiLog, AdminAudit)
// keyed by an now-orphaned, non-PII userId - exactly the "opaque userId, no
// PII" shape the admin router already relies on.
//
// Auth-owned secret material (sessions, link tokens, login-attempt rows tied
// to this user, the BYO AI key, and the wallet's encrypted signing key) IS
// hard-deleted: none of it is needed for tax/legal retention, and the wallet's
// encrypted secret in particular must not survive account deletion.
const GENERIC_DELETE_PW_ERROR = "Current password is incorrect.";

export type DeleteAccountResult = { ok: true } | { ok: false; status: number; error: string };

export async function deleteAccount(input: {
  userId: string;
  password: unknown;
}): Promise<DeleteAccountResult> {
  const password = String(input.password ?? "");
  const account = await authStore.findUserById(input.userId);
  const cred = account ? await authStore.findCredentialByEmail(account.email) : null;
  if (!cred || !(await verifyPassword(password, cred.passwordHash))) {
    return { ok: false, status: 400, error: GENERIC_DELETE_PW_ERROR };
  }

  // Best-effort Stripe cleanup: never let a Stripe hiccup block the user's
  // deletion right.
  const { stripeSubscriptionId } = await authStore.getStripeIds(input.userId);
  if (stripeSubscriptionId) {
    try {
      await cancelSubscription(stripeSubscriptionId);
    } catch (err) {
      store.log("warn", "Failed to cancel Stripe subscription during account deletion (continuing)", {
        userId: input.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Revoke every session BEFORE anonymizing, so a concurrent request racing
  // this one still resolves against the (about-to-be-gone) real credential
  // rather than a half-anonymized row.
  await authStore.revokeAllSessionsForUser(input.userId);
  await authStore.deleteUserAndData(input.userId);
  store.log("info", "Account deleted (anonymized) by the user", { userId: input.userId });
  return { ok: true };
}
