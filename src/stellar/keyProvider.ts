/**
 * Per-user signing seam (Feature 3).
 *
 * The single place that turns the CURRENT user's stored wallet into a usable
 * Keypair, and the single place that decides which Stellar account the current
 * operation builds against. It mirrors the ambient userId pattern (src/users/
 * context.ts): callers don't pass an account or a key around - they resolve it
 * here from currentUserId(). So the SAME code path serves a logged-in user (their
 * own wallet) and a background loop (which runs as DEFAULT_USER_ID and falls back
 * to the env STELLAR_SECRET, keeping the single-operator bot working unchanged).
 *
 * The plaintext secret is produced ONLY inside withDecryptedKey(), held for the
 * duration of the callback, and the decrypted seed Buffer is zeroed in `finally`.
 * It is never cached, returned, logged, or put on config. The master key
 * (config.walletEncryptionKey) is read only here.
 */
import { Keypair } from "@stellar/stellar-sdk";
import { config } from "../config";
import { currentUserId, DEFAULT_USER_ID } from "../users/context";
import { getActiveWallet } from "../db/repo";
import { decryptSecret } from "../crypto/secretBox";

/**
 * Thrown when the current user has no usable signing wallet. The server maps it
 * to a clean 400 ("set up a wallet first") rather than a generic 500. Carries no
 * secret material.
 */
export class WalletNotConfiguredError extends Error {
  constructor(message = "No active wallet is configured for this account.") {
    super(message);
    this.name = "WalletNotConfiguredError";
  }
}

/**
 * Thrown when the current user's active wallet is CLIENT-SIGNED (non-custodial):
 * the server holds only the public key (encryptedSecret is null), so there is no
 * key to decrypt or sign with here. The server maps it to a clean 409 telling the
 * client to sign the transaction itself (`/api/pay/build` + `/api/submit`).
 * Carries no secret material. (Non-custodial migration §4.6 — prevents a
 * decryptSecret(null) from surfacing as an uncaught generic 500.)
 */
export class ClientSignedWalletError extends Error {
  constructor(message = "This wallet is non-custodial; sign the transaction on your own device.") {
    super(message);
    this.name = "ClientSignedWalletError";
  }
}

/**
 * Does the DEFAULT account get to fall back to the env STELLAR_SECRET? Only the
 * default user (the single-operator deployment + the background autopilot/monitor
 * loops). A logged-in user NEVER falls back to the operator's key - they must set
 * up their own wallet, or they are read-only.
 */
function envFallbackKeypair(): Keypair | null {
  if (currentUserId() !== DEFAULT_USER_ID) return null;
  if (!config.stellarSecret) return null;
  return Keypair.fromSecret(config.stellarSecret);
}

function envFallbackPublic(): string | null {
  if (currentUserId() !== DEFAULT_USER_ID) return null;
  if (config.stellarPublic) return config.stellarPublic;
  if (config.stellarSecret) {
    try {
      return Keypair.fromSecret(config.stellarSecret).publicKey();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Run `fn` with the current user's signing Keypair, decrypting their stored
 * secret in memory ONLY for the duration of the call, then zeroing the seed.
 * Throws WalletNotConfiguredError when the user has no wallet (and isn't the
 * env-backed default account).
 */
export async function withDecryptedKey<T>(fn: (kp: Keypair) => T | Promise<T>): Promise<T> {
  const wallet = await getActiveWallet();
  if (wallet) {
    // Non-custodial wallets store only the public key — there is no secret to
    // decrypt or sign with server-side. Fail with a typed, catchable error rather
    // than calling decryptSecret(null) (which would surface as a generic 500).
    if (!wallet.encryptedSecret) throw new ClientSignedWalletError();
    const seed = decryptSecret(wallet.encryptedSecret, currentUserId(), config.walletEncryptionKey);
    try {
      const kp = Keypair.fromRawEd25519Seed(seed);
      // Defence in depth: the stored public key must match the decrypted key.
      if (kp.publicKey() !== wallet.publicKey) {
        throw new WalletNotConfiguredError("Stored wallet is inconsistent; re-import it.");
      }
      return await fn(kp);
    } finally {
      seed.fill(0);
    }
  }
  const envKp = envFallbackKeypair();
  if (envKp) return await fn(envKp);
  throw new WalletNotConfiguredError();
}

/**
 * The Stellar public key the current operation builds + signs against. Throws
 * WalletNotConfiguredError when there is none - use this on the WRITE/sign path
 * so the source account and the signing key always come from the same wallet.
 */
export async function requireTradingAccount(): Promise<string> {
  const acct = await resolveTradingAccountOrNull();
  if (!acct) throw new WalletNotConfiguredError();
  return acct;
}

/**
 * The current user's trading account public key, or null when unconfigured. Use
 * this on READ paths (balances/trustlines/offers) that should degrade gracefully
 * to "nothing to show" rather than error.
 */
export async function resolveTradingAccountOrNull(): Promise<string | null> {
  const wallet = await getActiveWallet();
  if (wallet) return wallet.publicKey;
  return envFallbackPublic();
}

/**
 * True when the current user's active wallet is non-custodial (client-signed):
 * the server stored only the public key, so signing must happen on the device.
 * Read paths still work (they use the public key); write paths must route through
 * the build/submit endpoints instead of withDecryptedKey().
 */
export async function isCurrentWalletClientSigned(): Promise<boolean> {
  const wallet = await getActiveWallet();
  return !!wallet && !wallet.encryptedSecret;
}
