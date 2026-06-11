import { config } from "../config";
import { horizon } from "./client";
import { canonicalAsset } from "./assets";
import type { TradeProposal } from "../types";

/**
 * Pre-sign safety check. Before we build/sign/submit a real transaction, verify
 * the account can actually settle it:
 *  - it has a trustline for the asset the trade would RECEIVE, and
 *  - it holds enough SPENDABLE balance of the asset it would give up, net of
 *    the XLM base reserve and any funds already locked in resting offers.
 *
 * This turns a guaranteed on-chain failure (op_underfunded / op_*_no_trust,
 * which still burns a fee) into a clean, free, pre-flight block.
 */
export interface PreflightResult {
  ok: boolean;
  reason?: string;
}

// Horizon balance lines / account read loosely at this external boundary.
interface RawBalanceLine {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  selling_liabilities?: string;
}

interface LoadedAccountLike {
  subentry_count?: number;
  balances: RawBalanceLine[];
}

// XLM base reserve is 0.5 per ledger entry; keep a little headroom for the fee.
const BASE_RESERVE_XLM = 0.5;
const FEE_BUFFER_XLM = 0.05;

function round7(n: number): number {
  return Number(n.toFixed(7));
}

function lineKey(b: RawBalanceLine): string {
  if (b.asset_type === "native") return "XLM";
  if (b.asset_code && b.asset_issuer) return `${b.asset_code}:${b.asset_issuer}`;
  return b.asset_type;
}

/** XLM that can actually be spent: balance - locked-in-offers - reserve - fee. */
function spendableXlm(acct: LoadedAccountLike): number {
  const native = acct.balances.find((b) => b.asset_type === "native");
  if (!native) return 0;
  const reserve = (2 + (acct.subentry_count ?? 0)) * BASE_RESERVE_XLM;
  const locked = Number(native.selling_liabilities ?? 0);
  return Number(native.balance) - locked - reserve - FEE_BUFFER_XLM;
}

/** Units of a non-native asset that can be spent (balance - locked-in-offers).
 *  Returns NaN when there is no trustline/holding for that asset. */
function spendableAsset(acct: LoadedAccountLike, key: string): number {
  const line = acct.balances.find(
    (b) => b.asset_type !== "native" && lineKey(b) === key,
  );
  if (!line) return NaN;
  return Number(line.balance) - Number(line.selling_liabilities ?? 0);
}

function hasTrustline(acct: LoadedAccountLike, key: string): boolean {
  if (key === "XLM") return true;
  return acct.balances.some(
    (b) => b.asset_type !== "native" && lineKey(b) === key,
  );
}

export async function preflightCheck(
  p: TradeProposal,
): Promise<PreflightResult> {
  if (!config.stellarPublic) {
    return { ok: false, reason: "STELLAR_PUBLIC is not configured." };
  }

  let acct: LoadedAccountLike;
  try {
    acct = (await horizon.loadAccount(
      config.stellarPublic,
    )) as unknown as LoadedAccountLike;
  } catch (err) {
    return {
      ok: false,
      reason: `account not loadable (unfunded or wrong network?): ${(err as Error).message}`,
    };
  }

  try {
    const base = canonicalAsset(p.baseAsset);
    const quote = canonicalAsset(p.quoteAsset);
    const amount = Number(p.amount);
    const price = Number(p.limitPrice);
    if (!(amount > 0) || !(price > 0)) {
      return { ok: false, reason: "amount and limitPrice must be positive." };
    }

    // The asset the account will RECEIVE must have a trustline first.
    const received = p.side === "sell" ? quote : base;
    if (!hasTrustline(acct, received)) {
      return {
        ok: false,
        reason: `no trustline for ${received} (the asset this trade would receive) - establish it before trading this pair.`,
      };
    }

    // Funds for the asset the account will GIVE UP.
    if (p.side === "sell") {
      // Selling `amount` of base.
      const avail = base === "XLM" ? spendableXlm(acct) : spendableAsset(acct, base);
      if (!Number.isFinite(avail)) {
        return { ok: false, reason: `no ${base} balance to sell.` };
      }
      if (avail < amount) {
        return {
          ok: false,
          reason: `insufficient ${base}: need ${amount}, have ~${round7(avail)} spendable${base === "XLM" ? " after reserve" : " after open offers"}.`,
        };
      }
    } else {
      // Buying `amount` of base costs `amount * price` of quote.
      const cost = amount * price;
      const avail = quote === "XLM" ? spendableXlm(acct) : spendableAsset(acct, quote);
      if (!Number.isFinite(avail)) {
        return { ok: false, reason: `no ${quote} balance to spend.` };
      }
      if (avail < cost) {
        return {
          ok: false,
          reason: `insufficient ${quote}: need ~${round7(cost)}, have ~${round7(avail)} spendable${quote === "XLM" ? " after reserve" : " after open offers"}.`,
        };
      }
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, reason: `preflight error: ${(err as Error).message}` };
  }
}
