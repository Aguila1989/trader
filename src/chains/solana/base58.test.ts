import { describe, it, expect } from "vitest";
import { base58Encode, base58Decode, isBase58OfLength } from "./base58";

describe("base58 codec", () => {
  it("round-trips arbitrary bytes", () => {
    const cases = [
      Uint8Array.from([]),
      Uint8Array.from([0]),
      Uint8Array.from([0, 0, 1]),
      Uint8Array.from([255]),
      Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 250]),
      Uint8Array.from(Array.from({ length: 32 }, (_, i) => (i * 7 + 3) % 256)),
      Uint8Array.from(Array.from({ length: 64 }, (_, i) => (i * 13 + 1) % 256)),
    ];
    for (const bytes of cases) {
      expect(base58Decode(base58Encode(bytes))).toEqual(bytes);
    }
  });

  it("preserves leading zero bytes as '1's", () => {
    expect(base58Encode(Uint8Array.from([0, 0]))).toBe("11");
    expect(base58Decode("11")).toEqual(Uint8Array.from([0, 0]));
  });

  it("matches known vectors", () => {
    // "hello" -> Cn8eVZg (classic test vector)
    expect(base58Encode(new TextEncoder().encode("hello"))).toBe("Cn8eVZg");
    expect(new TextDecoder().decode(base58Decode("Cn8eVZg"))).toBe("hello");
  });

  it("rejects invalid characters (0, O, I, l are not in the alphabet)", () => {
    expect(() => base58Decode("0OIl")).toThrow(/Invalid base58/);
  });

  it("isBase58OfLength checks the decoded byte length", () => {
    // The system program address: 32 zero bytes -> 32 "1"s.
    expect(isBase58OfLength("1".repeat(32), 32)).toBe(true);
    // A real-shaped Solana address (32 bytes).
    const addr = base58Encode(Uint8Array.from(Array.from({ length: 32 }, (_, i) => i + 1)));
    expect(isBase58OfLength(addr, 32)).toBe(true);
    expect(isBase58OfLength(addr, 33)).toBe(false);
    expect(isBase58OfLength("not-base58!", 32)).toBe(false);
  });
});
