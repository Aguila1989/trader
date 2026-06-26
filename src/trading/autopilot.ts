import { config } from "../config";
import { aiReady } from "../ai";
import { store } from "./store";
import { runChainScan } from "./orchestrator";

/**
 * The autopilot: a background loop that runs a chain scan of the curated token
 * universe on a fixed cadence, so the bot can generate (and, when armed, submit)
 * trades WITHOUT a human clicking "Scan chain". It is intentionally thin - it
 * only triggers the scan; every risk decision still lives downstream:
 *
 *   - runChainScan() routes each proposal through the policy engine + preflight.
 *   - A proposal only SUBMITS when auto-trade is on AND live trading is armed;
 *     otherwise it queues for manual approval (see orchestrator.executeInner).
 *   - The kill switch, daily caps, cooldown and per-trade size cap all apply.
 *
 * So enabling the loop alone never trades on its own - it just removes the
 * manual scan click from the hands-free path.
 */

let timer: ReturnType<typeof setTimeout> | null = null;
// Bumped on every (re)start and on stop. A loop closure captures the generation
// it was scheduled under and bows out once a newer start has superseded it, so
// re-calling startAutoPilot() to apply a new interval never leaves a zombie
// timer running alongside the new one (Feature 2: live interval changes).
let gen = 0;
let running = false;

/** One scan tick. Skips (without erroring) when there's nothing useful to do. */
async function runOnce(): Promise<void> {
  if (running) return; // belt-and-suspenders: never overlap two scans
  running = true;
  try {
    if (store.killSwitch) {
      store.log("info", "Auto-pilot: kill switch active - skipping this scan.");
      return;
    }
    if (!store.aiEnabled) {
      store.log("info", "Auto-pilot: AI trading is paused - skipping this scan.");
      return;
    }
    if (!aiReady()) {
      store.log(
        "warn",
        "Auto-pilot: active AI provider has no API key - skipping this scan.",
      );
      return;
    }
    const out = await runChainScan();
    store.log(
      "info",
      `Auto-pilot scan done: ${out.scanned} market(s), ${out.proposals.length} proposal(s).`,
    );
  } catch (err) {
    store.log("error", `Auto-pilot scan failed: ${(err as Error).message}`);
  } finally {
    running = false;
  }
}

/**
 * Start the periodic scan loop when AUTO_SCAN_INTERVAL_SECONDS > 0. The interval
 * is the GAP between scans (next scan is scheduled only after the previous one
 * finishes), so a slow scan can never pile up. No-op when disabled.
 */
export function startAutoPilot(): void {
  const myGen = ++gen; // supersede any previously-scheduled loop
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const sec = config.autoScanIntervalSeconds;
  if (sec <= 0) {
    store.log(
      "info",
      "Auto-pilot OFF. Set AUTO_SCAN_INTERVAL_SECONDS > 0 to scan hands-free.",
    );
    return;
  }
  store.log(
    "warn",
    `Auto-pilot ON: scanning the curated universe every ${Math.max(sec, 30)}s. ` +
      "Trades still require auto-trade ON + live trading ARMED + passing policy.",
  );

  const loop = (): void => {
    if (myGen !== gen) return; // a newer start (or stop) superseded us
    void runOnce().finally(() => {
      // Re-read the interval each tick so a live change applies immediately.
      if (myGen === gen) timer = setTimeout(loop, Math.max(config.autoScanIntervalSeconds, 30) * 1000);
    });
  };
  // First scan a few seconds after boot (let the server settle), then on cadence.
  timer = setTimeout(loop, 3_000);
}

/** Stop the loop (shutdown) or, via startAutoPilot(), restart it with the
 *  current interval. Bumping the generation invalidates any in-flight loop. */
export function stopAutoPilot(): void {
  gen++;
  if (timer) clearTimeout(timer);
  timer = null;
}
