import { describe, it, expect } from "vitest";
import {
  explainNoEntry,
  briefNoEntry,
  type NoEntryInput,
  type GateLimits,
} from "./explain";

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
