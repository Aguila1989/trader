import { Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { recommendedFee } from "./amounts";
import { signAndSubmit } from "./signer";

/** A claimable balance ("pending payment") addressed to the account. */
export interface ClaimableBalanceInfo {
  id: string;
  /** "XLM" | "CODE:ISSUER". */
  asset: string;
  amount: string;
  sponsor?: string;
  /** Feature 5: locally rejected (hidden by default, never auto-claimed). Set by
   *  the server from the persisted reject list; absent on the raw Horizon read. */
  rejected?: boolean;
  /** Feature 5: why it was rejected (only present on rejected entries). */
  rejectedReason?: string;
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

/** Claim a claimable balance by id. Requires a trustline for non-native assets
 *  (Horizon rejects the claim otherwise - the caller should pre-check). */
export async function claimBalance(balanceId: string): Promise<{ hash: string }> {
  if (!/^[0-9a-f]{72}$/i.test(balanceId.trim())) {
    throw new Error("Invalid claimable balance id.");
  }
  const account = await horizon.loadAccount(config.stellarPublic);
  const tx = new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(Operation.claimClaimableBalance({ balanceId: balanceId.trim() }))
    .setTimeout(120)
    .build();
  return signAndSubmit(tx);
}
