/**
 * The ChainAdapter interface + chain-neutral value types (Phase 0).
 *
 * A ChainAdapter is the single seam through which the trading domain
 * (orchestrator, monitor, fees) talks to a chain. Stellar is the first (and
 * currently only) implementation — see src/chains/stellar/adapter.ts. The
 * interface deliberately mirrors the EXISTING Stellar function shapes so the
 * eventual reroute of orchestrator.ts/monitor.ts is a near-mechanical swap.
 *
 * Asset references travel as canonical strings (`AssetRef`) — the same
 * "XLM"｜"CODE:ISSUER" form the domain + DB already use — while `AssetId`
 * (assetId.ts) is the structured identity for when fields are needed. Keeping
 * the string as the wire/storage form is what makes the migration additive.
 *
 * NOT wired into the app yet. See src/chains/README.md.
 */
import type { MarketSnapshot, Balance } from "../stellar/market";
import type { PreflightResult } from "../stellar/preflight";
import type { BookLevel, TradeProposal } from "../types";
import type { AssetId, ChainId } from "./assetId";

export type { MarketSnapshot, Balance, PreflightResult, BookLevel, TradeProposal, AssetId, ChainId };

/** A canonical asset reference string. Today "XLM"｜"CODE:ISSUER" (Stellar);
 *  future "chain:symbol[:issuerOrContract]". Parse with assetId.parseAssetRef. */
export type AssetRef = string;

/** Result of probing an on-chain account for the wallet flows. */
export interface ChainAccountProbe {
  /** Whether the account exists / is funded on-ledger. (Stellar: loadAccount
   *  succeeds; Solana: has no existence concept — treated as lamports > 0.) */
  exists: boolean;
  /** Native-asset balance as a decimal string (XLM / SOL), null when unknown. */
  nativeBalance: string | null;
  /** True when ANY balance (native or token) is non-zero. This is the
   *  remove-chain gate: a chain wallet may only be removed when this is false. */
  hasAnyFunds: boolean;
}

/** What actually traded on a submitted order, reconciled from the chain. */
export interface Fill {
  /** Base units that actually filled (0 = the whole order is resting). */
  filledBase: number;
  /** Volume-weighted price achieved (quote units per 1 base unit). */
  avgPrice: number;
  /** Id of the order left RESTING on the book, when a remainder rests
   *  (Stellar offerId / a CLOB order id). Absent when fully filled. */
  restingOrderId?: string;
}

export interface OrderReceipt {
  /** The durable on-chain/venue handle for this submission (Stellar: tx hash). */
  orderId: string;
  /** Reconciled fill, or null when the outcome is UNKNOWN (e.g. submit timed
   *  out) — the caller then keeps its conservative assume-full-fill fallback. */
  fill: Fill | null;
}

export type OrderKind = "place" | "cancel" | "modify";

/**
 * An unsigned, chain-prepared order. `payload` is chain-private (only the
 * producing adapter interprets it — Stellar wraps the SDK Transaction there) so
 * the trading domain never sees chain SDK types.
 */
export interface PreparedOrder {
  chain: ChainId;
  kind: OrderKind;
  /** Client-side reference for logs/idempotency (e.g. the proposal id). */
  ref: string;
  readonly payload: unknown;
}

/** A PreparedOrder that has been signed, carrying the durable handle to persist
 *  BEFORE the network submit (crash-recovery invariant). */
export interface SignedOrder {
  order: PreparedOrder;
  /** Persist this before calling submit() (Stellar: the tx hash). */
  handle: string;
}

/** A resting order on the book (chain-neutral view of Stellar's OpenOffer). */
export interface OpenOrder {
  id: string;
  sellAsset: AssetRef;
  buyAsset: AssetRef;
  amount: string;
  price: string;
  lastModified?: string;
}

export interface ModifyInput {
  sellAsset: AssetRef;
  buyAsset: AssetRef;
  orderId: string;
  amount: string;
  price: string;
}

/** How a chain charges for trading — a per-tx network fee (Stellar) or a
 *  maker/taker rate (CLOB venues like Hyperliquid). */
export interface FeeEstimate {
  model: "per-tx" | "maker-taker";
  /** per-tx: the fee bid, in the chain's smallest unit (Stellar: stroops). */
  perTx?: string;
  /** Unit label for `perTx`. */
  unit?: string;
  /** maker-taker: fee rates in basis points. */
  makerBps?: number;
  takerBps?: number;
  /** Human-readable summary for logs/UI. */
  display: string;
}

/**
 * The seam between the trading domain and a chain. One implementation per chain;
 * resolved via src/chains/registry.ts. Method shapes mirror today's Stellar
 * functions so the reroute is mechanical.
 */
export interface ChainAdapter {
  readonly chain: ChainId;
  /** Human label for the UI ("Stellar", "Solana"). */
  readonly displayName: string;
  /** Native asset ticker ("XLM", "SOL"). */
  readonly nativeSymbol: string;

  // --- wallet management (per-chain wallet flows: add/remove/receive) ---
  /** Shape-validate a public key / address for this chain. No network I/O. */
  validatePublicKey(publicKey: string): boolean;
  /** Probe the ledger for funded-ness + the remove-chain "no funds" gate. */
  probeAccount(publicKey: string): Promise<ChainAccountProbe>;
  /** Block-explorer URL for an account (network-aware). */
  explorerAccountUrl(publicKey: string): string;

  // --- asset identity ---
  parseAsset(ref: AssetRef): AssetId;
  formatAsset(a: AssetId): AssetRef;
  isNative(ref: AssetRef): boolean;

  // --- account / signer resolution (per-user, ambient) ---
  requireTradingAccount(): Promise<string>;
  resolveTradingAccountOrNull(): Promise<string | null>;
  isCurrentWalletClientSigned(): Promise<boolean>;

  // --- reads ---
  getMarketSnapshot(base: AssetRef, quote: AssetRef, depth?: number): Promise<MarketSnapshot>;
  getBalances(account: string): Promise<Balance[]>;
  getOpenOrders(account: string): Promise<OpenOrder[]>;
  bookLevels(snap: MarketSnapshot): { bids: BookLevel[]; asks: BookLevel[] };

  // --- pre-trade safety check ---
  preflight(p: TradeProposal): Promise<PreflightResult>;

  // --- execution: prepare -> sign -> submit (preserves the persist-before-submit split) ---
  prepareOrder(p: TradeProposal): Promise<PreparedOrder>;
  prepareCancel(p: TradeProposal, orderId: string): Promise<PreparedOrder>;
  prepareModify(input: ModifyInput): Promise<PreparedOrder>;
  /** Signs in place; the returned `handle` must be persisted before submit(). */
  sign(order: PreparedOrder): Promise<SignedOrder>;
  /** Submits an already-signed order and returns a reconciled Fill. */
  submit(order: SignedOrder): Promise<OrderReceipt>;

  // --- fee model ---
  estimateFee(): FeeEstimate;
}
