/**
 * Minimal Solana JSON-RPC client — plain `fetch`, no @solana/web3.js.
 *
 * P0 (wallet support) needs exactly two reads: the native lamport balance and
 * whether ANY SPL token account holds a non-zero amount (the remove-chain
 * "no funds" gate). Both are single JSON-RPC POSTs; pulling the full Solana SDK
 * for that would be pure weight. Trading-era needs (blockhash, tx submit) get
 * their own additions when the trading integration lands (see ./README.md).
 *
 * Network mapping mirrors the app's Stellar convention: config.network
 * "public" → mainnet-beta, anything else → devnet (the Solana testnet cluster
 * is semi-deprecated; devnet is the faucet-funded dev cluster). Overridable
 * with SOLANA_RPC_URL for a paid/private RPC endpoint.
 */
import { config } from "../../config";

/** The two SPL token programs whose accounts can hold user funds. */
const TOKEN_PROGRAMS = [
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // Token-2022
];

export const LAMPORTS_PER_SOL = 1_000_000_000;

export function solanaRpcUrl(): string {
  if (config.solanaRpcUrl) return config.solanaRpcUrl;
  return config.network === "public"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com";
}

interface RpcResponse<T> {
  result?: T;
  error?: { code: number; message: string };
}

let rpcId = 0;

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(solanaRpcUrl(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  if (!res.ok) throw new Error(`Solana RPC HTTP ${res.status}`);
  const body = (await res.json()) as RpcResponse<T>;
  if (body.error) throw new Error(`Solana RPC: ${body.error.message}`);
  if (body.result === undefined) throw new Error("Solana RPC: empty result");
  return body.result;
}

/** Native balance in lamports. A nonexistent account reads as 0 (Solana has no
 *  Stellar-style "unfunded 404" — accounts simply have zero balance). */
export async function getLamports(address: string): Promise<number> {
  const r = await rpc<{ value: number }>("getBalance", [address]);
  return r.value ?? 0;
}

interface ParsedTokenAccount {
  account?: {
    data?: {
      parsed?: { info?: { tokenAmount?: { amount?: string } } };
    };
  };
}

/** True when any SPL token account (classic or Token-2022) owned by `address`
 *  holds a non-zero amount. Drives the remove-chain "no funds" gate. */
export async function hasTokenBalances(address: string): Promise<boolean> {
  for (const program of TOKEN_PROGRAMS) {
    const r = await rpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [
      address,
      { programId: program },
      { encoding: "jsonParsed" },
    ]);
    for (const acc of r.value ?? []) {
      const amount = acc.account?.data?.parsed?.info?.tokenAmount?.amount;
      if (amount && amount !== "0") return true;
    }
  }
  return false;
}
