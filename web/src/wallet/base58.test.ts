import { describe, it, expect } from "vitest";
import { base58Encode, base58Decode, base58DecodeExact } from "./base58";

function hex(h: string): Uint8Array {
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// Reference vectors from the Bitcoin Core base58 test suite.
const VECTORS: Array<[string, string]> = [
  ["", ""],
  ["61", "2g"],
  ["626262", "a3gV"],
  ["636363", "aPEr"],
  ["73696d706c792061206c6f6e6720737472696e67", "2cFupjhnEsSn59qHXstmK2ffpLv2"],
  ["00eb15231dfceb60925886b67d065299925915aeb172c06647", "1NS17iag9jJgTHD1VXjvLCEnZuQ3rJDE9L"],
  ["516b6fcd0f", "ABnLTmg"],
  ["bf4f89001e670274dd", "3SEo3LWLoPntC"],
  ["572e4794", "3EFU7m"],
  ["ecac89cad93923c02321", "EJDM8drfXA6uyA"],
  ["10c8511e", "Rt5zm"],
  ["00000000000000000000", "1111111111"],
];

describe("base58Encode / base58Decode", () => {
  it("matches the reference vectors both ways", () => {
    for (const [h, b58] of VECTORS) {
      expect(base58Encode(hex(h))).toBe(b58);
      expect(Array.from(base58Decode(b58))).toEqual(Array.from(hex(h)));
    }
  });

  it("round-trips arbitrary byte strings, including leading zeros", () => {
    const cases = [
      new Uint8Array([]),
      new Uint8Array([0]),
      new Uint8Array([0, 0, 1]),
      new Uint8Array([255]),
      new Uint8Array(32).fill(7),
      new Uint8Array(64).map((_, i) => (i * 37) & 0xff),
      new Uint8Array([0, 0, 0, 255, 254, 253, 1, 2, 3]),
    ];
    for (const bytes of cases) {
      expect(Array.from(base58Decode(base58Encode(bytes)))).toEqual(Array.from(bytes));
    }
  });

  it("rejects characters outside the Bitcoin alphabet", () => {
    for (const bad of ["0", "O", "I", "l", "a b", "abc!", "+/="]) {
      expect(() => base58Decode(bad)).toThrow(/Base58/);
    }
  });
});

describe("base58DecodeExact", () => {
  it("returns the bytes when the length matches", () => {
    const enc = base58Encode(new Uint8Array(32).fill(9));
    expect(base58DecodeExact(enc, 32)).toHaveLength(32);
  });

  it("throws when the decoded length differs", () => {
    const enc = base58Encode(new Uint8Array(31).fill(9));
    expect(() => base58DecodeExact(enc, 32)).toThrow(/Expected 32/);
  });
});
