/**
 * Platform fee accrual + collection (2026-07 Feature 2).
 *
 * Two charging paths, matching how trades actually execute:
 *
 *  ATOMIC  - path-payment swaps (/api/swap, pending-payment converters) bundle
 *            a second Payment operation in the SAME transaction (built by the
 *            caller via feeOpForSwap); the ledger row is written right after
 *            the submit succeeds - one tx, swap + fee, all-or-nothing.
 *
 *  AT FILL - DEX maker offers can rest and fill hours later, so no atomic fee
 *            is physically possible. Each booked fill accrues a 'pending'
 *            ledger row (accrueFillFee, hooked into the two fill-logging
 *            funnels); collectPendingFees() - run from the position monitor
 *            tick - then submits a Payment signed with the fee payer's own
 *            wallet (keyProvider), stamps the receipt moment and the XLM/EUR
 *            rate AT that moment, and retries transient failures.
 *
 * Fees are wholly disabled until a fee wallet address is configured
 * (dbo.PlatformSettings, admin-editable; PLATFORM_FEE_WALLET seeds it once).
 * Paper fills never charge. Rates come from the pure engine (fees/engine.ts).
 */
import { randomUUID } from "node:crypto";
import { Asset, Operation } from "@stellar/stellar-sdk";
import { config } from "../config";
import { horizon } from "../stellar/client";
import { formatAmount } from "../stellar/amounts";
import * as authStore from "../auth/store";
import { currentUserId, runWithUserId } from "../users/context";
import * as billing from "../db/billingRepo";
import { isPlatformHalted } from "../db/billingRepo";
import { dbReady } from "../db/pool";
import { computeFeeXlm, feeRateFor, type FeeTradeType, type VolumeTier } from "./engine";
import { currentXlmEurRate, historicalXlmEurRate } from "./priceFeed";

const G_ADDR = /^G[A-Z2-7]{55}$/;
/** Give up on a pending fee after this many submit attempts (row -> 'failed',
 *  surfaced in the admin backoffice rather than retried forever). */
const MAX_COLLECT_ATTEMPTS = 10;

/* ---- fee wallet -------------------------------------------------------- */

let feeWalletCache: { at: number; value: string | null } | null = null;
let seeded = false;

/** The configured platform fee wallet, or null = fee system disabled.
 *  Seeds dbo.PlatformSettings from PLATFORM_FEE_WALLET exactly once. */
export async function feeWalletAddress(): Promise<string | null> {
  // SINGLE_USER personal mode: the operator IS the only user - a platform fee
  // would just charge himself (at the worst rate, since the DEFAULT account has
  // no premium row). Hard-disable fees regardless of any stale/inherited
  // dbo.PlatformSettings fee wallet from a prior multi-tenant deployment.
  if (config.singleUser) return null;
  if (feeWalletCache && Date.now() - feeWalletCache.at < 60_000) return feeWalletCache.value;
  if (!dbReady()) return null;
  let addr = await billing.getPlatformSetting(billing.PLATFORM_KEYS.feeWalletAddress);
  if (addr == null && !seeded) {
    seeded = true;
    const seed = config.billing.feeWalletSeed.trim();
    if (G_ADDR.test(seed)) {
      await billing.upsertPlatformSetting(billing.PLATFORM_KEYS.feeWalletAddress, seed);
      addr = seed;
    }
  }
  const value = addr && G_ADDR.test(addr) ? addr : null;
  feeWalletCache = { at: Date.now(), value };
  return value;
}

/** Test/admin hook: drop the cache after the address changes. */
export function invalidateFeeWalletCache(): void {
  feeWalletCache = null;
}

/* ---- fee context for the current user ---------------------------------- */

export interface FeeContext {
  tier: VolumeTier;
  isPremium: boolean;
  rate: number;
}

export async function feeContextFor(userId: string, tradeType: FeeTradeType): Promise<FeeContext> {
  const user = await authStore.findUserById(userId);
  const tier = (["Bronze", "Silver", "Gold", "Platinum"].includes(user?.volumeTier ?? "")
    ? user!.volumeTier
    : "Bronze") as VolumeTier;
  const isPremium = user?.isPremium ?? false;
  return { tier, isPremium, rate: feeRateFor(tier, isPremium, tradeType) };
}

/* ---- XLM-equivalent volume --------------------------------------------- */

/**
 * XLM-equivalent volume of a fill. Direct when either leg is XLM; otherwise a
 * one-hop Horizon quote converts the quote-leg value. Null = not valuable
 * right now (the fee is skipped and logged - never guessed).
 */
export async function xlmEquivalentOfFill(
  baseAsset: string,
  quoteAsset: string,
  amountBase: number,
  price: number,
): Promise<number | null> {
  if (!(amountBase > 0) || !(price >= 0)) return null;
  if (baseAsset === "XLM") return amountBase;
  const quoteValue = amountBase * price;
  if (quoteAsset === "XLM") return quoteValue;
  if (!(quoteValue > 0)) return null;
  try {
    const [code, issuer] = quoteAsset.split(":");
    if (!code || !issuer) return null;
    const page = await horizon
      .strictSendPaths(new Asset(code, issuer), formatAmount(quoteValue), [Asset.native()])
      .call();
    const dest = Number(page.records[0]?.destination_amount);
    return Number.isFinite(dest) && dest > 0 ? dest : null;
  } catch {
    return null;
  }
}

/* ---- AT-FILL accrual ---------------------------------------------------- */

export interface FillFee {
  /** Deterministic id per fill event - replays/reboots can't double-charge. */
  idKey: string;
  baseAsset: string;
  quoteAsset: string;
  /** Base amount of THIS fill event (a delta for tranches). */
  amountBase: number;
  price: number;
  tradeType: FeeTradeType;
  tradeTxHash?: string | undefined;
  /** Paper fills never charge. */
  paper?: boolean | undefined;
}

/**
 * Accrue the fee for one booked fill as a 'pending' ledger row. Fire-and-forget
 * from the fill-logging funnels (never blocks or fails a fill booking).
 */
export async function accrueFillFee(fill: FillFee): Promise<void> {
  try {
    if (fill.paper || fill.tradeTxHash === "paper") return;
    if (!dbReady()) return;
    if ((await feeWalletAddress()) == null) return;
    if (await isPlatformHalted()) {
      const { store } = await import("../trading/store");
      store.log("info", `Platform halted by admin — skipping fee accrual for fill ${fill.idKey}.`);
      return;
    }
    const userId = currentUserId();
    const volumeXlm = await xlmEquivalentOfFill(
      fill.baseAsset,
      fill.quoteAsset,
      fill.amountBase,
      fill.price,
    );
    if (volumeXlm == null || volumeXlm <= 0) {
      if (fill.amountBase > 0) {
        const { store } = await import("../trading/store");
        store.log(
          "warn",
          `Fee accrual skipped for fill ${fill.idKey}: no XLM valuation for ${fill.baseAsset}/${fill.quoteAsset}.`,
        );
      }
      return;
    }
    const ctx = await feeContextFor(userId, fill.tradeType);
    const feeXlm = Number(computeFeeXlm(volumeXlm, ctx.rate));
    if (!(feeXlm > 0)) return;
    await billing.insertFeeLedger({
      id: `fee-${fill.idKey}`,
      tsMs: Date.now(),
      userId,
      tradeType: fill.tradeType,
      tier: ctx.tier,
      isPremium: ctx.isPremium,
      feeRate: ctx.rate,
      tradeVolumeXlm: volumeXlm,
      feeXlm,
      status: "pending",
      tradeTxHash: fill.tradeTxHash ?? null,
    });
  } catch (err) {
    // Fee accounting must never break trading; the collector's ledger is the
    // safety net, and a miss here is visible in the admin reconciliation.
    const { store } = await import("../trading/store");
    store.log("warn", `Fee accrual failed for ${fill.idKey}: ${(err as Error).message}`);
  }
}

/* ---- ATOMIC swap fee ----------------------------------------------------- */

export interface SwapFeePlan {
  op: ReturnType<typeof Operation.payment>;
  feeXlm: number;
  ctx: FeeContext;
  /** Call AFTER the swap tx succeeded; writes the collected ledger row with
   *  the receipt-time EUR rate. */
  record: (tradeTxHash: string) => Promise<void>;
}

/**
 * The fee Payment operation to bundle into a path-payment swap, or null when
 * fees are disabled / the fee rounds to zero. `volumeXlm` is the swap's
 * XLM-equivalent volume (caller derives it from its own quote).
 */
export async function planSwapFee(volumeXlm: number, tradeType: FeeTradeType): Promise<SwapFeePlan | null> {
  if (!dbReady() || !(volumeXlm > 0)) return null;
  if (await isPlatformHalted()) {
    const { store } = await import("../trading/store");
    store.log("info", "Platform halted by admin — skipping platform fee collection for this swap.");
    return null;
  }
  const feeWallet = await feeWalletAddress();
  if (!feeWallet) return null;
  const userId = currentUserId();
  const ctx = await feeContextFor(userId, tradeType);
  const feeXlm = Number(computeFeeXlm(volumeXlm, ctx.rate));
  if (!(feeXlm > 0)) return null;
  const op = Operation.payment({
    destination: feeWallet,
    asset: Asset.native(),
    amount: formatAmount(feeXlm),
  });
  const record = async (tradeTxHash: string): Promise<void> => {
    const id = `fee-swap-${tradeTxHash}`;
    await billing.insertFeeLedger({
      id,
      tsMs: Date.now(),
      userId,
      tradeType,
      tier: ctx.tier,
      isPremium: ctx.isPremium,
      feeRate: ctx.rate,
      tradeVolumeXlm: volumeXlm,
      feeXlm,
      status: "pending",
      tradeTxHash,
    });
    const rate = await currentXlmEurRate();
    await billing.markFeeCollected(id, {
      collectedTxHash: tradeTxHash,
      collectedAtMs: Date.now(),
      ...(rate
        ? {
            xlmEurRate: rate.rate,
            feeEur: Math.round(feeXlm * rate.rate * 100) / 100,
            rateSource: rate.source,
          }
        : {}),
    });
  };
  return { op, feeXlm, ctx, record };
}

/* ---- pending-fee collection (monitor tick) ------------------------------- */

let collecting = false;

/**
 * Submit the XLM fee Payment for pending ledger rows, each signed with the fee
 * payer's own stored wallet (runWithUserId -> keyProvider). Skips entirely
 * while the kill switch is on, or while the platform is admin-halted - the
 * rows simply stay pending. Never throws.
 */
export async function collectPendingFees(): Promise<void> {
  if (collecting) return;
  collecting = true;
  try {
    if (!dbReady()) return;
    const feeWallet = await feeWalletAddress();
    if (!feeWallet) return;
    const { store } = await import("../trading/store");
    if (store.killSwitch) return;
    if (await isPlatformHalted()) {
      store.log("info", "Platform halted by admin — skipping platform fee collection this tick.");
      return;
    }
    const pending = await billing.listPendingFees(25);
    if (pending.length === 0) return;
    // Lazy import to keep module init cycle-free (transfers -> collector).
    const { sendPayment } = await import("../stellar/transfers");
    for (const row of pending) {
      try {
        const { hash } = await runWithUserId(row.userId, async () =>
          sendPayment({
            destination: feeWallet,
            asset: "XLM",
            amount: formatAmount(row.feeXlm),
            memo: "atrium fee",
          }),
        );
        const rate = await currentXlmEurRate();
        await billing.markFeeCollected(row.id, {
          collectedTxHash: hash,
          collectedAtMs: Date.now(),
          ...(rate
            ? {
                xlmEurRate: rate.rate,
                feeEur: Math.round(row.feeXlm * rate.rate * 100) / 100,
                rateSource: rate.source,
              }
            : {}),
        });
        store.log(
          "info",
          `Platform fee collected: ${formatAmount(row.feeXlm)} XLM (${row.tier} ${row.tradeType.toLowerCase()}) tx ${hash.slice(0, 8)}…`,
        );
      } catch (err) {
        await billing.bumpFeeAttempt(row.id, MAX_COLLECT_ATTEMPTS);
        store.log(
          "warn",
          `Platform fee collection failed for ${row.id} (attempt ${row.attempts + 1}/${MAX_COLLECT_ATTEMPTS}): ${(err as Error).message}`,
        );
      }
    }
  } finally {
    collecting = false;
  }
}

/**
 * Gap repair for the tax ledger: collected rows that missed their EUR rate
 * (both live feeds down at receipt) get the HISTORICAL rate of their receipt
 * minute - never the current price.
 */
export async function repairMissingEurRates(): Promise<void> {
  if (!dbReady()) return;
  const rows = await billing.listCollectedFeesMissingRate(10);
  for (const row of rows) {
    if (!row.collectedAt) continue;
    const rate = await historicalXlmEurRate(Date.parse(row.collectedAt));
    if (!rate) return; // feed still unavailable - retry on a later tick
    await billing.setFeeEurRate(
      row.id,
      rate.rate,
      Math.round(row.feeXlm * rate.rate * 100) / 100,
      rate.source,
    );
  }
}
