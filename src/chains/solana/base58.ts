/**
 * Minimal base58 (Bitcoin alphabet) codec — the encoding Solana uses for
 * addresses and secret keys. Self-contained (~40 lines) to avoid pulling the
 * heavy @solana/web3.js dependency for what is just an integer-base conversion.
 */
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE = BigInt(ALPHABET.length);
const INDEX = new Map<string, number>([...ALPHABET].map((c, i) => [c, i]));

export function base58Encode(bytes: Uint8Array): string {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  let out = "";
  while (n > 0n) {
    out = ALPHABET[Number(n % BASE)] + out;
    n /= BASE;
  }
  // Preserve leading zero bytes as "1"s (base58 convention).
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out || (bytes.length > 0 ? "1".repeat(bytes.length) : "");
}

export function base58Decode(s: string): Uint8Array {
  let n = 0n;
  for (const c of s) {
    const v = INDEX.get(c);
    if (v === undefined) throw new Error(`Invalid base58 character "${c}".`);
    n = n * BASE + BigInt(v);
  }
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  // Restore leading zero bytes encoded as "1"s.
  for (const c of s) {
    if (c !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

/** True when `s` decodes to exactly `len` bytes of valid base58. */
export function isBase58OfLength(s: string, len: number): boolean {
  try {
    return base58Decode(s).length === len;
  } catch {
    return false;
  }
}
