/**
 * Data access for the dbo.Users table.
 *
 * Mirrors the conventions of src/db/repo.ts: every function is guarded by
 * dbReady() (the app runs fully in-memory when no SQL Server is configured),
 * all inputs are bound as parameters (never string-concatenated), and a row
 * mapper converts the SQL shape to the domain User. The table itself - and the
 * bootstrapped default account - are created by ensureSchema in src/db/pool.ts.
 *
 * Users are global (not scoped by network or userId): they ARE the scope that
 * every other table references.
 */
import sql from "mssql";
import { randomUUID } from "node:crypto";
import { dbReady, getPool } from "../db/pool";
import { NO_PASSWORD } from "./password";
import type { NewUser, User } from "./types";

interface UserRow {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date | string;
  lastLoginAt: Date | string | null;
  isActive: boolean;
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    email: r.email,
    createdAt: toIso(r.createdAt),
    lastLoginAt: r.lastLoginAt ? toIso(r.lastLoginAt) : null,
    isActive: Boolean(r.isActive),
    ...(r.displayName ? { displayName: r.displayName } : {}),
  };
}

const SELECT_COLS = `id, email, displayName, createdAt, lastLoginAt, isActive`;

/**
 * Create a new account (idempotent on the unique email). Returns the created -
 * or pre-existing - user. The caller passes a bcrypt hash from
 * src/users/password.ts, never a plaintext password.
 */
export async function createUser(u: NewUser): Promise<User | null> {
  if (!dbReady()) return null;
  const id = randomUUID();
  const now = new Date();
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("email", sql.NVarChar(256), u.email)
    .input("passwordHash", sql.NVarChar(256), u.passwordHash ?? NO_PASSWORD)
    .input("displayName", sql.NVarChar(120), u.displayName ?? null)
    .input("createdAt", sql.DateTime2, now)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE email = @email)
       INSERT INTO dbo.Users (id, email, passwordHash, displayName, createdAt, isActive)
       VALUES (@id, @email, @passwordHash, @displayName, @createdAt, 1);`,
    );
  return getUserByEmail(u.email);
}

/** One account by id, or null when absent / no DB. */
export async function getUserById(id: string): Promise<User | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .query<UserRow>(`SELECT ${SELECT_COLS} FROM dbo.Users WHERE id = @id;`);
  const row = res.recordset[0];
  return row ? rowToUser(row) : null;
}

/** One account by its (unique) email, or null when absent / no DB. */
export async function getUserByEmail(email: string): Promise<User | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("email", sql.NVarChar(256), email)
    .query<UserRow>(`SELECT ${SELECT_COLS} FROM dbo.Users WHERE email = @email;`);
  const row = res.recordset[0];
  return row ? rowToUser(row) : null;
}

/** All accounts, newest first. Empty when no DB. */
export async function listUsers(): Promise<User[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .query<UserRow>(`SELECT ${SELECT_COLS} FROM dbo.Users ORDER BY createdAt DESC;`);
  return res.recordset.map(rowToUser);
}
