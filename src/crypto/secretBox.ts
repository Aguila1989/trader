/**
 * Authenticated encryption for wallet secret keys at rest (Feature 3).
 *
 * A small, dependency-free wrapper over Node's vetted `crypto` - the same
 * philosophy as src/auth/jwt.ts: structure, not home-grown crypto. The cipher is
 * AES-256-GCM; the per-record key is derived with HKDF-SHA-256 from a high-
 * entropy master secret (WALLET_ENCRYPTION_KEY) plus a random per-record salt,
 * with the userId bound into BOTH the HKDF `info` and the GCM AAD. That means:
 *
 *  - two users' secrets are encrypted under DIFFERENT derived keys even with the
 *    same master secret (the spec's per-user requirement), and
 *  - a ciphertext row copied into another user's row fails the GCM auth tag on
 *    decrypt instead of silently opening (defense-in-depth against IDOR/row
 *    tampering), because the AAD no longer matches.
 *
 * The master key is passed in (not read from config here) so this stays a pure,
 * fully testable primitive - exactly like signJwt/verifyJwt take their secret.
 * The single place that reads config.walletEncryptionKey is the wallet layer
 * (src/stellar/keyProvider.ts).
 *
 * Stored blob layout (then base64): version(1) ‖ salt(16) ‖ iv(12) ‖ tag(16) ‖
 * ciphertext(N). The leading version byte is the seam for a future KDF/cipher
 * change or master-key rotation; it MUST ship now so migration is possible later.
 *
 * Plaintext is a Buffer (the 32-byte raw ed25519 seed) so the caller can zero it
 * after use - the human-readable "S…" string can't be reliably wiped from the JS
 * heap. This module never logs, and its errors carry NO secret/key/userId.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/** Current blob format. Bump only with a matching decrypt branch + migration. */
const VERSION = 0x01;

const SALT_LEN = 16; // HKDF salt (random per record)
const IV_LEN = 12; // GCM nonce - 96 bits is the recommended size; random per call
const TAG_LEN = 16; // GCM auth tag
const KEY_LEN = 32; // AES-256

/** HKDF `info` context. The userId binds the derived key to one account. */
function hkdfInfo(userId: string): Buffer {
  return Buffer.from(`atrium:wallet-seed:v1:${userId}`, "utf8");
}

/** Derive the per-record AES key. Wrapped in a Buffer (hkdfSync gives an ArrayBuffer). */
function deriveKey(masterKey: string, salt: Buffer, userId: string): Buffer {
  return Buffer.from(
    hkdfSync("sha256", Buffer.from(masterKey, "utf8"), salt, hkdfInfo(userId), KEY_LEN),
  );
}

/**
 * Seal `plaintext` for `userId`. Returns a base64 self-describing blob. A fresh
 * random salt + IV per call makes (key, IV) reuse - catastrophic for GCM -
 * negligible. Throws (without leaking anything) if the master key is unusable.
 */
export function encryptSecret(plaintext: Buffer, userId: string, masterKey: string): string {
  if (!masterKey) throw new Error("wallet encryption key is not configured");
  if (!userId) throw new Error("a userId is required to encrypt a wallet secret");
  const salt = randomBytes(SALT_LEN);
  const iv = randomBytes(IV_LEN);
  const key = deriveKey(masterKey, salt, userId);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(userId, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  key.fill(0);
  return Buffer.concat([Buffer.from([VERSION]), salt, iv, tag, ciphertext]).toString("base64");
}

/**
 * Open a blob produced by encryptSecret for the SAME userId. Returns the
 * plaintext Buffer (caller should `.fill(0)` it after use). Throws a generic,
 * secret-free error on any tamper / wrong-user / wrong-key / malformed input -
 * never distinguish the cause to a caller, and never include key/secret/userId.
 */
export function decryptSecret(blob: string, userId: string, masterKey: string): Buffer {
  if (!masterKey) throw new Error("wallet encryption key is not configured");
  try {
    const raw = Buffer.from(blob, "base64");
    const minLen = 1 + SALT_LEN + IV_LEN + TAG_LEN;
    if (raw.length < minLen) throw new Error("short");
    if (raw[0] !== VERSION) throw new Error("version");
    let o = 1;
    const salt = raw.subarray(o, (o += SALT_LEN));
    const iv = raw.subarray(o, (o += IV_LEN));
    const tag = raw.subarray(o, (o += TAG_LEN));
    const ciphertext = raw.subarray(o);
    const key = deriveKey(masterKey, salt, userId);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAAD(Buffer.from(userId, "utf8"));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    key.fill(0);
    return plaintext;
  } catch {
    // Uniform failure: tampered ciphertext, wrong user, wrong master key, and
    // malformed input are indistinguishable on purpose. No secret in the message.
    throw new Error("wallet secret decryption failed");
  }
}
