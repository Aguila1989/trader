import type { BacktestResult } from "./engine";
import {
  computeMetrics,
  expectancyCI,
  type ExpectancyCI,
  type Metrics,
} from "./metrics";
import type { WalkForwardResult } from "./walkforward";
import { kellyFromMetrics, type KellySizing } from "./sizing";

/**
 * Plain-text console report. No colors or external deps - readable in any
 * terminal and in piped logs. The headline question this answers is not "did it
 * trade" but "is there an edge once costs are paid": look at expectancy (avg R)
 * and profit factor first, then how many signals the gates killed.
 */

function pad(s: string, w: number): string {
  return s.length >= w ? s : s + " ".repeat(w - s.length);
}
function padL(s: string, w: number): string {
  return s.length >= w ? s : " ".repeat(w - s.length) + s;
}
function pct(n: number | null): string {
  if (n == null) return "n/a";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function r(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
}

/** Dispersion + significance: the "is this an edge, or just luck" line. */
function statsLine(m: Metrics): string {
  const t = m.tStat === null ? "n/a" : m.tStat.toFixed(2);
  return `  stats: stdev=${m.stdDevR.toFixed(2)}R  Sharpe/trade=${m.sharpePerTrade.toFixed(
    2,
  )}  t=${t}  (|t|>~2 ~ 95% it isn't noise)`;
}

/** 95% bootstrap CI on expectancy + a plain read of whether it clears 0. */
function ciLine(ci: ExpectancyCI | null): string {
  if (!ci) return `  95% CI: n/a (need >=2 trades)`;
  const read =
    ci.lowerR > 0
      ? "edge holds at 95%"
      : ci.upperR < 0
        ? "negative at 95%"
        : "spans 0 - NOT proven";
  return `  95% CI (bootstrap) on expectancy: [${r(ci.lowerR)}, ${r(
    ci.upperR,
  )}] -> ${read}`;
}

/** One-line summary of where signals went, the crux of "why no trades". */
function funnelLine(res: BacktestResult): string {
  const gated = res.skippedByGate.volume;
  return `signals=${res.signals} -> gatedByVolume=${gated} -> trades=${res.trades.length}`;
}

export function formatResult(res: BacktestResult, m: Metrics): string {
  const lines: string[] = [];
  lines.push(`\n=== ${res.pair} ===`);
  lines.push(
    `  data: ${res.candles} candles  ${res.firstTime ?? "?"} -> ${res.lastTime ?? "?"}`,
  );
  lines.push(`  funnel: ${funnelLine(res)}`);
  if (m.trades === 0) {
    lines.push(
      `  no trades. ${
        res.signals === 0
          ? "The strategy never produced a signal on this history (regime/RSI/range conditions never aligned)."
          : "Every signal was filtered by the liquidity gate - this market is too thin to trade under the live rules."
      }`,
    );
    lines.push(`  buy & hold over window: ${pct(res.buyHoldPct)}`);
    return lines.join("\n");
  }

  lines.push(
    `  trades=${m.trades}  win%=${m.winRatePct}  (W:${m.wins} L:${m.losses} scratch:${m.scratches})`,
  );
  lines.push(
    `  expectancy=${r(m.expectancyR)}/trade  totalR=${r(m.totalR)}  profitFactor=${
      m.profitFactor ?? "n/a"
    }`,
  );
  lines.push(statsLine(m));
  lines.push(ciLine(expectancyCI(res.trades)));
  lines.push(
    `  avgWin=${r(m.avgWinR)} (${pct(m.avgWinPct)})  avgLoss=${r(m.avgLossR)} (${pct(
      m.avgLossPct,
    )})`,
  );
  lines.push(
    `  best=${r(m.bestR)}  worst=${r(m.worstR)}  maxDD=${m.maxDrawdownR.toFixed(
      2,
    )}R  avgHold=${m.avgBarsHeld} bars`,
  );
  const exits = Object.entries(m.exitReasons)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  lines.push(`  exits: ${exits}`);
  lines.push(
    `  buy & hold over window: ${pct(res.buyHoldPct)}  (strategy is fixed-risk per trade, not fully invested - context only)`,
  );
  return lines.join("\n");
}

export interface Aggregate {
  pairs: number;
  pairsWithTrades: number;
  metrics: Metrics;
  ci: ExpectancyCI | null;
}

/** Pool every pair's trades into one portfolio-level metric set. */
export function aggregate(results: BacktestResult[]): Aggregate {
  const allTrades = results.flatMap((res) => res.trades);
  return {
    pairs: results.length,
    pairsWithTrades: results.filter((res) => res.trades.length > 0).length,
    metrics: computeMetrics(allTrades),
    ci: expectancyCI(allTrades),
  };
}

export function formatAggregate(agg: Aggregate): string {
  const m = agg.metrics;
  const lines: string[] = [];
  lines.push(`\n${"=".repeat(60)}`);
  lines.push(`PORTFOLIO (all pairs pooled)`);
  lines.push(`${"=".repeat(60)}`);
  lines.push(
    `  pairs=${agg.pairs}  withTrades=${agg.pairsWithTrades}  totalTrades=${m.trades}`,
  );
  if (m.trades === 0) {
    lines.push(
      `  ZERO trades across the whole universe. Under these rules + gates, on this`,
    );
    lines.push(
      `  history, the bot would correctly have stood flat. That is the answer to`,
    );
    lines.push(
      `  "still no trades": it is the design working, not a bug. Loosen the gates`,
    );
    lines.push(`  only with evidence, not to manufacture activity.`);
    return lines.join("\n");
  }
  lines.push(
    `  win%=${m.winRatePct}  (W:${m.wins} L:${m.losses} scratch:${m.scratches})`,
  );
  lines.push(
    `  EXPECTANCY=${r(m.expectancyR)}/trade   TOTAL=${r(m.totalR)}   PROFIT FACTOR=${
      m.profitFactor ?? "n/a"
    }`,
  );
  lines.push(statsLine(m));
  lines.push(ciLine(agg.ci));
  lines.push(
    `  avgWin=${r(m.avgWinR)}  avgLoss=${r(m.avgLossR)}  maxDD=${m.maxDrawdownR.toFixed(
      2,
    )}R  avgHold=${m.avgBarsHeld} bars`,
  );
  const exits = Object.entries(m.exitReasons)
    .map(([k, v]) => `${k}:${v}`)
    .join(" ");
  lines.push(`  exits: ${exits}`);
  lines.push("");
  lines.push(verdict(m, agg.ci));
  return lines.join("\n");
}

/**
 * Walk-forward report for one pair. The OUT-OF-SAMPLE block is the only number
 * that earns belief; the in-sample line is shown purely to expose the gap
 * between "fitted" and "real" - a big gap IS the overfitting, made visible.
 */
export function formatWalkForward(
  label: string,
  wf: WalkForwardResult,
): string {
  const m = wf.oosMetrics;
  const lines: string[] = [];
  lines.push(`\n=== ${label} ===  [walk-forward]`);
  lines.push(
    `  folds: ${wf.folds.length} (traded ${wf.tradedFolds}, positive OOS ${wf.positiveFolds}/${wf.tradedFolds})`,
  );
  const inSample =
    wf.folds.filter((f) => f.params).length > 0
      ? avg(wf.folds.filter((f) => f.params).map((f) => f.trainExpectancyR))
      : 0;
  lines.push(
    `  in-sample (train, overfit-prone): avg expectancy ${r(inSample)}/trade`,
  );
  if (m.trades === 0) {
    lines.push(`  OUT-OF-SAMPLE: no trades on any unseen slice.`);
    return lines.join("\n");
  }
  lines.push(
    `  OUT-OF-SAMPLE (the honest number): trades=${m.trades} win%=${m.winRatePct} ` +
      `expectancy=${r(m.expectancyR)} PF=${m.profitFactor ?? "n/a"} totalR=${r(
        m.totalR,
      )} maxDD=${m.maxDrawdownR.toFixed(2)}R`,
  );
  const ci = expectancyCI(wf.oosTrades);
  lines.push(statsLine(m));
  lines.push(ciLine(ci));
  const k = kellyFromMetrics(m);
  lines.push(`  sizing (Kelly on OOS edge): ${sizingLine(k)}`);
  lines.push(`  ${wfVerdict(wf, ci)}`);
  return lines.join("\n");
}

function sizingLine(k: KellySizing): string {
  return `payoff b=${k.payoffRatio}, fullKelly=${(k.fullKelly * 100).toFixed(
    1,
  )}% -> recommend ${(k.recommendedRiskFraction * 100).toFixed(2)}% risk/trade. ${k.note}`;
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}

/**
 * Verdict that weighs OOS expectancy, cross-fold consistency, AND statistical
 * significance. A positive point estimate is necessary but NOT sufficient: with
 * tens of trades, +0.4R can sit comfortably inside a CI that still includes 0.
 * "SURVIVES" is reserved for an edge whose 95% bootstrap CI clears zero.
 */
function wfVerdict(wf: WalkForwardResult, ci: ExpectancyCI | null): string {
  const e = wf.oosMetrics.expectancyR;
  const consistent =
    wf.tradedFolds > 0 && wf.positiveFolds / wf.tradedFolds >= 0.6;
  const significant = ci != null && ci.lowerR > 0;
  const ciTxt = ci ? ` 95% CI [${r(ci.lowerR)}, ${r(ci.upperR)}],` : "";
  if (e > 0.05 && consistent && significant) {
    return `VERDICT: edge SURVIVES walk-forward (${r(
      e,
    )}/trade OOS,${ciTxt} positive in ${wf.positiveFolds}/${wf.tradedFolds} folds). The rare good outcome - size it per the Kelly line, start small, keep validating live.`;
  }
  if (e > 0.05 && consistent && !significant) {
    return `VERDICT: PROMISING but NOT yet significant - positive OOS (${r(
      e,
    )}/trade) and consistent across ${wf.positiveFolds}/${wf.tradedFolds} folds, but the${ciTxt} interval still includes 0. ${wf.oosMetrics.trades} trades can't rule out luck. Paper-trade to grow the sample; don't size up yet.`;
  }
  if (e > 0 && !consistent) {
    return `VERDICT: fragile - positive OOS on average (${r(
      e,
    )}) but only ${wf.positiveFolds}/${wf.tradedFolds} folds held up. One window is carrying it; not dependable.`;
  }
  return `VERDICT: NO durable edge - out-of-sample expectancy ${r(
    e,
  )}/trade. The in-sample optimum did not generalize. This is overfitting caught in the act; do not trade it.`;
}

/** A blunt, honest read of the headline numbers, gated on significance. */
function verdict(m: Metrics, ci: ExpectancyCI | null): string {
  const pf = m.profitFactor;
  const significant = ci != null && ci.lowerR > 0;
  const ciTxt = ci ? ` 95% CI [${r(ci.lowerR)}, ${r(ci.upperR)}]` : "";
  if (m.expectancyR > 0.05 && pf != null && pf > 1.2 && significant) {
    return `  VERDICT: positive expectancy (${r(
      m.expectancyR,
    )}/trade, PF ${pf},${ciTxt}) AFTER costs. Promising - but this is in-sample; confirm out-of-sample / walk-forward before funding.`;
  }
  if (m.expectancyR > 0.05 && pf != null && pf > 1.2 && !significant) {
    return `  VERDICT: positive point estimate (${r(
      m.expectancyR,
    )}/trade, PF ${pf}) but the${ciTxt} interval includes 0 - not distinguishable from noise at this sample size. Not proven; do not fund it.`;
  }
  if (m.expectancyR <= 0 || (pf != null && pf < 1)) {
    return `  VERDICT: NO edge - expectancy is ${r(
      m.expectancyR,
    )}/trade after costs (PF ${pf ?? "n/a"}). This strategy loses money on this history. Do not run it live as-is.`;
  }
  return `  VERDICT: marginal - expectancy ${r(
    m.expectancyR,
  )}/trade (PF ${pf ?? "n/a"}). Too thin an edge to survive real-world frictions and variance. Treat as "not proven".`;
}
