/**
 * The funding-carry arm - a STRUCTURAL, non-prediction strategy.
 *
 * Every other arm in this package is trying to predict a price move. This one
 * deliberately isn't: a perpetual-futures funding rate is a periodic cash
 * payment between longs and shorts that exists to keep the perp price
 * anchored to spot, independent of which way the price actually goes next.
 * When that rate is persistently lopsided, the side of the trade that's BEING
 * PAID has a real, measurable edge that has nothing to do with forecasting -
 * it earns a PAYMENT, not a price call. That is the entire thesis here, and
 * it is why this arm is worth measuring separately from the directional ones:
 * if it has edge, it should show up as low-variance, funding-period-shaped
 * returns, not the lumpy win/loss pattern a directional call produces.
 *
 * Sign convention (see FundingSnapshot in ./types): `rate` > 0 means longs pay
 * shorts (a SHORT earns the payment); `rate` < 0 means shorts pay longs (a
 * LONG earns it). "Sell to open short" / "buy to open long" is the standard
 * perp convention this arm assumes.
 *
 * Needs a perp venue. Today that's Hyperliquid (src/chains/hyperliquid) - spot
 * Stellar has no funding mechanism at all. Calling this arm for a chain that
 * isn't funding-capable is a caller bug (it should have been filtered out via
 * `supportedChains`), so that case THROWS. A funding-capable chain with no
 * funding reading available RIGHT NOW (`ctx.funding` undefined - a transient
 * data gap) is a normal, expected condition, so that case STANDS ASIDE
 * (returns no intents) rather than throwing.
 */
import type { StrategyArm, StrategyContext, StrategyIntent } from "./types";

export const FUNDING_CARRY_ARM_ID = "funding-carry";

/** The only chain this arm can operate on today (perp funding needs a perp venue). */
const FUNDING_CAPABLE_CHAIN = "hyperliquid";

export interface FundingCarryParams {
  /** Minimum |funding rate| PER INTERVAL (fraction, e.g. 0.0003 = 3bp) worth
   *  entering for, before even checking cost-adjusted edge. */
  entryRateThreshold: number;
  /** Exit once the (trailing-mean, when available) |rate| falls at/below
   *  this - the payment has "normalized" and the edge is gone. */
  exitRateThreshold: number;
  /** Assumed number of funding intervals the position will be held, for
   *  amortizing the round-trip trading cost against the harvested payments.
   *  This is what makes entry COST-AWARE rather than a bare rate threshold:
   *  a juicy rate that can't clear costs over a realistic hold is not a trade. */
  minHoldIntervals: number;
  /** Adverse move on the underlying mark, as a % of entry, that exits the
   *  position regardless of funding (the payment is never worth an unbounded
   *  directional loss on the underlying). */
  maxAdverseMovePct: number;
}

export const DEFAULT_FUNDING_CARRY_PARAMS: FundingCarryParams = {
  entryRateThreshold: 0.0003,
  exitRateThreshold: 0.00005,
  minHoldIntervals: 8,
  maxAdverseMovePct: 3,
};

/** Round-trip taker cost as a fraction of notional (entry + exit), from the
 *  same slippage budget every other arm sizes against. */
function roundTripCostFraction(ctx: StrategyContext): number {
  return 2 * (ctx.limits.maxSlippageBps / 10_000);
}

/** Direction that EARNS the current funding payment: "sell" (open short) when
 *  longs pay shorts (rate > 0); "buy" (open long) when shorts pay longs. */
function earningSide(rate: number): "buy" | "sell" {
  return rate > 0 ? "sell" : "buy";
}

export function makeFundingCarryArm(params: FundingCarryParams = DEFAULT_FUNDING_CARRY_PARAMS): StrategyArm {
  return {
    id: FUNDING_CARRY_ARM_ID,
    label: "Funding carry (Hyperliquid)",
    description:
      "Harvests perpetual-futures funding payments when the rate is persistently " +
      "lopsided net of round-trip trading cost. Earns a PAYMENT, not a price move - " +
      "measured separately from the directional arms on purpose.",
    kind: "funding-carry",
    supportedChains: [FUNDING_CAPABLE_CHAIN],
    async propose(ctx: StrategyContext): Promise<StrategyIntent[]> {
      if (ctx.chain !== FUNDING_CAPABLE_CHAIN) {
        // Caller error: this arm was routed to a chain with no funding
        // mechanism at all. supportedChains should have filtered this out.
        throw new Error(
          `funding-carry arm invoked for chain "${ctx.chain}", which has no funding mechanism (needs "${FUNDING_CAPABLE_CHAIN}").`,
        );
      }
      if (!ctx.funding) {
        // Funding-capable chain, but no reading available this tick - a
        // normal transient gap, not an error. Stand aside.
        return [];
      }
      // Belt-and-suspenders no-look-ahead: never act on a funding reading dated
      // after the decision instant (an off-by-one bar / tz mismatch would
      // manufacture look-ahead edge). Mirrors newsReaction's re-check.
      // (Review 2026-08-04, strategy-arms P2.)
      if (Date.parse(ctx.funding.asOf) > Date.parse(ctx.decisionTime)) return [];

      const { rate, trailingMeanRate } = ctx.funding;
      const entry = ctx.market.lastClose;
      if (!(entry > 0)) return [];

      const holding = ctx.inventory.netBaseQty;
      const isHolding = holding !== 0;

      if (isHolding) {
        const heldSide: "buy" | "sell" = holding > 0 ? "buy" : "sell";
        const normalizeRate = trailingMeanRate ?? rate;
        const normalized = Math.abs(normalizeRate) <= params.exitRateThreshold;
        // The position no longer earns when the earning side has flipped
        // away from the side we're actually holding.
        const flipped = earningSide(rate) !== heldSide;

        const avgEntry = ctx.inventory.avgEntryPrice;
        let adverseMoveBreached = false;
        if (avgEntry != null && avgEntry > 0) {
          const movePct = ((entry - avgEntry) / avgEntry) * 100;
          adverseMoveBreached =
            heldSide === "buy" ? movePct <= -params.maxAdverseMovePct : movePct >= params.maxAdverseMovePct;
        }

        if (normalized || flipped || adverseMoveBreached) {
          const closeSide: "buy" | "sell" = heldSide === "buy" ? "sell" : "buy";
          const size = Math.abs(holding);
          const reason = adverseMoveBreached
            ? `Funding-carry exit: adverse move on the underlying past ${params.maxAdverseMovePct}%.`
            : flipped
              ? `Funding-carry exit: funding flipped away from the held side (rate ${rate}).`
              : `Funding-carry exit: rate normalized to ${normalizeRate} (<= ${params.exitRateThreshold}).`;
          return [
            {
              armId: FUNDING_CARRY_ARM_ID,
              side: closeSide,
              base: ctx.market.base,
              quote: ctx.market.quote,
              size,
              limitPrice: entry,
              orderStyle: "taker",
              confidence: 70,
              targetPrice: entry,
              invalidationPrice: entry,
              // This CLOSES the held position - it must never be read as a
              // fresh directional open (see StrategyIntent.reduceOnly).
              reduceOnly: true,
              rationale: reason,
            },
          ];
        }
        return []; // still earning, still within the loss bound - hold
      }

      // Flat: consider entering only if the rate clears BOTH the raw
      // threshold and the amortized round-trip cost over the assumed hold.
      if (Math.abs(rate) < params.entryRateThreshold) return [];
      const expectedPaymentFraction = Math.abs(rate) * params.minHoldIntervals;
      const netEdge = expectedPaymentFraction - roundTripCostFraction(ctx);
      if (!(netEdge > 0)) return [];

      const side = earningSide(rate);

      // Confidence scales with how far past cost the edge sits (capped) -
      // this is a structural payment, not a forecast, so it never claims the
      // AI-style "high conviction" band the directional arm uses.
      const confidence = Math.min(75, 40 + Math.round((netEdge / roundTripCostFraction(ctx) || 1) * 10));

      // Size scales WITH that conviction, same as every other arm - the
      // limits cap is a ceiling, not the target.
      // Funding-carry only runs on a perp venue (FUNDING_CAPABLE_CHAIN), which
      // is QUOTE-margined: a flat account holds USDC margin and zero base units,
      // so BOTH a long and a short are sized against quote capacity. (Review
      // 2026-08-04, strategy-arms P1 — the old base-balance model sized every
      // short to 0, silently killing the more common half of the strategy.)
      // TODO(hl-verify): once HeldInventory expresses margin-based capacity +
      // leverage for perps, size against that rather than raw quote balance.
      const availableCapacity = ctx.inventory.availableQuoteBalance;
      const cappedNotional = Math.min(ctx.limits.maxNotionalQuote, availableCapacity);
      const notional = cappedNotional * (confidence / 100);
      if (!(notional > 0)) return [];
      const size = notional / entry;
      if (!(size > 0)) return [];

      return [
        {
          armId: FUNDING_CARRY_ARM_ID,
          side,
          base: ctx.market.base,
          quote: ctx.market.quote,
          size,
          limitPrice: entry,
          orderStyle: "taker",
          confidence,
          targetPrice: entry,
          invalidationPrice:
            side === "buy" ? entry * (1 - params.maxAdverseMovePct / 100) : entry * (1 + params.maxAdverseMovePct / 100),
          rationale: `Funding-carry entry: rate ${rate}/interval, net edge ${(netEdge * 100).toFixed(3)}% over ${params.minHoldIntervals} intervals after cost.`,
        },
      ];
    },
  };
}

/** The default instance, registered in registry.ts. */
export const fundingCarryArm: StrategyArm = makeFundingCarryArm();
