import { describe, it, expect } from "vitest";
import { parseProposal } from "./agent";

const USDC = "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";

/** A complete propose_stellar_trade tool input, minus post_only. */
function input(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    side: "buy",
    base_asset: "XLM",
    quote_asset: USDC,
    amount: "10",
    limit_price: "0.48",
    max_slippage_bps: 20,
    reason: "range support",
    confidence: "high",
    target_price: "0.52",
    invalidation_price: "0.46",
    ...over,
  };
}

describe("parseProposal post_only fail-safe", () => {
  it("defaults postOnly to TRUE when post_only is omitted (cheaper/safer maker path)", () => {
    const p = parseProposal(input());
    expect(p).not.toBeNull();
    expect(p!.postOnly).toBe(true);
  });

  it("keeps postOnly TRUE when post_only is explicitly true", () => {
    const p = parseProposal(input({ post_only: true }));
    expect(p!.postOnly).toBe(true);
  });

  it("sets postOnly FALSE only when post_only is explicitly false (opt into crossing)", () => {
    const p = parseProposal(input({ post_only: false }));
    expect(p!.postOnly).toBe(false);
  });

  it("treats a non-boolean / truthy junk value as maker (fail-safe to true)", () => {
    // Only an explicit `false` opts into crossing; anything else stays maker.
    expect(parseProposal(input({ post_only: "false" }))!.postOnly).toBe(true);
    expect(parseProposal(input({ post_only: 0 }))!.postOnly).toBe(true);
    expect(parseProposal(input({ post_only: null }))!.postOnly).toBe(true);
  });
});
