import { describe, expect, it } from "vitest";
import type { ArmAttribution, EvalConfig } from "./types";
import { createInitialState, reduce, type RunState } from "./state";
import { renderReport, type EvalSummary, type ReportDeps, type Verdict } from "./report";

function fakeAttribution(overrides: Partial<ArmAttribution> = {}): ArmAttribution {
  return {
    key: { arm: "a", venue: "v" },
    trades: 10,
    wins: 5,
    losses: 5,
    scratches: 0,
    hitRatePct: 50,
    grossPnlXlm: 1,
    feesXlm: 0.1,
    rebatesXlm: 0,
    slippageXlm: 0.05,
    netPnlXlm: 0.85,
    avgRMultiple: 0.1,
    netReturns: [0.1, -0.1],
    maxDrawdownXlm: 0.2,
    equityCurveXlm: [0.1, 0],
    byRegime: { ranging: { trades: 10, netPnlXlm: 0.85, hitRatePct: 50 } },
    byQuote: { USDC: 0.85 },
    modeledTrades: 0,
    openLots: [],
    ...overrides,
  };
}

function baseSummary(overrides: Partial<EvalSummary> = {}): EvalSummary {
  return {
    trades: 10,
    netPnlXlm: 0.85,
    expectancyR: 0.1,
    tStat: 1.2,
    ci: { lowerR: -0.1, upperR: 0.3, excludesZero: false },
    hitRatePct: 50,
    maxDrawdownXlm: 0.2,
    sharpePerTrade: 0.3,
    modeledTrades: 0,
    ...overrides,
  };
}

function baseConfig(overrides: Partial<EvalConfig> = {}): EvalConfig {
  return {
    arms: ["arm-a"],
    venues: ["stellar-sdex"],
    nMin: 2,
    dMin: 1,
    dMax: 30,
    alpha: 0.05,
    bootstrapResamples: 100,
    seed: 1,
    minRegimeSample: 5,
    ...overrides,
  };
}

function stateWithOneArmAndBaselines(config: EvalConfig, nowIso: string): RunState {
  const keys = [
    { key: { arm: "arm-a", venue: "stellar-sdex" }, kind: "arm" as const },
    { key: { arm: "baseline:rulebook", venue: "stellar-sdex" }, kind: "baseline" as const },
  ];
  let state = createInitialState("run-report", config, keys, nowIso);
  state = reduce(state, {
    type: "fill",
    key: { arm: "arm-a", venue: "stellar-sdex" },
    fill: {
      orderId: "o1",
      arm: "arm-a",
      venue: "stellar-sdex",
      side: "buy",
      base: "XLM",
      quote: "USDC",
      liquidity: "taker",
      filledBase: 10,
      avgPrice: 0.1,
      feeQuote: 0.01,
      referencePrice: 0.1,
      fidelity: "observed-taker",
      ts: nowIso,
      assumptions: [],
      regime: "ranging",
    },
  });
  return state;
}

describe("renderReport - honesty block wording", () => {
  it("prints NO PROVEN EDGE when the CI includes zero", async () => {
    const config = baseConfig();
    const state = stateWithOneArmAndBaselines(config, "2026-01-01T00:00:00.000Z");

    const deps: ReportDeps = {
      attribute: () => fakeAttribution(),
      summarize: () => baseSummary({ ci: { lowerR: -0.1, upperR: 0.3, excludesZero: false } }),
      verdictFor: (): Verdict => ({ verdict: "no-edge", headline: "does not clear zero after costs" }),
    };

    const report = await renderReport({ state, deps, generatedAtIso: "2026-01-02T00:00:00.000Z" });

    expect(report.markdown).toMatch(/NO PROVEN EDGE/);
    expect(report.markdown).toContain("Generated: 2026-01-02T00:00:00.000Z");
  });

  it("does NOT print NO PROVEN EDGE when the CI clears zero", async () => {
    const config = baseConfig();
    const state = stateWithOneArmAndBaselines(config, "2026-01-01T00:00:00.000Z");

    const deps: ReportDeps = {
      attribute: () => fakeAttribution(),
      summarize: () => baseSummary({ ci: { lowerR: 0.05, upperR: 0.3, excludesZero: true } }),
      verdictFor: (): Verdict => ({ verdict: "edge", headline: "clears zero at the adjusted level" }),
    };

    const report = await renderReport({ state, deps, generatedAtIso: "2026-01-02T00:00:00.000Z" });

    expect(report.markdown).not.toMatch(/NO PROVEN EDGE/);
    expect(report.markdown).toMatch(/EDGE/);
  });

  it("is deterministic: identical inputs render identical output", async () => {
    const config = baseConfig();
    const state = stateWithOneArmAndBaselines(config, "2026-01-01T00:00:00.000Z");
    const deps: ReportDeps = {
      attribute: () => fakeAttribution(),
      summarize: () => baseSummary(),
      verdictFor: (): Verdict => ({ verdict: "inconclusive-need-more-data", headline: "not enough data yet" }),
    };
    const a = await renderReport({ state, deps, generatedAtIso: "2026-01-02T00:00:00.000Z" });
    const b = await renderReport({ state, deps, generatedAtIso: "2026-01-02T00:00:00.000Z" });
    expect(a.markdown).toBe(b.markdown);
    expect(a.tradesCsv).toBe(b.tradesCsv);
  });
});

describe("renderReport - trades CSV", () => {
  it("emits one row per fill across all cells, plus the header", async () => {
    const config = baseConfig();
    const state = stateWithOneArmAndBaselines(config, "2026-01-01T00:00:00.000Z");
    const deps: ReportDeps = {
      attribute: () => fakeAttribution(),
      summarize: () => baseSummary(),
      verdictFor: (): Verdict => ({ verdict: "no-edge", headline: "n/a" }),
    };
    const report = await renderReport({ state, deps, generatedAtIso: "2026-01-02T00:00:00.000Z" });
    const rows = report.tradesCsv.trim().split("\n");
    expect(rows[0]).toMatch(/^arm,venue,orderId/);
    expect(rows.length).toBe(2); // header + the one fill seeded above
  });
});
