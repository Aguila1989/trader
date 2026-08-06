import { describe, it, expect } from "vitest";
import {
  DEFAULT_QUEUE_HAIRCUT,
  feeFor,
  fillMaker,
  fillTaker,
  observedThroughVolume,
  type FeeModel,
} from "./fills";
import type { PaperOrder } from "./types";

/**
 * Fill-model tests. Pure — fills.ts only pulls the pure walkBook helper, so no
 * mocking is needed. These pin the honesty invariants: a touch never fills a
 * maker, taker pays the real book, partials stay partial, fees/rebates apply.
 */

const FEES: FeeModel = {
  default: { makerBps: -2, takerBps: 10 }, // maker REBATE, taker cost
};

function order(over: Partial<PaperOrder>): PaperOrder {
  return {
    id: "o1",
    arm: "A",
    venue: "V",
    side: "buy",
    base: "TKN",
    quote: "XLM",
    liquidity: "taker",
    amount: 10,
    limitPrice: 0,
    decisionPrice: 100,
    ts: "2026-01-01T00:00:00.000Z",
    regime: null,
    ...over,
  };
}

describe("feeFor", () => {
  it("charges taker bps as a positive cost", () => {
    expect(feeFor(FEES, "V", "taker", 1000)).toBeCloseTo(1.0, 7); // 1000*10/1e4
  });
  it("credits a maker rebate as a negative cost", () => {
    expect(feeFor(FEES, "V", "maker", 1000)).toBeCloseTo(-0.2, 7); // 1000*-2/1e4
  });
  it("is zero for a zero-notional (no) fill", () => {
    expect(feeFor(FEES, "V", "taker", 0)).toBe(0);
  });
  it("adds a flat per-fill charge on top of bps", () => {
    const m: FeeModel = { default: { makerBps: 0, takerBps: 0, perFillQuote: 0.5 } };
    expect(feeFor(m, "V", "taker", 1000)).toBeCloseTo(0.5, 7);
  });
});

describe("observedThroughVolume", () => {
  const trades = [
    { price: 99, baseAmount: 5 },
    { price: 100, baseAmount: 10 }, // exactly at the resting price = a TOUCH
    { price: 101, baseAmount: 3 },
  ];
  it("counts ONLY volume strictly through a resting bid (touch excluded)", () => {
    expect(observedThroughVolume("buy", 100, trades)).toBe(5);
  });
  it("counts ONLY volume strictly through a resting ask (touch excluded)", () => {
    expect(observedThroughVolume("sell", 100, trades)).toBe(3);
  });
  it("the OPTIMISTIC includeTouch model fills MORE (proves why it is wrong)", () => {
    // Touch (10 @ 100) would be wrongly credited -> 15 vs the honest 5.
    expect(observedThroughVolume("buy", 100, trades, true)).toBe(15);
  });
});

describe("fillTaker — walks the real observed book", () => {
  it("pays the VWAP through the levels including the spread + taker fee", () => {
    const book = {
      bids: [{ price: 99, amount: 50 }],
      asks: [
        { price: 100, amount: 6 },
        { price: 101, amount: 10 },
      ],
    };
    const f = fillTaker(order({ amount: 10, limitPrice: 101 }), book, FEES);
    expect(f.filledBase).toBe(10);
    // (6*100 + 4*101)/10 = 100.4 — the spread + depth are really paid.
    expect(f.avgPrice).toBeCloseTo(100.4, 7);
    expect(f.feeQuote).toBeCloseTo((10 * 100.4 * 10) / 10_000, 6);
    expect(f.fidelity).toBe("observed-taker");
  });

  it("PARTIALLY fills when the book is too thin — never rounds up", () => {
    const book = {
      bids: [{ price: 99, amount: 50 }],
      asks: [{ price: 100, amount: 6 }],
    };
    const f = fillTaker(order({ amount: 20, limitPrice: 1000 }), book, FEES);
    expect(f.filledBase).toBe(6); // partial, capped by depth
    expect(f.avgPrice).toBeCloseTo(100, 7);
    expect(f.assumptions.some((a) => a.includes("partial"))).toBe(true);
  });

  it("does not fill past the limit price (rests, not crosses)", () => {
    const book = {
      bids: [{ price: 99, amount: 50 }],
      asks: [
        { price: 100, amount: 6 },
        { price: 105, amount: 10 },
      ],
    };
    const f = fillTaker(order({ amount: 10, limitPrice: 100 }), book, FEES);
    expect(f.filledBase).toBe(6); // 105 is beyond the limit -> unfilled
  });

  it("zero-fills against an empty book (records why)", () => {
    const f = fillTaker(order({ amount: 10, limitPrice: 100 }), { bids: [], asks: [] }, FEES);
    expect(f.filledBase).toBe(0);
    expect(f.avgPrice).toBe(0);
    expect(f.feeQuote).toBe(0);
  });
});

describe("fillMaker — the conservative modeled path", () => {
  const maker = () =>
    order({ side: "buy", liquidity: "maker", limitPrice: 100, amount: 20 });

  it("does NOT fill when the market only TOUCHED the level (the headline rule)", () => {
    // All prints exactly at the resting price = touches, never through.
    const f = fillMaker(maker(), { trades: [{ price: 100, baseAmount: 100 }] }, FEES);
    expect(f.filledBase).toBe(0);
    expect(f.fidelity).toBe("modeled-maker");
    expect(f.assumptions.some((a) => /through/i.test(a))).toBe(true);
  });

  it("fills only a queue-haircut fraction of the STRICTLY-through volume, at its limit price", () => {
    // 40 base traded strictly through 100; default haircut 0.5 -> credit 20.
    const f = fillMaker(maker(), { trades: [{ price: 99.5, baseAmount: 40 }] }, FEES);
    expect(f.filledBase).toBe(round7(40 * DEFAULT_QUEUE_HAIRCUT));
    expect(f.avgPrice).toBe(100); // fills at the RESTING price, not the print price
  });

  it("caps the credited volume at the order size (partial otherwise)", () => {
    // 200 through * 0.5 = 100 credited, but the order only wants 20.
    const f = fillMaker(
      order({ side: "buy", liquidity: "maker", limitPrice: 100, amount: 20 }),
      { trades: [{ price: 99, baseAmount: 200 }] },
      FEES,
    );
    expect(f.filledBase).toBe(20);
  });

  it("earns a maker REBATE (negative fee cost) when the venue pays one", () => {
    const f = fillMaker(maker(), { trades: [{ price: 99, baseAmount: 40 }] }, FEES);
    expect(f.feeQuote).toBeLessThan(0);
    expect(f.assumptions.some((a) => /rebate/i.test(a))).toBe(true);
  });

  it("a lower haircut credits strictly less than a higher one", () => {
    // Through-volume 20 keeps both credited amounts (4 vs 16) below the order
    // size (20) so the cap doesn't mask the haircut difference.
    const ev = { trades: [{ price: 99, baseAmount: 20 }] };
    const strict = fillMaker(maker(), ev, FEES, { queueHaircut: 0.2 });
    const loose = fillMaker(maker(), ev, FEES, { queueHaircut: 0.8 });
    expect(strict.filledBase).toBeCloseTo(4, 7);
    expect(loose.filledBase).toBeCloseTo(16, 7);
    expect(strict.filledBase).toBeLessThan(loose.filledBase);
  });
});

function round7(n: number): number {
  return Number(n.toFixed(7));
}
