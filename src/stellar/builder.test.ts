import { describe, it, expect, vi } from "vitest";
import type { TradeProposal } from "../types";

const USDC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
// A valid ed25519 public key for the trading account (used only to build the tx).
const PUB = vi.hoisted(() => "GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2");

vi.mock("../config", () => ({
  config: {
    stellarPublic: PUB,
    networkPassphrase: "Test SDF Network ; September 2015",
    limits: { maxFeeStroops: 100_000 },
  },
}));

// Avoid a Horizon round-trip: hand the builder a synthetic, valid Account.
vi.mock("./client", async () => {
  const actual = await vi.importActual<typeof import("@stellar/stellar-sdk")>(
    "@stellar/stellar-sdk",
  );
  return { horizon: { loadAccount: vi.fn(async () => new actual.Account(PUB, "1")) } };
});

const { buildOfferTransaction } = await import("./builder");

function proposal(over: Partial<TradeProposal>): TradeProposal {
  return {
    id: "t",
    createdAt: "",
    updatedAt: "",
    side: "buy",
    baseAsset: "XLM",
    quoteAsset: USDC,
    amount: "100",
    limitPrice: "0.5",
    maxSlippageBps: 10,
    reason: "",
    status: "proposed",
    policyViolations: [],
    ...over,
  };
}

describe("buildOfferTransaction price/side convention", () => {
  it("sell base -> manageSellOffer(selling=base, buying=quote) at quote-per-base price", async () => {
    const tx = await buildOfferTransaction(
      proposal({ side: "sell", baseAsset: "XLM", quoteAsset: USDC, amount: "100", limitPrice: "0.5" }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = tx.operations[0] as any;
    expect(op.type).toBe("manageSellOffer");
    expect(op.selling.isNative()).toBe(true);
    expect(op.buying.getCode()).toBe("USDC");
    expect(Number(op.amount)).toBeCloseTo(100, 7);
    expect(Number(op.price)).toBeCloseTo(0.5, 7);
  });

  it("buy base -> manageBuyOffer(selling=quote, buying=base) at quote-per-base price", async () => {
    const tx = await buildOfferTransaction(
      proposal({ side: "buy", baseAsset: "XLM", quoteAsset: USDC, amount: "100", limitPrice: "0.5" }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const op = tx.operations[0] as any;
    expect(op.type).toBe("manageBuyOffer");
    expect(op.selling.getCode()).toBe("USDC");
    expect(op.buying.isNative()).toBe(true);
    expect(Number(op.buyAmount)).toBeCloseTo(100, 7);
    expect(Number(op.price)).toBeCloseTo(0.5, 7);
  });

  it("bids the MAX_FEE_STROOPS cap as the per-operation fee", async () => {
    const tx = await buildOfferTransaction(proposal({ side: "sell" }));
    // One operation, so the tx fee equals the per-op bid.
    expect(tx.fee).toBe("100000");
  });
});
