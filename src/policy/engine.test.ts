import { describe, it, expect, vi } from "vitest";

const USDC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
const EURC = "EURC:GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2";
const AQUA = "AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA";

// Deterministic limits so the test doesn't depend on env / the curated universe
// folded into the real whitelist. USDC + EURC are high tier; AQUA is low.
vi.mock("../config", () => ({
  config: {
    limits: {
      assetWhitelist: ["XLM", USDC, EURC, AQUA],
      maxAmountPerTrade: 10,
      maxAmountPerTradeHigh: 50,
      maxDailyVolume: 500,
      maxTradesPerDay: 100,
      maxDailyLoss: 25,
      maxSlippageBps: 50,
      cooldownSeconds: 60,
      maxEntrySpreadBps: 100,
      minVolume24h: 500,
      maxOpenExposure: 200,
      pairExposureMultiplier: 3,
      stopLossPct: 5,
      maxOfferAgeMinutes: 15,
      maxProposalAgeSeconds: 600,
      minRiskReward: 1.2,
    },
  },
}));

const { checkPolicy, maxAmountForPair, lossTaper, isRiskReducing } = await import("./engine");
import type {
  TradeProposal,
  PolicyContext,
  DailyState,
  PositionSummary,
} from "../types";

const NOW = Date.parse("2026-01-01T12:00:00Z");

function proposal(over: Partial<TradeProposal> = {}): TradeProposal {
  return {
    id: "t",
    createdAt: "",
    updatedAt: "",
    side: "buy",
    baseAsset: "XLM",
    quoteAsset: USDC,
    amount: "1",
    limitPrice: "0.5",
    maxSlippageBps: 10,
    reason: "",
    status: "proposed",
    policyViolations: [],
    ...over,
  };
}

function daily(over: Partial<DailyState> = {}): DailyState {
  return { dayKey: "2026-01-01", volume: 0, tradeCount: 0, realizedPnl: 0, lastTradeAt: null, ...over };
}

function run(
  p: Partial<TradeProposal> = {},
  opts: {
    daily?: Partial<DailyState>;
    context?: PolicyContext;
    killSwitch?: boolean;
    nowMs?: number;
    positions?: PositionSummary[];
    unrealizedPnl?: number;
    autoExecution?: boolean;
  } = {},
) {
  return checkPolicy({
    proposal: proposal(p),
    context: opts.context ?? { bestBid: 0.5, bestAsk: 0.5 },
    daily: daily(opts.daily),
    killSwitch: opts.killSwitch ?? false,
    nowMs: opts.nowMs ?? NOW,
    positions: opts.positions,
    unrealizedPnl: opts.unrealizedPnl,
    autoExecution: opts.autoExecution,
  });
}

function position(over: Partial<PositionSummary> = {}): PositionSummary {
  return {
    pair: `XLM/${USDC}`,
    base: "XLM",
    quote: USDC,
    netQty: 0,
    avgPrice: 0.5,
    ...over,
  };
}

describe("isRiskReducing", () => {
  it("a fresh entry on a flat pair is NOT risk-reducing", () => {
    expect(isRiskReducing(proposal({ side: "buy", amount: "5" }), [])).toBe(false);
  });
  it("trimming a long (sell < net) is risk-reducing", () => {
    expect(
      isRiskReducing(proposal({ side: "sell", amount: "4" }), [position({ netQty: 10 })]),
    ).toBe(true);
  });
  it("fully closing a long (sell == net) is risk-reducing", () => {
    expect(
      isRiskReducing(proposal({ side: "sell", amount: "10" }), [position({ netQty: 10 })]),
    ).toBe(true);
  });
  it("a cross-zero flip (sell > net) is NOT risk-reducing", () => {
    expect(
      isRiskReducing(proposal({ side: "sell", amount: "16" }), [position({ netQty: 10 })]),
    ).toBe(false);
  });
  it("adding to a long is NOT risk-reducing", () => {
    expect(
      isRiskReducing(proposal({ side: "buy", amount: "3" }), [position({ netQty: 10 })]),
    ).toBe(false);
  });
  it("covering part of a short (buy < |net|) is risk-reducing", () => {
    expect(
      isRiskReducing(proposal({ side: "buy", amount: "4" }), [position({ netQty: -10 })]),
    ).toBe(true);
  });
});

describe("checkPolicy", () => {
  it("passes a clean in-bounds trade", () => {
    const res = run();
    expect(res.allowed).toBe(true);
    expect(res.violations).toEqual([]);
  });

  it("blocks when the kill switch is active", () => {
    const res = run({}, { killSwitch: true });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/kill switch/i);
  });

  it("blocks a non-whitelisted asset", () => {
    const res = run({ quoteAsset: "FAKE" });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/not whitelisted/i);
  });

  it("blocks identical base and quote", () => {
    const res = run({ baseAsset: "XLM", quoteAsset: "XLM" });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/identical/i);
  });

  it("rejects non-positive amount and price", () => {
    const res = run({ amount: "0", limitPrice: "0" });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/amount must be a positive/i);
    expect(res.violations.join(" ")).toMatch(/limit price must be a positive/i);
  });

  it("enforces the standard per-trade cap on a low-tier pair", () => {
    const res = run({ quoteAsset: AQUA, amount: "30" });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/exceeds max per trade 10/);
  });

  it("allows a larger clip on a high-tier pair", () => {
    // 30 is above the std cap (10) but under the high cap (50).
    const res = run({ quoteAsset: USDC, amount: "30" });
    expect(res.allowed).toBe(true);
  });

  it("blocks at the daily trade-count cap", () => {
    const res = run({}, { daily: { tradeCount: 100 } });
    expect(res.violations.join(" ")).toMatch(/trade count/i);
  });

  it("blocks when the trade would exceed daily volume", () => {
    const res = run({ amount: "1" }, { daily: { volume: 500 } });
    expect(res.violations.join(" ")).toMatch(/daily volume past cap/i);
  });

  it("blocks once the daily loss limit (XLM) is hit", () => {
    const res = run({}, { daily: { realizedPnl: -25 } });
    expect(res.violations.join(" ")).toMatch(/daily loss limit/i);
  });

  it("blocks a declared slippage above the cap", () => {
    const res = run({ maxSlippageBps: 60 });
    expect(res.violations.join(" ")).toMatch(/declared slippage/i);
  });

  it("blocks a limit price too far from market in the worse direction", () => {
    // Buying at 0.6 when the ask is 0.5 is paying away ~2000bps of slippage.
    const res = run({ side: "buy", limitPrice: "0.6" }, { context: { bestBid: 0.5, bestAsk: 0.5 } });
    expect(res.violations.join(" ")).toMatch(/off market/i);
  });

  it("blocks while the cooldown is still active", () => {
    const res = run(
      {},
      { daily: { lastTradeAt: new Date(NOW - 10_000).toISOString() }, nowMs: NOW },
    );
    expect(res.violations.join(" ")).toMatch(/cooldown active/i);
  });
});

describe("maxAmountForPair", () => {
  it("uses the high cap for XLM-vs-high-tier pairs", () => {
    expect(maxAmountForPair("XLM", USDC)).toBe(50);
  });

  it("keeps CROSS pairs (no XLM leg) at the standard cap - the high cap is in XLM-ish base units and 50 USDC is ~5x the real size of 50 XLM", () => {
    expect(maxAmountForPair(USDC, EURC)).toBe(10);
  });

  it("keeps INVERTED pairs (XLM as quote) at the standard cap - 50 USDC base would be ~5x the calibrated size", () => {
    expect(maxAmountForPair(USDC, "XLM")).toBe(10);
  });

  it("uses the standard cap for low-tier or mixed pairs", () => {
    expect(maxAmountForPair("XLM", AQUA)).toBe(10);
    expect(maxAmountForPair(USDC, AQUA)).toBe(10);
  });

  it("uses the standard cap for an XLM-only (no non-XLM leg) pair", () => {
    expect(maxAmountForPair("XLM", "XLM")).toBe(10);
  });
});

describe("liquidity gates", () => {
  it("blocks an entry when the spread exceeds the entry cap", () => {
    const res = run({}, { context: { bestBid: 0.5, bestAsk: 0.5, spreadBps: 150 } });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/spread .* exceeds entry cap/i);
  });

  it("blocks an entry when 24h volume is below the minimum", () => {
    const res = run(
      {},
      { context: { bestBid: 0.5, bestAsk: 0.5, baseVolume24h: 100 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/below the minimum/i);
  });

  it("skips liquidity gates when the data is absent (attended mode)", () => {
    const res = run({}, { context: { bestBid: 0.5, bestAsk: 0.5 } });
    expect(res.allowed).toBe(true);
  });

  it("fails CLOSED on missing market data under auto-execution", () => {
    const res = run({}, { context: {}, autoExecution: true });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/fails closed/i);
  });

  it("fails CLOSED on a missing target/invalidation bracket under auto-execution", () => {
    // Fresh market data, but no stated bracket: an unattended entry must not
    // submit without the stop the reward/risk gate validates.
    const res = run(
      {},
      { context: { bestBid: 0.5, bestAsk: 0.5, baseVolume24h: 10_000 }, autoExecution: true },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/target_price\/invalidation_price/i);
  });

  it("passes auto-execution with fresh data and a valid bracket", () => {
    const res = run(
      { targetPrice: "0.6", invalidationPrice: "0.45" },
      { context: { bestBid: 0.5, bestAsk: 0.5, baseVolume24h: 10_000 }, autoExecution: true },
    );
    expect(res.allowed).toBe(true);
  });
});

describe("size-aware (book-walk) depth check", () => {
  it("blocks a size that would sweep the book past the slippage cap", () => {
    // The limit (0.5, at the ask) passes the deviation check, but only 1 unit
    // sits at the touch - the remaining 9 are priced 200bps higher, so the
    // MARKET cannot absorb 10 units within the 50bps budget.
    const res = run(
      { side: "buy", amount: "10", limitPrice: "0.5" },
      {
        context: {
          bestBid: 0.49,
          bestAsk: 0.5,
          asks: [
            { price: 0.5, amount: 1 },
            { price: 0.51, amount: 20 },
          ],
          bids: [{ price: 0.49, amount: 20 }],
        },
      },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/sweep the book/i);
  });

  it("blocks a size the visible book cannot hold at all", () => {
    const res = run(
      { side: "buy", amount: "10", limitPrice: "0.5" },
      {
        context: {
          bestBid: 0.49,
          bestAsk: 0.5,
          asks: [{ price: 0.5, amount: 3 }],
          bids: [{ price: 0.49, amount: 20 }],
        },
      },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/cannot absorb/i);
  });

  it("passes when the book is deep enough at the touch", () => {
    const res = run(
      { side: "buy", amount: "10", limitPrice: "0.5" },
      {
        context: {
          bestBid: 0.49,
          bestAsk: 0.5,
          asks: [{ price: 0.5, amount: 50 }],
          bids: [{ price: 0.49, amount: 50 }],
        },
      },
    );
    expect(res.allowed).toBe(true);
  });
});

describe("exposure caps", () => {
  it("blocks a trade that grows a pair past its net-exposure cap", () => {
    // USDC pair cap = per-trade 50 x multiplier 3 = 150. 130 held + 30 = 160.
    const res = run(
      { side: "buy", amount: "30" },
      { positions: [position({ netQty: 130 })] },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/net .* exposure/i);
  });

  it("blocks a trade that pushes TOTAL open exposure past the cap", () => {
    // 160 XLM held on the USDC pair; +50 on EURC -> 210 > 200 total cap.
    const eurcPair = `XLM/${EURC}`;
    const res = run(
      { side: "buy", quoteAsset: EURC, amount: "50" },
      {
        positions: [
          position({ netQty: 160 }),
          position({ pair: eurcPair, quote: EURC, netQty: 0 }),
        ],
      },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/total open exposure/i);
  });
});

describe("risk-reducing exemptions", () => {
  it("lets a position be closed despite cooldown and a hit loss limit", () => {
    const res = run(
      { side: "sell", amount: "20", limitPrice: "0.5" },
      {
        positions: [position({ netQty: 20 })],
        daily: {
          realizedPnl: -25, // loss limit reached
          lastTradeAt: new Date(NOW - 10_000).toISOString(), // cooldown active
        },
        nowMs: NOW,
      },
    );
    expect(res.allowed).toBe(true);
    expect(res.violations).toEqual([]);
  });

  it("still blocks entries when the loss limit is hit", () => {
    const res = run({}, { daily: { realizedPnl: -25 } });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/daily loss limit/i);
  });

  it("exempts a genuine partial trim (same side, smaller)", () => {
    // Long 20, sell 10 -> long 10: shrinks without flipping. Exempt.
    const res = run(
      { side: "sell", amount: "10", limitPrice: "0.5" },
      { positions: [position({ netQty: 20 })], daily: { realizedPnl: -25 } },
    );
    expect(res.allowed).toBe(true);
  });

  it("exempts a full close to exactly zero", () => {
    const res = run(
      { side: "sell", amount: "20", limitPrice: "0.5" },
      { positions: [position({ netQty: 20 })], daily: { realizedPnl: -25 } },
    );
    expect(res.allowed).toBe(true);
  });

  it("does NOT exempt a cross-zero FLIP - the opposite-side opening is gated", () => {
    // Long 6, sell 10 -> short 4: lands smaller in magnitude but opens fresh
    // directional risk on the other side, so the loss-limit halt must apply.
    const res = run(
      { side: "sell", amount: "10", limitPrice: "0.5" },
      { positions: [position({ netQty: 6 })], daily: { realizedPnl: -25 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/daily loss limit/i);
  });

  it("gates a flip under auto-execution (fresh short needs its own bracket)", () => {
    // The flip is a new entry, so auto-execution's fail-closed bracket rule
    // applies even though it nets smaller.
    const res = run(
      { side: "sell", amount: "8", limitPrice: "0.5" },
      {
        positions: [position({ netQty: 6 })],
        context: { bestBid: 0.5, bestAsk: 0.5, baseVolume24h: 10_000 },
        autoExecution: true,
      },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/target_price\/invalidation_price/i);
  });
});

describe("unrealized losses in the loss gate", () => {
  it("halts entries when realized + unrealized losses reach the limit", () => {
    const res = run({}, { daily: { realizedPnl: -10 }, unrealizedPnl: -15 });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/daily loss limit/i);
    expect(res.violations.join(" ")).toMatch(/unrealized/i);
  });

  it("ignores unrealized GAINS (they don't extend the budget)", () => {
    const res = run({}, { daily: { realizedPnl: -24 }, unrealizedPnl: 50 });
    expect(res.allowed).toBe(true);
  });
});

describe("loss-budget size taper", () => {
  it("lossTaper ramps from 1 to 0.25 over the second half of the budget", () => {
    expect(lossTaper(0, 0, 25)).toBe(1);
    expect(lossTaper(-12.5, 0, 25)).toBe(1); // exactly half: still full size
    expect(lossTaper(-18.75, 0, 25)).toBeCloseTo(0.625, 4);
    expect(lossTaper(-25, 0, 25)).toBe(0.25);
    expect(lossTaper(-10, -10, 25)).toBeCloseTo(0.55, 4); // unrealized counts
  });

  it("blocks an amount above the tapered cap and explains the taper", () => {
    // -15 of -25 used -> taper 0.85 -> USDC cap 42.5.
    const res = run({ amount: "45" }, { daily: { realizedPnl: -15 } });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/tapered/i);
  });

  it("allows an amount under the tapered cap", () => {
    const res = run({ amount: "40" }, { daily: { realizedPnl: -15 } });
    expect(res.allowed).toBe(true);
  });
});

describe("reward/risk enforcement", () => {
  it("blocks a buy whose target/invalidation ratio is below the minimum", () => {
    const res = run({
      targetPrice: "0.52",
      invalidationPrice: "0.48", // reward 0.02 / risk 0.02 = 1.0 < 1.2
    });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/reward\/risk/i);
  });

  it("blocks inconsistent levels (target on the wrong side)", () => {
    const res = run({ targetPrice: "0.45", invalidationPrice: "0.4" });
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/inconsistent/i);
  });

  it("passes a clean 3:1 setup", () => {
    const res = run({ targetPrice: "0.56", invalidationPrice: "0.48" });
    expect(res.allowed).toBe(true);
  });
});

describe("maker-first (post_only) gating", () => {
  // A non-crossing maker buy joins the bid: limit <= bestBid. A thin/wide ask
  // book that would block a TAKER (book-walk sweep) must NOT block the maker,
  // since a resting maker never sweeps the book.
  const thinAskCtx: PolicyContext = {
    bestBid: 0.49,
    bestAsk: 0.5,
    asks: [
      { price: 0.5, amount: 1 },
      { price: 0.51, amount: 20 },
    ],
    bids: [{ price: 0.49, amount: 20 }],
  };

  it("a post_only buy at the bid PASSES the book-walk that blocks the same taker", () => {
    // Same order, same thin book: the taker is blocked by the sweep gate...
    const taker = run(
      { side: "buy", amount: "10", limitPrice: "0.49" },
      { context: thinAskCtx },
    );
    expect(taker.allowed).toBe(false);
    expect(taker.violations.join(" ")).toMatch(/sweep the book|cannot absorb/i);
    // ...the maker (resting at the bid) is not - it never sweeps the book.
    const maker = run(
      { side: "buy", amount: "10", limitPrice: "0.49", postOnly: true },
      { context: thinAskCtx },
    );
    expect(maker.allowed).toBe(true);
    expect(maker.violations).toEqual([]);
  });

  it("a post_only entry PASSES when the spread exceeds the entry cap (a taker is blocked)", () => {
    const wide: PolicyContext = { bestBid: 0.5, bestAsk: 0.5, spreadBps: 150 };
    const taker = run({ side: "buy", limitPrice: "0.5" }, { context: wide });
    expect(taker.allowed).toBe(false);
    expect(taker.violations.join(" ")).toMatch(/spread .* exceeds entry cap/i);
    const maker = run(
      { side: "buy", limitPrice: "0.5", postOnly: true },
      { context: wide },
    );
    expect(maker.allowed).toBe(true);
  });

  it("a post_only buy priced ABOVE the bid is BLOCKED by the crossing-maker guard", () => {
    const res = run(
      { side: "buy", limitPrice: "0.5", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/priced to cross the spread/i);
  });

  it("a post_only sell priced BELOW the ask is BLOCKED by the crossing-maker guard", () => {
    const res = run(
      { side: "sell", limitPrice: "0.49", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/priced to cross the spread/i);
  });

  it("makers are STILL blocked by the per-trade size cap", () => {
    const res = run(
      { side: "buy", quoteAsset: AQUA, amount: "30", limitPrice: "0.49", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/exceeds max per trade 10/);
  });

  it("makers are STILL blocked by the daily volume cap", () => {
    const res = run(
      { side: "buy", limitPrice: "0.49", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5 }, daily: { volume: 500 } },
    );
    expect(res.violations.join(" ")).toMatch(/daily volume past cap/i);
  });

  it("makers are STILL blocked by the daily loss halt", () => {
    const res = run(
      { side: "buy", limitPrice: "0.49", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5 }, daily: { realizedPnl: -25 } },
    );
    expect(res.violations.join(" ")).toMatch(/daily loss limit/i);
  });

  it("makers are STILL blocked by the minVolume24h liquidity gate", () => {
    const res = run(
      { side: "buy", limitPrice: "0.49", postOnly: true },
      { context: { bestBid: 0.49, bestAsk: 0.5, baseVolume24h: 100 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/below the minimum/i);
  });

  it("makers are STILL aged out by the staleness gate (a stale resting level IS the risk)", () => {
    const res = run(
      {
        side: "buy",
        limitPrice: "0.49",
        postOnly: true,
        createdAt: new Date(NOW - 700_000).toISOString(),
      },
      { context: { bestBid: 0.49, bestAsk: 0.5 }, nowMs: NOW },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/old/i);
  });

  it("makers are STILL blocked by the cooldown", () => {
    const res = run(
      { side: "buy", limitPrice: "0.49", postOnly: true },
      {
        context: { bestBid: 0.49, bestAsk: 0.5 },
        daily: { lastTradeAt: new Date(NOW - 10_000).toISOString() },
        nowMs: NOW,
      },
    );
    expect(res.violations.join(" ")).toMatch(/cooldown active/i);
  });

  it("reward/risk is STILL enforced for a maker", () => {
    const res = run(
      {
        side: "buy",
        limitPrice: "0.49",
        postOnly: true,
        targetPrice: "0.51", // reward 0.02 / risk 0.02 = 1.0 < 1.2
        invalidationPrice: "0.47",
      },
      { context: { bestBid: 0.49, bestAsk: 0.5 } },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/reward\/risk/i);
  });
});

describe("proposal staleness", () => {
  it("blocks execution of a proposal older than the max age", () => {
    const res = run(
      { createdAt: new Date(NOW - 700_000).toISOString() }, // ~700s old
      { nowMs: NOW },
    );
    expect(res.allowed).toBe(false);
    expect(res.violations.join(" ")).toMatch(/old/i);
  });

  it("passes a fresh proposal", () => {
    const res = run(
      { createdAt: new Date(NOW - 30_000).toISOString() },
      { nowMs: NOW },
    );
    expect(res.allowed).toBe(true);
  });
});
