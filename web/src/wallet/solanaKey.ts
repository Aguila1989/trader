// Solana wallet key helpers (NON-CUSTODIAL ONLY — the server stores the address,
// never a secret; there is no custodial Solana path). Solana uses the same
// ed25519 curve as Stellar, so @stellar/stellar-base (already a lazy-chunked
// dependency for the on-device Stellar key) supplies the key math; only the
// ENCODING differs:
//   address = Base58 of the 32-byte raw public key
//   secret  = Base58 of the 64-byte concat(raw seed, raw public key) — the
//             format Phantom/Solflare export and accept.
import { Keypair } from "@stellar/stellar-base";
import { base58Encode, base58Decode } from "./base58";

export interface SolanaWallet {
  /** Base58 address (the 32-byte public key). */
  publicKey: string;
  /** Base58 of the 64-byte secret (seed ‖ public key), Phantom-compatible. */
  secret: string;
}

// Derive the address + normalized 64-byte secret from a raw 32-byte seed.
function fromSeed(seed: Uint8Array): SolanaWallet {
  const kp = Keypair.fromRawEd25519Seed(Buffer.from(seed));
  const pub = new Uint8Array(kp.rawPublicKey());
  const full = new Uint8Array(64);
  full.set(seed, 0);
  full.set(pub, 32);
  return { publicKey: base58Encode(pub), secret: base58Encode(full) };
}

/** Generate a brand-new Solana keypair on this device. The secret is returned
 *  ONCE (for the user to back up); persist it with saveLocalWallet(…, "solana"). */
export function generateSolanaWallet(): SolanaWallet {
  return fromSeed(new Uint8Array(Keypair.random().rawSecretKey()));
}

/**
 * Parse + validate a user-supplied Solana secret. Accepts the 64-byte Phantom
 * export (seed ‖ public key — the embedded public half must match the one
 * derived from the seed) or a bare 32-byte seed. Returns the derived address
 * plus the secret NORMALIZED to the 64-byte Base58 form (what localKey stores).
 * Throws on anything else.
 */
export function parseSolanaSecret(input: string): SolanaWallet {
  let bytes: Uint8Array;
  try {
    bytes = base58Decode(input.trim());
  } catch {
    throw new Error("Not a valid Base58 string.");
  }
  if (bytes.length !== 64 && bytes.length !== 32) {
    throw new Error(`A Solana secret is 64 Base58-decoded bytes (or a 32-byte seed) — got ${bytes.length}.`);
  }
  const wallet = fromSeed(bytes.subarray(0, 32));
  if (bytes.length === 64) {
    const pub = base58Decode(wallet.publicKey);
    for (let i = 0; i < 32; i++) {
      if (bytes[32 + i] !== pub[i]) {
        throw new Error("The secret's embedded public key does not match its seed — not a valid Solana secret.");
      }
    }
  }
  return wallet;
}
