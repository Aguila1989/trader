/**
 * Daily volume-tier recalculation (2026-07 Feature 2). Clones the trustline
 * scanner's scheduling shape: a coarse 15-minute poll tick (setTimeout + a
 * generation token, NOT the recalc cadence itself) checks whether the fixed
 * local time-of-day target (config.billing.tierRecalcMinuteOfDay, default
 * 00:10) has passed; the last completed run is persisted so the schedule
 * survives restarts and an overdue run fires on the next tick.
 *
 * The recalc itself: previous CALENDAR month platform fills (all users), per
 * user -> wash-trade-filtered countable volume (fees/engine.ts) -> tier ->
 * dbo.Users.volumeTier (admin tierOverride rows are skipped in SQL). Upgrades
 * and downgrades both apply. Also flags accounts with >500 executed fills
 * yesterday for anomaly review. DB-only by design - without a database there
 * are no fees and no tiers.
 */
import { config } from "../config";
import { store } from "../trading/store";
import * as repo from "../db/repo";
import * as billing from "../db/billingRepo";
import { dbReady } from "../db/pool";
import { dayStartUtc, nextDailyOccurrenceUtc, previousCalendarMonthUtc } from "../time";
import { countableVolumeXlm, tierForMonthlyVolume, type CountableFill } from "./engine";

const TICK_MS = 15 * 60_000;
const LAST_RUN_KEY = "feeTier:lastRecalcAt";
/** Anomaly threshold: executed fills per day (business plan: 500). */
const FLAG_TRADES_PER_DAY = 500;

let gen = 0;
let timer: NodeJS.Timeout | null = null;
let running = false;

/** XLM-equivalent of a TradeLog fill row, or null when neither leg is XLM
 *  (skipped - a bulk historical revaluation would not be defensible). */
function fillVolumeXlm(f: billing.PlatformFillRow): number | null {
  if (f.baseAsset === "XLM") return f.amount ?? null;
  if (f.quoteAsset === "XLM") return f.totalValue ?? null;
  return null;
}

export async function runTierRecalc(trigger: "scheduled" | "manual"): Promise<void> {
  if (running || !dbReady()) return;
  running = true;
  try {
    const { start, end } = previousCalendarMonthUtc();
    const fills = await billing.listPlatformFills(start.getTime(), end.getTime());

    const perUser = new Map<string, CountableFill[]>();
    let skippedNoValuation = 0;
    for (const f of fills) {
      const volumeXlm = fillVolumeXlm(f);
      if (volumeXlm == null) {
        skippedNoValuation++;
        continue;
      }
      const action = f.action === "SELL" ? "SELL" : "BUY";
      const list = perUser.get(f.userId) ?? [];
      list.push({ ts: Date.parse(f.ts), baseAsset: f.baseAsset, action, volumeXlm });
      perUser.set(f.userId, list);
    }

    const states = await billing.listUserTierStates();
    let changed = 0;
    for (const u of states) {
      const volume = countableVolumeXlm(perUser.get(u.id) ?? []);
      const tier = tierForMonthlyVolume(volume);
      if (u.tierOverride) continue; // admin-pinned; the SQL guard also skips
      if (tier !== u.volumeTier) {
        await billing.setUserVolumeTier(u.id, tier);
        changed++;
        store.log(
          "info",
          `Volume tier ${u.volumeTier} -> ${tier} for user ${u.id.slice(0, 8)}… (prev-month countable volume ${volume.toFixed(2)} XLM).`,
        );
      }
    }

    // Anomaly detection: flag accounts with > FLAG_TRADES_PER_DAY executed
    // fills YESTERDAY (the last complete local day). Flags are set here and
    // only ever cleared by an admin.
    const todayStart = dayStartUtc();
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);
    const counts = await billing.countFillsPerUser(yesterdayStart.getTime(), todayStart.getTime());
    for (const [userId, n] of counts) {
      if (n > FLAG_TRADES_PER_DAY) {
        await billing.setUserFlaggedForReview(userId, true);
        store.log(
          "warn",
          `Anomaly flag: user ${userId.slice(0, 8)}… executed ${n} fills yesterday (> ${FLAG_TRADES_PER_DAY}/day) - flagged for review.`,
        );
      }
    }

    await repo.upsertSetting(LAST_RUN_KEY, new Date().toISOString());
    store.log(
      "info",
      `Volume-tier recalc (${trigger}) done: ${states.length} users, ${changed} tier change(s), window ${start.toISOString().slice(0, 10)}..${end.toISOString().slice(0, 10)}${skippedNoValuation ? `, ${skippedNoValuation} fill(s) skipped (no XLM leg)` : ""}.`,
    );
  } catch (err) {
    store.log("error", `Volume-tier recalc failed: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

async function computeNextRunAt(): Promise<Date> {
  const last = await repo.getSetting(LAST_RUN_KEY);
  const lastMs = last ? Date.parse(last) : 0;
  const base = Number.isFinite(lastMs) && lastMs > 0 ? new Date(lastMs) : new Date(0);
  return nextDailyOccurrenceUtc(config.billing.tierRecalcMinuteOfDay, base);
}

async function tick(): Promise<void> {
  if (!dbReady()) return;
  const next = await computeNextRunAt();
  if (Date.now() >= next.getTime()) await runTierRecalc("scheduled");
}

export function startTierScheduler(): void {
  const myGen = ++gen;
  if (timer) clearTimeout(timer);
  const loop = (): void => {
    if (myGen !== gen) return;
    void tick()
      .catch((err) => store.log("error", `Tier scheduler tick failed: ${(err as Error).message}`))
      .finally(() => {
        if (myGen !== gen) return;
        timer = setTimeout(loop, TICK_MS);
        timer.unref?.();
      });
  };
  // First tick shortly after boot so an overdue recalc catches up quickly.
  timer = setTimeout(loop, 20_000);
  timer.unref?.();
}

export function stopTierScheduler(): void {
  gen++;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
