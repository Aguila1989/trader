import { describe, it, expect } from "vitest";
import { reconcileStellarFill } from "./reconcile";
import type { OfferResultLike } from "../../stellar/signer";
import type { TradeProposal } from "../../types";

function proposal(over: Partial<TradeProposal>): TradeProposal {
  return {
    id: "t",
    createdAt: "",
    updatedAt: "",
    side: "buy",
    baseAsset: "XLM",
    quoteAsset: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    amount: "100",
    limitPrice: "0.5",
    maxSlippageBps: 10,
    reason: "",
    status: "proposed",
    policyViolations: [],
    ...over,
  };
}

describe("reconcileStellarFill", () => {
  it("returns null when there are no offer results (timeout path)", () => {
    expect(reconcileStellarFill(proposal({}), undefined)).toBeNull();
    expect(reconcileStellarFill(proposal({}), [])).toBeNull();
  });

  it("books a BUY fill: received base, paid quote -> price = paid/received", () => {
    const results: OfferResultLike[] = [{ amountBought: 100, amountSold: 50 }];
    const fill = reconcileStellarFill(proposal({ side: "buy", amount: "100", limitPrice: "0.5" }), results);
    expect(fill).not.toBeNull();
    expect(fill!.filledBase).toBeCloseTo(100, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.5, 7); // 50 quote / 100 base
  });

  it("books a SELL fill: sold base, received quote -> price = received/sold", () => {
    const results: OfferResultLike[] = [{ amountBought: 50, amountSold: 100 }];
    const fill = reconcileStellarFill(proposal({ side: "sell", amount: "100", limitPrice: "0.5" }), results);
    expect(fill!.filledBase).toBeCloseTo(100, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.5, 7);
  });

  it("reports a resting-only outcome as filledBase 0 at the limit price", () => {
    const results: OfferResultLike[] = [
      { amountBought: 0, amountSold: 0, currentOffer: { offerId: 4242 } },
    ];
    const fill = reconcileStellarFill(proposal({ side: "buy", limitPrice: "0.5" }), results);
    expect(fill).toEqual({ filledBase: 0, avgPrice: 0.5, restingOrderId: "4242" });
  });

  it("captures the resting offer id on a partial fill", () => {
    const results: OfferResultLike[] = [
      { amountBought: 40, amountSold: 20, currentOffer: { offerId: "999" } },
    ];
    const fill = reconcileStellarFill(proposal({ side: "buy", amount: "100", limitPrice: "0.5" }), results);
    expect(fill!.filledBase).toBeCloseTo(40, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.5, 7);
    expect(fill!.restingOrderId).toBe("999");
  });

  it("sums defensively across multiple result slots", () => {
    const results: OfferResultLike[] = [
      { amountBought: 30, amountSold: 15 },
      { amountBought: 30, amountSold: 15 },
    ];
    const fill = reconcileStellarFill(proposal({ side: "buy", amount: "100", limitPrice: "0.5" }), results);
    expect(fill!.filledBase).toBeCloseTo(60, 7);
    expect(fill!.avgPrice).toBeCloseTo(0.5, 7);
  });
});
