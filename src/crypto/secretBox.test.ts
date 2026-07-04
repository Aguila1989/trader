import { describe, it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { encryptSecret, decryptSecret } from "./secretBox";

/**
 * Contract for the at-rest wallet encryption (Feature 3). These pin the security
 * properties the spec requires: AES-256-GCM round-trip, per-user key separation,
 * tamper detection, a stable version byte, and no secret material in errors.
 */
const MASTER = "0".repeat(64); // stand-in for `openssl rand -hex 32`
const MASTER2 = "f".repeat(64);
const USER_A = "00000000-0000-0000-0000-00000000000a";
const USER_B = "00000000-0000-0000-0000-00000000000b";
// A realistic payload: a 32-byte raw ed25519 seed.
const seed = (): Buffer => randomBytes(32);

describe("crypto/secretBox", () => {
  it("round-trips a secret for the same user + master key", () => {
    const s = seed();
    const blob = encryptSecret(s, USER_A, MASTER);
    const out = decryptSecret(blob, USER_A, MASTER);
    expect(out.equals(s)).toBe(true);
  });

  it("produces a fresh blob each call (random salt + IV), all decrypting back", () => {
    const s = seed();
    const a = encryptSecret(s, USER_A, MASTER);
    const b = encryptSecret(s, USER_A, MASTER);
    expect(a).not.toBe(b);
    expect(decryptSecret(a, USER_A, MASTER).equals(s)).toBe(true);
    expect(decryptSecret(b, USER_A, MASTER).equals(s)).toBe(true);
  });

  it("derives different keys per user: user B cannot open user A's blob", () => {
    const s = seed();
    const blob = encryptSecret(s, USER_A, MASTER);
    // Same plaintext, same master key, different userId -> different blob...
    expect(blob).not.toBe(encryptSecret(s, USER_B, MASTER));
    // ...and a cross-user open fails the GCM auth tag (AAD + HKDF info mismatch).
    expect(() => decryptSecret(blob, USER_B, MASTER)).toThrow();
  });

  it("fails to open under the wrong master key", () => {
    const blob = encryptSecret(seed(), USER_A, MASTER);
    expect(() => decryptSecret(blob, USER_A, MASTER2)).toThrow();
  });

  it("detects tampering of any blob region", () => {
    const blob = encryptSecret(seed(), USER_A, MASTER);
    const raw = Buffer.from(blob, "base64");
    // Flip a byte in the ciphertext region (past version+salt+iv+tag = 45).
    raw[raw.length - 1] ^= 0xff;
    expect(() => decryptSecret(raw.toString("base64"), USER_A, MASTER)).toThrow();
    // Flip a byte in the auth tag.
    const raw2 = Buffer.from(blob, "base64");
    raw2[1 + 16 + 12] ^= 0xff;
    expect(() => decryptSecret(raw2.toString("base64"), USER_A, MASTER)).toThrow();
  });

  it("uses version byte 0x01 and rejects an unknown version", () => {
    const blob = encryptSecret(seed(), USER_A, MASTER);
    const raw = Buffer.from(blob, "base64");
    expect(raw[0]).toBe(0x01);
    raw[0] = 0x02;
    expect(() => decryptSecret(raw.toString("base64"), USER_A, MASTER)).toThrow();
  });

  it("rejects malformed / truncated input without leaking why", () => {
    expect(() => decryptSecret("not-base64-at-all!!", USER_A, MASTER)).toThrow(
      "wallet secret decryption failed",
    );
    expect(() => decryptSecret("", USER_A, MASTER)).toThrow("wallet secret decryption failed");
  });

  it("never includes the secret, master key, or userId in an error message", () => {
    const s = Buffer.from("SUPER_SECRET_SEED_BYTES_DO_NOT_LEAK!!", "utf8");
    const blob = encryptSecret(s, USER_A, MASTER);
    try {
      decryptSecret(blob, USER_B, MASTER); // wrong user -> throws
      throw new Error("expected decrypt to throw");
    } catch (err) {
      const msg = (err as Error).message;
      expect(msg).toBe("wallet secret decryption failed");
      expect(msg).not.toContain(MASTER);
      expect(msg).not.toContain(USER_A);
      expect(msg).not.toContain("SECRET");
    }
  });

  it("refuses to operate without a master key", () => {
    expect(() => encryptSecret(seed(), USER_A, "")).toThrow();
    expect(() => decryptSecret("x", USER_A, "")).toThrow();
  });

  // End-to-end with a REAL Stellar keypair: this is exactly how the wallet layer
  // (keyProvider/service) seals and re-opens a signing key - encrypt the raw
  // ed25519 seed, then rebuild the Keypair from the decrypted seed. Proves the
  // rawSecretKey()/fromRawEd25519Seed() integration the whole feature relies on.
  it("round-trips a real Stellar keypair seed and rebuilds the same Keypair", () => {
    const kp = Keypair.random();
    const blob = encryptSecret(kp.rawSecretKey(), USER_A, MASTER);
    const recoveredSeed = decryptSecret(blob, USER_A, MASTER);
    const rebuilt = Keypair.fromRawEd25519Seed(recoveredSeed);
    expect(rebuilt.publicKey()).toBe(kp.publicKey());
    expect(rebuilt.secret()).toBe(kp.secret());
  });

  // Regression pin for the createWallet "SAAAA..." bug: rawSecretKey() returns a
  // REFERENCE to the keypair's internal seed buffer, so zeroing it corrupts every
  // later kp.secret() encode (it silently returns the strkey of an all-zero
  // seed). Any caller that zeroes the seed as hygiene MUST encode the strkeys
  // first (see wallet/service.ts createWallet). If a future SDK version makes
  // rawSecretKey() return a copy, this test failing is the signal to re-check —
  // the encode-before-zero order in service.ts stays correct either way.
  it("zeroing rawSecretKey() corrupts later kp.secret() encodes (encode-before-zero!)", () => {
    const kp = Keypair.random();
    const goodSecret = kp.secret();
    kp.rawSecretKey().fill(0);
    const afterZero = kp.secret();
    expect(afterZero).not.toBe(goodSecret);
    // The garbage encode is a syntactically valid strkey of the all-zero seed —
    // exactly why the bug shipped: nothing threw, the user just got a wrong key.
    expect(afterZero.startsWith("SA")).toBe(true);
  });
});
