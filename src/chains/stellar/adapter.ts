/**
 * The Stellar ChainAdapter — a THIN FACADE over the existing src/stellar/*
 * modules. It adds no new trading logic; every method delegates to code that
 * already ships and is tested. Its only original code is (1) shape-mapping
 * (OpenOffer -> OpenOrder, SubmitResult -> OrderReceipt) and (2) fill
 * reconciliation + resting-id recovery, both lifted from orchestrator.ts so the
 * reconciliation lives at the adapter boundary (see ./reconcile.ts).
 *
 * IMPORTANT: nothing imports this yet. Wiring the orchestrator/monitor/fees
 * through the adapter is a separate, green-lit phase (another bot is currently
 * editing those files). See src/chains/README.md.
 */
import { BASE_FEE, Keypair, type Transaction } from "@stellar/stellar-sdk";
import { config } from "../../config";
import { horizon } from "../../stellar/client";
import {
  buildOfferTransaction,
  buildCancelOfferTransaction,
  buildModifyOfferTransaction,
} from "../../stellar/builder";
import { signOnly, submitSigned } from "../../stellar/signer";
import {
  requireTradingAccount,
  resolveTradingAccountOrNull,
  isCurrentWalletClientSigned,
} from "../../stellar/keyProvider";
import { preflightCheck } from "../../stellar/preflight";
import {
  getMarketSnapshot,
  getBalances,
  getOpenOffers,
  bookLevelsBase,
} from "../../stellar/market";
import type { TradeProposal } from "../../types";
import { parseAssetRef, formatAsset } from "../assetId";
import { reconcileStellarFill } from "./reconcile";
import type {
  ChainAdapter,
  FeeEstimate,
  ModifyInput,
  OpenOrder,
  OrderReceipt,
  PreparedOrder,
  SignedOrder,
} from "../types";

/** Chain-private payload carried inside a PreparedOrder for Stellar. */
interface StellarPayload {
  tx: Transaction;
  /** Present only for a "place" order — needed to reconcile the fill. */
  proposal?: TradeProposal;
}

function payloadOf(order: PreparedOrder): StellarPayload {
  if (order.chain !== "stellar") {
    throw new Error(`stellarAdapter received a "${order.chain}" order.`);
  }
  return order.payload as StellarPayload;
}

/**
 * Best-effort recovery of a resting offer's id when the submit response lost it
 * to a timeout: match the account's open offers by the proposal's legs and
 * limit price. Exported for the position monitor's late-landing recovery path
 * (the effects-based fill it books carries no currentOffer id).
 */
export async function recoverRestingOrderId(p: TradeProposal): Promise<string | undefined> {
  const pub = await resolveTradingAccountOrNull();
  if (!pub) return undefined;
  try {
    const offers = await getOpenOffers(pub);
    const selling = p.side === "sell" ? p.baseAsset : p.quoteAsset;
    const buying = p.side === "sell" ? p.quoteAsset : p.baseAsset;
    const limit = Number(p.limitPrice) || 0;
    if (!(limit > 0)) return undefined;
    // Offer price is buying-per-selling: equals the limit for a sell (quote per
    // base) and its inverse for a buy (base per quote).
    const expected = p.side === "sell" ? limit : 1 / limit;
    for (const o of offers) {
      if (o.selling !== selling || o.buying !== buying) continue;
      const op = Number(o.price) || 0;
      if (op > 0 && Math.abs(op - expected) / expected < 0.001) return o.id;
    }
  } catch {
    // Horizon unavailable: stay untracked (the monitor still surfaces it).
  }
  return undefined;
}

/** Horizon balance line, read loosely at this external boundary. */
interface RawBalanceLine {
  asset_type: string;
  balance: string;
}

export const stellarAdapter: ChainAdapter = {
  chain: "stellar",
  displayName: "Stellar",
  nativeSymbol: "XLM",

  // --- wallet management ---
  validatePublicKey(publicKey) {
    const pk = publicKey.trim();
    if (!/^G[A-Z2-7]{55}$/.test(pk)) return false;
    try {
      Keypair.fromPublicKey(pk);
      return true;
    } catch {
      return false;
    }
  },
  async probeAccount(publicKey) {
    try {
      const account = await horizon.loadAccount(publicKey);
      const balances = account.balances as unknown as RawBalanceLine[];
      const native = balances.find((b) => b.asset_type === "native");
      // A funded Stellar account always locks >=1 XLM of base reserve, so any
      // existing account has funds — exactly the remove-chain gate semantics
      // (empty it by merging the account externally before removal).
      const hasAnyFunds = balances.some((b) => Number(b.balance) > 0);
      return {
        exists: true,
        nativeBalance: native?.balance ?? "0",
        hasAnyFunds,
      };
    } catch {
      // 404 = unfunded (not on the ledger): removable, no funds anywhere.
      return { exists: false, nativeBalance: null, hasAnyFunds: false };
    }
  },
  explorerAccountUrl(publicKey) {
    const net = config.network === "public" ? "public" : "testnet";
    return `https://stellar.expert/explorer/${net}/account/${publicKey}`;
  },

  // --- asset identity ---
  parseAsset(ref) {
    return parseAssetRef(ref);
  },
  formatAsset(a) {
    return formatAsset(a);
  },
  isNative(ref) {
    const a = parseAssetRef(ref);
    return a.chain === "stellar" && a.symbol === "XLM" && !a.issuer;
  },

  // --- account / signer resolution ---
  requireTradingAccount() {
    return requireTradingAccount();
  },
  resolveTradingAccountOrNull() {
    return resolveTradingAccountOrNull();
  },
  isCurrentWalletClientSigned() {
    return isCurrentWalletClientSigned();
  },

  // --- reads ---
  getMarketSnapshot(base, quote, depth = 10) {
    return getMarketSnapshot(base, quote, depth);
  },
  getBalances(account) {
    return getBalances(account);
  },
  async getOpenOrders(account) {
    const offers = await getOpenOffers(account);
    return offers.map(
      (o): OpenOrder => ({
        id: o.id,
        sellAsset: o.selling,
        buyAsset: o.buying,
        amount: o.amount,
        price: o.price,
        lastModified: o.lastModified,
      }),
    );
  },
  bookLevels(snap) {
    return bookLevelsBase(snap);
  },

  // --- pre-trade check ---
  preflight(p) {
    return preflightCheck(p);
  },

  // --- execution: prepare -> sign -> submit ---
  async prepareOrder(p) {
    const tx = await buildOfferTransaction(p);
    return {
      chain: "stellar",
      kind: "place",
      ref: p.id,
      payload: { tx, proposal: p } satisfies StellarPayload,
    };
  },
  async prepareCancel(p, orderId) {
    const tx = await buildCancelOfferTransaction(p, orderId);
    return {
      chain: "stellar",
      kind: "cancel",
      ref: p.id,
      payload: { tx } satisfies StellarPayload,
    };
  },
  async prepareModify(input: ModifyInput) {
    const tx = await buildModifyOfferTransaction(
      input.sellAsset,
      input.buyAsset,
      input.orderId,
      input.amount,
      input.price,
    );
    return {
      chain: "stellar",
      kind: "modify",
      ref: input.orderId,
      payload: { tx } satisfies StellarPayload,
    };
  },
  async sign(order) {
    // signOnly signs the tx IN PLACE and returns its hash; the (now-signed) tx
    // stays in order.payload for submit(). Persist `handle` before submitting.
    const { tx } = payloadOf(order);
    const handle = await signOnly(tx);
    return { order, handle };
  },
  async submit(signed: SignedOrder): Promise<OrderReceipt> {
    const { order, handle } = signed;
    const { tx, proposal } = payloadOf(order);
    const res = await submitSigned(tx, handle);

    // Only a "place" order books a fill; cancel/modify have none to reconcile.
    if (order.kind !== "place" || !proposal) {
      return { orderId: res.hash, fill: null };
    }

    const fill = reconcileStellarFill(proposal, res.offerResults);
    // Timeout/effects path: the resting offer id was lost but a remainder rests
    // on-chain — recover it so the monitor can track it and stale-cancel it.
    if (fill && !fill.restingOrderId) {
      const requested = Number(proposal.amount) || 0;
      if (requested - fill.filledBase > 1e-7) {
        const recovered = await recoverRestingOrderId(proposal);
        if (recovered) fill.restingOrderId = recovered;
      }
    }
    return { orderId: res.hash, fill };
  },

  // --- fee model ---
  estimateFee(): FeeEstimate {
    const base = Number(BASE_FEE);
    const perOp = String(Math.max(base, Math.floor(config.limits.maxFeeStroops)));
    return {
      model: "per-tx",
      perTx: perOp,
      unit: "stroops",
      display: `${perOp} stroops per operation (bid; surge-priced, floored at BASE_FEE)`,
    };
  },
};
