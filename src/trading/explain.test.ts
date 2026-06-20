import { describe, it, expect } from "vitest";
import {
  explainNoEntry,
  briefNoEntry,
  baselineCall,
  divergenceNote,
  isFundable,
  type NoEntryInput,
  type GateLimits,
} from "./explain";
import type { IndicatorSet } from "../stellar/indicators";

const gates: GateLimits = { maxEntrySpreadBps: 100, minVolume24h: 500 };

function input(over: Partial<NoEntryInput> = {}): NoEntryInput {
  return {
    label: "XLM/USDC",
    regime: "trending-up",
    rsi14: 50,
    rangePos: 0.5,
    spreadBps: 8,
    baseVolume24h: 100_000,
    ...over,
  };
}

describe("explainNoEntry", () => {
  it("blocks on a spread over the entry cap", () => {
    const r = explainNoEntry(input({ spreadBps: 640 }), gates);
    expect(r).toContain("640bps");
    expect(r).toContain("entry cap");
  });

  it("blocks on 24h volume under the floor", () => {
    const r = explainNoEntry(input({ spreadBps: 8, baseVolume24h: 100 }), gates);
    expect(r).toContain("floor");
  });

  it("explains an uptrend with no pullback (RSI too hot) - the XLM/USDC case", () => {
    const r = explainNoEntry(input({ regime: "trending-up", rsi14: 64 }), gates);
    expect(r).toContain("uptrend");
    expect(r).toMatch(/pullback/i);
    expect(r).toContain("64");
  });

  it("notes a setup IS present on an uptrend pullback", () => {
    const r = explainNoEntry(input({ regime: "trending-up", rsi14: 40 }), gates);
    expect(r).toMatch(/setup is present/i);
  });

  it("explains a downtrend with no bounce", () => {
    const r = explainNoEntry(input({ regime: "trending-down", rsi14: 40 }), gates);
    expect(r).toMatch(/downtrend/i);
    expect(r).toMatch(/bounce/i);
  });

  it("explains a volatile stand-aside", () => {
    const r = explainNoEntry(input({ regime: "volatile" }), gates);
    expect(r).toMatch(/VOLATILE/);
    expect(r).toMatch(/stands aside/i);
  });

  it("explains ranging mid-channel", () => {
    const r = explainNoEntry(input({ regime: "ranging", rangePos: 0.5 }), gates);
    expect(r).toMatch(/mid-channel/i);
  });

  it("explains ranging at the low without oversold RSI", () => {
    const r = explainNoEntry(
      input({ regime: "ranging", rangePos: 0.1, rsi14: 55 }),
      gates,
    );
    expect(r).toMatch(/range low/i);
    expect(r).toMatch(/oversold/i);
  });

  it("flags too little history when regime is null", () => {
    const r = explainNoEntry(input({ regime: null }), gates);
    expect(r).toMatch(/too little history/i);
  });
});

describe("briefNoEntry", () => {
  it("renders a compact regime + rounded-RSI tag", () => {
    expect(briefNoEntry(input({ regime: "trending-up", rsi14: 63.7 }))).toBe(
      "XLM/USDC (trending-up, RSI 64)",
    );
  });
});

function ind(over: Partial<IndicatorSet> = {}): IndicatorSet {
  return {
    rsi14: 50,
    ema8: 100,
    ema24: 100,
    atrPct: 1,
    realizedVolPct: 1,
    efficiencyRatio: 0.2,
    rangePos: 0.5,
    volRatio: 1,
    regime: "ranging",
    ...over,
  };
}

describe("baselineCall (what the rulebook would do)", () => {
  it("sells a confirmed range high", () => {
    expect(baselineCall(ind({ regime: "ranging", rangePos: 0.8, rsi14: 65 }), 100).side).toBe("sell");
  });
  it("buys a confirmed range low", () => {
    expect(baselineCall(ind({ regime: "ranging", rangePos: 0.1, rsi14: 35 }), 100).side).toBe("buy");
  });
  it("stands aside mid-range", () => {
    expect(baselineCall(ind({ regime: "ranging", rangePos: 0.5, rsi14: 50 }), 100).side).toBeNull();
  });
  it("stands aside in a volatile regime", () => {
    expect(baselineCall(ind({ regime: "volatile", rangePos: 0.9, rsi14: 70 }), 100).side).toBeNull();
  });
});

describe("divergenceNote (rulebook vs AI)", () => {
  it("is a non-event when both stand aside", () => {
    expect(divergenceNote("XLM/USDC", { side: null, reason: "x" }, null)).toBeNull();
  });
  it("agrees, no divergence, when both take the same side", () => {
    const c = divergenceNote("XLM/USDC", { side: "sell", reason: "x" }, "sell");
    expect(c?.diverged).toBe(false);
    expect(c?.note).toMatch(/agree/);
  });
  it("flags the headline case: rulebook would trade, AI passed", () => {
    const c = divergenceNote("XLM/USDC", { side: "sell", reason: "range high" }, null);
    expect(c?.diverged).toBe(true);
    expect(c?.note).toMatch(/skipped a signal/);
  });
  it("flags the AI taking a trade the rules wouldn't", () => {
    const c = divergenceNote("XLM/USDC", { side: null, reason: "x" }, "buy");
    expect(c?.diverged).toBe(true);
    expect(c?.note).toMatch(/took a trade the rules wouldn't/);
  });
  it("flags opposite sides", () => {
    const c = divergenceNote("XLM/USDC", { side: "sell", reason: "x" }, "buy");
    expect(c?.diverged).toBe(true);
    expect(c?.note).toMatch(/opposite sides/);
  });
});

describe("isFundable", () => {
  const holdsUsdcOnly = (s: string) => s === "USDC";
  const holdsXlmOnly = (s: string) => s === "XLM";
  it("buy needs the quote currency", () => {
    expect(isFundable("buy", "XLM", "USDC", holdsUsdcOnly)).toBe(true);
    expect(isFundable("buy", "XLM", "USDC", holdsXlmOnly)).toBe(false);
  });
  it("sell needs the base asset", () => {
    expect(isFundable("sell", "XLM", "USDC", holdsXlmOnly)).toBe(true);
    expect(isFundable("sell", "XLM", "USDC", holdsUsdcOnly)).toBe(false);
  });
});

describe("divergenceNote - phantom (fundability) tagging", () => {
  it("tags an unfundable skipped signal as PHANTOM, not a real miss", () => {
    const c = divergenceNote("XLM/USDC", { side: "buy", reason: "range low" }, null, false);
    expect(c?.diverged).toBe(true);
    expect(c?.phantom).toBe(true);
    expect(c?.note).toMatch(/PHANTOM/);
  });
  it("keeps a fundable skipped signal as a real divergence", () => {
    const c = divergenceNote("XLM/USDC", { side: "buy", reason: "range low" }, null, true);
    expect(c?.diverged).toBe(true);
    expect(c?.phantom).toBe(false);
    expect(c?.note).toMatch(/skipped a signal/);
  });
  it("treats unknown fundability as a real (non-phantom) divergence", () => {
    const c = divergenceNote("XLM/USDC", { side: "buy", reason: "range low" }, null);
    expect(c?.phantom).toBe(false);
  });
});
