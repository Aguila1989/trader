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
let stopped = false;
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
  const sec = config.autoScanIntervalSeconds;
  if (sec <= 0) {
    store.log(
      "info",
      "Auto-pilot OFF. Set AUTO_SCAN_INTERVAL_SECONDS > 0 to scan hands-free.",
    );
    return;
  }
  const ms = Math.max(sec, 30) * 1000;
  store.log(
    "warn",
    `Auto-pilot ON: scanning the curated universe every ${Math.round(ms / 1000)}s. ` +
      "Trades still require auto-trade ON + live trading ARMED + passing policy.",
  );

  const loop = (): void => {
    if (stopped) return;
    void runOnce().finally(() => {
      if (!stopped) timer = setTimeout(loop, ms);
    });
  };
  // First scan a few seconds after boot (let the server settle), then on cadence.
  timer = setTimeout(loop, 3_000);
}

/** Stop the loop (used on shutdown). */
export function stopAutoPilot(): void {
  stopped = true;
  if (timer) clearTimeout(timer);
  timer = null;
}
