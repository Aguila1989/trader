import {
  Federation,
  Memo,
  Operation,
  TransactionBuilder,
  type Asset,
} from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { parseAsset, assetToString } from "./assets";
import { recommendedFee, formatAmount } from "./amounts";
import { signAndSubmit } from "./signer";
import { requireTradingAccount } from "./keyProvider";
import { assertDnsPublic } from "./safeHost";
import { planSwapFee } from "../fees/collector";

/**
 * Payments and path-payment swaps from the hot wallet. All submits go out only
 * through the server's ensureCanSubmit gate + the orchestrator's serial lock.
 */

const G_ADDR = /^G[A-Z2-7]{55}$/; // ed25519 public key
const M_ADDR = /^M[A-Z2-7]{68}$/; // muxed account

/** A text memo truncated to MEMO_TEXT's 28-BYTE limit (not 28 UTF-16 chars, so
 *  a multibyte string can't overflow and throw at build time). Trims whole
 *  characters off the end until it fits, so the result is always valid UTF-8. */
function textMemo(s: string): Memo {
  let str = s.trim();
  while (Buffer.byteLength(str, "utf8") > 28) str = str.slice(0, -1);
  return Memo.text(str);
}

/** The memo a federation record DEMANDS (e.g. an exchange deposit tag), or the
 *  operator's text memo when the record carries none. A federation memo is
 *  authoritative: dropping it sends funds to a pooled account uncredited. */
function memoFor(
  rec: { memo_type?: string; memo?: string },
  operatorMemo?: string,
): Memo | undefined {
  if (rec.memo != null && rec.memo !== "") {
    switch (rec.memo_type) {
      case "id":
        return Memo.id(String(rec.memo));
      case "hash":
        return Memo.hash(Buffer.from(rec.memo, "base64"));
      default:
        return Memo.text(String(rec.memo));
    }
  }
  return operatorMemo?.trim() ? textMemo(operatorMemo) : undefined;
}

export interface ResolvedDestination {
  accountId: string;
  memo?: Memo;
}

/** Resolve a destination: a raw G.../M... account id, or a federation address
 *  (name*domain). For a federation address the returned memo (if any) is the
 *  one the recipient requires. */
export async function resolveDestination(
  dest: string,
  operatorMemo?: string,
): Promise<ResolvedDestination> {
  const d = dest.trim();
  if (d.includes("*")) {
    // SEC-06: a federation address is name*domain; refuse a non-public domain
    // (incl. one that resolves to a private IP) before the SDK fetches its
    // stellar.toml / federation server.
    await assertDnsPublic(d.slice(d.indexOf("*") + 1));
    // SEC-06: bound the federation/toml fetch so a tarpitting host can't stall us.
    const rec = await Federation.Server.resolve(d, { timeout: 20_000 });
    if (!rec.account_id) {
      throw new Error(`Federation address ${d} did not resolve to an account.`);
    }
    const memo = memoFor(rec, operatorMemo);
    return { accountId: rec.account_id, ...(memo ? { memo } : {}) };
  }
  if (!G_ADDR.test(d) && !M_ADDR.test(d)) {
    throw new Error("Invalid destination: expected a G.../M... address or name*domain.");
  }
  return {
    accountId: d,
    ...(operatorMemo?.trim() ? { memo: textMemo(operatorMemo) } : {}),
  };
}

type TxOperation = Parameters<TransactionBuilder["addOperation"]>[0];

/** Build, sign and submit one ATOMIC transaction from 1..N operations (all
 *  succeed or none do - Feature 2 bundles a fee Payment with a swap here). */
async function buildSignSubmit(ops: TxOperation | TxOperation[], memo?: Memo): Promise<{ hash: string }> {
  const account = await horizon.loadAccount(await requireTradingAccount());
  const builder = new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  });
  for (const op of Array.isArray(ops) ? ops : [ops]) builder.addOperation(op);
  if (memo) builder.addMemo(memo);
  const { hash } = await signAndSubmit(builder.setTimeout(120).build());
  return { hash };
}

/** Build (but DON'T sign) an ATOMIC tx from 1..N operations, returning its XDR
 *  for the client to sign (non-custodial path). Twin of buildSignSubmit — the
 *  builders never touched the key, so this is the exact same build, minus the
 *  signAndSubmit. */
async function buildUnsigned(ops: TxOperation | TxOperation[], memo?: Memo): Promise<{ xdr: string }> {
  const account = await horizon.loadAccount(await requireTradingAccount());
  const builder = new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  });
  for (const op of Array.isArray(ops) ? ops : [ops]) builder.addOperation(op);
  if (memo) builder.addMemo(memo);
  return { xdr: builder.setTimeout(120).build().toXDR() };
}

export interface SendPaymentInput {
  destination: string;
  asset: string;
  amount: string;
  memo?: string;
}

export async function sendPayment(input: SendPaymentInput): Promise<{ hash: string }> {
  if (!(Number(input.amount) > 0)) throw new Error("Amount must be a positive number.");
  const { accountId, memo } = await resolveDestination(input.destination, input.memo);
  const asset = parseAsset(input.asset);
  return buildSignSubmit(
    Operation.payment({ destination: accountId, asset, amount: formatAmount(input.amount) }),
    memo,
  );
}

/** Non-custodial: build an unsigned same-asset payment for the client to sign. */
export async function buildPaymentUnsigned(input: SendPaymentInput): Promise<{ xdr: string }> {
  if (!(Number(input.amount) > 0)) throw new Error("Amount must be a positive number.");
  const { accountId, memo } = await resolveDestination(input.destination, input.memo);
  const asset = parseAsset(input.asset);
  return buildUnsigned(
    Operation.payment({ destination: accountId, asset, amount: formatAmount(input.amount) }),
    memo,
  );
}

export interface SwapQuote {
  sendAsset: string;
  sendAmount: string;
  destAsset: string;
  destAmount: string;
  path: string[];
}

function pathSpecOf(p: {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}): string {
  return p.asset_type === "native" ? "XLM" : `${p.asset_code}:${p.asset_issuer}`;
}

/** Quote a strict-send swap: best destAsset amount received for sendAmount. */
export async function quoteSwap(
  sendSpec: string,
  sendAmount: string,
  destSpec: string,
): Promise<SwapQuote | null> {
  if (!(Number(sendAmount) > 0)) return null;
  const sendAsset = parseAsset(sendSpec);
  const destAsset = parseAsset(destSpec);
  try {
    const page = await horizon
      .strictSendPaths(sendAsset, formatAmount(sendAmount), [destAsset])
      .call();
    const best = page.records[0];
    if (!best) return null;
    return {
      sendAsset: assetToString(sendAsset),
      sendAmount: formatAmount(sendAmount),
      destAsset: assetToString(destAsset),
      destAmount: best.destination_amount,
      path: (best.path ?? []).map(pathSpecOf),
    };
  } catch {
    return null;
  }
}

export interface SwapInput {
  sendAsset: string;
  sendAmount: string;
  destAsset: string;
  slippageBps?: number;
}

/**
 * Execute a strict-send swap (path payment to self). A fresh quote sets destMin
 * = floor(quoted * (1 - slippage)) so the fill is bounded against adverse
 * movement; rounding DOWN keeps the floor never looser than intended.
 */
export async function swap(
  input: SwapInput,
): Promise<{ hash: string; destMin: string; quoted: string }> {
  const quote = await quoteSwap(input.sendAsset, input.sendAmount, input.destAsset);
  if (!quote) throw new Error("No swap path found for this pair/size.");
  // SEC-07: clamp the client slippage to [0, maxSwapSlippageBps]. An unbounded
  // value (e.g. 10000 bps) would drive destMin to 0 - an accept-any-fill swap.
  const reqBps = Math.max(0, input.slippageBps ?? config.limits.maxSlippageBps);
  const slip = Math.min(reqBps, config.limits.maxSwapSlippageBps) / 10_000;
  // Floor to 7dp so destMin is never rounded UP into a looser bound.
  const destMin = formatAmount(Math.floor(Number(quote.destAmount) * (1 - slip) * 1e7) / 1e7);
  if (!(Number(destMin) > 0)) {
    throw new Error("Computed destMin is zero - refusing a swap that would accept any fill.");
  }
  const sendAsset = parseAsset(input.sendAsset);
  const destAsset = parseAsset(input.destAsset);
  const path: Asset[] = quote.path.map((s) => parseAsset(s));

  // Feature 2: bundle the platform fee as a second Payment in the SAME
  // transaction - the swap and its fee are atomic (both land or neither).
  // Volume is the swap's XLM-equivalent; when neither leg is XLM, an extra
  // send->XLM quote values it. planSwapFee returns null when fees are off.
  const volumeXlm =
    quote.sendAsset === "XLM"
      ? Number(quote.sendAmount)
      : quote.destAsset === "XLM"
        ? Number(quote.destAmount)
        : Number((await quoteSwap(input.sendAsset, input.sendAmount, "XLM"))?.destAmount ?? 0);
  const feePlan = await planSwapFee(volumeXlm, "MANUAL");

  const swapOp = Operation.pathPaymentStrictSend({
    sendAsset,
    sendAmount: formatAmount(input.sendAmount),
    // Swap to self: the destination is the current signer's own account.
    destination: await requireTradingAccount(),
    destAsset,
    destMin,
    path,
  });
  const { hash } = await buildSignSubmit(feePlan ? [swapOp, feePlan.op] : swapOp);
  // The tx (swap + fee) succeeded - write the collected fee to the tax ledger.
  if (feePlan) await feePlan.record(hash);
  return { hash, destMin, quoted: quote.destAmount };
}
