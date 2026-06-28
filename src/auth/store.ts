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
}

function rowToCredential(r: CredentialRow): Credential {
  const user: User = {
    id: r.id,
    email: r.email,
    createdAt: toIso(r.createdAt),
    lastLoginAt: r.lastLoginAt ? toIso(r.lastLoginAt) : null,
    isActive: Boolean(r.isActive),
    ...(r.displayName ? { displayName: r.displayName } : {}),
  };
  return {
    user,
    passwordHash: r.passwordHash,
    emailVerified: Boolean(r.emailVerified),
    isActive: Boolean(r.isActive),
    failedLoginAttempts: Number(r.failedLoginAttempts ?? 0),
    lockedUntil: toMs(r.lockedUntil),
  };
}

const CRED_COLS = `id, email, passwordHash, displayName, createdAt, lastLoginAt, isActive, emailVerified, failedLoginAttempts, lockedUntil`;

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

/**
 * Set a new password hash AND revoke every existing session for the user (a
 * password change/reset should log other sessions out). Failure state is also
 * cleared so a freshly-reset user isn't still locked.
 */
export async function setPasswordHash(userId: string, passwordHash: string): Promise<void> {
  if (!dbReady()) {
    const u = mem.users.get(userId);
    if (u) {
      u.passwordHash = passwordHash;
      u.failedLoginAttempts = 0;
      u.lockedUntil = null;
    }
    await revokeAllSessionsForUser(userId);
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
  await revokeAllSessionsForUser(userId);
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

export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  if (!dbReady()) {
    for (const s of mem.sessions.values()) if (s.userId === userId && s.revokedAt == null) s.revokedAt = Date.now();
    return;
  }
  await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("now", sql.DateTime2, new Date())
    .query(`UPDATE dbo.AuthSessions SET revokedAt = @now WHERE userId = @userId AND revokedAt IS NULL;`);
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
