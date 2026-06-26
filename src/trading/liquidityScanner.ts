import { config } from "../config";
import { store } from "./store";
import { collectTopLiquidity } from "../liquidity/scan";
import { analyzeLiquidity } from "../liquidity/analyze";
import type { LiquidityRec } from "../types";

/**
 * Hourly liquidity scanner: a background job that ranks the top-N most
 * XLM-liquid Stellar assets, persists each snapshot, computes trend +
 * "worth watching" recommendations, and publishes them to the dashboard.
 *
 * DELIBERATELY DECOUPLED from trading. It only observes and recommends: it
 * imports no orchestrator/monitor/policy/signer code, creates no proposals, and
 * never submits anything on-chain. An operator still has to promote a
 * recommended asset into SCAN_ASSETS / ASSET_WHITELIST by hand.
 *
 * Same loop scaffolding as autopilot.ts / monitor.ts: a module-level timer with
 * a `running` re-entrancy guard and a self-rescheduling setTimeout (next tick
 * scheduled in .finally so a slow tick never piles up).
 */

let timer: ReturnType<typeof setTimeout> | null = null;
// Generation token: bumped on every (re)start and on stop so a re-call of
// startLiquidityScanner() (Feature 2 live interval change) cleanly supersedes
// the old loop instead of running two timers at once.
let gen = 0;
let running = false;

async function runOnce(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const obs = await collectTopLiquidity({
      topN: 10,
      discoveryPages: config.liquidityDiscoveryPages,
      concurrency: 4,
    });
    // Persist each observation first so the history the analyzer reads includes
    // the current tick (consistency/trend count it too).
    for (const row of obs) store.recordLiquiditySnapshot(row);

    const since = new Date(
      Date.now() - config.liquidityRetentionDays * 86_400_000,
    ).toISOString();
    const hist = await store.getLiquidityHistory({ since });
    const recs = analyzeLiquidity(obs, hist, config.limits.assetWhitelist, Date.now());
    store.setLiquidityRecs(recs);

    const watching = recs.filter((r) => r.recommended).map((r) => r.assetCode);
    store.log(
      "info",
      `Liquidity scan: top ${obs.length} by 24h XLM volume [${obs
        .map((o) => o.assetCode)
        .join(", ")}]` +
        (watching.length ? `; worth watching: ${watching.join(", ")}.` : "."),
    );
  } finally {
    running = false;
  }
}

export function startLiquidityScanner(): void {
  const myGen = ++gen; // supersede any previously-scheduled loop
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const sec = config.liquidityScanIntervalSeconds;
  if (sec <= 0) {
    store.log(
      "info",
      "Liquidity scanner OFF (LIQUIDITY_SCAN_INTERVAL_SECONDS=0). No top-asset tracking.",
    );
    return;
  }
  // Floored at 300s: each tick fans out a handful of Horizon reads per
  // candidate; an hourly cadence (3600) is the intended default.
  store.log(
    "info",
    `Liquidity scanner ON: ranking the top liquid assets every ${Math.max(
      sec,
      300,
    )}s (observe-only, never trades).`,
  );

  const loop = (): void => {
    if (myGen !== gen) return; // a newer start (or stop) superseded us
    void runOnce()
      .catch((err) =>
        store.log("error", `Liquidity scan failed: ${(err as Error).message}`),
      )
      .finally(() => {
        // Re-read the interval each tick so a live change applies immediately.
        if (myGen === gen) timer = setTimeout(loop, Math.max(config.liquidityScanIntervalSeconds, 300) * 1000);
      });
  };
  // First tick shortly after boot (after hydration settles).
  timer = setTimeout(loop, 10_000);
}

/** Stop the scanner (shutdown) or, via startLiquidityScanner(), restart it with
 *  the current interval. The generation bump invalidates any in-flight loop. */
export function stopLiquidityScanner(): void {
  gen++;
  if (timer) clearTimeout(timer);
  timer = null;
}

/**
 * GetLiquidityRecommendations(): the current top-N liquid assets + their trend
 * data + the "recommended to add" flag. Exposed for the API endpoint and for
 * programmatic callers.
 */
export function getLiquidityRecommendations(): LiquidityRec[] {
  return store.getLiquidityRecs();
}
