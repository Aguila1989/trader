import {
  BASE_FEE,
  Federation,
  Memo,
  Operation,
  TransactionBuilder,
  type Asset,
} from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { parseAsset, assetToString } from "./assets";
import { signAndSubmit } from "./signer";

/**
 * Payments and path-payment swaps from the hot wallet. All submits go out only
 * through the server's ensureCanSubmit gate + the orchestrator's serial lock.
 */

function feeStr(): string {
  return String(Math.max(Number(BASE_FEE), Math.floor(config.limits.maxFeeStroops)));
}

/** Clamp a value to a valid Stellar amount string (<= 7 decimals). */
function amt7(v: string | number): string {
  return Number(Number(v).toFixed(7)).toString();
}

/** Resolve a destination: a raw G... account id OR a federation address
 *  (name*domain, resolved via the domain's stellar.toml). */
export async function resolveDestination(dest: string): Promise<string> {
  const d = dest.trim();
  if (d.includes("*")) {
    const rec = await Federation.Server.resolve(d);
    if (!rec.account_id) {
      throw new Error(`Federation address ${d} did not resolve to an account.`);
    }
    return rec.account_id;
  }
  if (!/^G[A-Z2-7]{55}$/.test(d)) {
    throw new Error("Invalid destination: expected a G... address or name*domain.");
  }
  return d;
}

export interface SendPaymentInput {
  destination: string;
  asset: string;
  amount: string;
  memo?: string;
}

export async function sendPayment(input: SendPaymentInput): Promise<{ hash: string }> {
  if (!(Number(input.amount) > 0)) throw new Error("Amount must be a positive number.");
  const destination = await resolveDestination(input.destination);
  const asset = parseAsset(input.asset);
  const account = await horizon.loadAccount(config.stellarPublic);
  const builder = new TransactionBuilder(account, {
    fee: feeStr(),
    networkPassphrase: config.networkPassphrase,
  }).addOperation(Operation.payment({ destination, asset, amount: amt7(input.amount) }));
  if (input.memo?.trim()) builder.addMemo(Memo.text(input.memo.trim().slice(0, 28)));
  return signAndSubmit(builder.setTimeout(120).build());
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
    const page = await horizon.strictSendPaths(sendAsset, amt7(sendAmount), [destAsset]).call();
    const best = page.records[0];
    if (!best) return null;
    return {
      sendAsset: assetToString(sendAsset),
      sendAmount: amt7(sendAmount),
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
 * = quoted * (1 - slippage) so the fill is bounded against adverse movement.
 */
export async function swap(
  input: SwapInput,
): Promise<{ hash: string; destMin: string; quoted: string }> {
  const quote = await quoteSwap(input.sendAsset, input.sendAmount, input.destAsset);
  if (!quote) throw new Error("No swap path found for this pair/size.");
  const slip = Math.max(0, input.slippageBps ?? config.limits.maxSlippageBps) / 10_000;
  const destMin = amt7(Number(quote.destAmount) * (1 - slip));
  const sendAsset = parseAsset(input.sendAsset);
  const destAsset = parseAsset(input.destAsset);
  const path: Asset[] = quote.path.map((s) => parseAsset(s));
  const account = await horizon.loadAccount(config.stellarPublic);
  const tx = new TransactionBuilder(account, {
    fee: feeStr(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset,
        sendAmount: amt7(input.sendAmount),
        destination: config.stellarPublic,
        destAsset,
        destMin,
        path,
      }),
    )
    .setTimeout(120)
    .build();
  const { hash } = await signAndSubmit(tx);
  return { hash, destMin, quoted: quote.destAmount };
}
