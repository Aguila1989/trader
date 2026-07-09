/**
 * Auth persistence facade: accounts (credentials + lockout state), sessions
 * (for server-side JWT revocation), single-use link tokens (verify / reset), and
 * the failed-login audit trail.
 *
 * Like the rest of the data layer it is DB-OPTIONAL: when SQL Server is
 * configured (dbReady()) everything is persisted to dbo.Users + the auth tables
 * created in src/db/pool.ts; otherwise it falls back to in-memory maps so the
 * app still runs (and the feature still works) without a database, exactly as
 * the trading store does. Every SQL input is bound as a parameter.
 *
 * Invariant inherited from Feature 1: the bcrypt password hash NEVER leaves this
 * layer except inside the internal `Credential` shape used by the login flow; it
 * is never part of the public `User` and is never logged or serialized.
 */
import sql from "mssql";
import { dbReady, getPool } from "../db/pool";
import { newId } from "./tokens";
import { NO_PASSWORD } from "../users/password";
import type { User } from "../users/types";

export type LinkTokenType = "verify" | "reset";

/** Internal login record: the public User plus the secrets/flags login needs. */
export interface Credential {
  user: User;
  passwordHash: string;
  emailVerified: boolean;
  isActive: boolean;
  failedLoginAttempts: number;
  /** Epoch ms the lock expires, or null when not locked. */
  lockedUntil: number | null;
  /** Feature 4: blocked by the admin backoffice (login refused). */
  disabledByAdmin: boolean;
  /** End-user 2FA (opt-in): the base32 TOTP secret, or null until setup. */
  totpSecret: string | null;
  /** End-user 2FA (opt-in): true once the user has confirmed enrollment. */
  totpEnabled: boolean;
  /** End-user 2FA backup codes: JSON array of SHA-256 hex hashes of the
   *  unused codes, or null when none have been issued (never enabled, or
   *  disabled since - see setTotpEnabled). */
  totpBackupCodes: string | null;
}

export interface NewAccount {
  id: string;
  email: string;
  passwordHash: string;
  displayName?: string | undefined;
  emailVerified: boolean;
}

export interface FailedLoginResult {
  attempts: number;
  locked: boolean;
  lockedUntil: number | null;
}

// --- in-memory backend (no-DB mode) ----------------------------------------
interface MemUser {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: number;
  lastLoginAt: number | null;
  isActive: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: number | null;
  onboardingCompleted: boolean;
  isPremium: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: string | null;
  subscriptionStart: number | null;
  subscriptionEnd: number | null;
  volumeTier: string;
  totpSecret: string | null;
  totpEnabled: boolean;
  totpBackupCodes: string | null;
}
interface MemSession {
  id: string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  revokedAt: number | null;
}
interface MemToken {
  id: string;
  userId: string;
  type: LinkTokenType;
  tokenHash: string;
  expiresAt: number;
  usedAt: number | null;
}
const mem = {
  users: new Map<string, MemUser>(), // keyed by id
  sessions: new Map<string, MemSession>(), // keyed by id (jti)
  tokens: new Map<string, MemToken>(), // keyed by id
  attempts: [] as { id: string; ts: number; email: string | null; userId: string | null; ip: string | null; success: boolean; reason: string | null }[],
};

function memUserToUser(u: MemUser): User {
  return {
    id: u.id,
    email: u.email,
    createdAt: new Date(u.createdAt).toISOString(),
    lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
    isActive: u.isActive,
    onboardingCompleted: u.onboardingCompleted,
    isPremium: u.isPremium,
    subscriptionStatus: u.subscriptionStatus,
    subscriptionEnd: u.subscriptionEnd ? new Date(u.subscriptionEnd).toISOString() : null,
    volumeTier: u.volumeTier,
    totpEnabled: u.totpEnabled,
    ...(u.displayName ? { displayName: u.displayName } : {}),
  };
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}
function toMs(v: Date | string | null): number | null {
  if (v == null) return null;
  return v instanceof Date ? v.getTime() : new Date(v).getTime();
}

interface CredentialRow {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: Date | string;
  lastLoginAt: Date | string | null;
  isActive: boolean;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | string | null;
  disabledByAdmin: boolean;
  onboardingCompleted: boolean;
  isPremium: boolean;
  subscriptionStatus: string | null;
  subscriptionEnd: Date | string | null;
  volumeTier: string | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  totpBackupCodes: string | null;
}

function rowToCredential(r: CredentialRow): Credential {
  const user: User = {
    id: r.id,
    email: r.email,
    createdAt: toIso(r.createdAt),
    lastLoginAt: r.lastLoginAt ? toIso(r.lastLoginAt) : null,
    isActive: Boolean(r.isActive),
    onboardingCompleted: Boolean(r.onboardingCompleted),
    isPremium: Boolean(r.isPremium),
    subscriptionStatus: r.subscriptionStatus ?? null,
    subscriptionEnd: r.subscriptionEnd ? toIso(r.subscriptionEnd) : null,
    volumeTier: r.volumeTier || "Bronze",
    totpEnabled: Boolean(r.totpEnabled),
    ...(r.displayName ? { displayName: r.displayName } : {}),
  };
  return {
    user,
    passwordHash: r.passwordHash,
    emailVerified: Boolean(r.emailVerified),
    isActive: Boolean(r.isActive),
    failedLoginAttempts: Number(r.failedLoginAttempts ?? 0),
    lockedUntil: toMs(r.lockedUntil),
    disabledByAdmin: Boolean(r.disabledByAdmin),
    totpSecret: r.totpSecret ?? null,
    totpEnabled: Boolean(r.totpEnabled),
    totpBackupCodes: r.totpBackupCodes ?? null,
  };
}

const CRED_COLS = `id, email, passwordHash, displayName, createdAt, lastLoginAt, isActive, emailVerified, failedLoginAttempts, lockedUntil, disabledByAdmin, onboardingCompleted, isPremium, subscriptionStatus, subscriptionEnd, volumeTier, totpSecret, totpEnabled, totpBackupCodes`;

// --- accounts ---------------------------------------------------------------

/**
 * Create an account. Returns the new User, or null when the email already
 * exists (the unique index / pre-check) so the caller can stay generic without
 * leaking which case occurred.
 */
export async function createAccount(a: NewAccount): Promise<User | null> {
  if (!dbReady()) {
    for (const u of mem.users.values()) if (u.email === a.email) return null;
    const now = Date.now();
    const u: MemUser = {
      id: a.id,
      email: a.email,
      passwordHash: a.passwordHash,
      displayName: a.displayName ?? null,
      createdAt: now,
      lastLoginAt: null,
      isActive: true,
      emailVerified: a.emailVerified,
      failedLoginAttempts: 0,
      lockedUntil: null,
      onboardingCompleted: false,
      isPremium: false,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
      subscriptionStart: null,
      subscriptionEnd: null,
      volumeTier: "Bronze",
      totpSecret: null,
      totpEnabled: false,
      totpBackupCodes: null,
    };
    mem.users.set(u.id, u);
    return memUserToUser(u);
  }
  try {
    await getPool()
      .request()
      .input("id", sql.NVarChar(64), a.id)
      .input("email", sql.NVarChar(256), a.email)
      .input("passwordHash", sql.NVarChar(256), a.passwordHash || NO_PASSWORD)
      .input("displayName", sql.NVarChar(120), a.displayName ?? null)
      .input("createdAt", sql.DateTime2, new Date())
      .input("emailVerified", sql.Bit, a.emailVerified)
      .query(
        `INSERT INTO dbo.Users (id, email, passwordHash, displayName, createdAt, isActive, emailVerified, failedLoginAttempts)
         VALUES (@id, @email, @passwordHash, @displayName, @createdAt, 1, @emailVerified, 0);`,
      );
  } catch (err) {
    // 2627 = PK/unique constraint, 2601 = unique index. Either => email taken.
    const n = (err as { number?: number }).number;
    if (n === 2627 || n === 2601) return null;
    throw err;
  }
  return findUserById(a.id);
}

/** Full login record for an email, or null when absent. */
export async function findCredentialByEmail(email: string): Promise<Credential | null> {
  if (!dbReady()) {
    for (const u of mem.users.values()) {
      if (u.email === email) {
        return {
          user: memUserToUser(u),
          passwordHash: u.passwordHash,
          emailVerified: u.emailVerified,
          isActive: u.isActive,
          failedLoginAttempts: u.failedLoginAttempts,
          lockedUntil: u.lockedUntil,
          disabledByAdmin: false, // admin backoffice requires a DB
          totpSecret: u.totpSecret,
          totpEnabled: u.totpEnabled,
          totpBackupCodes: u.totpBackupCodes,
        };
      }
    }
    return null;
  }
  const res = await getPool()
    .request()
    .input("email", sql.NVarChar(256), email)
    .query<CredentialRow>(`SELECT ${CRED_COLS} FROM dbo.Users WHERE email = @email;`);
  const row = res.recordset[0];
  return row ? rowToCredential(row) : null;
}

/** Public account by id (no secrets), or null. */
export async function findUserById(id: string): Promise<User | null> {
  if (!dbReady()) {
    const u = mem.users.get(id);
    return u ? memUserToUser(u) : null;
  }
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .query<CredentialRow>(`SELECT ${CRED_COLS} FROM dbo.Users WHERE id = @id;`);
  const row = res.recordset[0];
  return row ? rowToCredential(row).user : null;
}

/** Reset failure state + stamp lastLoginAt on a successful login. */
export async function recordSuccessfulLogin(userId: string): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.lastLoginAt = Date.now();
      u.failedLoginAttempts = 0;
      u.lockedUntil = null;
    }
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("now", sql.DateTime2, new Date())
    .query(
      `UPDATE dbo.Users
          SET lastLoginAt = @now, failedLoginAttempts = 0, lockedUntil = NULL
        WHERE id = @id;`,
    );
}

/**
 * Increment the failure counter and lock the account when it reaches `max`.
 * Returns the post-update state so the caller can log the lockout.
 */
export async function registerFailedLogin(
  userId: string,
  max: number,
  lockoutMs: number,
): Promise<FailedLoginResult> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (!u) return { attempts: 0, locked: false, lockedUntil: null };
    u.failedLoginAttempts += 1;
    if (u.failedLoginAttempts >= max) u.lockedUntil = Date.now() + lockoutMs;
    return { attempts: u.failedLoginAttempts, locked: u.lockedUntil != null, lockedUntil: u.lockedUntil };
  }
  const until = new Date(Date.now() + lockoutMs);
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("max", sql.Int, max)
    .input("until", sql.DateTime2, until)
    .query<{ failedLoginAttempts: number; lockedUntil: Date | null }>(
      `UPDATE dbo.Users
          SET failedLoginAttempts = failedLoginAttempts + 1,
              lockedUntil = CASE WHEN failedLoginAttempts + 1 >= @max THEN @until ELSE lockedUntil END
        OUTPUT inserted.failedLoginAttempts, inserted.lockedUntil
        WHERE id = @id;`,
    );
  const row = res.recordset[0];
  if (!row) return { attempts: 0, locked: false, lockedUntil: null };
  const lockedUntil = toMs(row.lockedUntil);
  return {
    attempts: Number(row.failedLoginAttempts),
    locked: lockedUntil != null && lockedUntil > Date.now(),
    lockedUntil,
  };
}

/** Mark the account's email as verified. */
export async function setEmailVerified(userId: string): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) u.emailVerified = true;
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .query(`UPDATE dbo.Users SET emailVerified = 1 WHERE id = @id;`);
}

// --- end-user 2FA (TOTP), opt-in --------------------------------------------

/**
 * Store a freshly-generated TOTP secret for the pending setup flow.
 * `totpEnabled` is explicitly reset to 0 here: generating a new secret always
 * starts a fresh, unconfirmed enrollment (e.g. the user re-ran setup before
 * confirming), so a stale enabled flag from a previous secret can never survive.
 */
export async function setTotpSecret(userId: string, secret: string): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.totpSecret = secret;
      u.totpEnabled = false;
    }
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("secret", sql.NVarChar(64), secret)
    .query(`UPDATE dbo.Users SET totpSecret = @secret, totpEnabled = 0 WHERE id = @id;`);
}

/**
 * Flip the enabled flag. Enabling requires the caller to have already verified
 * a code against the pending secret (see enableTwoFactor in service.ts).
 * Disabling also NULLs the secret AND the backup codes, so a later
 * re-enrollment always starts from a fresh secret and a fresh code set (never
 * resurrects old ones).
 */
export async function setTotpEnabled(userId: string, enabled: boolean): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.totpEnabled = enabled;
      if (!enabled) {
        u.totpSecret = null;
        u.totpBackupCodes = null;
      }
    }
    return;
  }
  if (enabled) {
    await getPool()
      .request()
      .input("id", sql.NVarChar(64), userId)
      .query(`UPDATE dbo.Users SET totpEnabled = 1 WHERE id = @id;`);
  } else {
    await getPool()
      .request()
      .input("id", sql.NVarChar(64), userId)
      .query(`UPDATE dbo.Users SET totpEnabled = 0, totpSecret = NULL, totpBackupCodes = NULL WHERE id = @id;`);
  }
}

/**
 * Replace the persisted backup-code hash set wholesale (issued at
 * /2fa/enable, replaced by /2fa/backup-codes). `hashesJson` is a JSON array of
 * SHA-256 hex hashes of the normalized codes, or null to clear it.
 */
export async function setTotpBackupCodes(userId: string, hashesJson: string | null): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) u.totpBackupCodes = hashesJson;
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("codes", sql.NVarChar(sql.MAX), hashesJson)
    .query(`UPDATE dbo.Users SET totpBackupCodes = @codes WHERE id = @id;`);
}

/**
 * Persist whether the onboarding tutorial was completed (or skipped). `false`
 * is the "Restart Tutorial" reset: the tour will auto-start again on the next
 * shell load.
 */
export async function setOnboardingCompleted(userId: string, completed: boolean): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) u.onboardingCompleted = completed;
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("completed", sql.Bit, completed)
    .query(`UPDATE dbo.Users SET onboardingCompleted = @completed WHERE id = @id;`);
}

// --- premium subscription state (Feature 2, 2026-07) ------------------------
// Written ONLY by the Stripe webhook / checkout layer (src/billing/*). The
// webhook is the source of truth: user input never touches these fields.

export interface SubscriptionState {
  isPremium: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  /** Epoch ms of the current period bounds, or null. */
  subscriptionStart?: number | null;
  subscriptionEnd?: number | null;
}

export async function setSubscriptionState(userId: string, s: SubscriptionState): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (!u) return;
    u.isPremium = s.isPremium;
    if (s.stripeCustomerId !== undefined) u.stripeCustomerId = s.stripeCustomerId;
    if (s.stripeSubscriptionId !== undefined) u.stripeSubscriptionId = s.stripeSubscriptionId;
    if (s.subscriptionStatus !== undefined) u.subscriptionStatus = s.subscriptionStatus;
    if (s.subscriptionStart !== undefined) u.subscriptionStart = s.subscriptionStart;
    if (s.subscriptionEnd !== undefined) u.subscriptionEnd = s.subscriptionEnd;
    return;
  }
  const req = getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("isPremium", sql.Bit, s.isPremium);
  const sets = ["isPremium = @isPremium"];
  if (s.stripeCustomerId !== undefined) {
    req.input("cust", sql.NVarChar(64), s.stripeCustomerId);
    sets.push("stripeCustomerId = @cust");
  }
  if (s.stripeSubscriptionId !== undefined) {
    req.input("sub", sql.NVarChar(64), s.stripeSubscriptionId);
    sets.push("stripeSubscriptionId = @sub");
  }
  if (s.subscriptionStatus !== undefined) {
    req.input("status", sql.NVarChar(24), s.subscriptionStatus);
    sets.push("subscriptionStatus = @status");
  }
  if (s.subscriptionStart !== undefined) {
    req.input("start", sql.DateTime2, s.subscriptionStart == null ? null : new Date(s.subscriptionStart));
    sets.push("subscriptionStart = @start");
  }
  if (s.subscriptionEnd !== undefined) {
    req.input("end", sql.DateTime2, s.subscriptionEnd == null ? null : new Date(s.subscriptionEnd));
    sets.push("subscriptionEnd = @end");
  }
  await req.query(`UPDATE dbo.Users SET ${sets.join(", ")} WHERE id = @id;`);
}

/** The userId owning a Stripe customer, or null. Webhook events carry the
 *  customer id, not our user id (except checkout's client_reference_id). */
export async function findUserIdByStripeCustomer(customerId: string): Promise<string | null> {
  if (!customerId) return null;
  if (!dbReady()) {
    for (const u of mem.users.values()) if (u.stripeCustomerId === customerId) return u.id;
    return null;
  }
  const res = await getPool()
    .request()
    .input("cust", sql.NVarChar(64), customerId)
    .query<{ id: string }>(`SELECT id FROM dbo.Users WHERE stripeCustomerId = @cust;`);
  return res.recordset[0]?.id ?? null;
}

/** The user's stored Stripe ids (for checkout reuse + status display). */
export async function getStripeIds(
  userId: string,
): Promise<{ stripeCustomerId: string | null; stripeSubscriptionId: string | null }> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    return {
      stripeCustomerId: u?.stripeCustomerId ?? null,
      stripeSubscriptionId: u?.stripeSubscriptionId ?? null,
    };
  }
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .query<{ stripeCustomerId: string | null; stripeSubscriptionId: string | null }>(
      `SELECT stripeCustomerId, stripeSubscriptionId FROM dbo.Users WHERE id = @id;`,
    );
  const row = res.recordset[0];
  return {
    stripeCustomerId: row?.stripeCustomerId ?? null,
    stripeSubscriptionId: row?.stripeSubscriptionId ?? null,
  };
}

/**
 * Set a new password hash AND revoke every existing session for the user (a
 * password change/reset should log other sessions out). Failure state is also
 * cleared so a freshly-reset user isn't still locked.
 *
 * `keepJti` (optional) is the session to PRESERVE: on a self-service password
 * CHANGE the user's current browser session must stay logged in, so we revoke
 * every OTHER session but leave that one active. Omitting it (the reset flow)
 * revokes all sessions, as before.
 */
export async function setPasswordHash(userId: string, passwordHash: string, keepJti?: string): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.passwordHash = passwordHash;
      u.failedLoginAttempts = 0;
      u.lockedUntil = null;
    }
    await revokeAllSessionsForUser(userId, keepJti);
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("hash", sql.NVarChar(256), passwordHash)
    .query(
      `UPDATE dbo.Users
          SET passwordHash = @hash, failedLoginAttempts = 0, lockedUntil = NULL
        WHERE id = @id;`,
    );
  await revokeAllSessionsForUser(userId, keepJti);
}

// --- sessions (server-side JWT revocation) ----------------------------------

export interface NewSession {
  id: string; // = the JWT jti
  userId: string;
  expiresAt: number; // epoch ms
  ip?: string | undefined;
  userAgent?: string | undefined;
}

export async function createSession(s: NewSession): Promise<void> {
  if (!dbReady()) {
    mem.sessions.set(s.id, {
      id: s.id,
      userId: s.userId,
      createdAt: Date.now(),
      expiresAt: s.expiresAt,
      revokedAt: null,
    });
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), s.id)
    .input("userId", sql.NVarChar(64), s.userId)
    .input("createdAt", sql.DateTime2, new Date())
    .input("expiresAt", sql.DateTime2, new Date(s.expiresAt))
    .input("ip", sql.NVarChar(64), s.ip ?? null)
    .input("userAgent", sql.NVarChar(256), s.userAgent ? s.userAgent.slice(0, 256) : null)
    .query(
      `INSERT INTO dbo.AuthSessions (id, userId, createdAt, expiresAt, ip, userAgent)
       VALUES (@id, @userId, @createdAt, @expiresAt, @ip, @userAgent);`,
    );
}

/** True when the session exists, is not revoked, and has not expired. */
export async function isSessionActive(jti: string): Promise<boolean> {
  if (!jti) return false;
  if (!dbReady()) {
    const s = mem.sessions.get(jti);
    return !!s && s.revokedAt == null && s.expiresAt > Date.now();
  }
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), jti)
    .query<{ ok: number }>(
      `SELECT 1 AS ok FROM dbo.AuthSessions
        WHERE id = @id AND revokedAt IS NULL AND expiresAt > SYSUTCDATETIME();`,
    );
  return res.recordset.length > 0;
}

export async function revokeSession(jti: string): Promise<void> {
  if (!jti) return;
  if (!dbReady()) {
    const s = mem.sessions.get(jti);
    if (s && s.revokedAt == null) s.revokedAt = Date.now();
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), jti)
    .input("now", sql.DateTime2, new Date())
    .query(`UPDATE dbo.AuthSessions SET revokedAt = @now WHERE id = @id AND revokedAt IS NULL;`);
}

/**
 * Delete sessions whose expiry has passed so dbo.AuthSessions (and the in-memory
 * fallback) don't grow without bound. Revoked-but-unexpired rows are kept so the
 * gate keeps seeing them as revoked until they expire. Returns the count removed.
 */
export async function purgeExpiredSessions(): Promise<number> {
  if (!dbReady()) {
    const now = Date.now();
    let n = 0;
    for (const [k, s] of mem.sessions) {
      if (s.expiresAt < now) {
        mem.sessions.delete(k);
        n++;
      }
    }
    return n;
  }
  const res = await getPool()
    .request()
    .query(`DELETE FROM dbo.AuthSessions WHERE expiresAt < SYSUTCDATETIME();`);
  return res.rowsAffected?.[0] ?? 0;
}

/**
 * AUDIT-014: retention for the remaining append-only auth artifacts, which the
 * in-memory fallback bounds but SQL Server never did:
 *  - dbo.LoginAttempts grows on EVERY attempt (incl. unauthenticated ones from
 *    any IP) — keep `retentionDays` of audit trail, drop the rest;
 *  - dbo.AuthTokens rows stay after expiry/use — the hash is worthless then.
 * Returns the total rows removed. Scheduled next to purgeExpiredSessions.
 */
export async function purgeAuthArtifacts(retentionDays = 90): Promise<number> {
  const cutoffMs = Date.now() - retentionDays * 86_400_000;
  if (!dbReady()) {
    const before = mem.attempts.length;
    mem.attempts = mem.attempts.filter((a) => a.ts >= cutoffMs);
    let removed = before - mem.attempts.length;
    const now = Date.now();
    for (const [id, t] of mem.tokens) {
      if (t.expiresAt < now || t.usedAt != null) {
        mem.tokens.delete(id);
        removed++;
      }
    }
    return removed;
  }
  const res = await getPool()
    .request()
    .input("cutoff", sql.DateTime2, new Date(cutoffMs))
    .query<{ n: number }>(
      `DECLARE @a INT;
       DELETE FROM dbo.LoginAttempts WHERE ts < @cutoff;
       SET @a = @@ROWCOUNT;
       DELETE FROM dbo.AuthTokens WHERE expiresAt < SYSUTCDATETIME() OR usedAt IS NOT NULL;
       SELECT @a + @@ROWCOUNT AS n;`,
    );
  return Number(res.recordset[0]?.n ?? 0);
}

/**
 * Revoke every active session for a user. When `keepJti` is supplied, the
 * session with that id is left untouched so the caller's current session stays
 * valid (self-service password change keeps the active browser logged in while
 * logging out all other devices); omit it to revoke EVERY session (reset flow).
 */
export async function revokeAllSessionsForUser(userId: string, keepJti?: string): Promise<void> {
  if (!dbReady()) {
    for (const s of mem.sessions.values()) {
      if (s.userId === userId && s.revokedAt == null && s.id !== keepJti) s.revokedAt = Date.now();
    }
    return;
  }
  const req = getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("now", sql.DateTime2, new Date());
  let where = `userId = @userId AND revokedAt IS NULL`;
  if (keepJti) {
    req.input("keepJti", sql.NVarChar(64), keepJti);
    where += ` AND id <> @keepJti`;
  }
  await req.query(`UPDATE dbo.AuthSessions SET revokedAt = @now WHERE ${where};`);
}

/**
 * GDPR account deletion: ANONYMIZE the Users row (every per-user table,
 * including the retained tax/legal ledgers, FK-references dbo.Users(id) - see
 * ensureUserScoping in src/db/pool.ts - so a hard DELETE would either violate
 * those FKs or require cascading deletes across a dozen tables). The email is
 * replaced with a tombstone so the UNIQUE index never blocks a future
 * registration by the real address, displayName/passwordHash/2FA are wiped,
 * and isActive is cleared so the row can never log in again.
 *
 * Secret material tied to this user is HARD-DELETED / destroyed here:
 *  - dbo.AuthSessions, dbo.AuthTokens, dbo.LoginAttempts (auth bookkeeping -
 *    nothing here is needed for tax/legal retention once the account is gone);
 *  - dbo.UserAiKeys (the user's BYO AI provider key);
 *  - dbo.Wallets.encryptedSecret is NULLed (NOT the row itself - the row stays
 *    for FK integrity with anything that references the wallet id, but the
 *    AES-256-GCM ciphertext is destroyed so the signing key can never be
 *    recovered again by anyone, including the operator). THIS IS IRREVERSIBLE:
 *    any funds still held by that wallet become permanently inaccessible - the
 *    caller (src/auth/service.ts deleteAccount) surfaces that warning to the
 *    user BEFORE this runs.
 *
 * Callers are expected to have already revoked sessions and cancelled any
 * Stripe subscription. Retained ledgers (dbo.Proposals, dbo.TradeLog,
 * dbo.AiLog, dbo.FeeLedger, dbo.AdminAudit, dbo.StopLossAudit, ...) are left
 * untouched, keyed by the now-orphaned, non-PII userId - the same "opaque
 * userId, no PII" shape the admin router already relies on.
 */
export async function deleteUserAndData(userId: string): Promise<void> {
  const tombstoneEmail = `deleted+${userId}@invalid`;
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.email = tombstoneEmail;
      u.displayName = null;
      u.passwordHash = NO_PASSWORD;
      u.isActive = false;
      u.totpSecret = null;
      u.totpEnabled = false;
      u.totpBackupCodes = null;
    }
    for (const s of mem.sessions.values()) if (s.userId === userId) mem.sessions.delete(s.id);
    for (const t of mem.tokens.values()) if (t.userId === userId) mem.tokens.delete(t.id);
    mem.attempts = mem.attempts.filter((a) => a.userId !== userId);
    return;
  }
  const pool = getPool();
  await pool
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("email", sql.NVarChar(256), tombstoneEmail)
    .input("passwordHash", sql.NVarChar(256), NO_PASSWORD)
    .query(
      `UPDATE dbo.Users
          SET email = @email,
              displayName = NULL,
              passwordHash = @passwordHash,
              isActive = 0,
              totpSecret = NULL,
              totpEnabled = 0,
              totpBackupCodes = NULL
        WHERE id = @userId;`,
    );
  await pool
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query(
      `DELETE FROM dbo.AuthSessions WHERE userId = @userId;
       DELETE FROM dbo.AuthTokens WHERE userId = @userId;
       DELETE FROM dbo.LoginAttempts WHERE userId = @userId;
       DELETE FROM dbo.UserAiKeys WHERE userId = @userId;
       UPDATE dbo.Wallets SET encryptedSecret = '', updatedAt = SYSUTCDATETIME() WHERE userId = @userId;`,
    );
}

// --- single-use link tokens (verify / reset) --------------------------------

export interface NewLinkToken {
  userId: string;
  type: LinkTokenType;
  tokenHash: string;
  expiresAt: number; // epoch ms
}

export async function createLinkToken(t: NewLinkToken): Promise<void> {
  if (!dbReady()) {
    const id = newId();
    mem.tokens.set(id, { id, userId: t.userId, type: t.type, tokenHash: t.tokenHash, expiresAt: t.expiresAt, usedAt: null });
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), newId())
    .input("userId", sql.NVarChar(64), t.userId)
    .input("type", sql.NVarChar(16), t.type)
    .input("tokenHash", sql.NVarChar(128), t.tokenHash)
    .input("createdAt", sql.DateTime2, new Date())
    .input("expiresAt", sql.DateTime2, new Date(t.expiresAt))
    .query(
      `INSERT INTO dbo.AuthTokens (id, userId, type, tokenHash, createdAt, expiresAt)
       VALUES (@id, @userId, @type, @tokenHash, @createdAt, @expiresAt);`,
    );
}

/** Invalidate any outstanding unused tokens of a type (e.g. before issuing a new reset). */
export async function invalidateLinkTokens(userId: string, type: LinkTokenType): Promise<void> {
  if (!dbReady()) {
    for (const t of mem.tokens.values()) if (t.userId === userId && t.type === type && t.usedAt == null) t.usedAt = Date.now();
    return;
  }
  await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("type", sql.NVarChar(16), type)
    .input("now", sql.DateTime2, new Date())
    .query(`UPDATE dbo.AuthTokens SET usedAt = @now WHERE userId = @userId AND type = @type AND usedAt IS NULL;`);
}

/**
 * Atomically consume a token: if a matching unused, unexpired token exists, mark
 * it used and return its userId; otherwise null. Single-use is enforced by the
 * `usedAt IS NULL` predicate in the UPDATE so a replayed link cannot succeed.
 */
export async function consumeLinkToken(type: LinkTokenType, tokenHash: string): Promise<string | null> {
  if (!dbReady()) {
    for (const t of mem.tokens.values()) {
      if (t.type === type && t.tokenHash === tokenHash && t.usedAt == null && t.expiresAt > Date.now()) {
        t.usedAt = Date.now();
        return t.userId;
      }
    }
    return null;
  }
  const res = await getPool()
    .request()
    .input("type", sql.NVarChar(16), type)
    .input("tokenHash", sql.NVarChar(128), tokenHash)
    .input("now", sql.DateTime2, new Date())
    .query<{ userId: string }>(
      `UPDATE dbo.AuthTokens
          SET usedAt = @now
        OUTPUT inserted.userId
        WHERE type = @type AND tokenHash = @tokenHash AND usedAt IS NULL AND expiresAt > SYSUTCDATETIME();`,
    );
  return res.recordset[0]?.userId ?? null;
}

// --- login attempts (audit trail) ------------------------------------------

export interface LoginAttempt {
  email: string | null;
  userId: string | null;
  ip: string | null;
  success: boolean;
  reason: string;
}

export async function recordLoginAttempt(a: LoginAttempt): Promise<void> {
  if (!dbReady()) {
    mem.attempts.push({ id: newId(), ts: Date.now(), email: a.email, userId: a.userId, ip: a.ip, success: a.success, reason: a.reason });
    if (mem.attempts.length > 1000) mem.attempts.shift();
    return;
  }
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), newId())
    .input("ts", sql.DateTime2, new Date())
    .input("email", sql.NVarChar(256), a.email ? a.email.slice(0, 256) : null)
    .input("userId", sql.NVarChar(64), a.userId ?? null)
    .input("ip", sql.NVarChar(64), a.ip ? a.ip.slice(0, 64) : null)
    .input("success", sql.Bit, a.success)
    .input("reason", sql.NVarChar(64), a.reason.slice(0, 64))
    .query(
      `INSERT INTO dbo.LoginAttempts (id, ts, email, userId, ip, success, reason)
       VALUES (@id, @ts, @email, @userId, @ip, @success, @reason);`,
    );
}

/** Test-only: wipe the in-memory backend between cases. No-op when on a DB. */
export function __resetMemoryStoreForTests(): void {
  mem.users.clear();
  mem.sessions.clear();
  mem.tokens.clear();
  mem.attempts.length = 0;
}
