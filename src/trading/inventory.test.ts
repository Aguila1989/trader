import { describe, it, expect } from "vitest";
import {
  fundabilityReport,
  fundabilityFromPredicate,
  rebalancePlan,
  explainPhantomSkips,
  type PairSpec,
  type PairTarget,
  type RebalanceLimits,
  type PricedBalance,
} from "./inventory";

/**
 * Inventory manager tests: the fundability truth table (buy needs quote /
 * sell needs base), rebalance minimality + cap enforcement, and the
 * phantom-skip explainer. Pure functions throughout - no mocking needed.
 */

const XLM_USDC: PairSpec = { base: "XLM", quote: "USDC:GA5Z" };
const AQUA_XLM: PairSpec = { base: "AQUA:GBAQ", quote: "XLM" };

describe("fundabilityReport", () => {
  it("buy needs quote, sell needs base — the isFundable truth table, all-XLM wallet", () => {
    const report = fundabilityReport([{ asset: "XLM", balance: "100" }], [XLM_USDC, AQUA_XLM]);

    const xlmUsdc = report.pairs.find((p) => p.base === "XLM")!;
    expect(xlmUsdc.canSell).toBe(true); // holds XLM (the base)
    expect(xlmUsdc.canBuy).toBe(false); // no USDC (the quote)
    expect(xlmUsdc.buyBlockedReason).toMatch(/USDC/);
    expect(xlmUsdc.sellBlockedReason).toBeUndefined();

    const aquaXlm = report.pairs.find((p) => p.base.startsWith("AQUA"))!;
    expect(aquaXlm.canBuy).toBe(true); // holds XLM (the quote here)
    expect(aquaXlm.canSell).toBe(false); // no AQUA (the base)
  });

  it("both sides fundable when both legs are held", () => {
    const report = fundabilityReport(
      [
        { asset: "XLM", balance: "100" },
        { asset: "USDC:GA5Z", balance: "50" },
      ],
      [XLM_USDC],
    );
    const p = report.pairs[0]!;
    expect(p.canBuy).toBe(true);
    expect(p.canSell).toBe(true);
    expect(p.buyBlockedReason).toBeUndefined();
    expect(p.sellBlockedReason).toBeUndefined();
  });

  it("zero-balance and negative-balance rows do not count as held", () => {
    const report = fundabilityReport(
      [
        { asset: "XLM", balance: "0" },
        { asset: "USDC:GA5Z", balance: "-1" },
      ],
      [XLM_USDC],
    );
    const p = report.pairs[0]!;
    expect(p.canSell).toBe(false);
    expect(p.canBuy).toBe(false);
  });

  it("rolls up missing assets and flags dead pairs (neither leg held)", () => {
    const report = fundabilityReport([], [XLM_USDC, AQUA_XLM]);
    expect(report.missingAssets).toEqual(expect.arrayContaining(["XLM", "USDC:GA5Z", "AQUA:GBAQ"]));
    expect(report.deadPairs).toHaveLength(2);
  });

  it("fundabilityFromPredicate agrees with fundabilityReport for the same holdings", () => {
    const balances = [{ asset: "XLM", balance: "100" }];
    const fromBalances = fundabilityReport(balances, [XLM_USDC]);
    const held = (spec: string) => spec === "XLM";
    const fromPredicate = fundabilityFromPredicate(held, [XLM_USDC]);
    expect(fromPredicate).toEqual(fromBalances);
  });
});

describe("rebalancePlan", () => {
  const target: PairTarget = { base: "XLM", quote: "USDC", targetBaseSharePct: 0.5, bandPct: 0.1 };
  const limits: RebalanceLimits = { maxPerRebalanceXlm: 1000, maxPortfolioSharePct: 1, minRebalanceXlm: 0.01 };

  it("proposes nothing when the split is inside the band", () => {
    const balances: PricedBalance[] = [
      { asset: "XLM", xlmValue: 55 },
      { asset: "USDC", xlmValue: 45 },
    ]; // 55% base share; band is 40-60% -> inside
    expect(rebalancePlan(balances, [target], limits)).toEqual([]);
  });

  it("sells base back to the band edge, not all the way to target (minimal turnover)", () => {
    const balances: PricedBalance[] = [
      { asset: "XLM", xlmValue: 90 },
      { asset: "USDC", xlmValue: 10 },
    ]; // 90% base; band-high = 60% -> sell enough to land AT 60%, not 50%.
    const plan = rebalancePlan(balances, [target], limits);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.side).toBe("sell");
    expect(plan[0]!.xlmValue).toBeCloseTo(30, 5); // 90 - 0.6*100
  });

  it("buys base when quote-heavy, respecting the per-trade cap", () => {
    const balances: PricedBalance[] = [
      { asset: "XLM", xlmValue: 5 },
      { asset: "USDC", xlmValue: 95 },
    ];
    const capped: RebalanceLimits = { ...limits, maxPerRebalanceXlm: 10 };
    const plan = rebalancePlan(balances, [target], capped);
    expect(plan).toHaveLength(1);
    expect(plan[0]!.side).toBe("buy");
    expect(plan[0]!.xlmValue).toBeLessThanOrEqual(10);
  });

  it("never exceeds the max-portfolio-share cap", () => {
    const balances: PricedBalance[] = [
      { asset: "XLM", xlmValue: 100 },
      { asset: "USDC", xlmValue: 0 },
    ];
    const shareCapped: RebalanceLimits = {
      maxPerRebalanceXlm: 1000,
      maxPortfolioSharePct: 0.05,
      minRebalanceXlm: 0,
    };
    const plan = rebalancePlan(balances, [target], shareCapped);
    expect(plan[0]!.xlmValue).toBeLessThanOrEqual(5); // 5% of a 100-value portfolio
  });

  it("drops an intent that rounds below the dust floor after capping", () => {
    const balances: PricedBalance[] = [
      { asset: "XLM", xlmValue: 51 },
      { asset: "USDC", xlmValue: 49 },
    ];
    const tightTarget: PairTarget = { ...target, bandPct: 0.005 }; // band 49.5-50.5%, raw need = 0.5
    const plan = rebalancePlan(balances, [tightTarget], { ...limits, minRebalanceXlm: 5 });
    expect(plan).toEqual([]);
  });

  it("skips a pair with zero total value (a funding gap, not a rebalance)", () => {
    expect(rebalancePlan([], [target], limits)).toEqual([]);
  });
});

describe("explainPhantomSkips", () => {
  it("names the missing asset for a phantom skip", () => {
    const report = fundabilityReport([{ asset: "XLM", balance: "100" }], [{ base: "XLM", quote: "USDC" }]);
    const [msg] = explainPhantomSkips([{ base: "XLM", quote: "USDC", side: "buy" }], report);
    expect(msg).toMatch(/USDC/);
    expect(msg).toMatch(/PHANTOM/);
  });

  it("references a matching queued rebalance intent with its size", () => {
    const report = fundabilityReport([{ asset: "XLM", balance: "100" }], [{ base: "XLM", quote: "USDC" }]);
    const plan = [
      { base: "XLM", quote: "USDC", side: "sell" as const, xlmValue: 12.5, reason: "x" },
    ];
    const [msg] = explainPhantomSkips([{ base: "XLM", quote: "USDC", side: "buy" }], report, plan);
    expect(msg).toMatch(/12.5/);
  });

  it("reports the skip may no longer be phantom once the wallet is fundable", () => {
    const report = fundabilityReport(
      [
        { asset: "XLM", balance: "100" },
        { asset: "USDC", balance: "50" },
      ],
      [{ base: "XLM", quote: "USDC" }],
    );
    const [msg] = explainPhantomSkips([{ base: "XLM", quote: "USDC", side: "buy" }], report);
    expect(msg).toMatch(/CAN fund/);
  });
});
