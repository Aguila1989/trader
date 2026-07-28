/**
 * Wallet creation / import / replacement logic (Feature 3).
 *
 * The orchestration layer between the HTTP routes (src/wallet/routes.ts) and the
 * primitives (crypto/secretBox, db/repo, stellar/*). It is the ONLY place that
 * turns a user-entered/generated "S..." secret into the stored ciphertext, and
 * the only place the plaintext secret is returned to the caller (exactly once,
 * at creation, for the user to write down). After that the secret never leaves
 * the server again.
 *
 * Every operation is implicitly scoped to currentUserId() via the repo layer.
 */
import { randomUUID } from "node:crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "../stellar/client";
import { encryptSecret, decryptSecret } from "../crypto/secretBox";
import {
  getActiveWallet,
  getLatestPendingWallet,
  insertWallet,
  listActiveWallets,
  setWalletStatus,
} from "../db/repo";
import { adapterFor, enabledChains, isChainEnabled, isChainSupported } from "../chains/registry";
import type { ChainAccountProbe } from "../chains/types";
import { currentUserId } from "../users/context";
import {
  findUserById,
  findCredentialByEmail,
  registerFailedLogin,
  recordLoginAttempt,
  recordSuccessfulLogin,
} from "../auth/store";
import { verifyPassword } from "../users/password";
import { dbReady } from "../db/pool";
import { getOpenOffers } from "../stellar/market";
import { buildCancelOfferTransaction } from "../stellar/builder";
import { signAndSubmit } from "../stellar/signer";
import { runExclusive } from "../trading/orchestrator";
import { stopLossService } from "../trading/stopLossService";
import { store } from "../trading/store";
import type { TradeProposal } from "../types";
import { WalletError } from "./errors";

/** A Stellar ed25519 secret seed in strkey form. */
const SECRET_RE = /^S[A-Z2-7]{55}$/;

/**
 * AUDIT-012: wallet rows live ONLY in SQL Server (there is deliberately no
 * in-memory fallback for key material), but repo.insertWallet silently no-ops
 * without a DB — so create/import/replace would return success while storing
 * NOTHING, and the "saved" wallet would vanish on the next request. Fail
 * loudly instead.
 */
function ensureWalletStorage(): void {
  if (!dbReady()) {
    throw new WalletError(
      503,
      "Wallet storage is unavailable (no database connection). A configured SQL Server is required to store encrypted wallets.",
    );
  }
}

export interface WalletStatusView {
  configured: boolean;
  network: string;
  publicKey?: string;
  /** Whether the account exists on-ledger (funded past the base reserve). */
  funded?: boolean;
  /** Native XLM balance as a string, or null when unfunded / unknown. */
  xlmBalance?: string | null;
  /** NON-CUSTODIAL: true when the active wallet holds no server-side secret
   *  (encryptedSecret is null), so signing must happen on the user's device. */
  clientSigned?: boolean;
  /** Whether the server offers the non-custodial flow (NONCUSTODIAL_MODE). The
   *  setup UI shows the client-signed option only when true. */
  nonCustodial?: boolean;
}

/** Probe Horizon for an account's funded state + native balance. */
async function probeAccount(publicKey: string): Promise<{ funded: boolean; xlmBalance: string | null }> {
  try {
    const acct = await horizon.loadAccount(publicKey);
    const native = (acct.balances as Array<{ asset_type: string; balance: string }>).find(
      (b) => b.asset_type === "native",
    );
    return { funded: true, xlmBalance: native?.balance ?? "0" };
  } catch (err) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404) return { funded: false, xlmBalance: null };
    throw err;
  }
}

/**
 * OPTION A step 1: generate a brand-new keypair, store it as `pending`
 * (encrypted), and return the secret ONCE for the user to write down. Refuses if
 * the user already has an active wallet (replacement goes through replaceWallet).
 */
export async function createWallet(): Promise<{ publicKey: string; secret: string }> {
  ensureWalletStorage();
  if (await getActiveWallet()) {
    throw new WalletError(409, "You already have an active wallet. Replace it via import instead.");
  }
  const kp = Keypair.random();
  // Supersede any earlier un-confirmed pending wallet so they don't accumulate.
  const stale = await getLatestPendingWallet();
  if (stale) await setWalletStatus(stale.id, "replaced");
  // Encode the strkeys BEFORE zeroing: kp.rawSecretKey() returns a reference to
  // the keypair's INTERNAL seed buffer, so the fill(0) below also blanks the
  // keypair itself. Calling kp.secret() after that encoded an all-zero seed —
  // the user was shown (and asked to save) a garbage "SAAAA..." key that could
  // never match confirmWallet's last-4 check, while the DB kept the real one.
  const publicKey = kp.publicKey();
  const secret = kp.secret();
  const seed = kp.rawSecretKey();
  let blob: string;
  try {
    blob = encryptSecret(seed, currentUserId(), config.walletEncryptionKey);
  } finally {
    seed.fill(0);
  }
  await insertWallet({
    id: randomUUID(),
    publicKey,
    encryptedSecret: blob,
    status: "pending",
  });
  // The secret leaves the server exactly here, once, over the user's authed TLS
  // session. It is never persisted in plaintext and never returned again.
  return { publicKey, secret };
}

/**
 * OPTION A step 2: confirm the user saved the secret by matching its LAST 4
 * characters, then activate the pending wallet. The check decrypts the pending
 * row server-side (the secret is never re-sent by the client).
 */
export async function confirmWallet(last4: string): Promise<{ publicKey: string }> {
  if (await getActiveWallet()) {
    throw new WalletError(409, "You already have an active wallet.");
  }
  const pending = await getLatestPendingWallet();
  if (!pending) {
    throw new WalletError(400, "No pending wallet to confirm. Create one first.");
  }
  const want = String(last4 ?? "").trim();
  if (want.length !== 4) {
    throw new WalletError(400, "Enter the last 4 characters of your secret key.");
  }
  if (!pending.encryptedSecret) {
    // Non-custodial wallets carry no server-side secret; nothing to confirm here.
    throw new WalletError(400, "This wallet is non-custodial; there is no server-side secret to confirm.");
  }
  // Decrypt the pending row to verify the last-4 the user typed (case-sensitive,
  // matching the displayed strkey). decryptSecret throws on any tamper/mismatch.
  const seed = decryptSecret(pending.encryptedSecret, currentUserId(), config.walletEncryptionKey);
  let secret: string;
  try {
    secret = Keypair.fromRawEd25519Seed(seed).secret();
  } finally {
    seed.fill(0);
  }
  if (secret.slice(-4) !== want) {
    throw new WalletError(400, "Those 4 characters don't match. Check your saved secret key.");
  }
  await setWalletStatus(pending.id, "active");
  return { publicKey: pending.publicKey };
}

/** Validate + parse a user-supplied "S..." secret into a Keypair (or 400). */
function keypairFromSecret(secret: unknown): Keypair {
  const s = String(secret ?? "").trim();
  if (!SECRET_RE.test(s)) {
    throw new WalletError(400, "That doesn't look like a Stellar secret key (it must start with S).");
  }
  try {
    return Keypair.fromSecret(s);
  } catch {
    throw new WalletError(400, "Invalid Stellar secret key.");
  }
}

/**
 * OPTION B: import an existing secret as the (first) active wallet. Validates the
 * format, derives the public key, probes Horizon for the funded state, and stores
 * the encrypted secret. Refuses if an active wallet already exists.
 */
export async function importWallet(
  secret: unknown,
): Promise<{ publicKey: string; funded: boolean; xlmBalance: string | null }> {
  ensureWalletStorage();
  if (await getActiveWallet()) {
    throw new WalletError(409, "You already have an active wallet. Replace it instead.");
  }
  const kp = keypairFromSecret(secret);
  const probe = await probeAccount(kp.publicKey());
  const seed = kp.rawSecretKey();
  let blob: string;
  try {
    blob = encryptSecret(seed, currentUserId(), config.walletEncryptionKey);
  } finally {
    seed.fill(0);
  }
  await insertWallet({
    id: randomUUID(),
    publicKey: kp.publicKey(),
    encryptedSecret: blob,
    status: "active",
  });
  return { publicKey: kp.publicKey(), ...probe };
}

/**
 * NON-CUSTODIAL: register a client-generated wallet by its PUBLIC KEY only. The
 * server never receives or stores a secret (encryptedSecret is null); signing
 * happens on the user's device via /api/pay/build + /api/submit. Refuses if an
 * active wallet already exists ON THAT CHAIN (replace it instead). Gated by
 * NONCUSTODIAL_MODE at the route.
 *
 * Multi-chain (2026-07): `chain` selects the ledger ("stellar" default). The
 * chain must be operator-enabled (CHAINS) and the address is validated by that
 * chain's adapter. Non-Stellar wallets are ALWAYS non-custodial — this is their
 * only registration path.
 */
export async function registerWallet(
  publicKey: unknown,
  chain: unknown = "stellar",
): Promise<{
  publicKey: string;
  chain: string;
  funded: boolean;
  nativeBalance: string | null;
  /** Back-compat alias of nativeBalance for the pre-multichain Stellar UI. */
  xlmBalance: string | null;
}> {
  ensureWalletStorage();
  const chainId = String(chain ?? "stellar").trim().toLowerCase() || "stellar";
  if (!isChainEnabled(chainId)) {
    throw new WalletError(400, `Chain "${chainId}" is not available on this platform.`);
  }
  const adapter = adapterFor(chainId);
  const pk = String(publicKey ?? "").trim();
  if (!adapter.validatePublicKey(pk)) {
    throw new WalletError(
      400,
      chainId === "stellar"
        ? "That doesn't look like a Stellar public key (it must start with G)."
        : `That doesn't look like a valid ${adapter.displayName} address.`,
    );
  }
  if (await getActiveWallet(chainId)) {
    throw new WalletError(
      409,
      `You already have an active ${adapter.displayName} wallet. Remove or replace it first.`,
    );
  }
  const probe = await adapter.probeAccount(pk).catch(() => ({
    exists: false,
    nativeBalance: null,
    hasAnyFunds: false,
  }));
  await insertWallet({
    id: randomUUID(),
    chain: chainId,
    publicKey: pk,
    encryptedSecret: null, // non-custodial: no secret is held server-side
    status: "active",
  });
  return {
    publicKey: pk,
    chain: chainId,
    funded: probe.exists,
    nativeBalance: probe.nativeBalance,
    xlmBalance: chainId === "stellar" ? probe.nativeBalance : null,
  };
}

/** One row of the per-chain wallet overview (GET /api/wallet/chains). */
export interface ChainWalletView {
  chain: string;
  displayName: string;
  nativeSymbol: string;
  /** Whether the operator currently offers this chain (CHAINS). A wallet on a
   *  since-disabled chain still shows up so the user can remove it. */
  enabled: boolean;
  configured: boolean;
  publicKey?: string;
  /** True = no server-side secret; signing happens on the device. */
  clientSigned?: boolean;
  funded?: boolean;
  nativeBalance?: string | null;
  /** The remove gate, evaluated live: any non-zero balance blocks removal. */
  hasAnyFunds?: boolean;
  canRemove?: boolean;
  /** Human reason when canRemove is false (funds present / probe failed). */
  removeBlockReason?: string;
  explorerUrl?: string;
}

/**
 * Per-chain wallet overview: one entry for every operator-enabled chain, plus
 * any chain the user still holds an active wallet on (even if since disabled,
 * so it can always be removed). Never returns secret material.
 */
export async function getWalletsOverview(): Promise<ChainWalletView[]> {
  const wallets = await listActiveWallets();
  const byChain = new Map(wallets.map((w) => [w.chain, w]));
  const chainIds = new Set<string>([
    ...enabledChains().map((a) => a.chain),
    ...wallets.map((w) => w.chain).filter((c) => isChainSupported(c)),
  ]);

  const out: ChainWalletView[] = [];
  for (const chainId of chainIds) {
    const adapter = adapterFor(chainId);
    const wallet = byChain.get(chainId);
    const view: ChainWalletView = {
      chain: chainId,
      displayName: adapter.displayName,
      nativeSymbol: adapter.nativeSymbol,
      enabled: isChainEnabled(chainId),
      configured: !!wallet,
    };
    if (wallet) {
      view.publicKey = wallet.publicKey;
      view.clientSigned = !wallet.encryptedSecret;
      view.explorerUrl = adapter.explorerAccountUrl(wallet.publicKey);
      try {
        const probe = await adapter.probeAccount(wallet.publicKey);
        view.funded = probe.exists;
        view.nativeBalance = probe.nativeBalance;
        view.hasAnyFunds = probe.hasAnyFunds;
        view.canRemove = !probe.hasAnyFunds;
        if (probe.hasAnyFunds) {
          view.removeBlockReason = `This wallet still holds funds. Empty it (send everything out) before removing the ${adapter.displayName} chain.`;
        }
      } catch {
        // Fail CLOSED on removal when the balance can't be verified.
        view.canRemove = false;
        view.removeBlockReason = "Balance check unavailable right now — try again in a moment.";
      }
    }
    out.push(view);
  }
  // Stable order: enabled config order first, then leftovers alphabetically.
  const order = new Map(config.chains.map((c, i) => [c, i]));
  out.sort((a, b) => (order.get(a.chain) ?? 99) - (order.get(b.chain) ?? 99) || a.chain.localeCompare(b.chain));
  return out;
}

/**
 * Remove the user's wallet on `chain` — allowed ONLY when the on-ledger account
 * holds no funds at all (native or tokens), verified live and failing CLOSED
 * when the balance can't be checked. The row is status-transitioned to
 * "removed" (never deleted), matching the wallet layer's no-delete rule.
 * Removal stays possible for a chain the operator has since disabled.
 */
export async function removeChainWallet(
  chain: unknown,
): Promise<{ chain: string; removed: true }> {
  ensureWalletStorage();
  const chainId = String(chain ?? "").trim().toLowerCase();
  if (!isChainSupported(chainId)) {
    throw new WalletError(400, `Unknown chain "${chainId}".`);
  }
  const adapter = adapterFor(chainId);
  const wallet = await getActiveWallet(chainId);
  if (!wallet) {
    throw new WalletError(404, `You have no active ${adapter.displayName} wallet to remove.`);
  }
  let probe: ChainAccountProbe;
  try {
    probe = await adapter.probeAccount(wallet.publicKey);
  } catch {
    throw new WalletError(
      502,
      `Could not verify the ${adapter.displayName} wallet is empty (network unavailable). Removal refused — try again in a moment.`,
    );
  }
  if (probe.hasAnyFunds) {
    throw new WalletError(
      409,
      `This ${adapter.displayName} wallet still holds funds. Empty it first (send everything out), then remove the chain.`,
    );
  }
  await setWalletStatus(wallet.id, "removed");
  store.log("trade", `${adapter.displayName} wallet removed (${wallet.publicKey.slice(0, 8)}…, empty).`);
  return { chain: chainId, removed: true };
}

/** Wallet status for the header chip + setup gate. Never returns a secret. */
export async function getWalletStatus(): Promise<WalletStatusView> {
  const wallet = await getActiveWallet();
  if (!wallet) return { configured: false, network: config.network, nonCustodial: config.nonCustodial };
  const probe = await probeAccount(wallet.publicKey).catch(() => ({
    funded: false,
    xlmBalance: null,
  }));
  return {
    configured: true,
    network: config.network,
    publicKey: wallet.publicKey,
    funded: probe.funded,
    xlmBalance: probe.xlmBalance,
    clientSigned: !wallet.encryptedSecret,
    nonCustodial: config.nonCustodial,
  };
}

/**
 * Verify the current user's password (for the replace re-auth gate).
 *
 * AUDIT-009: shares the LOGIN lockout + attempt audit trail. Without this,
 * /api/wallet/replace (outside /api/auth/*, so not covered by authRateLimiter)
 * was an unmetered password oracle: unlimited guesses, no lockout, no logging.
 * Now a locked account is rejected outright, every wrong guess increments the
 * same failure counter the login flow uses (locking at the same threshold),
 * and each attempt lands in dbo.LoginAttempts with a wallet-replace reason.
 */
async function verifyCurrentPassword(password: unknown): Promise<void> {
  const pw = String(password ?? "");
  if (!pw) throw new WalletError(400, "Your password is required to replace your wallet.");
  const user = await findUserById(currentUserId());
  if (!user) throw new WalletError(401, "Not authenticated.");
  const cred = await findCredentialByEmail(user.email);
  if (!cred) throw new WalletError(401, "Incorrect password.");
  if (cred.lockedUntil != null && cred.lockedUntil > Date.now()) {
    await recordLoginAttempt({
      email: user.email,
      userId: user.id,
      ip: null,
      success: false,
      reason: "wallet-replace-while-locked",
    });
    throw new WalletError(
      403,
      `Account temporarily locked due to repeated failed password attempts. Try again in about ${config.auth.lockoutMinutes} minutes.`,
    );
  }
  if (!(await verifyPassword(pw, cred.passwordHash))) {
    const r = await registerFailedLogin(
      user.id,
      config.auth.maxFailedLogins,
      config.auth.lockoutMinutes * 60_000,
    );
    await recordLoginAttempt({
      email: user.email,
      userId: user.id,
      ip: null,
      success: false,
      reason: r.locked ? "wallet-replace-bad-password-locked" : "wallet-replace-bad-password",
    });
    throw new WalletError(401, "Incorrect password.");
  }
  // Correct password: clear the shared failure counter (same as a login).
  await recordSuccessfulLogin(user.id);
}

/**
 * Replace the active wallet with a newly-imported one. Requires password re-auth.
 * BEFORE switching keys, cancels everything tied to the OLD wallet - on-chain
 * resting offers (signed with the old, still-active key) and the user's active
 * stop-losses - so the new wallet never inherits orders it can't manage.
 */
export async function replaceWallet(
  secret: unknown,
  password: unknown,
): Promise<{ publicKey: string; cancelledOffers: number; cancelledStops: number }> {
  ensureWalletStorage();
  await verifyCurrentPassword(password);
  const old = await getActiveWallet();
  if (!old) {
    throw new WalletError(409, "No active wallet to replace. Use create or import instead.");
  }
  const kp = keypairFromSecret(secret);
  if (kp.publicKey() === old.publicKey) {
    throw new WalletError(400, "That is already your active wallet.");
  }

  // 1) Cancel the OLD wallet's resting offers on-chain, with the OLD key (still
  //    active here), serialized on the shared execution queue. Done first so the
  //    new wallet never inherits offers it has no key to cancel.
  let cancelledOffers = 0;
  const offers = await getOpenOffers(old.publicKey).catch(() => []);
  for (const offer of offers) {
    const synthetic = {
      side: "sell",
      baseAsset: offer.selling,
      quoteAsset: offer.buying,
      limitPrice: offer.price,
    } as unknown as TradeProposal;
    await runExclusive(async () => {
      const tx = await buildCancelOfferTransaction(synthetic, offer.id);
      await signAndSubmit(tx);
    });
    cancelledOffers += 1;
  }

  // 2) Cancel the user's active stop-losses (in-memory + persisted, consistently).
  let cancelledStops = 0;
  for (const s of stopLossService.getActiveStopLosses()) {
    try {
      stopLossService.cancelStopLoss(s.id, "manual", "wallet replaced");
      cancelledStops += 1;
    } catch {
      /* best-effort: a stop that already transitioned is fine to skip */
    }
  }

  // 3) Switch wallets. The OLD row must leave 'active' BEFORE the new one enters
  //    it (the single-active filtered unique index enforces this).
  const seed = kp.rawSecretKey();
  let blob: string;
  try {
    blob = encryptSecret(seed, currentUserId(), config.walletEncryptionKey);
  } finally {
    seed.fill(0);
  }
  await setWalletStatus(old.id, "replaced");
  await insertWallet({
    id: randomUUID(),
    publicKey: kp.publicKey(),
    encryptedSecret: blob,
    status: "active",
  });
  store.log("trade", `Wallet replaced (${cancelledOffers} offers + ${cancelledStops} stops cancelled).`);
  return { publicKey: kp.publicKey(), cancelledOffers, cancelledStops };
}

/**
 * Testnet-only: fund the active wallet via Friendbot. Refuses on mainnet (there
 * is no faucet there - the user funds with real XLM). Returns the new balance.
 */
export async function fundViaFriendbot(): Promise<{ funded: boolean; xlmBalance: string | null }> {
  if (config.network === "public") {
    throw new WalletError(400, "Friendbot funds testnet accounts only. On mainnet, send real XLM.");
  }
  const wallet = await getActiveWallet();
  if (!wallet) throw new WalletError(400, "Set up a wallet before funding it.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const resp = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(wallet.publicKey)}`,
      { signal: controller.signal },
    );
    if (!resp.ok && resp.status !== 400) {
      // 400 from Friendbot usually means "already funded" - fall through to probe.
      throw new WalletError(502, "Friendbot funding failed. Try again in a moment.");
    }
  } catch (err) {
    if (err instanceof WalletError) throw err;
    throw new WalletError(502, "Could not reach Friendbot. Try again in a moment.");
  } finally {
    clearTimeout(timer);
  }
  return probeAccount(wallet.publicKey);
}
