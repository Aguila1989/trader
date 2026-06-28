/**
 * User account entity.
 *
 * Every persisted data entity in the app (trades, stop losses, settings, logs,
 * scan results, ...) is scoped to a userId that references dbo.Users(id). See
 * src/db/pool.ts for the schema + the boot migration that creates the default
 * account and backfills existing rows, and src/users/context.ts for how the
 * data layer resolves "the current user".
 */

/**
 * A user account as exposed to application code. The bcrypt password hash is
 * deliberately NOT part of this shape: it never leaves the data layer, so it
 * cannot be accidentally logged or serialized to a client. Hash reads/writes go
 * through src/users/repo.ts + src/users/password.ts.
 */
export interface User {
  /** Stable unique id (NVARCHAR(64)); the FK target for every scoped table. */
  id: string;
  /** Unique email address - the login identifier. */
  email: string;
  /** Optional human-friendly display name. */
  displayName?: string;
  /** ISO timestamp the account was created. */
  createdAt: string;
  /** ISO timestamp of the last successful login, or null if never. */
  lastLoginAt: string | null;
  /** When false the account is disabled (kept for data integrity, cannot log in). */
  isActive: boolean;
}

/** Fields required to create a new account. */
export interface NewUser {
  email: string;
  /** A bcrypt hash from src/users/password.ts - NEVER a plaintext password. */
  passwordHash: string;
  displayName?: string;
}
