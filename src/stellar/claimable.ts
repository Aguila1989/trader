import { BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { signAndSubmit } from "./signer";

/** A claimable balance ("pending payment") addressed to the account. */
export interface ClaimableBalanceInfo {
  id: string;
  /** "XLM" | "CODE:ISSUER". */
  asset: string;
  amount: string;
  sponsor?: string;
}

interface RawClaimable {
  id: string;
  asset: string; // "native" | "code:issuer"
  amount: string;
  sponsor?: string;
}

function normAsset(a: string): string {
  return a === "native" ? "XLM" : a;
}

/** List claimable balances the account can claim ("pending payments"). */
export async function listClaimableBalances(
  claimant: string,
): Promise<ClaimableBalanceInfo[]> {
  const page = await horizon.claimableBalances().claimant(claimant).limit(50).call();
  return (page.records as unknown as RawClaimable[]).map((r) => ({
    id: r.id,
    asset: normAsset(r.asset),
    amount: r.amount,
    ...(r.sponsor ? { sponsor: r.sponsor } : {}),
  }));
}

function feeStr(): string {
  return String(Math.max(Number(BASE_FEE), Math.floor(config.limits.maxFeeStroops)));
}

/** Claim a claimable balance by id. Requires a trustline for non-native assets
 *  (Horizon rejects the claim otherwise). */
export async function claimBalance(balanceId: string): Promise<{ hash: string }> {
  const account = await horizon.loadAccount(config.stellarPublic);
  const tx = new TransactionBuilder(account, {
    fee: feeStr(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(Operation.claimClaimableBalance({ balanceId }))
    .setTimeout(120)
    .build();
  return signAndSubmit(tx);
}
