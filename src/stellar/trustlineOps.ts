import { Operation, StellarToml, TransactionBuilder } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "./client";
import { parseAsset, assetToString, canonicalAsset } from "./assets";
import { recommendedFee } from "./amounts";
import { signAndSubmit } from "./signer";
import { requireTradingAccount } from "./keyProvider";
import { assertDnsPublic } from "./safeHost";

/**
 * Programmatic trustline management for the dashboard (the `npm run trustlines`
 * CLI keeps its own batch path). All on-chain submits here go through the
 * server's gates (read-only / live-arm / kill switch) and the orchestrator's
 * serial lock so a trustline change can't race a trade onto the same sequence.
 */

export interface TrustlineInfo {
  /** Canonical "CODE:ISSUER". */
  asset: string;
  code: string;
  issuer: string;
  /** Held amount. */
  balance: string;
  /** Trust limit ("" when unbounded/unknown). */
  limit: string;
}

interface RawBalanceLine {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
}

/** Current non-native trustlines on the account, with balance + limit. */
export async function getTrustlines(accountId: string): Promise<TrustlineInfo[]> {
  const account = await horizon.loadAccount(accountId);
  return (account.balances as unknown as RawBalanceLine[])
    .filter((b) => b.asset_type !== "native" && b.asset_code && b.asset_issuer)
    .map((b) => ({
      asset: `${b.asset_code}:${b.asset_issuer}`,
      code: b.asset_code as string,
      issuer: b.asset_issuer as string,
      balance: b.balance,
      limit: b.limit ?? "",
    }));
}

/**
 * Resolve an asset's issuer from a home domain's stellar.toml CURRENCIES list,
 * so an operator can add a trustline by code + domain (e.g. "USDC" +
 * "centre.io") instead of pasting a 56-char issuer key. Throws when the domain
 * has no TOML or no matching code.
 */
export async function resolveIssuerByDomain(
  code: string,
  domain: string,
): Promise<string> {
  await assertDnsPublic(domain); // SEC-06: refuse IP-literals / internal / private-resolving hosts
  // SEC-06: https-only + a 20s timeout so a tarpitting host can't stall us.
  const toml = await StellarToml.Resolver.resolve(domain.trim(), {
    allowHttp: false,
    timeout: 20_000,
  });
  const currencies = (toml.CURRENCIES ?? []) as Array<{
    code?: string;
    issuer?: string;
  }>;
  const match = currencies.find(
    (c) => (c.code ?? "").toUpperCase() === code.trim().toUpperCase() && c.issuer,
  );
  if (!match?.issuer) {
    throw new Error(`No "${code}" asset published in ${domain}'s stellar.toml.`);
  }
  return match.issuer;
}

/**
 * Build, sign and submit a trustline change. `remove: true` sets a zero limit,
 * which CLOSES the trustline and frees the 0.5 XLM reserve - Horizon rejects it
 * when the balance is non-zero, so callers should pre-check.
 */
export async function changeTrustline(
  spec: string,
  opts: { remove?: boolean } = {},
): Promise<{ hash: string; asset: string }> {
  const canon = canonicalAsset(spec);
  const asset = parseAsset(canon);
  if (asset.isNative()) {
    throw new Error("XLM is the native asset and needs no trustline.");
  }
  const account = await horizon.loadAccount(await requireTradingAccount());
  const tx = new TransactionBuilder(account, {
    fee: recommendedFee(),
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      opts.remove
        ? Operation.changeTrust({ asset, limit: "0" })
        : Operation.changeTrust({ asset }),
    )
    .setTimeout(120)
    .build();
  const { hash } = await signAndSubmit(tx);
  return { hash, asset: assetToString(asset) };
}
