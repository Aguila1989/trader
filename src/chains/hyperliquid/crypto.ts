/**
 * Ethereum-style crypto primitives for Hyperliquid (Phase 2a).
 *
 * Hyperliquid authenticates exchange actions with an EIP-712 secp256k1
 * signature (Ethereum-style), NOT Stellar's ed25519. That means we need three
 * things the Stellar path never used: keccak-256 (for EIP-712 struct hashing +
 * address derivation), secp256k1 ECDSA signing with a RECOVERY id (v), and
 * Ethereum address derivation from a private key.
 *
 * DEPENDENCY CHOICE — implemented in pure TS on purpose:
 *   - keccak-256: `node:crypto` only exposes NIST SHA3-256 (pad 0x06), which is
 *     a DIFFERENT function from Ethereum's keccak-256 (pad 0x01). There is no
 *     keccak in Node's stdlib and no secp256k1 curve lib in our direct
 *     dependencies (@noble/hashes is only a TRANSITIVE dep of stellar-sdk, so
 *     relying on it would be fragile — a stellar-sdk bump could remove it).
 *     Rather than add a new dependency we implement keccak-f[1600] here (~80
 *     lines) and pin it with the standard published test vectors in the tests.
 *   - secp256k1: implemented with BigInt field/scalar math (Jacobian point
 *     arithmetic) so we get DETERMINISTIC RFC6979 signatures AND the recovery
 *     id `v` directly from the ephemeral point R. Node's ECDSA uses a random k
 *     (non-deterministic, no RFC6979) and never exposes R, so it cannot give us
 *     either — hence the hand-rolled EC. HMAC-SHA256 (for RFC6979) DOES come
 *     from `node:crypto`, which is the one piece we don't need to reinvent.
 *
 * Everything here is offline/pure — no network, no import-time side effects.
 */
import { createHmac } from "node:crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Hex / byte helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a hex string (with or without a leading "0x") into bytes. Throws on
 *  odd length or non-hex. The error messages are DELIBERATELY content-free:
 *  private keys are parsed through here, and a mistyped key (odd length / stray
 *  char) must never be interpolated into an exception that gets logged or shipped
 *  to Sentry. (Review 2026-08-04, hl-signing P1 — was `...: ${hex}`.) */
export function hexToBytes(hex: string): Uint8Array {
  let s = hex.startsWith("0x") || hex.startsWith("0X") ? hex.slice(2) : hex;
  if (s.length % 2 !== 0) throw new Error("invalid hex: odd length");
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(s.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) throw new Error("invalid hex: non-hex byte");
    out[i] = byte;
  }
  return out;
}

const HEX_CHARS = "0123456789abcdef";

/** Lowercase hex WITHOUT a "0x" prefix. */
export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] as number;
    s += HEX_CHARS[b >> 4];
    s += HEX_CHARS[b & 0x0f];
  }
  return s;
}

/** Big-endian bytes -> unsigned BigInt. */
export function bytesToBigInt(bytes: Uint8Array): bigint {
  let x = 0n;
  for (let i = 0; i < bytes.length; i++) x = (x << 8n) | BigInt(bytes[i] as number);
  return x;
}

/** Unsigned BigInt -> fixed-width big-endian bytes (left-zero-padded). Throws if
 *  the value does not fit in `length` bytes — silent truncation would corrupt a
 *  signature. */
export function bigIntToBytes(x: bigint, length: number): Uint8Array {
  if (x < 0n) throw new Error("bigIntToBytes: negative");
  const out = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    out[i] = Number(x & 0xffn);
    x >>= 8n;
  }
  if (x !== 0n) throw new Error(`value does not fit in ${length} bytes`);
  return out;
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// keccak-256 (Ethereum), pure TS — Keccak-f[1600], rate 1088 bits (136 bytes)
// ─────────────────────────────────────────────────────────────────────────────

const KECCAK_RATE = 136; // bytes; capacity 512, output 256
const U64_MASK = (1n << 64n) - 1n;

/** Round constants for Keccak-f[1600] (24 rounds). */
const KECCAK_RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
/** Rotation offsets, in the rho/pi lane-permutation order below. */
const KECCAK_ROTC: number[] = [
  1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];
/** Lane permutation (pi) indices, paired with ROTC above. */
const KECCAK_PILN: number[] = [
  10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];

function rotl64(x: bigint, n: number): bigint {
  const b = BigInt(n);
  return ((x << b) | (x >> (64n - b))) & U64_MASK;
}

/** In-place Keccak-f[1600] permutation over 25 lanes. */
function keccakF(A: bigint[]): void {
  for (let round = 0; round < 24; round++) {
    // θ (theta)
    const C: bigint[] = new Array(5);
    for (let x = 0; x < 5; x++) {
      C[x] =
        (A[x] as bigint) ^
        (A[x + 5] as bigint) ^
        (A[x + 10] as bigint) ^
        (A[x + 15] as bigint) ^
        (A[x + 20] as bigint);
    }
    for (let x = 0; x < 5; x++) {
      const d = (C[(x + 4) % 5] as bigint) ^ rotl64(C[(x + 1) % 5] as bigint, 1);
      for (let y = 0; y < 25; y += 5) A[x + y] = (A[x + y] as bigint) ^ d;
    }
    // ρ (rho) + π (pi)
    let t = A[1] as bigint;
    for (let i = 0; i < 24; i++) {
      const j = KECCAK_PILN[i] as number;
      const tmp = A[j] as bigint;
      A[j] = rotl64(t, KECCAK_ROTC[i] as number);
      t = tmp;
    }
    // χ (chi)
    for (let y = 0; y < 25; y += 5) {
      const t0 = A[y] as bigint;
      const t1 = A[y + 1] as bigint;
      const t2 = A[y + 2] as bigint;
      const t3 = A[y + 3] as bigint;
      const t4 = A[y + 4] as bigint;
      A[y] = t0 ^ (~t1 & U64_MASK & t2);
      A[y + 1] = t1 ^ (~t2 & U64_MASK & t3);
      A[y + 2] = t2 ^ (~t3 & U64_MASK & t4);
      A[y + 3] = t3 ^ (~t4 & U64_MASK & t0);
      A[y + 4] = t4 ^ (~t0 & U64_MASK & t1);
    }
    // ι (iota)
    A[0] = (A[0] as bigint) ^ (KECCAK_RC[round] as bigint);
  }
}

/**
 * Ethereum keccak-256. Multi-rate padding uses the 0x01 domain byte (NOT the
 * 0x06 of NIST SHA3), then sets the high bit of the final rate byte (0x80).
 * Returns 32 bytes.
 */
export function keccak256(msg: Uint8Array): Uint8Array {
  // Pad: message || 0x01 || 0x00* || 0x80, filling out to a rate multiple.
  const padLen = KECCAK_RATE - (msg.length % KECCAK_RATE);
  const padded = new Uint8Array(msg.length + padLen);
  padded.set(msg, 0);
  padded[msg.length] = (padded[msg.length] as number) ^ 0x01;
  padded[padded.length - 1] = (padded[padded.length - 1] as number) ^ 0x80;

  const A: bigint[] = new Array(25).fill(0n);
  for (let off = 0; off < padded.length; off += KECCAK_RATE) {
    // Absorb: XOR 17 little-endian 64-bit lanes into the state, then permute.
    for (let i = 0; i < KECCAK_RATE / 8; i++) {
      let lane = 0n;
      for (let b = 0; b < 8; b++) lane |= BigInt(padded[off + 8 * i + b] as number) << BigInt(8 * b);
      A[i] = (A[i] as bigint) ^ lane;
    }
    keccakF(A);
  }
  // Squeeze the first 256 bits (4 little-endian lanes).
  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let lane = A[i] as bigint;
    for (let b = 0; b < 8; b++) {
      out[8 * i + b] = Number(lane & 0xffn);
      lane >>= 8n;
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// secp256k1 curve (Jacobian point math over BigInt)
// ─────────────────────────────────────────────────────────────────────────────

/** Field prime p = 2^256 − 2^32 − 977. */
export const SECP256K1_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
/** Curve order n. */
export const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
/** Generator point (Gx, Gy). Curve is y² = x³ + 7 (a = 0, b = 7). */
export const SECP256K1_GX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
export const SECP256K1_GY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;

const HALF_N = SECP256K1_N >> 1n; // for low-s normalisation

function mod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r >= 0n ? r : r + m;
}

/** Modular inverse via the extended Euclidean algorithm. */
function modInverse(a: bigint, m: bigint): bigint {
  let [old_r, r] = [mod(a, m), m];
  let [old_s, s] = [1n, 0n];
  while (r !== 0n) {
    const q = old_r / r;
    [old_r, r] = [r, old_r - q * r];
    [old_s, s] = [s, old_s - q * s];
  }
  if (old_r !== 1n) throw new Error("modInverse: not invertible");
  return mod(old_s, m);
}

/** Jacobian projective point; the identity is any point with z = 0. */
interface JPoint {
  x: bigint;
  y: bigint;
  z: bigint;
}
const J_ZERO: JPoint = { x: 0n, y: 1n, z: 0n };
const P = SECP256K1_P;

function jDouble(p1: JPoint): JPoint {
  if (p1.z === 0n || p1.y === 0n) return J_ZERO;
  // a = 0 simplification.
  const A = mod(p1.x * p1.x, P);
  const B = mod(p1.y * p1.y, P);
  const C = mod(B * B, P);
  const D = mod(2n * (mod((p1.x + B) * (p1.x + B), P) - A - C), P);
  const E = mod(3n * A, P);
  const F = mod(E * E, P);
  const X3 = mod(F - 2n * D, P);
  const Y3 = mod(E * (D - X3) - 8n * C, P);
  const Z3 = mod(2n * p1.y * p1.z, P);
  return { x: X3, y: Y3, z: Z3 };
}

function jAdd(p1: JPoint, p2: JPoint): JPoint {
  if (p1.z === 0n) return p2;
  if (p2.z === 0n) return p1;
  const Z1Z1 = mod(p1.z * p1.z, P);
  const Z2Z2 = mod(p2.z * p2.z, P);
  const U1 = mod(p1.x * Z2Z2, P);
  const U2 = mod(p2.x * Z1Z1, P);
  const S1 = mod(p1.y * p2.z * Z2Z2, P);
  const S2 = mod(p2.y * p1.z * Z1Z1, P);
  if (U1 === U2) {
    if (S1 !== S2) return J_ZERO; // p1 = -p2
    return jDouble(p1); // p1 = p2
  }
  const H = mod(U2 - U1, P);
  const I = mod(mod(2n * H, P) * mod(2n * H, P), P);
  const J = mod(H * I, P);
  const r = mod(2n * (S2 - S1), P);
  const V = mod(U1 * I, P);
  const X3 = mod(r * r - J - 2n * V, P);
  const Y3 = mod(r * (V - X3) - 2n * S1 * J, P);
  const Z3 = mod((mod((p1.z + p2.z) * (p1.z + p2.z), P) - Z1Z1 - Z2Z2) * H, P);
  return { x: X3, y: Y3, z: Z3 };
}

/** Double-and-add scalar multiplication k·P. */
function jMul(k: bigint, point: JPoint): JPoint {
  let acc = J_ZERO;
  let add = point;
  let n = k;
  while (n > 0n) {
    if (n & 1n) acc = jAdd(acc, add);
    add = jDouble(add);
    n >>= 1n;
  }
  return acc;
}

interface APoint {
  x: bigint;
  y: bigint;
}

function toAffine(p1: JPoint): APoint {
  if (p1.z === 0n) throw new Error("point at infinity has no affine form");
  const zinv = modInverse(p1.z, P);
  const zinv2 = mod(zinv * zinv, P);
  return { x: mod(p1.x * zinv2, P), y: mod(p1.y * zinv2 * zinv, P) };
}

const G: JPoint = { x: SECP256K1_GX, y: SECP256K1_GY, z: 1n };

/** k·G in affine coordinates. */
function scalarMulG(k: bigint): APoint {
  return toAffine(jMul(mod(k, SECP256K1_N), G));
}

// ─────────────────────────────────────────────────────────────────────────────
// Key / address derivation
// ─────────────────────────────────────────────────────────────────────────────

function normalizePrivateKey(privateKey: string | Uint8Array): bigint {
  const bytes = typeof privateKey === "string" ? hexToBytes(privateKey) : privateKey;
  if (bytes.length !== 32) throw new Error(`private key must be 32 bytes, got ${bytes.length}`);
  const d = bytesToBigInt(bytes);
  if (d <= 0n || d >= SECP256K1_N) throw new Error("private key out of range [1, n-1]");
  return d;
}

/**
 * Uncompressed public key: 65 bytes, 0x04 || X(32) || Y(32). The X‖Y tail (64
 * bytes) is what keccak hashes for the Ethereum address.
 */
export function privateKeyToPublicKey(privateKey: string | Uint8Array): Uint8Array {
  const d = normalizePrivateKey(privateKey);
  const pub = scalarMulG(d);
  return concatBytes(new Uint8Array([0x04]), bigIntToBytes(pub.x, 32), bigIntToBytes(pub.y, 32));
}

/**
 * Ethereum address (0x + 40 lowercase hex) = last 20 bytes of keccak256(X‖Y).
 * This is the account Hyperliquid recovers from an L1-action signature, so the
 * signing key's derived address IS the HL account identity.
 */
export function privateKeyToAddress(privateKey: string | Uint8Array): string {
  const pub = privateKeyToPublicKey(privateKey); // 0x04 || X || Y
  const hash = keccak256(pub.subarray(1)); // hash X‖Y, drop the 0x04 tag
  return "0x" + bytesToHex(hash.subarray(12)); // last 20 bytes
}

// ─────────────────────────────────────────────────────────────────────────────
// RFC 6979 deterministic nonce (HMAC-SHA256) + ECDSA sign
// ─────────────────────────────────────────────────────────────────────────────

function hmacSha256(key: Uint8Array, ...msgs: Uint8Array[]): Uint8Array {
  const h = createHmac("sha256", Buffer.from(key));
  for (const m of msgs) h.update(Buffer.from(m));
  return new Uint8Array(h.digest());
}

/**
 * Deterministic k per RFC 6979 (§3.2) with HMAC-SHA256. qlen = 256 == hashlen,
 * so bits2int is a plain big-endian read and bits2octets is that value mod n.
 * Yields candidate k values; the caller retries if a candidate produces r == 0
 * or s == 0 (astronomically rare, but the spec mandates the retry loop).
 */
function* rfc6979Nonces(d: bigint, hash: Uint8Array): Generator<bigint> {
  const dBytes = bigIntToBytes(d, 32);
  const h1modn = bigIntToBytes(mod(bytesToBigInt(hash), SECP256K1_N), 32); // bits2octets(h)
  // Typed as the generic Uint8Array (ArrayBufferLike) so reassignment from
  // hmacSha256's return type is accepted under TS 5.7's typed-array generics.
  let V: Uint8Array = new Uint8Array(32).fill(0x01);
  let K: Uint8Array = new Uint8Array(32).fill(0x00);
  K = hmacSha256(K, V, new Uint8Array([0x00]), dBytes, h1modn);
  V = hmacSha256(K, V);
  K = hmacSha256(K, V, new Uint8Array([0x01]), dBytes, h1modn);
  V = hmacSha256(K, V);
  for (;;) {
    V = hmacSha256(K, V);
    const k = bytesToBigInt(V); // T = V (exactly 32 bytes), bits2int(T)
    if (k >= 1n && k < SECP256K1_N) yield k;
    K = hmacSha256(K, V, new Uint8Array([0x00]));
    V = hmacSha256(K, V);
  }
}

/** ECDSA signature over secp256k1: r, s (low-s normalised) and the recovery id. */
export interface Signature {
  r: bigint;
  s: bigint;
  /** Recovery id (0..3): bit0 = parity of R.y, bit1 = whether R.x overflowed n
   *  (≈ never). Ethereum's `v` is 27 + recovery. */
  recovery: number;
}

/**
 * Sign a 32-byte message hash with secp256k1 + RFC6979, producing a
 * low-s-normalised (r, s) and the recovery id. Deterministic: the same
 * (hash, key) always yields the same signature.
 */
export function sign(msgHash: Uint8Array, privateKey: string | Uint8Array): Signature {
  if (msgHash.length !== 32) throw new Error("message hash must be 32 bytes");
  const d = normalizePrivateKey(privateKey);
  const z = mod(bytesToBigInt(msgHash), SECP256K1_N);

  for (const k of rfc6979Nonces(d, msgHash)) {
    const R = scalarMulG(k);
    const r = mod(R.x, SECP256K1_N);
    if (r === 0n) continue;
    const kInv = modInverse(k, SECP256K1_N);
    let s = mod(kInv * (z + r * d), SECP256K1_N);
    if (s === 0n) continue;
    // recovery: y parity, plus the (practically impossible) x >= n overflow bit.
    let recovery = Number(R.y & 1n) | (R.x >= SECP256K1_N ? 2 : 0);
    // Enforce low-s (EIP-2 / canonical). Flipping s flips R.y parity too.
    if (s > HALF_N) {
      s = SECP256K1_N - s;
      recovery ^= 1;
    }
    return { r, s, recovery };
  }
  // Unreachable in practice — the generator is infinite.
  throw new Error("failed to produce a valid signature");
}

// ─────────────────────────────────────────────────────────────────────────────
// Public-key recovery (ecrecover) — used to VERIFY v in tests, and available
// for future signer-address confirmation.
// ─────────────────────────────────────────────────────────────────────────────

/** Modular square root for p ≡ 3 (mod 4): √a = a^((p+1)/4) mod p. */
function modSqrt(a: bigint): bigint {
  return modPow(a, (P + 1n) / 4n, P);
}

function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n;
  let b = mod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = mod(result * b, m);
    b = mod(b * b, m);
    e >>= 1n;
  }
  return result;
}

/**
 * Recover the signer's Ethereum address from a hash + signature. Returns the
 * lowercase 0x address. Throws if the recovery id yields no valid point.
 */
export function recoverAddress(msgHash: Uint8Array, sig: Signature): string {
  const { r, s, recovery } = sig;
  // R.x = r (+ n if the overflow bit is set).
  const x = r + (recovery >= 2 ? SECP256K1_N : 0n);
  if (x >= P) throw new Error("recover: x out of field");
  // Decompress: y² = x³ + 7.
  const ySq = mod(x * x * x + 7n, P);
  let y = modSqrt(ySq);
  if (mod(y * y, P) !== ySq) throw new Error("recover: no square root (bad signature)");
  // Pick the y whose parity matches bit0 of the recovery id.
  if ((y & 1n) !== BigInt(recovery & 1)) y = P - y;
  const Rj: JPoint = { x, y, z: 1n };
  const z = mod(bytesToBigInt(msgHash), SECP256K1_N);
  const rInv = modInverse(r, SECP256K1_N);
  // Q = r⁻¹ · (s·R − z·G)  =  (−z·r⁻¹)·G + (s·r⁻¹)·R
  const u1 = mod(-z * rInv, SECP256K1_N);
  const u2 = mod(s * rInv, SECP256K1_N);
  const Q = toAffine(jAdd(jMul(u1, G), jMul(u2, Rj)));
  const pub = concatBytes(bigIntToBytes(Q.x, 32), bigIntToBytes(Q.y, 32));
  return "0x" + bytesToHex(keccak256(pub).subarray(12));
}
