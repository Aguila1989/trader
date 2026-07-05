import { describe, it, expect } from "vitest";
import { ScanBusyError, isScanInFlight, withScanLock } from "./orchestrator";

/**
 * FIX-PLAN Fix 5: the cross-entry-point scan mutex. POST /api/scan and the
 * autopilot tick both funnel through runChainScan() -> withScanLock(); two
 * concurrent scans used to mean doubled paid LLM calls.
 */
describe("trading/orchestrator scan mutex", () => {
  it("runs exactly one scan at a time - the second caller gets ScanBusyError", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });

    const first = withScanLock(async () => {
      await gate;
      return "first-done";
    });
    expect(isScanInFlight()).toBe(true);

    // Overlapping caller (the autopilot tick / a second POST /api/scan).
    await expect(withScanLock(async () => "second")).rejects.toBeInstanceOf(ScanBusyError);

    release();
    await expect(first).resolves.toBe("first-done");
    expect(isScanInFlight()).toBe(false);
  });

  it("releases the lock even when the scan throws", async () => {
    await expect(
      withScanLock(async () => {
        throw new Error("horizon down");
      }),
    ).rejects.toThrow("horizon down");
    expect(isScanInFlight()).toBe(false);
    // Lock is free again: a follow-up scan may run.
    await expect(withScanLock(async () => "ok")).resolves.toBe("ok");
  });
});
