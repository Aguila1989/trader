import { describe, it, expect } from "vitest";
import {
  FEE_RATES,
  computeFeeXlm,
  countableVolumeXlm,
  feeRateFor,
  tierForMonthlyVolume,
  type CountableFill,
} from "./engine";

describe("fees/engine", () => {
  it("maps monthly volume to the business plan's tier boundaries", () => {
    expect(tierForMonthlyVolume(0)).toBe("Bronze");
    expect(tierForMonthlyVolume(4_999.99)).toBe("Bronze");
    expect(tierForMonthlyVolume(5_000)).toBe("Silver");
    expect(tierForMonthlyVolume(19_999.99)).toBe("Silver");
    expect(tierForMonthlyVolume(20_000)).toBe("Gold");
    expect(tierForMonthlyVolume(50_000)).toBe("Gold"); // table: Platinum is > 50,000
    expect(tierForMonthlyVolume(50_000.01)).toBe("Platinum");
    expect(tierForMonthlyVolume(NaN)).toBe("Bronze");
    expect(tierForMonthlyVolume(-5)).toBe("Bronze");
  });

  it("applies the exact rate table", () => {
    // Free manual
    expect(feeRateFor("Bronze", false, "MANUAL")).toBe(0.0028);
    expect(feeRateFor("Silver", false, "MANUAL")).toBe(0.0023);
    expect(feeRateFor("Gold", false, "MANUAL")).toBe(0.0018);
    expect(feeRateFor("Platinum", false, "MANUAL")).toBe(0.0012);
    // Premium manual
    expect(feeRateFor("Bronze", true, "MANUAL")).toBe(0.0018);
    expect(feeRateFor("Silver", true, "MANUAL")).toBe(0.0016);
    expect(feeRateFor("Gold", true, "MANUAL")).toBe(0.0013);
    expect(feeRateFor("Platinum", true, "MANUAL")).toBe(0.0008);
    // Premium AI
    expect(feeRateFor("Bronze", true, "AI")).toBe(0.0014);
    expect(feeRateFor("Silver", true, "AI")).toBe(0.0012);
    expect(feeRateFor("Gold", true, "AI")).toBe(0.001);
    expect(feeRateFor("Platinum", true, "AI")).toBe(0.0008);
    // A free-user "AI" trade indicates a gating bug: charge free manual, never less.
    expect(feeRateFor("Bronze", false, "AI")).toBe(FEE_RATES.Bronze.freeManual);
  });

  it("computes proportional fees with no minimum, 7dp, never exponential", () => {
    expect(computeFeeXlm(1000, 0.0028)).toBe("2.8");
    expect(computeFeeXlm(1, 0.0028)).toBe("0.0028");
    // A dust trade still pays proportionally (no minimum fee).
    expect(computeFeeXlm(0.01, 0.0028)).toBe("0.000028");
    // Sub-stroop fee rounds to zero -> nothing to charge.
    expect(computeFeeXlm(0.00001, 0.0008)).toBe("0");
    expect(computeFeeXlm(0, 0.0028)).toBe("0");
    expect(computeFeeXlm(-5, 0.0028)).toBe("0");
    expect(computeFeeXlm(NaN, 0.0028)).toBe("0");
    // 7dp rounding half-up at the boundary.
    expect(computeFeeXlm(0.055, 0.001)).toBe("0.000055");
  });

  const fill = (ts: number, action: "BUY" | "SELL", volumeXlm: number, baseAsset = "TOK:GA"): CountableFill => ({
    ts,
    action,
    volumeXlm,
    baseAsset,
  });

  it("counts only fills >= 1 XLM toward tier volume", () => {
    expect(countableVolumeXlm([fill(0, "BUY", 0.5), fill(1000, "BUY", 1), fill(2000, "BUY", 2.5)])).toBe(3.5);
  });

  it("excludes BOTH legs of a round-trip on the same asset within 60s", () => {
    // buy then sell 30s later = wash: both excluded.
    expect(countableVolumeXlm([fill(0, "BUY", 100), fill(30_000, "SELL", 100)])).toBe(0);
    // 61s apart = fine.
    expect(countableVolumeXlm([fill(0, "BUY", 100), fill(61_000, "SELL", 100)])).toBe(200);
    // Different assets never pair.
    expect(countableVolumeXlm([fill(0, "BUY", 100, "A:G1"), fill(1_000, "SELL", 100, "B:G2")])).toBe(200);
    // Same direction never pairs.
    expect(countableVolumeXlm([fill(0, "BUY", 100), fill(1_000, "BUY", 100)])).toBe(200);
  });

  it("ping-pong farming counts for zero (greedy nearest pairing)", () => {
    const fills = [
      fill(0, "BUY", 50),
      fill(10_000, "SELL", 50),
      fill(20_000, "BUY", 50),
      fill(30_000, "SELL", 50),
    ];
    expect(countableVolumeXlm(fills)).toBe(0);
  });

  it("an unpaired leg still counts", () => {
    const fills = [fill(0, "BUY", 50), fill(10_000, "SELL", 50), fill(20_000, "BUY", 80)];
    expect(countableVolumeXlm(fills)).toBe(80);
  });
});
