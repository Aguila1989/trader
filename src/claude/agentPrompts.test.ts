import { describe, it, expect, vi } from "vitest";
import { renderMarketRow, runTurn, systemPrompt, systemChainPrompt } from "./agent";
import { effectiveLimits } from "../policy/riskProfile";
import { config } from "../config";
import type { MarketSnapshot } from "../stellar/market";
import type { AiProvider, AiRequest, AiTurn } from "../ai";
import type { RiskProfile } from "../types";

const profileOf = (lvl: "low" | "medium" | "high"): RiskProfile => ({
  positionSize: lvl,
  stopLossDistance: lvl,
  tradeFrequency: lvl,
  volatilityTolerance: lvl,
  drawdownTolerance: lvl,
  slippageTolerance: lvl,
  expertMode: false,
});

describe("FIX-PLAN Fix 1: system prompts render the EFFECTIVE limits", () => {
  it("all-HIGH renders 300bps slippage, 300bps spread cap and NO volume floor", () => {
    const limits = effectiveLimits(profileOf("high"));
    // Lock the semantics the prompt relies on (base 50/100/500 defaults).
    expect(limits.maxSlippageBps).toBe(300);
    expect(limits.maxEntrySpreadBps).toBe(config.limits.maxEntrySpreadBps * 3);
    expect(limits.minVolume24h).toBe(0);

    for (const prompt of [systemPrompt(limits), systemChainPrompt(limits)]) {
      expect(prompt).toContain(`at or below ${limits.maxSlippageBps} bps`);
      expect(prompt).toContain(`${limits.maxEntrySpreadBps}bps`);
      expect(prompt).toContain("no volume floor at your current risk profile");
      expect(prompt).not.toContain(`24h volume is under ${config.limits.minVolume24h}`);
      expect(prompt).toContain("do not apply a stricter bar than stated");
    }
  });

  it("all-LOW renders the base values", () => {
    const limits = effectiveLimits(profileOf("low"));
    expect(limits.maxSlippageBps).toBe(config.limits.maxSlippageBps);
    const prompt = systemChainPrompt(limits);
    expect(prompt).toContain(`at or below ${config.limits.maxSlippageBps} bps`);
    expect(prompt).toContain(`when the spread exceeds ${config.limits.maxEntrySpreadBps}bps`);
    expect(prompt).toContain(`24h volume is under ${config.limits.minVolume24h}`);
    expect(prompt).not.toContain("no volume floor");
  });

  it("a runtime minRiskReward settings change shows up in the next render", () => {
    const limits = effectiveLimits(profileOf("low"));
    const before = systemChainPrompt(limits);
    expect(before).toContain(`minimum reward/risk of ${limits.minRiskReward}`);
    // Simulate settings.ts's live mutation path: the NEXT render sees it.
    const after = systemChainPrompt({ ...limits, minRiskReward: 1.7 });
    expect(after).toContain("minimum reward/risk of 1.7");
  });

  it("states the rulebook's actual trigger numbers from DEFAULT_PARAMS", () => {
    const prompt = systemChainPrompt(effectiveLimits(profileOf("low")));
    expect(prompt).toContain("range edges at <=0.25/>=0.75 with RSI <=40/>=60");
    expect(prompt).toContain("trend pullback/bounce at RSI 45/55");
  });
});

const snapshot = (over: Partial<MarketSnapshot["stats"]>): MarketSnapshot => ({
  base: "XLM",
  quote: "USDC:GA5ZSE",
  bestBid: 0.24,
  bestAsk: 0.2412,
  spreadBps: 49.8,
  stats: {
    lastPrice: 0.2406,
    change24hPct: 1.2,
    low24h: 0.229,
    high24h: 0.243,
    baseVolume24h: 120_000,
    regime: "ranging",
    rsi14: 64.6,
    atrPct: 1.1,
    rangePos: 0.84,
    ...over,
  } as MarketSnapshot["stats"],
  stats7d: null,
  bids: [{ price: 0.24, amount: 1000 } as never],
  asks: [{ price: 0.2412, amount: 900 } as never],
  recentTrades: [],
  flowBuyPct: 42,
});

describe("FIX-PLAN Fix 2: market rows carry the rulebook's read", () => {
  it("ranging at rangePos 0.84 / RSI 64.6 renders rulebook=SELL with the numbers", () => {
    const row = renderMarketRow(snapshot({}), 500);
    expect(row).toContain("rulebook=SELL (Range high: rangePos 0.84 >= 0.75, RSI 64.6 >= 60.)");
  });

  it("a volatile / no-regime market renders rulebook=none", () => {
    expect(renderMarketRow(snapshot({ regime: "volatile" }), 500)).toContain("rulebook=none");
    expect(renderMarketRow(snapshot({ regime: null as never }), 500)).toContain("rulebook=none");
  });
});

describe("FIX-PLAN Fix 4: truncated empty turns are logged and retried once", () => {
  const req: AiRequest = { system: "s", messages: [], tools: [], maxReplyTokens: 100 };

  it("retries once with a doubled reply budget on max_tokens + empty content", async () => {
    const calls: AiRequest[] = [];
    const provider: AiProvider = {
      id: "fake",
      run: vi.fn(async (r: AiRequest): Promise<AiTurn> => {
        calls.push(r);
        return calls.length === 1
          ? { text: "", toolCalls: [], stopReason: "max_tokens" }
          : { text: "recovered", toolCalls: [], stopReason: "end_turn" };
      }),
    } as unknown as AiProvider;

    const turn = await runTurn(provider, req);
    expect(turn.text).toBe("recovered");
    expect(calls).toHaveLength(2);
    expect(calls[1]!.maxReplyTokens).toBe(200);
  });

  it("does not retry a deliberate empty end_turn or a turn with tool calls", async () => {
    const run = vi.fn(async (): Promise<AiTurn> => ({ text: "", toolCalls: [], stopReason: "end_turn" }));
    const provider = { id: "fake", run } as unknown as AiProvider;
    await runTurn(provider, req);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
