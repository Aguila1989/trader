/**
 * Cross-chain BRIDGE seam (design-only for now — no live implementation).
 *
 * "Trade a token on chain A for a token on chain B" is NOT a single atomic
 * operation anywhere: it decomposes into DEX leg A → bridge the pivot asset
 * (USDC) → DEX leg B, with the user signing each leg (non-custodial). This
 * module pins down the interface + state machine so the first real provider
 * (Circle CCTP V2 — live on both Stellar and Solana) implements a stable shape.
 * See ./README.md for the verified provider landscape and the full design.
 *
 * INVARIANT the interface encodes: every intermediate state leaves funds
 * resting as REAL USDC on a REAL chain (never wrapped, never in a pool), so a
 * failed flow is "stranded-safe" — resumable or keepable, never lost.
 */
import type { ChainId } from "../assetId";

/** Lifecycle of one cross-chain transfer of the pivot asset (USDC). */
export type BridgeTransferState =
  /** Quote accepted, nothing signed yet. */
  | "pending"
  /** Burn tx signed + submitted on the source chain, awaiting finality. */
  | "burned"
  /** Attestation retrieved from the bridge's attestation service. */
  | "attested"
  /** Mint tx signed + submitted on the destination chain. */
  | "minted"
  /** Terminal: pivot asset delivered on the destination chain. */
  | "done"
  /** Terminal-but-safe: flow stopped mid-way; funds rest as real USDC on one
   *  of the two chains. Offer the user resume-or-keep, never write off. */
  | "stranded";

export interface BridgeQuote {
  provider: string;
  fromChain: ChainId;
  toChain: ChainId;
  /** Amount of the pivot asset (USDC) to move, decimal string. */
  amount: string;
  /** Provider fee in basis points (0 for CCTP standard transfers). */
  feeBps: number;
  /** Expected end-to-end latency in seconds (attestation-bound). */
  estimatedSeconds: number;
}

export interface BridgeTransfer {
  id: string;
  state: BridgeTransferState;
  quote: BridgeQuote;
  /** Source-chain burn tx handle, once signed/submitted. */
  burnTxId?: string;
  /** The attestation blob the destination mint consumes. */
  attestation?: string;
  /** Destination-chain mint tx handle, once submitted. */
  mintTxId?: string;
  /** Where the funds physically rest right now (chain id) — the resume anchor. */
  fundsRestOn: ChainId;
  createdAt: string;
  updatedAt: string;
}

/**
 * One bridge integration (CCTP first). All build* methods return UNSIGNED
 * chain-native payloads — signing always happens on the user's device via the
 * owning chain's client-sign flow, mirroring /api/pay/build + /api/submit.
 */
export interface BridgeProvider {
  readonly name: string;
  /** Chain pairs this provider can move the pivot asset between. */
  supports(from: ChainId, to: ChainId): boolean;
  quote(from: ChainId, to: ChainId, amount: string): Promise<BridgeQuote>;
  /** Build the source-chain burn/deposit tx (unsigned, client signs). */
  buildBurn(t: BridgeTransfer): Promise<{ unsignedTx: string }>;
  /** Poll the provider's attestation service for the burn's attestation. */
  fetchAttestation(t: BridgeTransfer): Promise<string | null>;
  /** Build the destination-chain mint/claim tx (unsigned, client signs). */
  buildMint(t: BridgeTransfer): Promise<{ unsignedTx: string }>;
}
