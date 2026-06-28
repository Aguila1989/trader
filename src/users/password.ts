/**
 * Password hashing for user accounts.
 *
 * The User entity stores a bcrypt password hash (see src/users/types.ts). This
 * module is the ONLY place that produces or checks those hashes, so the cost
 * factor is defined in exactly one spot.
 *
 * Scope note: this feature does NOT implement login/registration - that arrives
 * with the authentication feature. This utility exists so the entity's "bcrypt,
 * minimum 12 rounds" contract is encoded and tested now; the auth layer will
 * call hashPassword() when a user sets a password and verifyPassword() at login.
 */
import { hash, compare } from "bcryptjs";

/**
 * bcrypt cost factor (work factor). The User-entity spec mandates a minimum of
 * 12 rounds; we use exactly that. Raising it later only strengthens new hashes -
 * existing hashes embed their own cost, so verification keeps working.
 */
export const BCRYPT_ROUNDS = 12;

/**
 * Sentinel stored in passwordHash for an account that has no usable password
 * yet (the bootstrapped default account). It can never match any input because
 * it is not a valid bcrypt hash - verifyPassword() rejects it explicitly.
 */
export const NO_PASSWORD = "";

/** Hash a plaintext password with bcrypt at BCRYPT_ROUNDS. */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("Cannot hash an empty password.");
  }
  return hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash. Returns false (never
 * throws) for a missing/empty hash, so an account with no password set - or a
 * malformed hash - simply cannot be logged into.
 */
export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (!storedHash || storedHash === NO_PASSWORD) return false;
  try {
    return await compare(plain, storedHash);
  } catch {
    return false;
  }
}
