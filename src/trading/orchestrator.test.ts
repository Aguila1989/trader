import { describe, it, expect } from "vitest";
import { reconcileOfferFill, simulatePaperFill } from "./orchestrator";
import type { PolicyContext, TradeProposal } from "../types";

function proposal(over: Partial<TradeProposal> = {}): TradeProposal {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    side: "buy",
    baseAsset: "XLM",
    quoteAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    amount: "10",
    limitPrice: "0.5",
    maxSlippageBps: 50,
    reason: "test",
    status: "submitting",
    policyViolations: [],
    ...over,
  };
}

describe("reconcileOfferFill", () => {
  it("returns null when no offerResults are present (timeout/poll path)", () => {
    expect(reconcileOfferFill(proposal(), undefined)).toBeNull();
    expect(reconcileOfferFill(proposal(), [])).toBeNull();
  });

  it("books a full buy fill with the volume-weighted price", () => {
    // Bought 10 XLM (base) for 4.8 USDC -> avg 0.48, better than the 0.5 limit.
    const fill = reconcileOfferFill(proposal(), [
      { amountBought: 10, amountSold: 4.8 },
    ]);
    expect(fill).not.toBeNull();
    expect(fill!.filledBase).toBeCloseTo(10, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.48, 7);
    expect(fill!.offerId).toBeUndefined();
  });

  it("books a full sell fill (sold = base leg, bought = quote leg)", () => {
    const fill = reconcileOfferFill(proposal({ side: "sell" }), [
      { amountSold: 10, amountBought: 5.2 },
    ]);
    expect(fill!.filledBase).toBeCloseTo(10, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.52, 7);
  });

  it("books a partial fill and carries the resting offer id", () => {
    const fill = reconcileOfferFill(proposal(), [
      {
        amountBought: 4,
        amountSold: 2.2,
        currentOffer: { offerId: 123456 },
      },
    ]);
    expect(fill!.filledBase).toBeCloseTo(4, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.55, 7);
    expect(fill!.offerId).toBe("123456");
  });

  it("books ZERO (not a full fill) when the order rested unfilled", () => {
    const fill = reconcileOfferFill(proposal(), [
      { amountBought: 0, amountSold: 0, currentOffer: { offerId: "987" } },
    ]);
    expect(fill!.filledBase).toBe(0);
    expect(fill!.avgPrice).toBeCloseTo(0.5, 7); // falls back to the limit
    expect(fill!.offerId).toBe("987");
  });

  it("sums defensively across multiple result slots", () => {
    const fill = reconcileOfferFill(proposal(), [
      { amountBought: 4, amountSold: 2 },
      { amountBought: 6, amountSold: 3.1 },
    ]);
    expect(fill!.filledBase).toBeCloseTo(10, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.51, 7);
  });
});

describe("simulatePaperFill", () => {
  const ctx: PolicyContext = {
    bestBid: 0.49,
    bestAsk: 0.5,
    asks: [
      { price: 0.5, amount: 6 },
      { price: 0.55, amount: 10 },
    ],
    bids: [
      { price: 0.49, amount: 6 },
      { price: 0.45, amount: 10 },
    ],
  };

  it("walks the ASK side for a buy and returns the size-weighted price", () => {
    // 6 @ 0.50 + 4 @ 0.55 = 5.2 / 10 = 0.52 (worse than the touch - that's the
    // spread + impact a flat-cost backtest never charges you).
    const fill = simulatePaperFill(proposal({ amount: "10" }), ctx);
    expect(fill).not.toBeNull();
    expect(fill!.filledBase).toBeCloseTo(10, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.52, 7);
  });

  it("walks the BID side for a sell", () => {
    // 6 @ 0.49 + 4 @ 0.45 = 4.74 / 10 = 0.474.
    const fill = simulatePaperFill(proposal({ side: "sell", amount: "10" }), ctx);
    expect(fill!.avgPrice).toBeCloseTo(0.474, 7);
  });

  it("fills only what the book can absorb (partial)", () => {
    const fill = simulatePaperFill(proposal({ amount: "100" }), ctx);
    expect(fill!.filledBase).toBeCloseTo(16, 7); // 6 + 10 visible
  });

  it("returns null when there is no book to fill against", () => {
    expect(simulatePaperFill(proposal(), {})).toBeNull();
    expect(simulatePaperFill(proposal(), { asks: [] })).toBeNull();
  });

  it("returns null for a non-positive amount", () => {
    expect(simulatePaperFill(proposal({ amount: "0" }), ctx)).toBeNull();
  });
});
