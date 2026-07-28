/**
 * NON-CUSTODIAL client-side key storage (migration P0, path "B": app-managed key).
 *
 * The user's secret is generated ON THIS DEVICE, encrypted at rest with a key
 * derived from a user passphrase (PBKDF2-SHA256 → AES-256-GCM), and stored in
 * IndexedDB. It is NEVER sent to the server. It is decrypted transiently in memory
 * only to sign, then dropped.
 *
 * MULTI-CHAIN (2026-07): storage is PER-CHAIN — one record per chain id
 * ("stellar" | "solana"), same passphrase→AES scheme for all. Every function
 * takes a chain that DEFAULTS to "stellar", so pre-existing call sites are
 * unchanged; the legacy single record ("active") migrates to "stellar" on
 * first read. Solana wallets are non-custodial only.
 *
 * SECURITY CEILING (state plainly): software Ed25519 signing needs the raw seed as
 * JS-reachable bytes at sign time, so any XSS active at that instant can capture
 * it — CSP + supply-chain integrity are the only barrier. A hardware/external
 * wallet (path "A") is the genuine isolation upgrade and is the planned fast-follow.
 * This module needs a dedicated SECURITY REVIEW + testnet verification before it is
 * enabled on mainnet. Checklist:
 *   [ ] CSP forbids inline/eval + third-party script origins — an XSS active at
 *       sign time can read the seed, and this is the only barrier (plan §9.2 A/C).
 *   [ ] @stellar/stellar-base is version-pinned + lockfile-committed; any bump
 *       gets extra review (client SDK supply-chain SPOF).
 *   [ ] PBKDF2 iteration count re-checked against current guidance (now 310k).
 *   [ ] Passphrase is never logged, never sent to the server, and not retained
 *       after unlock; the decrypted Keypair is used once and dropped.
 *   [ ] Backup/recovery UX enforced: a lost passphrase or lost device = permanent
 *       loss — communicated explicitly, with a mandatory seed-backup step.
 *   [ ] The IndexedDB record is cleared on logout / account-switch / device change.
 *   [ ] Evaluate a hardware / external wallet (path A) as the true isolation upgrade.
 */
import { Keypair } from "@stellar/stellar-base";
import { parseSolanaSecret } from "./solanaKey";

/** Chains a device key can be stored for. The IndexedDB record key IS the
 *  chain id — one encrypted wallet per chain, same crypto for all of them. */
export type ChainId = "stellar" | "solana";

const DB_NAME = "atrium-wallet";
const STORE = "keys";
// Pre-multichain record key: the single (Stellar) wallet was stored under
// "active"; idbGet migrates it to "stellar" transparently on first read.
const LEGACY_RECORD_KEY = "active";
// OWASP-recommended floor for PBKDF2-HMAC-SHA256 (2023). Raise if UX allows.
const PBKDF2_ITERATIONS = 310_000;

interface StoredKey {
  publicKey: string;
  salt: string; // base64
  iv: string; // base64
  // base64 — AES-256-GCM of the secret (utf8). Plaintext is chain-specific:
  // stellar = the "S…" secret; solana = the Base58 64-byte (seed ‖ pub) secret.
  ciphertext: string;
  createdAt: number;
}

// Chain-specific validation + normalization: the public key derived from a
// secret, and the exact plaintext we store. Throws on an invalid secret.
function normalizeSecret(secret: string, chain: ChainId): { publicKey: string; plaintext: string } {
  if (chain === "solana") {
    const w = parseSolanaSecret(secret); // throws; normalizes to Base58-64
    return { publicKey: w.publicKey, plaintext: w.secret };
  }
  const kp = Keypair.fromSecret(secret.trim()); // throws on an invalid secret
  return { publicKey: kp.publicKey(), plaintext: secret.trim() };
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function idbGetRaw(db: IDBDatabase, key: string): Promise<StoredKey | null> {
  return new Promise<StoredKey | null>((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as StoredKey | undefined) ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(chain: ChainId): Promise<StoredKey | null> {
  const db = await openDb();
  try {
    const rec = await idbGetRaw(db, chain);
    if (rec) return rec;
    if (chain !== "stellar") return null;
    // Transparent migration: a pre-multichain record ("active") IS the Stellar
    // wallet — move it under the chain-id key on first read.
    const legacy = await idbGetRaw(db, LEGACY_RECORD_KEY);
    if (!legacy) return null;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(legacy, "stellar");
      tx.objectStore(STORE).delete(LEGACY_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return legacy;
  } finally {
    db.close();
  }
}

async function idbPut(chain: ChainId, rec: StoredKey): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(rec, chain);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbDelete(chain: ChainId): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(chain);
      // Belt-and-braces: clearing the Stellar key also clears an unmigrated
      // legacy record so no orphaned ciphertext lingers on the device.
      if (chain === "stellar") tx.objectStore(STORE).delete(LEGACY_RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/** Generate a brand-new Stellar keypair on this device. The secret is returned
 *  ONCE (for the user to also back up); call saveLocalWallet to persist it. */
export function generateLocalWallet(): { publicKey: string; secret: string } {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

/** Encrypt + persist a chain secret under a passphrase. Returns the public key
 *  (Stellar "G…" / Solana Base58 address). Solana secrets are normalized to the
 *  Base58 64-byte form before encryption. */
export async function saveLocalWallet(
  secret: string,
  passphrase: string,
  chain: ChainId = "stellar",
): Promise<string> {
  if (!passphrase) throw new Error("A passphrase is required to protect your key.");
  const { publicKey, plaintext } = normalizeSecret(secret, chain);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext)),
  );
  await idbPut(chain, {
    publicKey,
    salt: b64encode(salt),
    iv: b64encode(iv),
    ciphertext: b64encode(ct),
    createdAt: Date.now(),
  });
  return publicKey;
}

/** The stored public key for a chain (no decryption / no passphrase), or null. */
export async function getLocalPublicKey(chain: ChainId = "stellar"): Promise<string | null> {
  const rec = await idbGet(chain);
  return rec?.publicKey ?? null;
}

export async function hasLocalWallet(chain: ChainId = "stellar"): Promise<boolean> {
  return (await idbGet(chain)) !== null;
}

/** Decrypt the stored secret for a chain and return the PLAINTEXT secret string
 *  (Stellar "S…" / Solana Base58-64). The caller must use it immediately and
 *  drop the reference (it is NOT cached here). */
export async function unlockLocalSecret(
  passphrase: string,
  chain: ChainId = "stellar",
): Promise<string> {
  const rec = await idbGet(chain);
  if (!rec) throw new Error("No wallet is stored on this device.");
  const key = await deriveKey(passphrase, b64decode(rec.salt));
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64decode(rec.iv) },
      key,
      b64decode(rec.ciphertext),
    );
  } catch {
    throw new Error("Wrong passphrase.");
  }
  const secret = new TextDecoder().decode(plain).trim();
  const { publicKey } = normalizeSecret(secret, chain);
  if (publicKey !== rec.publicKey) throw new Error("Stored key is inconsistent.");
  return secret;
}

/** Decrypt the stored STELLAR secret and return a live Keypair (the Stellar
 *  signing path — existing call sites are unchanged). */
export async function unlockLocalWallet(passphrase: string): Promise<Keypair> {
  return Keypair.fromSecret(await unlockLocalSecret(passphrase, "stellar"));
}

/** Remove the device-stored key for a chain (on logout / removal / new device). */
export async function clearLocalWallet(chain: ChainId = "stellar"): Promise<void> {
  await idbDelete(chain);
}
