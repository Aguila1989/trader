import type { BacktestResult } from "./engine";
import { computeMetrics, type Metrics } from "./metrics";

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
}

/** Pool every pair's trades into one portfolio-level metric set. */
export function aggregate(results: BacktestResult[]): Aggregate {
  const allTrades = results.flatMap((res) => res.trades);
  return {
    pairs: results.length,
    pairsWithTrades: results.filter((res) => res.trades.length > 0).length,
    metrics: computeMetrics(allTrades),
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
  lines.push(verdict(m));
  return lines.join("\n");
}

/** A blunt, honest read of the headline numbers. */
function verdict(m: Metrics): string {
  const pf = m.profitFactor;
  if (m.expectancyR > 0.05 && pf != null && pf > 1.2) {
    return `  VERDICT: positive expectancy (${r(
      m.expectancyR,
    )}/trade, PF ${pf}) AFTER costs. Promising, but small samples lie - validate out-of-sample / walk-forward before trusting it with funds.`;
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
