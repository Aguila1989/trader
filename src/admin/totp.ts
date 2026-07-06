/**
 * TOTP (RFC 6238) for the admin backoffice's mandatory 2FA (Feature 4).
 * Hand-rolled on node:crypto - ~60 lines beat a dependency for one code path,
 * the same philosophy as src/auth/jwt.ts. HMAC-SHA1 / 30s step / 6 digits,
 * exactly what Google Authenticator, 1Password, Aegis etc. produce by default.
 * Verification accepts ±1 time step of clock drift and compares in constant
 * time. Unit-tested against the RFC 6238 Appendix B reference vectors.
 */
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32 decode (no padding required; case-insensitive). */
export function base32Decode(s: string): Buffer {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32_ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error("invalid base32 character");
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32_ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** HOTP (RFC 4226) for one counter value. */
function hotp(key: Buffer, counter: number, digits: number): string {
  const msg = Buffer.alloc(8);
  // Counters fit in 2^53 comfortably (30s steps put year-9999 around 2^43).
  msg.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac("sha1", key).update(msg).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const code =
    (((mac[offset]! & 0x7f) << 24) |
      ((mac[offset + 1]! & 0xff) << 16) |
      ((mac[offset + 2]! & 0xff) << 8) |
      (mac[offset + 3]! & 0xff)) %
    10 ** digits;
  return String(code).padStart(digits, "0");
}

/** The TOTP code for a base32 secret at `nowMs` (default: now). */
export function totpCode(
  secretB32: string,
  nowMs: number = Date.now(),
  stepSec = 30,
  digits = 6,
): string {
  return hotp(base32Decode(secretB32), Math.floor(nowMs / 1000 / stepSec), digits);
}

/**
 * Verify a user-entered code against the secret, accepting ±1 step of clock
 * drift. Constant-time comparison per candidate; returns false on ANY
 * malformed input rather than throwing.
 */
export function verifyTotp(secretB32: string, code: string, nowMs: number = Date.now()): boolean {
  const entered = code.trim();
  if (!/^\d{6}$/.test(entered)) return false;
  let key: Buffer;
  try {
    key = base32Decode(secretB32);
  } catch {
    return false;
  }
  if (key.length < 10) return false; // refuse degenerate secrets
  const step = Math.floor(nowMs / 1000 / 30);
  const enteredBuf = Buffer.from(entered, "utf8");
  for (const c of [step, step - 1, step + 1]) {
    const expected = Buffer.from(hotp(key, c, 6), "utf8");
    if (expected.length === enteredBuf.length && timingSafeEqual(expected, enteredBuf)) return true;
  }
  return false;
}

/** A fresh 160-bit secret (the RFC-recommended size) as base32. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

/** otpauth:// URI for authenticator-app enrollment (QR payload). */
export function otpauthUri(secretB32: string, account: string, issuer = "Atrium Admin"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  return `otpauth://totp/${label}?secret=${secretB32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
