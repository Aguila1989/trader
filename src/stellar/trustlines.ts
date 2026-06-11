/**
 * Establish trustlines for the curated scan universe.
 *
 *   npm run trustlines
 *
 * WHY: every chain-scan trade is XLM <-> token. The pre-sign preflight blocks any
 * trade whose RECEIVED asset has no trustline (and you can't hold/sell a token
 * you don't trust). A brand-new wallet trusts only XLM, so without this the bot
 * literally cannot settle any of these pairs.
 *
 * This adds a trustline (max limit) for every SCAN_ASSETS / curated token the
 * wallet doesn't already trust, in ONE signed transaction. Each new trustline
 * locks 0.5 XLM as base reserve (recoverable later via a zero-limit changeTrust).
 * Requires STELLAR_SECRET - it signs with your hot wallet. Idempotent: re-running
 * only adds what's missing.
 */
import { BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { config, isReadOnly } from "../config";
import { horizon } from "./client";
import { parseAsset, assetToString } from "./assets";
import { signAndSubmit } from "./signer";

interface BalanceLine {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

async function main(): Promise<void> {
  if (isReadOnly) {
    console.error(
      "Read-only mode: set STELLAR_SECRET in .env before establishing trustlines.",
    );
    process.exit(1);
  }
  if (!config.stellarPublic) {
    console.error("STELLAR_PUBLIC is not configured.");
    process.exit(1);
  }

  const specs = config.scanAssets; // curated universe (or SCAN_ASSETS), XLM removed
  if (specs.length === 0) {
    console.log("No scan assets configured - nothing to trust.");
    return;
  }

  console.log(
    `Network: ${config.network} | wallet: ${config.stellarPublic.slice(0, 6)}...${config.stellarPublic.slice(-4)}`,
  );

  const account = await horizon.loadAccount(config.stellarPublic);
  const existing = new Set(
    (account.balances as BalanceLine[])
      .filter((b) => b.asset_type !== "native" && b.asset_code && b.asset_issuer)
      .map((b) => `${b.asset_code}:${b.asset_issuer}`),
  );

  const toAdd = specs
    .map((s) => parseAsset(s))
    .filter((a) => !existing.has(assetToString(a)));

  if (toAdd.length === 0) {
    console.log(
      `All ${specs.length} curated token(s) are already trusted. Nothing to do.`,
    );
    return;
  }

  console.log(
    `Adding ${toAdd.length} trustline(s) (~${(toAdd.length * 0.5).toFixed(1)} XLM reserve locked):`,
  );
  for (const a of toAdd) console.log(`  + ${assetToString(a)}`);

  const fee = String(
    Math.max(Number(BASE_FEE), Math.floor(config.limits.maxFeeStroops)),
  );
  const builder = new TransactionBuilder(account, {
    fee,
    networkPassphrase: config.networkPassphrase,
  });
  for (const asset of toAdd) builder.addOperation(Operation.changeTrust({ asset }));
  const tx = builder.setTimeout(120).build();

  const { hash } = await signAndSubmit(tx);
  console.log(`\n✓ Submitted. tx ${hash}`);
  console.log(
    "Trustlines established - the wallet can now receive/hold these tokens, " +
      "so a sell of XLM into them will pass preflight.",
  );
}

main().catch((err) => {
  console.error(`Trustline setup failed: ${(err as Error).message}`);
  process.exit(1);
});
