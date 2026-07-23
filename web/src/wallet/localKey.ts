/**
 * NON-CUSTODIAL client-side key storage (migration P0, path "B": app-managed key).
 *
 * The user's Stellar secret is generated ON THIS DEVICE, encrypted at rest with a
 * key derived from a user passphrase (PBKDF2-SHA256 → AES-256-GCM), and stored in
 * IndexedDB. It is NEVER sent to the server. It is decrypted transiently in memory
 * only to sign, then dropped.
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

const DB_NAME = "atrium-wallet";
const STORE = "keys";
const RECORD_KEY = "active";
// OWASP-recommended floor for PBKDF2-HMAC-SHA256 (2023). Raise if UX allows.
const PBKDF2_ITERATIONS = 310_000;

interface StoredKey {
  publicKey: string;
  salt: string; // base64
  iv: string; // base64
  ciphertext: string; // base64 — AES-256-GCM of the "S..." secret (utf8)
  createdAt: number;
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

async function idbGet(): Promise<StoredKey | null> {
  const db = await openDb();
  try {
    return await new Promise<StoredKey | null>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(RECORD_KEY);
      req.onsuccess = () => resolve((req.result as StoredKey | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function idbPut(rec: StoredKey): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(rec, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbDelete(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(RECORD_KEY);
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

/** Encrypt + persist a Stellar secret under a passphrase. Returns the public key. */
export async function saveLocalWallet(secret: string, passphrase: string): Promise<string> {
  if (!passphrase) throw new Error("A passphrase is required to protect your key.");
  const kp = Keypair.fromSecret(secret.trim()); // throws on an invalid secret
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(secret.trim()),
    ),
  );
  await idbPut({
    publicKey: kp.publicKey(),
    salt: b64encode(salt),
    iv: b64encode(iv),
    ciphertext: b64encode(ct),
    createdAt: Date.now(),
  });
  return kp.publicKey();
}

/** The stored public key (no decryption / no passphrase needed), or null. */
export async function getLocalPublicKey(): Promise<string | null> {
  const rec = await idbGet();
  return rec?.publicKey ?? null;
}

export async function hasLocalWallet(): Promise<boolean> {
  return (await idbGet()) !== null;
}

/** Decrypt the stored secret with the passphrase and return a live Keypair. The
 *  caller must use it immediately and drop the reference (it is NOT cached here). */
export async function unlockLocalWallet(passphrase: string): Promise<Keypair> {
  const rec = await idbGet();
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
  const kp = Keypair.fromSecret(secret);
  if (kp.publicKey() !== rec.publicKey) throw new Error("Stored key is inconsistent.");
  return kp;
}

/** Remove the device-stored key (e.g. on logout or after moving to a new device). */
export async function clearLocalWallet(): Promise<void> {
  await idbDelete();
}
