/**
 * Hermetic tests for the Hyperliquid crypto primitives. No network.
 *
 * keccak vectors were generated offline from @noble/hashes (the reference impl
 * transitively present in node_modules) and are the STANDARD Ethereum keccak-256
 * outputs. The secp256k1 address vectors were generated offline from Node's
 * `crypto.createECDH('secp256k1')` (an independent implementation). Signing is
 * validated three ways: determinism, an ecrecover round-trip (independent code
 * path), and — the strongest check — an independent verify by Node's OpenSSL
 * ECDSA over a real SHA-256 message.
 */
import { createHash, createPublicKey, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  bytesToHex,
  hexToBytes,
  keccak256,
  privateKeyToAddress,
  privateKeyToPublicKey,
  recoverAddress,
  sign,
  bigIntToBytes,
  SECP256K1_N,
} from "./crypto";

const utf8 = (s: string) => new TextEncoder().encode(s);
const seq = (n: number) => Uint8Array.from({ length: n }, (_, i) => i & 0xff);

describe("keccak256", () => {
  // Standard Ethereum keccak-256 vectors (NOT NIST SHA3-256).
  it("hashes the empty string", () => {
    expect(bytesToHex(keccak256(new Uint8Array()))).toBe(
      "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
  });
  it('hashes "abc"', () => {
    expect(bytesToHex(keccak256(utf8("abc")))).toBe(
      "4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45",
    );
  });
  it('hashes "testing 123"', () => {
    expect(bytesToHex(keccak256(utf8("testing 123")))).toBe(
      "f2f7b8d2fe3fd87658f9e920d8d9f7940f54d3a135890b4a71da6319edeeafc2",
    );
  });
  // Rate-boundary cases (rate = 136 bytes) exercise the padding + multi-block path.
  it("hashes exactly rate-1 bytes (135)", () => {
    expect(bytesToHex(keccak256(seq(135)))).toBe(
      "cbdfd9dee5faad3818d6b06f95a219fd290b0e1706f6a82e5a595b9ce9faca62",
    );
  });
  it("hashes exactly rate bytes (136) — forces a full pad block", () => {
    expect(bytesToHex(keccak256(seq(136)))).toBe(
      "7ce759f1ab7f9ce437719970c26b0a66ff11fe3e38e17df89cf5d29c7d7f807e",
    );
  });
  it("hashes rate+1 bytes (137) — two absorb blocks", () => {
    expect(bytesToHex(keccak256(seq(137)))).toBe(
      "ac73d4fae68b8453f764007c1a20ce95994187861f0c3227a3a8e99a73a3b1db",
    );
  });
  it("always returns 32 bytes", () => {
    expect(keccak256(utf8("x")).length).toBe(32);
  });
});

describe("address / public-key derivation", () => {
  const PRIV_ONE = "0000000000000000000000000000000000000000000000000000000000000001";
  const PRIV_46 = "4646464646464646464646464646464646464646464646464646464646464646";

  it("derives the generator public key for private key 1", () => {
    // Uncompressed key = 0x04 || Gx || Gy.
    expect(bytesToHex(privateKeyToPublicKey(PRIV_ONE))).toBe(
      "0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798" +
        "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8",
    );
  });
  it("derives the well-known address for private key 1", () => {
    expect(privateKeyToAddress(PRIV_ONE)).toBe("0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
  });
  it("derives the address for private key 0x4646..46", () => {
    expect(privateKeyToAddress(PRIV_46)).toBe("0x9d8a62f656a8d1615c1294fd71e9cfb3e4855a4f");
  });
  it("accepts a 0x-prefixed key and Uint8Array equivalently", () => {
    expect(privateKeyToAddress("0x" + PRIV_46)).toBe(privateKeyToAddress(hexToBytes(PRIV_46)));
  });
  it("rejects out-of-range keys", () => {
    expect(() => privateKeyToAddress("00".repeat(32))).toThrow();
    expect(() => privateKeyToAddress(bigIntToBytes(SECP256K1_N, 32))).toThrow();
  });
});

describe("secp256k1 sign", () => {
  const PRIV = "4646464646464646464646464646464646464646464646464646464646464646";
  const hash = keccak256(utf8("hello hyperliquid"));

  it("is deterministic (RFC6979): same input -> identical signature", () => {
    const a = sign(hash, PRIV);
    const b = sign(hash, PRIV);
    expect(a.r).toBe(b.r);
    expect(a.s).toBe(b.s);
    expect(a.recovery).toBe(b.recovery);
  });

  it("produces a canonical low-s signature", () => {
    const { s } = sign(hash, PRIV);
    expect(s <= SECP256K1_N >> 1n).toBe(true);
  });

  it("recovers the signer address (validates r, s AND v together)", () => {
    const sig = sign(hash, PRIV);
    expect(recoverAddress(hash, sig)).toBe(privateKeyToAddress(PRIV));
  });

  it("changing the message changes the signature", () => {
    const other = keccak256(utf8("different message"));
    expect(sign(hash, PRIV).r).not.toBe(sign(other, PRIV).r);
  });

  it("verifies against Node's independent OpenSSL ECDSA (real SHA-256 message)", () => {
    // Sign a genuine SHA-256 digest of a message, then let Node verify it. This
    // is an implementation entirely separate from ours, so a pass proves our EC
    // math + RFC6979 signing yields spec-valid ECDSA signatures.
    const msg = utf8("cross-verify against openssl");
    const digest = new Uint8Array(createHash("sha256").update(msg).digest());
    const sig = sign(digest, PRIV);

    // DER-encode (r, s) for Node's dsaEncoding:'der'.
    const der = derEncode(sig.r, sig.s);
    const pub = privateKeyToPublicKey(PRIV); // 0x04 || x || y
    const b64url = (b: Uint8Array) => Buffer.from(b).toString("base64url");
    const key = createPublicKey({
      key: { kty: "EC", crv: "secp256k1", x: b64url(pub.subarray(1, 33)), y: b64url(pub.subarray(33, 65)) },
      format: "jwk",
    });
    const ok = createVerify("sha256").update(msg).verify({ key, dsaEncoding: "der" }, der);
    expect(ok).toBe(true);
  });
});

/** Minimal DER encoding of an ECDSA (r, s) pair for the cross-verify test. */
function derEncode(r: bigint, s: bigint): Buffer {
  const int = (x: bigint) => {
    let b = Array.from(bigIntToBytes(x, 32));
    while (b.length > 1 && b[0] === 0) b = b.slice(1); // strip leading zeros
    if ((b[0] as number) & 0x80) b = [0, ...b]; // keep it positive
    return Buffer.from([0x02, b.length, ...b]);
  };
  const rb = int(r);
  const sb = int(s);
  return Buffer.from([0x30, rb.length + sb.length, ...rb, ...sb]);
}
