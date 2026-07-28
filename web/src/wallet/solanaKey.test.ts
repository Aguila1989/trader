import { describe, it, expect } from "vitest";
import { generateSolanaWallet, parseSolanaSecret } from "./solanaKey";
import { base58Encode, base58Decode } from "./base58";

describe("generateSolanaWallet", () => {
  it("produces a 32-byte Base58 address and a 64-byte Base58 secret whose last half is the public key", () => {
    const w = generateSolanaWallet();
    const pub = base58Decode(w.publicKey);
    const sec = base58Decode(w.secret);
    expect(pub).toHaveLength(32);
    expect(sec).toHaveLength(64);
    expect(Array.from(sec.subarray(32))).toEqual(Array.from(pub));
  });

  it("generates a different keypair every time", () => {
    expect(generateSolanaWallet().publicKey).not.toBe(generateSolanaWallet().publicKey);
  });
});

describe("parseSolanaSecret", () => {
  it("accepts a generated 64-byte secret and is a normalization fixpoint", () => {
    const w = generateSolanaWallet();
    const parsed = parseSolanaSecret(w.secret);
    expect(parsed.publicKey).toBe(w.publicKey);
    expect(parsed.secret).toBe(w.secret);
  });

  it("accepts a bare 32-byte seed and derives the same wallet", () => {
    const w = generateSolanaWallet();
    const seed = base58Decode(w.secret).subarray(0, 32);
    const parsed = parseSolanaSecret(base58Encode(seed));
    expect(parsed.publicKey).toBe(w.publicKey);
    expect(parsed.secret).toBe(w.secret); // normalized back to the 64-byte form
  });

  it("tolerates surrounding whitespace", () => {
    const w = generateSolanaWallet();
    expect(parseSolanaSecret(`  ${w.secret}\n`).publicKey).toBe(w.publicKey);
  });

  it("rejects a 64-byte secret whose embedded public key does not match the seed", () => {
    const bytes = base58Decode(generateSolanaWallet().secret);
    bytes[63] ^= 0x01; // corrupt the public half
    expect(() => parseSolanaSecret(base58Encode(bytes))).toThrow(/does not match/);
  });

  it("rejects wrong lengths", () => {
    expect(() => parseSolanaSecret(base58Encode(new Uint8Array(31).fill(1)))).toThrow(/64|32/);
    expect(() => parseSolanaSecret(base58Encode(new Uint8Array(65).fill(1)))).toThrow(/64|32/);
    expect(() => parseSolanaSecret("")).toThrow();
  });

  it("rejects non-Base58 input (e.g. a Stellar secret)", () => {
    expect(() => parseSolanaSecret("SB0O0I0L")).toThrow(/Base58/);
  });
});
