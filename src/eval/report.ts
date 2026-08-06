import type { ArmAttribution, EvalConfig, EvalVerdict, PaperFill } from "./types";
import { armKeyOf } from "./types";
import { type CellState, type RunState, openCellCount } from "./state";

/**
 * Renders the Phase 4 "does it work / how well / how to improve" report as
 * markdown + a trades CSV. Pure and deterministic: every timestamp is
 * INJECTED (`generatedAtIso`), nothing here calls Date.now(), and the same
 * RunState + deps always produce byte-identical output. The caller (not this
 * module) decides where the strings end up on disk.
 *
 * Like controller.ts, `summarize` / `verdictFor` / `attribute` are injected
 * rather than imported by static path from the sibling src/eval/{stats,
 * attribution}.ts modules (being written in parallel) - this file is typed
 * against the shared, already-real ./types vocabulary, but never depends on
 * those two files existing to typecheck or to run its own tests. See the
 * assumptions returned by this builder for the exact contract expected of
 * each, and integrationSpec for how the real functions get wired in.
 *
 * The Honesty block's "NO PROVEN EDGE" wording is derived HERE, directly
 * from `summary.ci.excludesZero` - not solely from the injected `verdictFor`
 * - so that mandated plain-language statement can never silently drift from
 * whatever wording a stats.ts implementation happens to choose.
 */

export interface EvalSummary {
  trades: number;
  netPnlXlm: number;
  /** Average R-multiple across trades that carried a stop; null when none did. */
  expectancyR: number | null;
  tStat: number | null;
  ci: { lowerR: number; upperR: number; excludesZero: boolean } | null;
  hitRatePct: number;
  maxDrawdownXlm: number;
  sharpePerTrade: number | null;
  /** ArmAttribution.modeledTrades passthrough - the fill-fidelity honesty signal. */
  modeledTrades: number;
}

export interface Verdict {
  verdict: EvalVerdict;
  headline: string;
}

export interface ReportDeps {
  /** src/eval/attribution.ts - FIFO-matches one cell's raw fill ledger. */
  attribute(fills: PaperFill[]): Promise<ArmAttribution> | ArmAttribution;
  /** src/eval/stats.ts - wraps an ArmAttribution into the significance-tested
   *  summary numbers (bootstrap CI, t-stat, Sharpe). */
  summarize(attribution: ArmAttribution, config: EvalConfig): Promise<EvalSummary> | EvalSummary;
  /** src/eval/stats.ts - the tradeable / no-edge / inconclusive call, at the
   *  multiplicity-adjusted confidence level. */
  verdictFor(
    summary: EvalSummary,
    config: EvalConfig,
    numComparisons: number,
  ): Promise<Verdict> | Verdict;
}

export interface RenderReportOptions {
  state: RunState;
  deps: ReportDeps;
  /** Injected "now" for the report header - never Date.now() inside this module. */
  generatedAtIso: string;
  armLabels?: Record<string, string>;
  venueLabels?: Record<string, string>;
}

export interface RenderedReport {
  markdown: string;
  tradesCsv: string;
}

interface CellData {
  cell: CellState;
  attribution: ArmAttribution;
  summary: EvalSummary;
}

export async function renderReport(opts: RenderReportOptions): Promise<RenderedReport> {
  const { state, deps, generatedAtIso } = opts;
  const armLabel = (id: string) => opts.armLabels?.[id] ?? id;
  const venueLabel = (id: string) => opts.venueLabels?.[id] ?? id;

  const cells = Object.values(state.cells);
  const realArmCells = cells.filter((c) => c.kind === "arm");
  const baselineCells = cells.filter((c) => c.kind === "baseline");
  // Multiple-comparisons count: arm x venue cells actually under test. Fixed
  // baselines are reference points, not hypotheses, so they don't inflate it.
  const numComparisons = Math.max(1, realArmCells.length);

  const cellData = new Map<string, CellData>();
  for (const cell of cells) {
    const attribution = await deps.attribute(cell.fills);
    const summary = await deps.summarize(attribution, state.config);
    cellData.set(armKeyOf(cell.key), { cell, attribution, summary });
  }

  const lines: string[] = [];
  lines.push(`# Paper Evaluation Report`);
  lines.push(``);
  lines.push(`Generated: ${generatedAtIso}`);
  lines.push(`Run: ${state.runId}  Status: ${state.status}  Ticks: ${state.iteration}`);
  lines.push(`Window: ${state.startedAt} -> ${state.lastTickAt ?? "n/a"}`);
  lines.push(
    `Config: N_min=${state.config.nMin} D_min=${state.config.dMin}d D_max=${state.config.dMax}d alpha=${state.config.alpha}`,
  );
  lines.push(``);

  lines.push(`## Overview`);
  lines.push(``);
  lines.push(`| Arm | Venue | Kind | Trades | Expectancy R | 95% CI | Verdict |`);
  lines.push(`|---|---|---|---|---|---|---|`);
  for (const cell of cells) {
    const d = cellData.get(armKeyOf(cell.key))!;
    const verdict = await deps.verdictFor(d.summary, state.config, numComparisons);
    lines.push(
      `| ${armLabel(cell.key.arm)} | ${venueLabel(cell.key.venue)} | ${cell.kind} | ${d.summary.trades} | ${fmtR(
        d.summary.expectancyR,
      )} | ${fmtCi(d.summary.ci)} | ${verdict.verdict} |`,
    );
  }
  lines.push(``);

  for (const cell of realArmCells) {
    const d = cellData.get(armKeyOf(cell.key))!;
    const sameVenueBaselines = baselineCells.filter((b) => b.key.venue === cell.key.venue);
    for (const line of await renderArmSection(d, sameVenueBaselines, cellData, deps, state.config, numComparisons, armLabel, venueLabel)) {
      lines.push(line);
    }
  }

  for (const line of renderHonestyBlock(state, cells, cellData, numComparisons)) {
    lines.push(line);
  }

  const markdown = lines.join("\n") + "\n";
  const tradesCsv = renderTradesCsv(cells, armLabel, venueLabel);
  return { markdown, tradesCsv };
}

async function renderArmSection(
  d: CellData,
  sameVenueBaselines: CellState[],
  cellData: Map<string, CellData>,
  deps: ReportDeps,
  config: EvalConfig,
  numComparisons: number,
  armLabel: (id: string) => string,
  venueLabel: (id: string) => string,
): Promise<string[]> {
  const lines: string[] = [];
  lines.push(`## ${armLabel(d.cell.key.arm)} — ${venueLabel(d.cell.key.venue)}`);
  lines.push(``);

  // --- Does it work? -----------------------------------------------------
  lines.push(`### Does it work?`);
  lines.push(`- Net PnL after costs: ${d.summary.netPnlXlm.toFixed(4)} XLM over ${d.summary.trades} closed trades.`);
  lines.push(
    `- Expectancy: ${fmtR(d.summary.expectancyR)}  t-stat: ${
      d.summary.tStat === null ? "n/a" : d.summary.tStat.toFixed(2)
    }  95% CI: ${fmtCi(d.summary.ci)}`,
  );
  for (const b of sameVenueBaselines) {
    const bd = cellData.get(armKeyOf(b.key))!;
    lines.push(
      `- vs ${armLabel(b.key.arm)}: ${d.summary.netPnlXlm.toFixed(4)} XLM vs ${bd.summary.netPnlXlm.toFixed(4)} XLM (${cmp(
        d.summary.netPnlXlm,
        bd.summary.netPnlXlm,
      )}).`,
    );
  }
  const verdict = await deps.verdictFor(d.summary, config, numComparisons);
  lines.push(`- **Verdict: ${verdict.verdict.toUpperCase()}** — ${verdict.headline}`);
  if (d.summary.ci && !d.summary.ci.excludesZero) {
    lines.push(
      `- Honest read: the 95% CI [${d.summary.ci.lowerR.toFixed(3)}R, ${d.summary.ci.upperR.toFixed(
        3,
      )}R] includes 0 after costs - **NO PROVEN EDGE** here, whatever the point estimate looks like.`,
    );
  } else if (!d.summary.ci) {
    lines.push(`- Honest read: too few trades for a confidence interval - **NO PROVEN EDGE** (not yet disprovable either).`);
  }
  lines.push(``);

  // --- How well? -----------------------------------------------------------
  lines.push(`### How well?`);
  lines.push(
    `- Hit rate: ${d.summary.hitRatePct.toFixed(1)}%  Sharpe/trade: ${
      d.summary.sharpePerTrade === null ? "n/a" : d.summary.sharpePerTrade.toFixed(2)
    }  Max drawdown: ${d.summary.maxDrawdownXlm.toFixed(4)} XLM`,
  );
  const regimeEntries = Object.entries(d.attribution.byRegime);
  const regimeLines = regimeEntries.map(
    ([regime, r]) => `${regime}: ${r.trades} trades, ${r.netPnlXlm.toFixed(4)} XLM, ${r.hitRatePct.toFixed(1)}% hit`,
  );
  lines.push(`- By regime: ${regimeLines.length ? regimeLines.join(" · ") : "no regime data"}`);
  lines.push(
    `- Cost drag: ${d.attribution.feesXlm.toFixed(4)} XLM fees + ${d.attribution.slippageXlm.toFixed(
      4,
    )} XLM slippage (rebates ${d.attribution.rebatesXlm.toFixed(4)} XLM).`,
  );
  lines.push(``);

  // --- How to improve? ------------------------------------------------------
  lines.push(`### How to improve?`);
  const byPnl = [...regimeEntries].sort((a, b) => b[1].netPnlXlm - a[1].netPnlXlm);
  const best = byPnl[0];
  const worst = byPnl[byPnl.length - 1];
  if (best && worst && best[0] !== worst[0]) {
    lines.push(
      `- ${best[0]} carried the result (${best[1].netPnlXlm.toFixed(4)} XLM); ${worst[0]} dragged it (${worst[1].netPnlXlm.toFixed(
        4,
      )} XLM).`,
    );
  }
  const thinRegimes = regimeEntries.filter(([, r]) => r.trades < config.minRegimeSample).map(([regime]) => regime);
  if (thinRegimes.length) {
    lines.push(
      `- Thin-sample regimes (< ${config.minRegimeSample} trades — don't trust these buckets yet): ${thinRegimes.join(", ")}.`,
    );
  }
  const grossAbs = Math.abs(d.attribution.grossPnlXlm);
  const costShare = grossAbs > 0 ? (d.attribution.feesXlm + d.attribution.slippageXlm) / grossAbs : null;
  if (costShare !== null && costShare > 0.3) {
    lines.push(
      `- Costs ate ${(costShare * 100).toFixed(
        0,
      )}% of gross PnL - this edge is spread/cost-fragile; re-test with a tighter maker-only entry or a higher liquidity gate before funding it.`,
    );
  }
  if (d.attribution.modeledTrades > 0 && d.attribution.trades > 0) {
    lines.push(
      `- ${d.attribution.modeledTrades}/${d.attribution.trades} closed trades relied on a MODELED maker fill (not an observed taker sweep) - re-run with more taker-side entries if that share is large, to reduce reliance on the fill model.`,
    );
  }
  lines.push(
    `- Parameters are the overfitting surface (see src/backtest/strategy.ts) - only widen this arm's parameters with an out-of-sample / walk-forward reason, never to chase this run's own curve.`,
  );
  lines.push(``);

  return lines;
}

function renderHonestyBlock(
  state: RunState,
  cells: CellState[],
  cellData: Map<string, CellData>,
  numComparisons: number,
): string[] {
  const lines: string[] = [];
  lines.push(`## Honesty block`);
  lines.push(``);
  const config = state.config;
  const adjAlpha = config.alpha / numComparisons;
  lines.push(
    `- Multiple comparisons: ${numComparisons} arm(s) tested at alpha=${config.alpha}. Bonferroni-adjusted per-arm alpha ≈ ${adjAlpha.toFixed(
      4,
    )} — an individual arm's un-adjusted "significant" CI is weaker evidence than it looks when ${numComparisons} were tried at once.`,
  );

  for (const cell of cells) {
    const d = cellData.get(armKeyOf(cell.key))!;
    const label = `${cell.key.arm} / ${cell.key.venue}`;
    if (d.summary.trades < config.nMin) {
      lines.push(
        `- ${label}: only ${d.summary.trades}/${config.nMin} required trades - too small a sample to say anything; treat as INCONCLUSIVE, not "no edge".`,
      );
      continue;
    }
    if (!d.summary.ci) {
      lines.push(`- ${label}: not enough trades to form a confidence interval — NO PROVEN EDGE.`);
    } else if (!d.summary.ci.excludesZero) {
      lines.push(
        `- ${label}: 95% CI [${d.summary.ci.lowerR.toFixed(3)}R, ${d.summary.ci.upperR.toFixed(
          3,
        )}R] includes 0 after costs — **NO PROVEN EDGE**.`,
      );
    } else {
      lines.push(
        `- ${label}: 95% CI clears 0 (${d.summary.ci.lowerR.toFixed(3)}R to ${d.summary.ci.upperR.toFixed(
          3,
        )}R) - promising, but confirm out-of-sample before funding.`,
      );
    }
    if (d.attribution.trades > 0 && d.attribution.modeledTrades / d.attribution.trades > 0.5) {
      lines.push(
        `  - fill FIDELITY warning: over half of ${label}'s trades used a MODELED maker fill, not an observed fill - weight this result down accordingly.`,
      );
    }
  }

  const stillOpen = openCellCount(state);
  if (stillOpen > 0) {
    lines.push(`- ${stillOpen} cell(s) still held an open (unrealized) position when the run stopped - their PnL is not final.`);
  }
  lines.push(
    `- Overfitting: every strategy parameter tuned against this SAME run's numbers is a spent degree of freedom (see src/backtest/strategy.ts). Re-validate any promising arm on a fresh, later window before sizing it.`,
  );
  return lines;
}

function fmtR(x: number | null): string {
  return x === null ? "n/a" : `${x >= 0 ? "+" : ""}${x.toFixed(4)}`;
}

function fmtCi(ci: EvalSummary["ci"]): string {
  if (!ci) return "n/a";
  return `[${ci.lowerR.toFixed(3)}, ${ci.upperR.toFixed(3)}]${ci.excludesZero ? "" : " (includes 0)"}`;
}

function cmp(a: number, b: number): string {
  return a > b ? "ahead" : a < b ? "behind" : "tied";
}

function csvField(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function renderTradesCsv(
  cells: CellState[],
  armLabel: (id: string) => string,
  venueLabel: (id: string) => string,
): string {
  const header =
    "arm,venue,orderId,side,base,quote,liquidity,filledBase,avgPrice,feeQuote,referencePrice,fidelity,ts,regime";
  const rows: string[] = [header];
  for (const cell of cells) {
    for (const f of cell.fills) {
      rows.push(
        [
          csvField(armLabel(f.arm)),
          csvField(venueLabel(f.venue)),
          csvField(f.orderId),
          f.side,
          csvField(f.base),
          csvField(f.quote),
          f.liquidity,
          String(f.filledBase),
          String(f.avgPrice),
          String(f.feeQuote),
          String(f.referencePrice),
          f.fidelity,
          f.ts,
          csvField(f.regime ?? ""),
        ].join(","),
      );
    }
  }
  return rows.join("\n") + "\n";
}
