import { describe, it, expect, beforeEach } from "vitest";
import { ledger, computeEvolution, type Fill } from "./positions";

function fill(over: Partial<Fill>): Fill {
  return {
    side: "buy",
    base: "USDC",
    quote: "XLM",
    amount: 100,
    price: 0.5,
    ...over,
  };
}

describe("Ledger FIFO realized PnL", () => {
  beforeEach(() => ledger.reset());

  it("opening a lot realizes nothing", () => {
    expect(ledger.recordFill(fill({ side: "buy", amount: 100, price: 0.5 }))).toBe(0);
  });

  it("buy then sell realizes (sell - buy) * qty in the XLM quote", () => {
    ledger.recordFill(fill({ side: "buy", amount: 100, price: 0.5 }));
    const realized = ledger.recordFill(fill({ side: "sell", amount: 100, price: 0.6 }));
    // quote is XLM -> delta passes through unchanged.
    expect(realized).toBeCloseTo(10, 7);
    // Net position is flat, so the pair drops out of positions().
    expect(ledger.positions()).toHaveLength(0);
  });

  it("matches lots FIFO across multiple opens", () => {
    ledger.recordFill(fill({ side: "buy", amount: 100, price: 0.5 }));
    ledger.recordFill(fill({ side: "buy", amount: 100, price: 0.6 }));
    // Sell 150: closes 100@0.5 (=> +20) then 50@0.6 (=> +5) = 25.
    const realized = ledger.recordFill(fill({ side: "sell", amount: 150, price: 0.7 }));
    expect(realized).toBeCloseTo(25, 7);
    // 50 of the 0.6 lot remains open.
    const [pos] = ledger.positions();
    expect(pos?.netQty).toBeCloseTo(50, 7);
    expect(pos?.avgPrice).toBeCloseTo(0.6, 7);
  });

  it("handles a short opened then covered", () => {
    ledger.recordFill(fill({ side: "sell", amount: 100, price: 0.6 }));
    const realized = ledger.recordFill(fill({ side: "buy", amount: 100, price: 0.5 }));
    // Short at 0.6, cover at 0.5 => (0.6 - 0.5) * 100 = 10.
    expect(realized).toBeCloseTo(10, 7);
    expect(ledger.positions()).toHaveLength(0);
  });
});

describe("realized PnL normalization to XLM", () => {
  beforeEach(() => ledger.reset());

  it("quote == XLM passes through unchanged", () => {
    ledger.recordFill(fill({ base: "USDC", quote: "XLM", side: "buy", amount: 100, price: 0.5 }));
    const realized = ledger.recordFill(
      fill({ base: "USDC", quote: "XLM", side: "sell", amount: 100, price: 0.6 }),
    );
    expect(realized).toBeCloseTo(10, 7);
  });

  it("base == XLM converts the quote delta to XLM at the realizing fill price", () => {
    // XLM/USDC: price is USDC-per-XLM. Buy 100 XLM @0.5, sell @0.6.
    ledger.recordFill(fill({ base: "XLM", quote: "USDC", side: "buy", amount: 100, price: 0.5 }));
    const realized = ledger.recordFill(
      fill({ base: "XLM", quote: "USDC", side: "sell", amount: 100, price: 0.6 }),
    );
    // realizedQuote = 10 USDC; /0.6 (the sell price) => 16.6666667 XLM.
    expect(realized).toBeCloseTo(16.6666667, 6);
  });

  it("neither leg XLM returns the raw quote delta (documented limitation)", () => {
    ledger.recordFill(fill({ base: "USDC", quote: "EURC", side: "buy", amount: 100, price: 0.9 }));
    const realized = ledger.recordFill(
      fill({ base: "USDC", quote: "EURC", side: "sell", amount: 100, price: 1.0 }),
    );
    expect(realized).toBeCloseTo(10, 7);
  });
});

describe("computeEvolution", () => {
  it("accumulates volume, trade count and PnL per fill", () => {
    const fills: Fill[] = [
      fill({ side: "buy", amount: 100, price: 0.5, ts: "2026-01-01T00:00:00Z" }),
      fill({ side: "sell", amount: 100, price: 0.6, ts: "2026-01-01T01:00:00Z" }),
    ];
    const series = computeEvolution(fills);
    expect(series).toHaveLength(2);
    expect(series[0]?.cumulativeTrades).toBe(1);
    expect(series[0]?.cumulativeVolume).toBeCloseTo(100, 7);
    expect(series[0]?.cumulativePnl).toBeCloseTo(0, 7);
    expect(series[1]?.cumulativeTrades).toBe(2);
    expect(series[1]?.cumulativeVolume).toBeCloseTo(200, 7);
    expect(series[1]?.cumulativePnl).toBeCloseTo(10, 7);
  });
});
