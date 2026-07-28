/**
 * ChainAdapter registry — resolves a chain id to its adapter.
 *
 * Stellar is the only registered chain. When the trading domain is rerouted
 * (green-lit phase), callers do `adapterFor(proposal.chain ?? "stellar")`
 * instead of importing src/stellar/* directly. Adding a chain later = register
 * one adapter here. NOT wired into the app yet — see src/chains/README.md.
 */
import { config } from "../config";
import type { ChainId } from "./assetId";
import type { ChainAdapter } from "./types";
import { stellarAdapter } from "./stellar/adapter";
import { solanaAdapter } from "./solana/adapter";

const adapters: Partial<Record<string, ChainAdapter>> = {
  stellar: stellarAdapter,
  solana: solanaAdapter,
};

/** The adapter for a chain (defaults to Stellar). Throws for an unknown chain. */
export function adapterFor(chain: ChainId = "stellar"): ChainAdapter {
  const a = adapters[chain];
  if (!a) throw new Error(`No ChainAdapter registered for chain "${chain}".`);
  return a;
}

/** Convenience: the default (Stellar) adapter. */
export function defaultAdapter(): ChainAdapter {
  return adapterFor("stellar");
}

/** True when a chain has a registered adapter. */
export function isChainSupported(chain: string): boolean {
  return adapters[chain] !== undefined;
}

/** The list of registered chain ids. */
export function registeredChains(): ChainId[] {
  return Object.keys(adapters);
}

/**
 * The chains the platform actually OFFERS to users: the intersection of the
 * operator's CHAINS config with the registered adapters. Wallet routes use
 * this — an adapter existing in code does not by itself surface a chain.
 */
export function enabledChains(): ChainAdapter[] {
  return config.chains
    .filter((c) => adapters[c] !== undefined)
    .map((c) => adapters[c] as ChainAdapter);
}

/** True when the operator has enabled `chain` (and an adapter exists for it). */
export function isChainEnabled(chain: string): boolean {
  return config.chains.includes(chain) && adapters[chain] !== undefined;
}
