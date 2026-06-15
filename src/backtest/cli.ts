import { config } from "../config";
import { resolveScanPairs, type ScanPair } from "../stellar/universe";
import type { Candle } from "../stellar/market";
import {
  candleQuality,
  loadCandles,
  MIN_CANDLE_COVERAGE,
  RESOLUTION_MS,
  THIN_TRADES_PER_BUCKET,
} from "./data";
import { kellyFromMetrics } from "./sizing";
import {
  runBacktest,
  DEFAULT_BACKTEST_CONFIG,
  DEFAULT_IMPACT_BPS,
  type BacktestConfig,
  type BacktestResult,
} from "./engine";
import { computeMetrics, expectancyCI } from "./metrics";
import { DEFAULT_PARAMS } from "./strategy";
import {
  aggregate,
  formatAggregate,
  formatResult,
  formatWalkForward,
} from "./report";
import { searchParams } from "./search";
import { walkForward } from "./walkforward";

/**
 * Backtest CLI:  npm run backtest -- [options]
 *
 * Replays real Stellar trade-aggregation history through the deterministic
 * baseline strategy (src/backtest/strategy.ts) and reports whether it has an
 * edge AFTER modeled costs. It does NOT touch keys, balances, or submit
 * anything - read-only history in, metrics out.
 */

type Mode = "single" | "search" | "walk-forward";

interface Args {
  pairs: ScanPair[];
  resolution: string;
  days: number;
  cfg: BacktestConfig;
  refresh: boolean;
  json: boolean;
  nowMs?: number;
  mode: Mode;
  trainBars: number;
  testBars: number;
}

const HELP = `
Backtest the deterministic baseline strategy over historical Stellar candles.

Usage:
  npm run backtest -- [options]

Modes (default: a single in-sample run):
  --search           Sweep the parameter grid on the full window and rank
                     configs by a robustness-adjusted score. IN-SAMPLE only:
                     a hypothesis generator, NOT proof. Use --walk-forward to test it.
  --walk-forward     Optimize on rolling TRAIN slices, score on UNSEEN TEST
                     slices, and report pooled out-of-sample edge + Kelly sizing.
                     This is the only number worth believing.

Options:
  --pairs <list>     Comma list of BASE/QUOTE (bare curated codes ok, e.g.
                     "XLM/USDC,USDC/EURC"). Default: the live scan universe.
  --res <res>        Candle width: 1m,5m,15m,1h,1d,1w. Default: 1h.
  --days <n>         Lookback window in days. Default: 90.
  --cost-bps <n>     Per-fill cost (spread+slippage+fee proxy). Default: 10.
  --window <n>       Indicator lookback in candles. Default: 24 (the live 1h window).
  --max-hold <n>     Max bars to hold before a timeout exit. Default: 48.
  --min-volume <n>   Liquidity gate: min window base volume. Default: MIN_VOLUME_24H.
  --no-volume-gate   Disable the liquidity gate (see every raw signal).
  --optimistic       On a bar that hits both target and stop, assume target first.
  --trade-size <n>   Order size in BASE units to model market impact for: a fill
                     that's a big fraction of a bar's traded volume pays more than
                     the flat spread (sqrt-scaled). Default: off (size-agnostic).
  --impact-bps <n>   Impact in bps at 100% participation (whole-bar order).
                     Default: ${DEFAULT_IMPACT_BPS}. Only applies with --trade-size.
  --train-bars <n>   Walk-forward training window in candles. Default: 600.
  --test-bars <n>    Walk-forward test window in candles. Default: 200.
  --refresh          Re-pull from Horizon, ignoring the on-disk cache.
  --pin-now <ms>     Pin "now" (epoch ms) for a reproducible window.
  --json             Emit machine-readable JSON instead of the text report.
  --help             Show this help.

Reads NETWORK / HORIZON_URL / SCAN_ASSETS / SCAN_PAIRS / limits from your .env.
`;

function parseArgs(argv: string[]): Args | null {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (flag: string): boolean => argv.includes(flag);

  if (has("--help") || has("-h")) return null;

  const pairsArg = get("--pairs");
  const pairs = pairsArg
    ? resolveScanPairs(pairsArg)
    : [
        ...config.scanAssets.map((quote) => ({ base: "XLM", quote })),
        ...config.scanPairs,
      ];

  const resolution = (get("--res") ?? "1h").toLowerCase();
  const days = Number(get("--days") ?? 90);

  const cfg: BacktestConfig = {
    ...DEFAULT_BACKTEST_CONFIG,
    window: Number(get("--window") ?? DEFAULT_BACKTEST_CONFIG.window),
    maxHoldBars: Number(get("--max-hold") ?? DEFAULT_BACKTEST_CONFIG.maxHoldBars),
    costBps: Number(get("--cost-bps") ?? DEFAULT_BACKTEST_CONFIG.costBps),
    applyVolumeGate: !has("--no-volume-gate"),
    minWindowVolume: Number(get("--min-volume") ?? config.limits.minVolume24h),
    pessimisticIntrabar: !has("--optimistic"),
    params: { ...DEFAULT_PARAMS },
  };

  const tradeSize = get("--trade-size");
  if (tradeSize !== undefined) cfg.tradeSizeBase = Number(tradeSize);
  const impactBps = get("--impact-bps");
  if (impactBps !== undefined) cfg.impactBpsAtFullParticipation = Number(impactBps);

  const pinNow = get("--pin-now");
  const mode: Mode = has("--walk-forward") || has("--wf")
    ? "walk-forward"
    : has("--search")
      ? "search"
      : "single";

  return {
    pairs,
    resolution,
    days,
    cfg,
    refresh: has("--refresh"),
    json: has("--json"),
    nowMs: pinNow ? Number(pinNow) : undefined,
    mode,
    trainBars: Number(get("--train-bars") ?? 600),
    testBars: Number(get("--test-bars") ?? 200),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    console.log(HELP);
    return;
  }

  const resolutionMs = RESOLUTION_MS[args.resolution];
  if (!resolutionMs) {
    console.error(
      `Unknown --res "${args.resolution}". Use one of: ${Object.keys(RESOLUTION_MS).join(", ")}.`,
    );
    process.exitCode = 1;
    return;
  }
  if (!(args.days > 0)) {
    console.error(`--days must be positive.`);
    process.exitCode = 1;
    return;
  }
  if (args.pairs.length === 0) {
    console.error(
      `No pairs to test. Pass --pairs, or configure SCAN_ASSETS / SCAN_PAIRS.`,
    );
    process.exitCode = 1;
    return;
  }

  const lookbackMs = args.days * 86_400_000;
  const log = (msg: string) => {
    if (!args.json) console.error(msg);
  };

  log(
    `Backtest: ${args.pairs.length} pair(s), ${args.resolution} candles, ${args.days}d lookback, ` +
      `cost ${args.cfg.costBps}bps${
        args.cfg.tradeSizeBase
          ? ` +impact(size ${args.cfg.tradeSizeBase} @ ${
              args.cfg.impactBpsAtFullParticipation ?? DEFAULT_IMPACT_BPS
            }bps/full)`
          : ""
      }, window ${args.cfg.window}, maxHold ${args.cfg.maxHoldBars}, ` +
      `volumeGate ${args.cfg.applyVolumeGate ? `on (>=${args.cfg.minWindowVolume})` : "off"}, ` +
      `network ${config.network}`,
  );

  // Load every pair's candles once; all modes share them.
  const loaded: { pair: ScanPair; candles: Candle[] }[] = [];
  for (const p of args.pairs) {
    try {
      const candles = await loadCandles(p.base, p.quote, resolutionMs, lookbackMs, {
        refresh: args.refresh,
        nowMs: args.nowMs,
        onProgress: log,
      });
      const q = candleQuality(candles, resolutionMs);
      const issues: string[] = [];
      if (q.candles > 0 && q.medianTradesPerBucket < THIN_TRADES_PER_BUCKET) {
        issues.push(
          `median ${q.medianTradesPerBucket} trades/candle (thin book - the printed OHLC extremes aren't fillable with size)`,
        );
      }
      if (q.candles > 1 && q.coverage < MIN_CANDLE_COVERAGE) {
        issues.push(
          `${Math.round(q.coverage * 100)}% time-bucket coverage (gappy - candles span silent stretches)`,
        );
      }
      if (issues.length > 0) {
        log(
          `${p.base}/${p.quote}: DATA-QUALITY WARNING - ${issues.join("; ")}. Intrabar fills are likely optimistic; distrust any edge here until paper-traded on the live book.`,
        );
      }
      loaded.push({ pair: p, candles });
    } catch (err) {
      log(`${p.base}/${p.quote}: error - ${(err as Error).message}`);
    }
  }

  if (args.mode === "search") return runSearch(args, loaded, log);
  if (args.mode === "walk-forward") return runWalkForward(args, loaded, log);
  return runSingle(args, loaded, log);
}

type Loaded = { pair: ScanPair; candles: Candle[] };

/** Default mode: one in-sample run per pair + a pooled portfolio summary. */
function runSingle(args: Args, loaded: Loaded[], log: (m: string) => void): void {
  const results: BacktestResult[] = [];
  for (const { pair: p, candles } of loaded) {
    if (candles.length < args.cfg.window + 2) {
      log(`${p.base}/${p.quote}: only ${candles.length} candles - skipping.`);
      results.push({
        pair: `${p.base}/${p.quote}`,
        base: p.base,
        quote: p.quote,
        candles: candles.length,
        firstTime: candles[0]?.time ?? null,
        lastTime: candles[candles.length - 1]?.time ?? null,
        signals: 0,
        skippedByGate: { volume: 0 },
        trades: [],
        buyHoldPct: null,
      });
      continue;
    }
    results.push(runBacktest(p.base, p.quote, candles, args.cfg));
  }

  if (args.json) {
    const resolutionMs = RESOLUTION_MS[args.resolution] ?? 0;
    const out = results.map((res, i) => ({
      ...res,
      metrics: computeMetrics(res.trades),
      dataQuality: candleQuality(loaded[i]!.candles, resolutionMs),
    }));
    console.log(
      JSON.stringify(
        { config: { ...args, cfg: args.cfg }, results: out, aggregate: aggregate(results) },
        null,
        2,
      ),
    );
    return;
  }
  for (const res of results) console.log(formatResult(res, computeMetrics(res.trades)));
  console.log(formatAggregate(aggregate(results)));
}

/** Grid search per pair, ranked. IN-SAMPLE - explicitly flagged as such. */
function runSearch(args: Args, loaded: Loaded[], log: (m: string) => void): void {
  for (const { pair: p, candles } of loaded) {
    const label = `${p.base}/${p.quote}`;
    if (candles.length < args.cfg.window + 2) {
      log(`${label}: too few candles - skipping.`);
      continue;
    }
    const ranked = searchParams(candles, args.cfg).slice(0, 5);
    console.log(`\n=== ${label} ===  [in-sample grid search, top 5 of grid]`);
    console.log(
      `  WARNING: in-sample ranking is overfit-prone. Confirm with --walk-forward before believing any of these.`,
    );
    ranked.forEach((s, i) => {
      const m = s.metrics;
      console.log(
        `  #${i + 1} score=${s.score.toFixed(2)} | RR=${s.params.rewardRiskMult} atrStop=${s.params.atrStopMult} ` +
          `trendRsi=${s.params.trendPullbackRsi} rangePos=${s.params.rangeLowPos}/${s.params.rangeHighPos} ` +
          `| trades=${m.trades} win%=${m.winRatePct} expectancy=${m.expectancyR}R PF=${m.profitFactor ?? "n/a"}`,
      );
    });
  }
}

/** Walk-forward per pair + a pooled out-of-sample portfolio verdict. */
function runWalkForward(args: Args, loaded: Loaded[], log: (m: string) => void): void {
  const need = args.cfg.window + args.trainBars + args.testBars;
  const pooledOos: BacktestResult["trades"] = [];
  for (const { pair: p, candles } of loaded) {
    const label = `${p.base}/${p.quote}`;
    if (candles.length < need) {
      log(
        `${label}: ${candles.length} candles < ${need} needed (window+train+test) - skipping. Try a longer --days or smaller --train-bars/--test-bars.`,
      );
      continue;
    }
    const wf = walkForward(
      p.base,
      p.quote,
      candles,
      args.cfg,
      args.trainBars,
      args.testBars,
    );
    console.log(formatWalkForward(label, wf));
    pooledOos.push(...wf.oosTrades);
  }

  const m = computeMetrics(pooledOos);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`PORTFOLIO out-of-sample (all pairs, walk-forward)`);
  console.log(`${"=".repeat(60)}`);
  if (m.trades === 0) {
    console.log(`  No out-of-sample trades. Nothing survived to measure.`);
    return;
  }
  const k = kellyFromMetrics(m);
  const ci = expectancyCI(pooledOos);
  console.log(
    `  trades=${m.trades} win%=${m.winRatePct} EXPECTANCY=${m.expectancyR}R ` +
      `PF=${m.profitFactor ?? "n/a"} totalR=${m.totalR}R maxDD=${m.maxDrawdownR.toFixed(2)}R`,
  );
  console.log(
    `  stdev=${m.stdDevR.toFixed(2)}R Sharpe/trade=${m.sharpePerTrade.toFixed(2)} ` +
      `t=${m.tStat === null ? "n/a" : m.tStat.toFixed(2)}` +
      (ci
        ? `  95% CI=[${ci.lowerR.toFixed(2)}, ${ci.upperR.toFixed(2)}]R ${
            ci.lowerR > 0 ? "(edge holds at 95%)" : "(spans 0 - NOT proven)"
          }`
        : ""),
  );
  console.log(
    `  Kelly: fullKelly=${(k.fullKelly * 100).toFixed(1)}% -> recommend ${(
      k.recommendedRiskFraction * 100
    ).toFixed(2)}% risk/trade. ${k.note}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
