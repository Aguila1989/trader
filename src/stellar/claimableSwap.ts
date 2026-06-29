// Features 3 & 4 — convert a pending payment (claimable balance) straight to XLM.
//
// A non-native pending payment can only be spent once it has been CLAIMED, which
// needs a trustline. Rather than make the user add a trustline (and whitelist
// the token) first, we do the whole thing atomically in ONE transaction:
//
//   [changeTrust(token)]            <- only if no trustline exists yet
//   claimClaimableBalance(id)       <- credits the token to the account
//   pathPaymentStrictSend(token->XLM, destMin)   <- disposes the full amount
//   [changeTrust(token, limit 0)]   <- only if we just opened it: reclaim reserve
//
// All-or-nothing: if the swap path is gone or destMin can't be met, the whole tx
// reverts and nothing is claimed - so we never end up holding an unwanted token.
// Disposing an asset TO XLM is safe regardless of whitelist (you reduce exposure
// and acquire the always-whitelisted base), so the SEC-01 gate on these routes
// checks the ACQUIRED side (XLM) only.

import { Operation, TransactionBuilder, type Asset } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { parseAsset, assetToString } from "./assets";
import { recommendedFee, formatAmount } from "./amounts";
import { signAndSubmit } from "./signer";
import { requireTradingAccount } from "./keyProvider";
import { quoteSwap } from "./transfers";
import { USDC_SPEC } from "./universe";

const BALANCE_ID = /^[0-9a-f]{72}$/i;

/** A pre-trade read-only assessment of swapping `amount` of `asset` to XLM. */
export interface SwapAssessment {
  /** Canonical asset spec ("XLM" | "CODE:ISSUER"). */
  asset: string;
  amount: string;
  /** XLM you would receive (strict-send quote), or null if no path. */
  estXlm: string | null;
  /** The token's direct USDC value (Z in the warning copy), or null. */
  tokenUsdc: string | null;
  /** USDC value of the XLM you'd receive, or null. */
  xlmUsdc: string | null;
  /** (tokenUsdc - xlmUsdc) / tokenUsdc * 100; null when not computable.
   *  Positive = you LOSE value vs. holding the token. */
  valueLossPct: number | null;
}

export interface ClaimableSwapResult {
  hash: string;
  asset: string;
  amount: string;
  /** Quoted XLM out (for the trade log). For a native claim this is the amount. */
  estXlm: string;
  destMin: string;
  trustlineAdded: boolean;
  /** false for a native (XLM) pending payment - it's a plain claim, no swap. */
  swapped: boolean;
}

function isNativeSpec(spec: string): boolean {
  if (spec === "XLM") return true;
  try {
    return parseAsset(spec).isNative();
  } catch {
    return false;
  }
}

/**
 * Read-only: quote the swap-to-XLM and value both legs in USDC so the UI can
 * show "you'd get Y XLM; the token is worth ~Z USDC" and decide whether the loss
 * crosses the configured threshold. Never signs anything.
 */
export async function assessSwapToXlm(
  asset: string,
  amount: string,
): Promise<SwapAssessment> {
  if (isNativeSpec(asset)) {
    return { asset: "XLM", amount, estXlm: amount, tokenUsdc: null, xlmUsdc: null, valueLossPct: 0 };
  }
  const canon = assetToString(parseAsset(asset));
  const toXlm = await quoteSwap(canon, amount, "XLM");
  const estXlm = toXlm?.destAmount ?? null;

  const isUsdc = canon.toUpperCase() === USDC_SPEC.toUpperCase();
  let tokenUsdc: string | null = null;
  if (isUsdc) tokenUsdc = formatAmount(amount);
  else tokenUsdc = (await quoteSwap(canon, amount, USDC_SPEC))?.destAmount ?? null;

  let xlmUsdc: string | null = null;
  if (estXlm != null) xlmUsdc = (await quoteSwap("XLM", estXlm, USDC_SPEC))?.destAmount ?? null;

  let valueLossPct: number | null = null;
  if (tokenUsdc != null && xlmUsdc != null && Number(tokenUsdc) > 0) {
    valueLossPct = Number(
      (((Number(tokenUsdc) - Number(xlmUsdc)) / Number(tokenUsdc)) * 100).toFixed(2),
    );
  }
  return { asset: canon, amount, estXlm, tokenUsdc, xlmUsdc, valueLossPct };
}

/**
 * Claim a pending payment and (for non-native assets) immediately swap the full
 * claimed amount to XLM, atomically. The caller is responsible for the value-loss
 * gate + the SEC-01 acquired-side check before calling.
 */
export async function swapClaimableToXlm(input: {
  id: string;
  asset: string;
  amount: string;
  slippageBps?: number;
}): Promise<ClaimableSwapResult> {
  const id = input.id.trim();
  if (!BALANCE_ID.test(id)) throw new Error("Invalid claimable balance id.");

  // Per-user (Feature 3): claim into / swap to the CURRENT signer's own wallet.
  const self = await requireTradingAccount();

  // Native pending payment: nothing to swap, just claim it.
  if (isNativeSpec(input.asset)) {
    const account = await horizon.loadAccount(self);
    const tx = new TransactionBuilder(account, {
      fee: recommendedFee(),
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(Operation.claimClaimableBalance({ balanceId: id }))
      .setTimeout(120)
      .build();
    const { hash } = await signAndSubmit(tx);
    return {
      hash,
      asset: "XLM",
      amount: input.amount,
      estXlm: input.amount,
      destMin: input.amount,
      trustlineAdded: false,
      swapped: false,
    };
  }

  const token = parseAsset(input.asset);
  const canonToken = assetToString(token);
  const xlm = parseAsset("XLM");

  const quote = await quoteSwap(canonToken, input.amount, "XLM");
  if (!quote) throw new Error("No swap path to XLM for this asset/size.");

  // SEC-07-style clamp: bound destMin away from zero.
  const reqBps = Math.max(0, input.slippageBps ?? config.limits.maxSwapSlippageBps);
  const slip = Math.min(reqBps, config.limits.maxSwapSlippageBps) / 10_000;
  const destMin = formatAmount(
    Math.floor(Number(quote.destAmount) * (1 - slip) * 1e7) / 1e7,
  );
  if (!(Number(destMin) > 0)) {
    throw new Error("Computed destMin is zero - refusing a swap that would accept any fill.");
  }

  const account = await horizon.loadAccount(self);
  const lines = account.balances as unknown as Array<{
    asset_type: string;
    asset_code?: string;
    asset_issuer?: string;
  }>;
  const hasTrust = lines.some(
    (b) => b.asset_type !== "native" && `${b.asset_code}:${b.asset_issuer}` === canonToken,
  );
  const path: Asset[] = quote.path.map((s) => parseAsset(s));

  const builder = new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  });
  if (!hasTrust) builder.addOperation(Operation.changeTrust({ asset: token }));
  builder.addOperation(Operation.claimClaimableBalance({ balanceId: id }));
  builder.addOperation(
    Operation.pathPaymentStrictSend({
      sendAsset: token,
      sendAmount: formatAmount(input.amount),
      destination: self,
      destAsset: xlm,
      destMin,
      path,
    }),
  );
  // We opened the trustline only to pass the token through: the strict-send sent
  // the full claimed amount, so the balance is back to 0 and closing the line
  // (limit 0) succeeds and reclaims the 0.5 XLM reserve - atomically.
  if (!hasTrust) builder.addOperation(Operation.changeTrust({ asset: token, limit: "0" }));

  const { hash } = await signAndSubmit(builder.setTimeout(120).build());
  return {
    hash,
    asset: canonToken,
    amount: input.amount,
    estXlm: quote.destAmount,
    destMin,
    trustlineAdded: !hasTrust,
    swapped: true,
  };
}
