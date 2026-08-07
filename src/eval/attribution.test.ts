import { describe, it, expect } from "vitest";
import { attributeArm, attributeAll } from "./attribution";
import type { PaperFill } from "./types";

/**
 * Attribution tests. attribution.ts pulls only the pure realizedToXlm helper
 * (positions.ts imports nothing but types), so these are hermetic with no mocks.
 * All pairs use an XLM quote so realizedToXlm is an identity — PnL numbers are
 * exact and deterministic. Pins: FIFO correctness (long + short), gross-vs-net,
 * fees flipping a winner, slippage sign, R-multiples, per-regime/venue split.
 */

function fill(over: Partial<PaperFill>): PaperFill {
  return {
    orderId: "o",
    arm: "A",
    venue: "V",
    side: "buy",
    base: "TKN",
    quote: "XLM",
    liquidity: "taker",
    filledBase: 10,
    avgPrice: 100,
    feeQuote: 0,
    referencePrice: 100,
    fidelity: "observed-taker",
    ts: "2026-01-01T00:00:00.000Z",
    assumptions: [],
    regime: null,
    ...over,
  };
}

describe("FIFO realized PnL", () => {
  it("realizes a long round-trip: gross, fees, net", () => {
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 10, avgPrice: 100, feeQuote: 1, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 110, feeQuote: 1.1, ts: "t2" }),
    ];
    const a = attributeArm(fills);
    expect(a.trades).toBe(1);
    expect(a.grossPnlXlm).toBeCloseTo(100, 6); // (110-100)*10
    expect(a.feesXlm).toBeCloseTo(2.1, 6); // 1 entry + 1.1 exit
    expect(a.netPnlXlm).toBeCloseTo(97.9, 6);
    expect(a.hitRatePct).toBe(100);
  });

  it("realizes a SHORT round-trip (sell then buy) with signed lots", () => {
    const fills = [
      fill({ orderId: "e", side: "sell", filledBase: 10, avgPrice: 100, ts: "t1" }),
      fill({ orderId: "x", side: "buy", filledBase: 10, avgPrice: 90, ts: "t2" }),
    ];
    const a = attributeArm(fills);
    expect(a.trades).toBe(1);
    expect(a.grossPnlXlm).toBeCloseTo(100, 6); // short: (entry 100 - exit 90)*10
    expect(a.netPnlXlm).toBeCloseTo(100, 6);
  });

  it("emits ONE independent round-trip return per CLOSING fill, not per lot-chunk (P0)", () => {
    // Scale into 3 lots, close all 3 with ONE sell: a SINGLE round trip. It must
    // produce exactly one netReturns observation (the independence unit for the
    // significance layer), even though 3 lot-chunks close. Before the fix these
    // 3 near-identical returns were counted as 3 i.i.d. trades, inflating the
    // effective sample size. (Review 2026-08-04, eval-honesty P0.)
    const fills = [
      fill({ orderId: "e1", side: "buy", filledBase: 10, avgPrice: 100, ts: "t1" }),
      fill({ orderId: "e2", side: "buy", filledBase: 10, avgPrice: 100, ts: "t2" }),
      fill({ orderId: "e3", side: "buy", filledBase: 10, avgPrice: 100, ts: "t3" }),
      fill({ orderId: "x", side: "sell", filledBase: 30, avgPrice: 110, ts: "t4" }),
    ];
    const a = attributeArm(fills);
    expect(a.trades).toBe(3); // 3 lot-chunks closed...
    expect(a.netReturns).toHaveLength(1); // ...but ONE independent round trip
    expect(a.netReturns[0]!).toBeCloseTo(0.1, 6); // notional-weighted +10% net
  });

  it("marks the OPEN remainder to the last observed price (deferred-loser guard)", () => {
    // Buy 20 @100, sell only 10 @110 (banking a winner) while the market's
    // last observed print is 110... then a later print at 60 shows the
    // remaining 10 units are deep under water. Realized PnL looks great; the
    // unrealized mark is what stops that flattering the record.
    // (Review 2026-08-04, eval-honesty P2.)
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 20, avgPrice: 100, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 110, ts: "t2" }),
      // A later small print marks the pair much lower.
      fill({ orderId: "e2", side: "buy", filledBase: 1, avgPrice: 60, ts: "t3" }),
    ];
    const a = attributeArm(fills);
    expect(a.netPnlXlm).toBeGreaterThan(0); // the realized record looks fine...
    expect(a.unrealizedPnlXlm).toBeLessThan(0); // ...but the open book is under water
    const open = a.openLots[0]!;
    expect(open.lastPrice).toBe(60);
    expect(open.unrealizedPnlXlm).toBeLessThan(0);
  });

  it("counts each scaling-OUT close as its own round-trip observation", () => {
    // One 20-unit long closed by TWO separate sells = two closing DECISIONS.
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 20, avgPrice: 100, ts: "t1" }),
      fill({ orderId: "x1", side: "sell", filledBase: 10, avgPrice: 110, ts: "t2" }),
      fill({ orderId: "x2", side: "sell", filledBase: 10, avgPrice: 120, ts: "t3" }),
    ];
    const a = attributeArm(fills);
    expect(a.netReturns).toHaveLength(2);
  });

  it("matches FIFO across partial closes (leaves an open remainder)", () => {
    const fills = [
      fill({ orderId: "e1", side: "buy", filledBase: 10, avgPrice: 100, ts: "t1" }),
      fill({ orderId: "e2", side: "buy", filledBase: 10, avgPrice: 120, ts: "t2" }),
      fill({ orderId: "x", side: "sell", filledBase: 12, avgPrice: 130, ts: "t3" }),
    ];
    const a = attributeArm(fills);
    // Sell 12 closes the 10@100 lot fully (+300) and 2 of the 20-lot@120 (+20).
    expect(a.grossPnlXlm).toBeCloseTo(320, 6);
    // 8 base of the second lot remain open.
    expect(a.openLots).toHaveLength(1);
    expect(a.openLots[0]!.netQty).toBeCloseTo(8, 6);
    expect(a.openLots[0]!.avgPrice).toBeCloseTo(120, 6);
  });
});

describe("cost accounting", () => {
  it("FEES flip a gross winner into a net LOSS", () => {
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 10, avgPrice: 100, feeQuote: 0, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 100.5, feeQuote: 6, ts: "t2" }),
    ];
    const a = attributeArm(fills);
    expect(a.grossPnlXlm).toBeCloseTo(5, 6); // 0.5 * 10
    expect(a.feesXlm).toBeCloseTo(6, 6);
    expect(a.netPnlXlm).toBeLessThan(0); // marginal winner, dead after costs
    expect(a.losses).toBe(1);
  });

  it("a MAKER capturing the spread shows NEGATIVE implementation shortfall (a gain)", () => {
    // Bought below the mid, sold above the mid -> price improvement both legs.
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 10, avgPrice: 99.5, referencePrice: 100, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 100.5, referencePrice: 100, ts: "t2" }),
    ];
    const a = attributeArm(fills);
    expect(a.slippageXlm).toBeLessThan(0);
  });

  it("a TAKER crossing the spread shows POSITIVE implementation shortfall (a cost)", () => {
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 10, avgPrice: 100.5, referencePrice: 100, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 99.5, referencePrice: 100, ts: "t2" }),
    ];
    const a = attributeArm(fills);
    expect(a.slippageXlm).toBeGreaterThan(0);
  });
});

describe("R multiples", () => {
  it("computes net R from the opening lot's stop", () => {
    const fills = [
      fill({ orderId: "e", side: "buy", filledBase: 10, avgPrice: 100, feeQuote: 0, ts: "t1" }),
      fill({ orderId: "x", side: "sell", filledBase: 10, avgPrice: 110, feeQuote: 0, ts: "t2" }),
    ];
    const stops = new Map([["e", { stopPrice: 95 }]]); // risk = 5/unit
    const a = attributeArm(fills, stops);
    expect(a.avgRMultiple).toBeCloseTo(2, 6); // (10 net/unit) / 5 risk
  });

  it("leaves R null when no stop was supplied", () => {
    const fills = [
      fill({ orderId: "e", side: "buy", ts: "t1" }),
      fill({ orderId: "x", side: "sell", avgPrice: 110, ts: "t2" }),
    ];
    expect(attributeArm(fills).avgRMultiple).toBeNull();
  });
});

describe("breakdowns", () => {
  it("splits net PnL per regime and tags modeled-maker trades", () => {
    const fills = [
      fill({ orderId: "e1", side: "buy", avgPrice: 100, regime: "ranging", fidelity: "modeled-maker", liquidity: "maker", ts: "t1" }),
      fill({ orderId: "x1", side: "sell", avgPrice: 110, regime: "ranging", ts: "t2" }),
      fill({ orderId: "e2", side: "buy", avgPrice: 100, regime: "trending-up", ts: "t3" }),
      fill({ orderId: "x2", side: "sell", avgPrice: 90, regime: "trending-up", ts: "t4" }),
    ];
    const a = attributeArm(fills);
    expect(a.byRegime["ranging"]!.netPnlXlm).toBeCloseTo(100, 6);
    expect(a.byRegime["trending-up"]!.netPnlXlm).toBeCloseTo(-100, 6);
    // The closing leg's fidelity is observed-taker, but the round-trip inherits
    // the WEAKEST leg -> the opening modeled-maker fill makes it modeled.
    expect(a.modeledTrades).toBe(1);
  });

  it("attributeAll separates arms and venues", () => {
    const fills = [
      fill({ arm: "A", venue: "V1", orderId: "a1", side: "buy", ts: "t1" }),
      fill({ arm: "A", venue: "V1", orderId: "a2", side: "sell", avgPrice: 110, ts: "t2" }),
      fill({ arm: "B", venue: "V2", orderId: "b1", side: "buy", ts: "t1" }),
      fill({ arm: "B", venue: "V2", orderId: "b2", side: "sell", avgPrice: 90, ts: "t2" }),
    ];
    const all = attributeAll(fills);
    expect(all.get("A::V1")!.netPnlXlm).toBeCloseTo(100, 6);
    expect(all.get("B::V2")!.netPnlXlm).toBeCloseTo(-100, 6);
  });
});
