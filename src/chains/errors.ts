/**
 * Typed errors for the chain abstraction layer.
 */
import type { ChainId } from "./assetId";

/**
 * Thrown by an adapter method that has no meaningful implementation on that
 * chain (e.g. trading on the Solana adapter before the Jupiter/CLOB integration
 * lands, or Stellar-only primitives like trustlines on any other chain).
 * Routes map it to a clean 400/501 instead of a generic 500.
 */
export class NotSupportedOnChainError extends Error {
  readonly chain: ChainId;
  readonly operation: string;

  constructor(chain: ChainId, operation: string, message?: string) {
    super(message ?? `${operation} is not supported on ${chain} (yet).`);
    this.name = "NotSupportedOnChainError";
    this.chain = chain;
    this.operation = operation;
  }
}
