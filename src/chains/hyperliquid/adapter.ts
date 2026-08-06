/**
 * The Hyperliquid ChainAdapter — PHASE 2c (personal build).
 *
 * A THIN FACADE over the real sibling modules (./info for reads, ./exchange
 * for writes — see their headers for the wire-level detail), the same
 * relationship src/chains/stellar/adapter.ts has to src/stellar/*. This file's
 * only original logic is: asset-ref parsing/routing, the preflight gate, and
 * adapting the chain-neutral ChainAdapter shapes (PreparedOrder/SignedOrder/
 * OrderReceipt) onto Hyperliquid's very different execution model:
 *
 *  - Hyperliquid is a perps CLOB, not an account-model ledger: "accounts" are
 *    EVM 0x-addresses, there is no trustline concept, and markets are
 *    USDC-quoted only — `getMarketSnapshot`'s `quote` MUST resolve to "USDC"
 *    (bare or "hyperliquid:USDC") or the call throws.
 *  - There is no tx hash. The durable `handle` persisted before submit() is a
 *    CLIENT ORDER ID ("cloid") generated at `prepareOrder`/`prepareModify`
 *    time — it is known and returned by `sign()` WITHOUT any cryptographic
 *    work happening yet (see the note on `sign()` below for why).
 *  - The operator's secp256k1 key is CUSTODIAL: stored AES-256-GCM at rest in
 *    dbo.Wallets (chain='hyperliquid'), decrypted ONLY for the duration of the
 *    submit() call that needs it — the same decrypt-only-at-use, zero-after
 *    pattern as src/stellar/keyProvider.ts, reusing src/crypto/secretBox.ts's
 *    default "wallet-seed" purpose (it is still, structurally, "a wallet
 *    secret at rest for this user" — no new SecretPurpose needed).
 *
 * WHY sign() does no cryptographic work: Hyperliquid's real L1-action signing
 * is fused with the network POST inside ./exchange.ts's placeOrders/
 * cancelOrders/modifyOrders — each mints a FRESH nonce (Date.now()) right at
 * the HTTP call, because a stale nonce can fail Hyperliquid's replay-window
 * check, so a signature literally cannot be precomputed in a separate step
 * and reused later. The crash-recovery invariant sign() exists for only needs
 * a durable id to exist and be PERSISTED before any network call happens —
 * and that id (the cloid) is already known from prepareOrder()/
 * prepareModify(), well before submit() ever decrypts a key or touches the
 * network. So sign() just confirms/returns it; the actual decrypt + sign +
 * POST all happen together inside submit().
 *
 * See ./README.md for what is verified vs assumed and the testnet checklist.
 * NOT wired into the app yet: not in src/chains/registry.ts, and TradeProposal
 * has no `chain` field for the orchestrator to route on.
 */
import { config } from "../../config";
import { getActiveWallet } from "../../db/repo";
import { decryptSecret } from "../../crypto/secretBox";
import { currentUserId, DEFAULT_USER_ID } from "../../users/context";
import { parseAssetRef, formatAsset as formatAssetRef, type AssetId } from "../assetId";
import { NotSupportedOnChainError } from "../errors";
import { randomBytes } from "node:crypto";
import { summarizeCandles } from "../../stellar/market";
import {
  getMeta,
  getL2Book,
  getCandles,
  getUserState,
  getOpenOrders as hlGetOpenOrders,
  type HyperliquidAssetMeta,
  type HyperliquidUserState,
} from "./info";
import {
  placeOrders,
  cancelOrders,
  modifyOrders,
  signerAddress,
  type HyperliquidOrderRequest,
  type HyperliquidSubmitArgs,
} from "./exchange";
import type {
  Balance,
  BookLevel,
  ChainAdapter,
  ChainAccountProbe,
  FeeEstimate,
  MarketSnapshot,
  ModifyInput,
  OpenOrder,
  OrderReceipt,
  PreflightResult,
  PreparedOrder,
  SignedOrder,
} from "../types";

/**
 * Thrown when the current user has no usable Hyperliquid signing wallet (no
 * dbo.Wallets row and, for a non-default user, no env fallback). Mirrors
 * src/stellar/keyProvider.ts's WalletNotConfiguredError. Carries no secret.
 */
export class HyperliquidWalletNotConfiguredError extends Error {
  constructor(message = "No active Hyperliquid wallet is configured for this account.") {
    super(message);
    this.name = "HyperliquidWalletNotConfiguredError";
  }
}

/** Round to `dp` decimal places, dropping FP noise. */
function round(n: number, dp: number): number {
  return Number(n.toFixed(dp));
}

/** Hyperliquid's two REST hosts. Overridable with HYPERLIQUID_API_URL (e.g. to
 *  point at a local proxy) - see ./README.md's config keys. */
const HL_DEFAULT_URLS: Record<string, string> = {
  testnet: "https://api.hyperliquid-testnet.xyz",
  public: "https://api.hyperliquid.xyz",
};

function baseUrl(): string {
  return config.hyperliquidApiUrl || HL_DEFAULT_URLS[config.network] || HL_DEFAULT_URLS.testnet!;
}

function isMainnet(): boolean {
  return config.network === "public";
}

/** Chain-private payload carried inside a PreparedOrder for Hyperliquid. */
interface HyperliquidPayload {
  /** The durable client order id — generated at prepare time, persisted (as
   *  `handle`) by the caller BEFORE submit(). For "cancel" this is just the
   *  target oid (no new cloid needed to reference an existing order). */
  cloid: string;
  order?: HyperliquidOrderRequest; // "place"
  cancel?: { assetIndex: number; orderId: number }; // "cancel"
  modify?: { orderId: number; order: HyperliquidOrderRequest }; // "modify"
}

function payloadOf(order: PreparedOrder): HyperliquidPayload {
  if (order.chain !== "hyperliquid") {
    throw new Error(`hyperliquidAdapter received a "${order.chain}" order.`);
  }
  return order.payload as HyperliquidPayload;
}

/** A fresh 16-byte client order id, "0x"-prefixed (Hyperliquid's cloid format). */
function newCloid(): string {
  return `0x${randomBytes(16).toString("hex")}`;
}

/** Resolve a coin's meta entry (wire asset index + size decimals). Throws on
 *  an unknown market - callers turn that into a clean preflight/prepare error. */
async function findAsset(coin: string): Promise<HyperliquidAssetMeta> {
  const meta = await getMeta(baseUrl());
  const asset = meta.find((m) => m.name === coin);
  if (!asset) throw new Error(`Unknown Hyperliquid market "${coin}".`);
  return asset;
}

/**
 * Resolve the current user's Hyperliquid private key (hex, "0x"-prefixed),
 * decrypted ONLY for the call that needs it, zeroed immediately after (the
 * Buffer, at least — a derived JS string can't be zeroed; this is the same
 * limitation any string-typed secret has in JS). Falls back to the env
 * HYPERLIQUID_PRIVATE_KEY for the DEFAULT account only (mirrors
 * config.stellarSecret in src/stellar/keyProvider.ts). Throws
 * HyperliquidWalletNotConfiguredError when neither is available, and
 * NotSupportedOnChainError when the active wallet is client-signed (no
 * server-side secret) — non-custodial Hyperliquid signing isn't built yet.
 */
async function resolvePrivateKeyHex(): Promise<string> {
  const wallet = await getActiveWallet("hyperliquid");
  if (wallet) {
    if (!wallet.encryptedSecret) {
      throw new NotSupportedOnChainError(
        "hyperliquid",
        "sign",
        "This Hyperliquid wallet is client-signed only; server-side signing is not yet implemented.",
      );
    }
    const seed = decryptSecret(wallet.encryptedSecret, currentUserId(), config.walletEncryptionKey);
    try {
      return `0x${seed.toString("hex")}`;
    } finally {
      seed.fill(0);
    }
  }
  if (currentUserId() === DEFAULT_USER_ID && config.hyperliquidPrivateKey) {
    return config.hyperliquidPrivateKey;
  }
  throw new HyperliquidWalletNotConfiguredError();
}

/** Best-effort resolved trading address (wallet row, else env fallback for
 *  the DEFAULT account only — never for a logged-in user). */
async function resolveAddress(): Promise<string | null> {
  const wallet = await getActiveWallet("hyperliquid");
  if (wallet) return wallet.publicKey;
  if (currentUserId() !== DEFAULT_USER_ID || !config.hyperliquidPrivateKey) return null;
  try {
    return signerAddress(config.hyperliquidPrivateKey);
  } catch {
    return null;
  }
}

/** Build the args ./exchange.ts's placeOrders/cancelOrders/modifyOrders need,
 *  decrypting the signing key fresh for this one call. Trading on the
 *  signer's own account only (no vault/subaccount support yet). */
async function buildSubmitArgs(): Promise<HyperliquidSubmitArgs> {
  return { baseUrl: baseUrl(), isMainnet: isMainnet(), privateKey: await resolvePrivateKeyHex(), vaultAddress: null };
}

/** Minimum order notional (USD) Hyperliquid enforces. TODO(hl-verify): confirm
 *  the current figure (and whether it varies by market) before going live. */
const MIN_NOTIONAL_USD = 10;

export const hyperliquidAdapter: ChainAdapter = {
  chain: "hyperliquid",
  displayName: "Hyperliquid",
  nativeSymbol: "USDC",

  // --- wallet management ---
  validatePublicKey(publicKey) {
    return /^0x[0-9a-fA-F]{40}$/.test(publicKey.trim());
  },
  async probeAccount(publicKey): Promise<ChainAccountProbe> {
    // Deliberately does NOT swallow errors. `hasAnyFunds` is the remove-chain
    // gate: callers (wallet/service.ts getWalletsOverview / removeChainWallet)
    // fail CLOSED when a probe THROWS, but would read a caught error reported
    // as `hasAnyFunds: false` as a verified-empty account and allow removal —
    // a fail-OPEN on an unverified balance. Let the error propagate so the
    // caller's existing "balance check unavailable" path handles it.
    // (Review 2026-08-04, hl-order-submit P2.)
    const state = await getUserState(baseUrl(), publicKey);
    return {
      exists: true, // an address always "exists" on Hyperliquid; the API simply answers with zeros
      nativeBalance: Number.isFinite(state.accountValue) ? String(state.accountValue) : "0",
      hasAnyFunds: state.accountValue > 0 || state.positions.length > 0,
    };
  },
  explorerAccountUrl(publicKey) {
    // TODO(hl-verify): confirm the exact explorer path for both networks.
    const base = isMainnet() ? "https://app.hyperliquid.xyz" : "https://app.hyperliquid-testnet.xyz";
    return `${base}/explorer/address/${publicKey}`;
  },

  // --- asset identity ---
  parseAsset(ref): AssetId {
    const s = ref.trim();
    // Accept the bare native symbol and the chain-qualified form; a legacy
    // Stellar-shaped ref here is a routing bug upstream — refuse it loudly.
    const a = s.toUpperCase() === "USDC" ? parseAssetRef("hyperliquid:USDC") : parseAssetRef(s);
    if (a.chain !== "hyperliquid") {
      throw new Error(`Asset "${ref}" is not a hyperliquid asset (parsed as ${a.chain}).`);
    }
    return a;
  },
  formatAsset(a) {
    return formatAssetRef(a);
  },
  isNative(ref) {
    const a = this.parseAsset(ref);
    return a.symbol === "USDC" && !a.contract;
  },

  // --- account / signer resolution ---
  async requireTradingAccount() {
    const acct = await resolveAddress();
    if (!acct) throw new HyperliquidWalletNotConfiguredError();
    return acct;
  },
  resolveTradingAccountOrNull() {
    return resolveAddress();
  },
  async isCurrentWalletClientSigned() {
    const wallet = await getActiveWallet("hyperliquid");
    return !!wallet && !wallet.encryptedSecret;
  },

  // --- reads ---
  async getMarketSnapshot(base, quote, depth = 10): Promise<MarketSnapshot> {
    const baseAsset = this.parseAsset(base);
    const quoteAsset = this.parseAsset(quote);
    if (!(quoteAsset.symbol === "USDC" && !quoteAsset.contract)) {
      throw new Error(`Hyperliquid markets are USDC-quoted; got quote "${quote}".`);
    }
    const coin = baseAsset.symbol;
    const url = baseUrl();
    const now = Date.now();

    const [book, candles24h, candles7d] = await Promise.all([
      getL2Book(url, coin),
      getCandles(url, coin, "1h", now - 24 * 3_600_000, now).catch(() => []),
      getCandles(url, coin, "1d", now - 7 * 86_400_000, now).catch(() => []),
    ]);

    const stats = summarizeCandles(candles24h, 3_600_000);
    const stats7d = candles7d.length > 0 ? summarizeCandles(candles7d, 86_400_000) : null;

    const bids = book.bids.slice(0, depth).map((l) => ({ price: String(l.price), amount: String(l.amount) }));
    const asks = book.asks.slice(0, depth).map((l) => ({ price: String(l.price), amount: String(l.amount) }));
    const bestBid = book.bids[0]?.price ?? null;
    const bestAsk = book.asks[0]?.price ?? null;
    const spreadBps = bestBid != null && bestAsk != null && bestAsk > 0 ? ((bestAsk - bestBid) / bestAsk) * 10_000 : null;

    return {
      base,
      quote,
      bestBid,
      bestAsk,
      spreadBps,
      stats,
      stats7d,
      bids,
      asks,
      // TODO(hl-verify): ./info.ts has no trades feed yet; wire one in if/when
      // it exposes one (a recentTrades/fills-style read).
      recentTrades: [],
      flowBuyPct: null,
    };
  },
  async getBalances(account): Promise<Balance[]> {
    const state = await getUserState(baseUrl(), account);
    const out: Balance[] = [
      { asset: formatAssetRef({ chain: "hyperliquid", symbol: "USDC", decimals: 8 }), balance: String(state.withdrawable) },
    ];
    for (const pos of state.positions) {
      // Signed: + long, - short (mirrors PositionSummary.netQty's convention).
      out.push({ asset: formatAssetRef({ chain: "hyperliquid", symbol: pos.coin, decimals: 8 }), balance: String(pos.size) });
    }
    return out;
  },
  getOpenOrders(account): Promise<OpenOrder[]> {
    return hlGetOpenOrders(baseUrl(), account);
  },
  bookLevels(snap): { bids: BookLevel[]; asks: BookLevel[] } {
    // Hyperliquid's L2 book gives BOTH sides in base-asset size units already
    // (unlike Horizon's asymmetric bid/ask convention) - no conversion needed.
    const toLevel = (l: { price: string; amount: string }): BookLevel => ({ price: Number(l.price), amount: Number(l.amount) });
    return {
      bids: snap.bids.map(toLevel).filter((l) => l.price > 0 && l.amount > 0),
      asks: snap.asks.map(toLevel).filter((l) => l.price > 0 && l.amount > 0),
    };
  },

  // --- pre-trade safety check ---
  async preflight(p): Promise<PreflightResult> {
    const pub = await resolveAddress();
    if (!pub) {
      return {
        ok: false,
        code: "no_public",
        reason: "No usable Hyperliquid signing wallet for this account (set up a wallet first).",
      };
    }

    let state: HyperliquidUserState;
    try {
      state = await getUserState(baseUrl(), pub);
    } catch (err) {
      return { ok: false, code: "account", reason: `Hyperliquid account not loadable: ${(err as Error).message}` };
    }

    const amount = Number(p.amount);
    const price = Number(p.limitPrice);
    if (!(amount > 0) || !(price > 0)) {
      return { ok: false, code: "bad_input", reason: "amount and limitPrice must be positive." };
    }

    let coin: string;
    try {
      coin = this.parseAsset(p.baseAsset).symbol;
    } catch (err) {
      return { ok: false, code: "bad_input", reason: (err as Error).message };
    }

    let asset: HyperliquidAssetMeta;
    try {
      asset = await findAsset(coin);
    } catch (err) {
      return { ok: false, code: "bad_input", reason: (err as Error).message };
    }

    const roundedSize = round(amount, asset.szDecimals);
    if (!(roundedSize > 0)) {
      return {
        ok: false,
        code: "bad_input",
        reason: `size ${p.amount} rounds to zero at Hyperliquid's ${asset.szDecimals} size decimals for ${coin}.`,
      };
    }

    const notional = amount * price;
    if (notional < MIN_NOTIONAL_USD) {
      return {
        ok: false,
        code: "bad_input",
        reason: `order notional $${notional.toFixed(2)} is below Hyperliquid's $${MIN_NOTIONAL_USD} minimum.`,
      };
    }

    // Conservative check: require the full notional in withdrawable margin
    // (no leverage credit assumed) - see ./README.md for the leverage caveat.
    if (!(state.withdrawable >= notional)) {
      return {
        ok: false,
        code: "insufficient_balance",
        reason: `insufficient margin: need ~${notional.toFixed(2)} USDC, have ~${Math.max(0, state.withdrawable).toFixed(2)} withdrawable.`,
        assetGiven: "USDC",
        required: round(notional, 2),
        available: round(Math.max(0, state.withdrawable), 2),
      };
    }

    return { ok: true };
  },

  // --- execution: prepare -> sign -> submit ---
  async prepareOrder(p) {
    const coin = this.parseAsset(p.baseAsset).symbol;
    const asset = await findAsset(coin);
    const cloid = newCloid();
    const order: HyperliquidOrderRequest = {
      assetIndex: asset.index,
      isBuy: p.side === "buy",
      limitPx: p.limitPrice,
      size: String(round(Number(p.amount), asset.szDecimals)),
      reduceOnly: false,
      tif: p.postOnly ? "Alo" : "Gtc",
      cloid,
    };
    return {
      chain: "hyperliquid",
      kind: "place",
      ref: p.id,
      payload: { cloid, order } satisfies HyperliquidPayload,
    };
  },
  async prepareCancel(p, orderId) {
    const coin = this.parseAsset(p.baseAsset).symbol;
    const asset = await findAsset(coin);
    // TODO(hl-verify): assumes `orderId` is always the numeric exchange oid,
    // as returned by getOpenOrders / a resting fill - there is no cancel-by-
    // cloid path wired here.
    return {
      chain: "hyperliquid",
      kind: "cancel",
      ref: orderId,
      payload: { cloid: orderId, cancel: { assetIndex: asset.index, orderId: Number(orderId) } } satisfies HyperliquidPayload,
    };
  },
  async prepareModify(input: ModifyInput) {
    // Buying the base (isBuy=true) iff the leg given up is the USDC quote.
    const isBuy = this.isNative(input.sellAsset);
    const coin = this.parseAsset(isBuy ? input.buyAsset : input.sellAsset).symbol;
    const asset = await findAsset(coin);
    const cloid = newCloid();
    const order: HyperliquidOrderRequest = {
      assetIndex: asset.index,
      isBuy,
      limitPx: input.price,
      size: String(round(Number(input.amount), asset.szDecimals)),
      reduceOnly: false,
      tif: "Gtc",
      cloid,
    };
    return {
      chain: "hyperliquid",
      kind: "modify",
      ref: input.orderId,
      payload: { cloid, modify: { orderId: Number(input.orderId), order } } satisfies HyperliquidPayload,
    };
  },
  async sign(order) {
    // No cryptographic work happens here - see the file header for why (HL's
    // real signing is fused with the network POST and needs a fresh nonce at
    // that moment). The crash-recovery handle (the cloid) already exists from
    // prepareOrder()/prepareModify() - just confirm and return it.
    const payload = payloadOf(order);
    return { order, handle: payload.cloid };
  },
  async submit(signed: SignedOrder): Promise<OrderReceipt> {
    const { order, handle } = signed;
    const payload = payloadOf(order);
    const args = await buildSubmitArgs();

    if (order.kind === "place") {
      if (!payload.order) throw new Error("hyperliquidAdapter.submit: place order missing its payload.");
      const [receipt] = await placeOrders([payload.order], args);
      return receipt ?? { orderId: handle, fill: null };
    }
    if (order.kind === "cancel") {
      if (!payload.cancel) throw new Error("hyperliquidAdapter.submit: cancel missing its payload.");
      await cancelOrders([payload.cancel], args); // cancel/modify carry no fill to reconcile
      return { orderId: handle, fill: null };
    }
    if (!payload.modify) throw new Error("hyperliquidAdapter.submit: modify missing its payload.");
    await modifyOrders([payload.modify], args);
    return { orderId: handle, fill: null };
  },

  // --- fee model ---
  estimateFee(): FeeEstimate {
    // TODO(hl-verify): base-tier figures as of this build; Hyperliquid's fee
    // schedule is VIP-volume-tiered and changes over time - confirm live.
    const makerBps = 2;
    const takerBps = 5;
    return {
      model: "maker-taker",
      makerBps,
      takerBps,
      display: `${makerBps / 100}% maker / ${takerBps / 100}% taker (base tier; VIP volume tiers reduce both - TODO(hl-verify))`,
    };
  },
};
