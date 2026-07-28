/**
 * Chain-qualified asset identity + a BACKWARD-COMPATIBLE string shim.
 *
 * Part of the ChainAdapter refactor (Phase 0). Today every asset is a bare
 * string: "XLM" | "CODE:ISSUER" (Stellar). This module introduces a structured
 * {chain, symbol, issuer/contract, decimals} identity WITHOUT breaking that:
 *
 *   parseAssetRef() accepts BOTH the legacy Stellar form AND a new
 *   chain-qualified form "chain:symbol[:issuerOrContract]". A legacy string
 *   parses to chain "stellar", so existing DB rows and every current call site
 *   keep working unchanged.
 *
 *   formatAsset() emits the LEGACY form for Stellar ("XLM" / "CODE:ISSUER") so a
 *   round-trip is byte-identical with what the app + DB already store. It only
 *   emits the new "chain:..." form for non-Stellar chains (none registered yet).
 *
 * NOTHING imports this yet — it is inert until the orchestrator/monitor reroute
 * (a later, green-lit phase). See src/chains/README.md.
 */

/** Registered/known chains. Open-ended so callers can pass any string, but the
 *  disambiguation below only treats these as new-form prefixes. */
export type ChainId = "stellar" | "hyperliquid" | (string & {});

export interface AssetId {
  chain: ChainId;
  /** Ticker/code, e.g. "XLM", "USDC". */
  symbol: string;
  /** Stellar issuer (G-address). Mutually exclusive with `contract` in practice. */
  issuer?: string;
  /** EVM/Solana contract or mint address; a Hyperliquid spot asset index. */
  contract?: string;
  /** Fixed-point precision. Stellar = 7 (stroops); varies per chain/token. */
  decimals: number;
}

export const STELLAR_DECIMALS = 7;

/** Only these first-segments are read as a chain prefix in the new form. Any
 *  other head (e.g. "USDC") is treated as a legacy Stellar "CODE:ISSUER". */
const KNOWN_CHAINS = new Set<ChainId>(["stellar", "solana", "hyperliquid"]);

/** Best-effort default precision for a chain when a per-token value is unknown.
 *  Non-Stellar values are PLACEHOLDERS — real per-asset decimals come from that
 *  chain's metadata (per-mint on Solana, spotMeta on Hyperliquid) once the
 *  trading adapters land. */
export function defaultDecimals(chain: ChainId): number {
  switch (chain) {
    case "stellar":
      return STELLAR_DECIMALS;
    case "solana":
      return 9; // SOL; SPL tokens carry per-mint decimals
    case "hyperliquid":
      return 8;
    default:
      return 18;
  }
}

function parseLegacyStellar(s: string): AssetId {
  if (s.toUpperCase() === "XLM" || s.toLowerCase() === "native") {
    return { chain: "stellar", symbol: "XLM", decimals: STELLAR_DECIMALS };
  }
  const [code, issuer] = s.split(":");
  if (!code || !issuer) {
    throw new Error(`Invalid asset "${s}". Use "XLM" or "CODE:ISSUER".`);
  }
  return { chain: "stellar", symbol: code, issuer, decimals: STELLAR_DECIMALS };
}

/**
 * Parse an asset reference into a structured AssetId.
 *  - Legacy Stellar: "XLM" | "native" | "CODE:ISSUER"  -> chain "stellar"
 *  - New qualified:  "stellar:USDC:GA5Z…" | "hyperliquid:PURR" | "stellar:XLM"
 */
export function parseAssetRef(ref: string): AssetId {
  const s = ref.trim();
  if (!s) throw new Error("Empty asset ref");

  const parts = s.split(":");
  const head = parts[0] ?? "";
  if (parts.length >= 2 && KNOWN_CHAINS.has(head as ChainId)) {
    const chain = head as ChainId;
    const symbol = parts[1] ?? "";
    const id = parts.slice(2).join(":") || undefined; // issuer/contract may itself be plain
    if (!symbol) throw new Error(`Invalid asset ref "${ref}".`);
    if (chain === "stellar") {
      return id
        ? { chain, symbol, issuer: id, decimals: STELLAR_DECIMALS }
        : { chain, symbol, decimals: STELLAR_DECIMALS };
    }
    return { chain, symbol, contract: id, decimals: defaultDecimals(chain) };
  }

  // No recognised chain prefix -> legacy Stellar form.
  return parseLegacyStellar(s);
}

/**
 * Canonical string form. Stellar emits the LEGACY shape so it stays identical to
 * existing storage; other chains emit the new "chain:symbol[:contract]" form.
 */
export function formatAsset(a: AssetId): string {
  if (a.chain === "stellar") {
    return a.issuer ? `${a.symbol}:${a.issuer}` : a.symbol; // "CODE:ISSUER" | "XLM"
  }
  const id = a.contract ?? a.issuer;
  return id ? `${a.chain}:${a.symbol}:${id}` : `${a.chain}:${a.symbol}`;
}

/** The chain an asset ref belongs to, without a full parse-and-throw. */
export function chainOf(ref: string): ChainId {
  const head = ref.trim().split(":")[0] ?? "";
  return KNOWN_CHAINS.has(head as ChainId) ? (head as ChainId) : "stellar";
}

/** True when two refs denote the same asset (chain + symbol + issuer/contract). */
export function sameAsset(a: string, b: string): boolean {
  try {
    const x = parseAssetRef(a);
    const y = parseAssetRef(b);
    return (
      x.chain === y.chain &&
      x.symbol === y.symbol &&
      (x.issuer ?? x.contract) === (y.issuer ?? y.contract)
    );
  } catch {
    return false;
  }
}
