/**
 * The Solana ChainAdapter — WALLET-LEVEL support only (multi-chain P0).
 *
 * Implemented for real: address validation, account probing (native lamports +
 * SPL token balances via plain JSON-RPC — see ./rpc.ts), explorer links, and
 * per-user account resolution from dbo.Wallets. Solana wallets are
 * NON-CUSTODIAL ONLY: the key is generated in the browser and the server stores
 * just the base58 address (encryptedSecret = NULL), so there is deliberately no
 * server-side signing here.
 *
 * Everything trading-shaped (market data, orders, preflight, fees) throws
 * NotSupportedOnChainError until the trading integration lands — the plan for
 * that (Jupiter for taker flow, Phoenix/OpenBook for maker) is in ./README.md.
 */
import { config } from "../../config";
import { getActiveWallet } from "../../db/repo";
import { parseAssetRef, formatAsset, type AssetId } from "../assetId";
import { NotSupportedOnChainError } from "../errors";
import { isBase58OfLength } from "./base58";
import { getLamports, hasTokenBalances, LAMPORTS_PER_SOL } from "./rpc";
import type { ChainAdapter, ChainAccountProbe, FeeEstimate } from "../types";

/** A Solana address is the base58 of a 32-byte ed25519 public key. (On-curve
 *  verification is skipped on purpose — wallet addresses are user-supplied and
 *  the RPC probe is the real gate; PDAs would simply show as empty accounts.) */
function isSolanaAddress(s: string): boolean {
  // 32 bytes encode to 32–44 base58 chars; check the decode length exactly.
  return s.length >= 32 && s.length <= 44 && isBase58OfLength(s, 32);
}

function unsupported(operation: string): never {
  throw new NotSupportedOnChainError("solana", operation);
}

export const solanaAdapter: ChainAdapter = {
  chain: "solana",
  displayName: "Solana",
  nativeSymbol: "SOL",

  // --- wallet management ---
  validatePublicKey(publicKey) {
    return isSolanaAddress(publicKey.trim());
  },
  async probeAccount(publicKey): Promise<ChainAccountProbe> {
    const lamports = await getLamports(publicKey);
    // Only pay for the token sweep when it can change the verdict: with
    // lamports > 0 the account already has funds either way for `exists`,
    // but hasAnyFunds must still catch token-only accounts at 0 lamports.
    const tokens = await hasTokenBalances(publicKey);
    const sol = lamports / LAMPORTS_PER_SOL;
    return {
      exists: lamports > 0,
      nativeBalance: lamports > 0 ? sol.toFixed(9).replace(/0+$/, "").replace(/\.$/, "") : "0",
      hasAnyFunds: lamports > 0 || tokens,
    };
  },
  explorerAccountUrl(publicKey) {
    const cluster = config.network === "public" ? "" : "?cluster=devnet";
    return `https://explorer.solana.com/address/${publicKey}${cluster}`;
  },

  // --- asset identity ---
  parseAsset(ref): AssetId {
    const s = ref.trim();
    // Accept the bare native symbol and the chain-qualified form; a legacy
    // Stellar-shaped ref here is a routing bug upstream, so refuse it loudly.
    const a = s.toUpperCase() === "SOL" ? parseAssetRef("solana:SOL") : parseAssetRef(s);
    if (a.chain !== "solana") {
      throw new Error(`Asset "${ref}" is not a solana asset (parsed as ${a.chain}).`);
    }
    return a;
  },
  formatAsset(a) {
    return formatAsset(a);
  },
  isNative(ref) {
    const a = this.parseAsset(ref);
    return a.symbol === "SOL" && !a.contract;
  },

  // --- account / signer resolution ---
  async requireTradingAccount() {
    const acct = await this.resolveTradingAccountOrNull();
    if (!acct) throw new NotSupportedOnChainError("solana", "trading", "No Solana wallet is configured for this account.");
    return acct;
  },
  async resolveTradingAccountOrNull() {
    const wallet = await getActiveWallet("solana");
    return wallet?.publicKey ?? null;
  },
  async isCurrentWalletClientSigned() {
    // Solana wallets are non-custodial only: no server-side secret, ever.
    return true;
  },

  // --- trading surface: not yet (see ./README.md for the integration plan) ---
  getMarketSnapshot() {
    return unsupported("getMarketSnapshot");
  },
  async getBalances() {
    return unsupported("getBalances");
  },
  getOpenOrders() {
    return unsupported("getOpenOrders");
  },
  bookLevels() {
    return unsupported("bookLevels");
  },
  preflight() {
    return unsupported("preflight");
  },
  prepareOrder() {
    return unsupported("prepareOrder");
  },
  prepareCancel() {
    return unsupported("prepareCancel");
  },
  prepareModify() {
    return unsupported("prepareModify");
  },
  sign() {
    return unsupported("sign");
  },
  submit() {
    return unsupported("submit");
  },
  estimateFee(): FeeEstimate {
    return {
      model: "per-tx",
      perTx: "5000",
      unit: "lamports",
      display: "~5000 lamports base fee per signature (+ priority fee under congestion)",
    };
  },
};
