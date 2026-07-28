// Minimal Base58 codec (Bitcoin alphabet) — Solana encodes both its 32-byte
// public keys (addresses) and 64-byte secret keys (the Phantom export format)
// as Base58. Self-contained and pure (no deps, no crypto) so it is unit-testable
// and adds no vendor weight; ~40 lines is cheaper than a library.
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const CHAR_MAP = new Map<string, number>();
for (let i = 0; i < ALPHABET.length; i++) CHAR_MAP.set(ALPHABET[i], i);

/** Encode bytes as Base58 (Bitcoin alphabet). Leading zero bytes become '1's. */
export function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = []; // base-58 digits, least-significant first
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let out = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]];
  return out;
}

/** Decode a Base58 string to bytes. Throws on any character outside the alphabet. */
export function base58Decode(s: string): Uint8Array {
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes: number[] = []; // little-endian byte accumulator
  for (let i = zeros; i < s.length; i++) {
    const val = CHAR_MAP.get(s[i]);
    if (val === undefined) throw new Error(`Invalid Base58 character '${s[i]}'.`);
    let carry = val;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  const out = new Uint8Array(zeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) out[zeros + bytes.length - 1 - i] = bytes[i];
  return out;
}

/** Decode + assert an exact byte length (shape check for addresses/secrets). */
export function base58DecodeExact(s: string, length: number): Uint8Array {
  const bytes = base58Decode(s);
  if (bytes.length !== length) {
    throw new Error(`Expected ${length} Base58-decoded bytes, got ${bytes.length}.`);
  }
  return bytes;
}
