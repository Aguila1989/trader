/**
 * Opaque single-use tokens for email-verification and password-reset LINKS, and
 * a few small auth helpers.
 *
 * Security posture: the RAW token only ever lives in the emailed URL and the
 * user's inbox. What we PERSIST is its SHA-256 hash, so a database leak does not
 * hand an attacker working reset/verify links (mirrors how the password column
 * stores a bcrypt hash, not the password). Lookups hash the incoming raw token
 * and compare against the stored hash.
 */
import { randomBytes, createHash, randomUUID } from "node:crypto";

/** A fresh random id for sessions (the JWT `jti`) and DB primary keys. */
export function newId(): string {
  return randomUUID();
}

/**
 * Generate a link token: a 32-byte (256-bit) base64url secret to put in the URL,
 * plus its SHA-256 hash to store. The raw value is never persisted.
 */
export function generateLinkToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

/** SHA-256 (hex) of a raw token - the at-rest representation. */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Pragmatic email validation: one @, non-empty local part, a dotted domain, no
 * spaces, length-bounded to the dbo.Users.email column (NVARCHAR(256)). We
 * normalize to a trimmed, lower-cased form so "A@B.com" and "a@b.com" are one
 * account (the unique index is case-sensitive otherwise).
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: unknown): string {
  return String(email ?? "").trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length > 0 && email.length <= 256 && EMAIL_RE.test(email);
}
