import { describe, it, expect } from "vitest";
import type { Candle } from "../stellar/market";
import {
  runBacktest,
  computeImpactBps,
  DEFAULT_BACKTEST_CONFIG,
  type BacktestConfig,
} from "./engine";
import { DEFAULT_PARAMS } from "./strategy";

/**
 * A ranging triangle wave in [98,102] with even bar spacing. It tags as
 * "ranging" (net move ~0 over the window -> low efficiency ratio, no vol
 * expansion) and parks the close at the band edges every other bar, so the
 * mean-reversion rules fire predictably - the ideal shape to test engine
 * MECHANICS (exits, costs, no-overlap, gating) deterministically. The strategy
 * logic itself is covered in strategy.test.ts.
 */
function rangingSeries(bars: number): Candle[] {
  const pattern = [100, 102, 100, 98];
  const out: Candle[] = [];
  for (let i = 0; i < bars; i++) {
    const close = pattern[i % pattern.length]!;
    out.push({
      time: new Date(i * 3_600_000).toISOString(),
      open: close,
      high: close + 0.5,
      low: close - 0.5,
      close,
      baseVolume: 1000,
    });
  }
  return out;
}

// Loosen the range RSI confirmations so both edges fire on a ~50-RSI oscillation.
const loose: BacktestConfig = {
  ...DEFAULT_BACKTEST_CONFIG,
  params: {
    ...DEFAULT_PARAMS,
    rangeLowPos: 0.4,
    rangeBuyRsi: 60,
    rangeHighPos: 0.6,
    rangeSellRsi: 40,
  },
};

describe("runBacktest - mechanics", () => {
  const candles = rangingSeries(80);
  const res = runBacktest("XLM", "USDC", candles, loose);

  it("produces trades on a triangle wave", () => {
    expect(res.signals).toBeGreaterThan(0);
    expect(res.trades.length).toBeGreaterThan(0);
  });

  it("every trade moves strictly forward in time", () => {
    for (const t of res.trades) {
      expect(Date.parse(t.exitTime)).toBeGreaterThan(Date.parse(t.entryTime));
      expect(t.barsHeld).toBeGreaterThanOrEqual(1);
    }
  });

  it("never overlaps two positions", () => {
    for (let k = 1; k < res.trades.length; k++) {
      const prev = res.trades[k - 1]!;
      const cur = res.trades[k]!;
      expect(Date.parse(cur.entryTime)).toBeGreaterThanOrEqual(
        Date.parse(prev.exitTime),
      );
    }
  });

  it("signs R correctly: target exits win, stop exits lose (after costs)", () => {
    for (const t of res.trades) {
      if (t.exitReason === "target") expect(t.rMultiple).toBeGreaterThan(0);
      if (t.exitReason === "stop") expect(t.rMultiple).toBeLessThan(0);
    }
  });

  it("applies a cost haircut to both fills (higher cost => smaller win R)", () => {
    // Same trades, higher per-fill cost: every winning target must realize a
    // smaller R because entry pays up and exit receives less. This is the lever
    // that flips real backtests from "edge" to "no edge".
    const dear = runBacktest("XLM", "USDC", rangingSeries(80), {
      ...loose,
      costBps: 50,
    });
    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    const cheapWins = res.trades.filter((t) => t.exitReason === "target");
    const dearWins = dear.trades.filter((t) => t.exitReason === "target");
    expect(cheapWins.length).toBeGreaterThan(0);
    expect(dearWins.length).toBeGreaterThan(0);
    expect(avg(dearWins.map((t) => t.rMultiple))).toBeLessThan(
      avg(cheapWins.map((t) => t.rMultiple)),
    );
  });
});

describe("runBacktest - liquidity gate (the 'why no trades' lever)", () => {
  it("kills every signal when the window volume floor is unreachable", () => {
    const res = runBacktest("XLM", "USDC", rangingSeries(80), {
      ...loose,
      applyVolumeGate: true,
      minWindowVolume: 1e12,
    });
    expect(res.signals).toBeGreaterThan(0);
    expect(res.trades.length).toBe(0);
    expect(res.skippedByGate.volume).toBe(res.signals);
  });

  it("lets them through when the gate is disabled", () => {
    const res = runBacktest("XLM", "USDC", rangingSeries(80), {
      ...loose,
      applyVolumeGate: false,
    });
    expect(res.skippedByGate.volume).toBe(0);
    expect(res.trades.length).toBeGreaterThan(0);
  });
});

describe("runBacktest - empty / tiny input", () => {
  it("returns an empty result without throwing on too few candles", () => {
    const res = runBacktest("XLM", "USDC", rangingSeries(5), loose);
    expect(res.trades).toEqual([]);
    expect(res.signals).toBe(0);
  });
});

describe("computeImpactBps", () => {
  it("is zero when no trade size is configured (the default, size-agnostic)", () => {
    expect(computeImpactBps(loose, 1000)).toBe(0);
    // Coeff set but no size -> still zero: size is the switch.
    expect(
      computeImpactBps({ ...loose, impactBpsAtFullParticipation: 999 }, 1000),
    ).toBe(0);
  });

  it("equals the full-participation coeff when the order is a whole bar's volume", () => {
    const cfg = { ...loose, tradeSizeBase: 1000, impactBpsAtFullParticipation: 80 };
    expect(computeImpactBps(cfg, 1000)).toBeCloseTo(80, 6);
  });

  it("scales with the square root of participation", () => {
    // size/vol = 0.25 -> sqrt = 0.5 -> half the full coeff.
    const cfg = { ...loose, tradeSizeBase: 250, impactBpsAtFullParticipation: 80 };
    expect(computeImpactBps(cfg, 1000)).toBeCloseTo(40, 6);
  });

  it("charges max impact on a bar that traded nothing", () => {
    const cfg = { ...loose, tradeSizeBase: 10, impactBpsAtFullParticipation: 80 };
    expect(computeImpactBps(cfg, 0)).toBe(80);
  });
});

describe("runBacktest - market impact", () => {
  it("shrinks winning R once a real trade size eats into the book", () => {
    const candles = rangingSeries(80);
    const flat = runBacktest("XLM", "USDC", candles, loose);
    const impacted = runBacktest("XLM", "USDC", candles, {
      ...loose,
      tradeSizeBase: 500, // half of each bar's 1000 volume -> ~70bps impact/fill
      impactBpsAtFullParticipation: 100,
    });
    const avg = (xs: number[]) =>
      xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
    const flatWins = flat.trades
      .filter((t) => t.exitReason === "target")
      .map((t) => t.rMultiple);
    const impactedWins = impacted.trades
      .filter((t) => t.exitReason === "target")
      .map((t) => t.rMultiple);
    expect(flatWins.length).toBeGreaterThan(0);
    expect(impactedWins.length).toBe(flatWins.length); // same trades, worse fills
    expect(avg(impactedWins)).toBeLessThan(avg(flatWins));
  });

  it("is a no-op when no trade size is set, even with a coeff present", () => {
    const candles = rangingSeries(80);
    const a = runBacktest("XLM", "USDC", candles, loose);
    const b = runBacktest("XLM", "USDC", candles, {
      ...loose,
      impactBpsAtFullParticipation: 999,
    });
    expect(b.trades.map((t) => t.rMultiple)).toEqual(
      a.trades.map((t) => t.rMultiple),
    );
  });
});
