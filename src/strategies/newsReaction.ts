/**
 * The news/catalyst-reaction arm.
 *
 * Proposes a directional trade ONLY on high-confidence catalysts, and ONLY
 * using catalysts already known as of the decision instant - never a headline
 * that (in real time or in a backtest) hadn't happened yet. `ctx.catalysts` is
 * expected to already be filtered by the caller, but this file re-checks
 * `publishedAt <= ctx.decisionTime` itself (belt and suspenders - an arm must
 * never trust a caller for its own no-look-ahead invariant).
 *
 * The aggregation (turning a list of raw events into one directional score +
 * confidence) is NOT reimplemented here - it is delegated to the pure scorer in
 * src/catalyst/score.ts: `scoreAsset(events, asset, asOfIso)` returns an
 * `AssetCatalystSignal` with `score` in [-1, 1] and `confidence` in [0, 1].
 * This arm's params are on a 0..100 scale, so the two are compared after a ×100
 * rescale below. (Reconciled 2026-08 against the real catalyst module, which
 * uses a richer CatalystEvent than this arm's original imagined contract.)
 */
import { scoreAsset } from "../catalyst/score";
import type { CatalystEvent } from "../catalyst/types";
import type { StrategyArm, StrategyContext, StrategyIntent } from "./types";

export const NEWS_REACTION_ARM_ID = "news-reaction";

export interface NewsReactionParams {
  /** Minimum |aggregated score| (0..100 scale) worth acting on. */
  minScoreMagnitude: number;
  /** Minimum aggregate confidence (0..100) - "high-confidence catalysts" only. */
  minConfidence: number;
  /** Target/stop distance as a fraction of entry, used when indicators.atrPct
   *  is unavailable (a catalyst reaction needs a bracket even with thin data). */
  fallbackBandPct: number;
}

export const DEFAULT_NEWS_REACTION_PARAMS: NewsReactionParams = {
  minScoreMagnitude: 40,
  minConfidence: 65,
  fallbackBandPct: 1.5,
};

export function makeNewsReactionArm(params: NewsReactionParams = DEFAULT_NEWS_REACTION_PARAMS): StrategyArm {
  return {
    id: NEWS_REACTION_ARM_ID,
    label: "News reaction",
    description:
      "Trades a high-confidence catalyst read (src/catalyst/score.ts), " +
      "using only events already known as of the decision instant. Stands aside " +
      "on low-confidence, stale, or absent catalysts.",
    kind: "news-reaction",
    supportedChains: ["stellar", "hyperliquid"],
    async propose(ctx: StrategyContext): Promise<StrategyIntent[]> {
      const entry = ctx.market.lastClose;
      if (!(entry > 0)) return [];

      // No-look-ahead, re-checked here even though the caller should have
      // already filtered: only events known by decisionTime. Asset relevance
      // (naming this base, or market-wide `assets: []`) is decided by
      // scoreAsset itself, so we do NOT pre-filter by asset here.
      // Compare as instants (Date.parse), not lexicographically: mixed ISO
      // offsets (e.g. "+02:00" vs "Z") sort wrong as strings. (Review
      // 2026-08-04, strategy-arms P2.)
      const decisionMs = Date.parse(ctx.decisionTime);
      const relevant: CatalystEvent[] = ctx.catalysts.filter(
        (e) => Date.parse(e.publishedAt) <= decisionMs,
      );
      if (relevant.length === 0) return [];

      const signal = scoreAsset(relevant, ctx.market.base, ctx.decisionTime);
      // scoreAsset returns score in [-1,1] and confidence in [0,1]; this arm's
      // params are 0..100, so rescale ×100 to compare.
      const confidence100 = signal.confidence * 100;
      const scoreMagnitude100 = Math.abs(signal.score) * 100;
      if (confidence100 < params.minConfidence) return []; // not high-confidence enough
      if (scoreMagnitude100 < params.minScoreMagnitude) return []; // too weak to act on

      const side = signal.score > 0 ? "buy" : "sell";

      // Size scales WITH the aggregate confidence - same convention as every
      // other arm - so the limits cap is a ceiling, not the target.
      const availableCapacity =
        side === "buy" ? ctx.inventory.availableQuoteBalance : ctx.inventory.availableBaseBalance * entry;
      const cappedNotional = Math.min(ctx.limits.maxNotionalQuote, availableCapacity);
      const notional = cappedNotional * signal.confidence;
      if (!(notional > 0)) return [];
      const size = notional / entry;
      if (!(size > 0)) return [];

      const bandPct = ctx.indicators.atrPct != null && ctx.indicators.atrPct > 0 ? ctx.indicators.atrPct : params.fallbackBandPct;
      const band = (bandPct / 100) * entry;
      const targetPrice = side === "buy" ? entry + band : entry - band;
      const invalidationPrice = side === "buy" ? entry - band : entry + band;
      if (!(targetPrice > 0) || !(invalidationPrice > 0)) return [];

      return [
        {
          armId: NEWS_REACTION_ARM_ID,
          side,
          base: ctx.market.base,
          quote: ctx.market.quote,
          size,
          limitPrice: entry,
          orderStyle: "taker",
          confidence: Math.round(confidence100),
          targetPrice,
          invalidationPrice,
          rationale: `Catalyst reaction: score ${signal.score.toFixed(2)} (confidence ${signal.confidence.toFixed(2)}) from ${signal.eventCount} event(s).`,
        },
      ];
    },
  };
}

/** The default instance, registered in registry.ts. */
export const newsReactionArm: StrategyArm = makeNewsReactionArm();
