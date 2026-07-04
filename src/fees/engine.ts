/**
 * Platform fee engine (2026-07 Feature 2). Pure functions only - no I/O, no
 * config reads - so every number in the business plan's fee table is unit-
 * tested exactly as written. Collection/persistence live in collector.ts.
 *
 * Volume tiers are computed DAILY from the PREVIOUS calendar month's platform
 * volume (tierScheduler.ts); new users start Bronze. Fees have NO minimum -
 * small trades pay proportionally. Rates are fractions (0.0028 = 0.28%).
 */

export type VolumeTier = "Bronze" | "Silver" | "Gold" | "Platinum";
export type FeeTradeType = "MANUAL" | "AI";

export const VOLUME_TIERS: readonly VolumeTier[] = ["Bronze", "Silver", "Gold", "Platinum"];

/** Exact rates from the business plan (README Platform Roadmap v3, verbatim). */
export const FEE_RATES: Record<VolumeTier, { freeManual: number; premiumManual: number; premiumAi: number }> = {
  Bronze: { freeManual: 0.0028, premiumManual: 0.0018, premiumAi: 0.0014 },
  Silver: { freeManual: 0.0023, premiumManual: 0.0016, premiumAi: 0.0012 },
  Gold: { freeManual: 0.0018, premiumManual: 0.0013, premiumAi: 0.001 },
  Platinum: { freeManual: 0.0012, premiumManual: 0.0008, premiumAi: 0.0008 },
};

/** Tier boundaries on the previous month's counted volume, in XLM. */
export function tierForMonthlyVolume(volumeXlm: number): VolumeTier {
  if (!Number.isFinite(volumeXlm) || volumeXlm < 0) return "Bronze";
  if (volumeXlm > 50_000) return "Platinum";
  if (volumeXlm >= 20_000) return "Gold";
  if (volumeXlm >= 5_000) return "Silver";
  return "Bronze";
}

/**
 * The applied fee rate. AI trading only exists for premium users (it is the
 * paywall), so a non-premium AI rate falls back to the free manual rate - that
 * path indicates a gating bug upstream, never a discount.
 */
export function feeRateFor(tier: VolumeTier, isPremium: boolean, tradeType: FeeTradeType): number {
  const r = FEE_RATES[tier];
  if (!isPremium) return r.freeManual;
  return tradeType === "AI" ? r.premiumAi : r.premiumManual;
}

/**
 * Fee in XLM for a trade volume, as a 7-decimal Stellar amount string.
 * Rounded HALF-UP at the 7th decimal; no minimum fee. Returns "0" for
 * non-positive/invalid volume (nothing to charge).
 */
export function computeFeeXlm(tradeVolumeXlm: number, rate: number): string {
  if (!Number.isFinite(tradeVolumeXlm) || tradeVolumeXlm <= 0) return "0";
  if (!Number.isFinite(rate) || rate <= 0) return "0";
  const fee = Math.round(tradeVolumeXlm * rate * 1e7) / 1e7;
  if (fee <= 0) return "0";
  let s = fee.toFixed(7);
  s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

/** Minimum single-trade size (XLM) for a fill to COUNT toward tier volume.
 *  Smaller trades still pay fees - they just don't help the tier. */
export const MIN_TIER_COUNT_XLM = 1;

/** Round-trip window: opposite-direction fills on the same asset within this
 *  window are wash trades and count for NOTHING (volume farming protection). */
export const WASH_WINDOW_MS = 60_000;

export interface CountableFill {
  /** Fill timestamp, epoch ms. */
  ts: number;
  /** Base asset spec ("XLM" or "CODE:ISSUER"). */
  baseAsset: string;
  /** BUY or SELL of the base asset. */
  action: "BUY" | "SELL";
  /** XLM-equivalent volume of the fill. */
  volumeXlm: number;
}

/**
 * Tier-countable volume for one user: drops sub-minimum fills, then removes
 * wash round-trips (a BUY and a SELL of the SAME asset within WASH_WINDOW_MS
 * cancel each other - BOTH legs are excluded, greedily pairing nearest-in-time
 * first, so ping-pong farming counts for zero rather than half).
 */
export function countableVolumeXlm(fills: readonly CountableFill[]): number {
  const eligible = fills
    .filter((f) => Number.isFinite(f.volumeXlm) && f.volumeXlm >= MIN_TIER_COUNT_XLM)
    .slice()
    .sort((a, b) => a.ts - b.ts);

  const excluded = new Set<number>(); // indices into `eligible`
  for (let i = 0; i < eligible.length; i++) {
    if (excluded.has(i)) continue;
    const a = eligible[i]!;
    for (let j = i + 1; j < eligible.length; j++) {
      if (excluded.has(j)) continue;
      const b = eligible[j]!;
      if (b.ts - a.ts > WASH_WINDOW_MS) break; // sorted: nothing later can match
      if (b.baseAsset === a.baseAsset && b.action !== a.action) {
        excluded.add(i);
        excluded.add(j);
        break;
      }
    }
  }

  let total = 0;
  for (let i = 0; i < eligible.length; i++) {
    if (!excluded.has(i)) total += eligible[i]!.volumeXlm;
  }
  return Math.round(total * 1e7) / 1e7;
}
