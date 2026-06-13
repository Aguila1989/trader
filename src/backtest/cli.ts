import { config } from "../config";
import { resolveScanPairs, type ScanPair } from "../stellar/universe";
import { loadCandles, RESOLUTION_MS } from "./data";
import {
  runBacktest,
  DEFAULT_BACKTEST_CONFIG,
  type BacktestConfig,
  type BacktestResult,
} from "./engine";
import { computeMetrics } from "./metrics";
import { DEFAULT_PARAMS } from "./strategy";
import { aggregate, formatAggregate, formatResult } from "./report";

/**
 * Backtest CLI:  npm run backtest -- [options]
 *
 * Replays real Stellar trade-aggregation history through the deterministic
 * baseline strategy (src/backtest/strategy.ts) and reports whether it has an
 * edge AFTER modeled costs. It does NOT touch keys, balances, or submit
 * anything - read-only history in, metrics out.
 */

interface Args {
  pairs: ScanPair[];
  resolution: string;
  days: number;
  cfg: BacktestConfig;
  refresh: boolean;
  json: boolean;
  nowMs?: number;
}

const HELP = `
Backtest the deterministic baseline strategy over historical Stellar candles.

Usage:
  npm run backtest -- [options]

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

  const pinNow = get("--pin-now");

  return {
    pairs,
    resolution,
    days,
    cfg,
    refresh: has("--refresh"),
    json: has("--json"),
    nowMs: pinNow ? Number(pinNow) : undefined,
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
      `cost ${args.cfg.costBps}bps, window ${args.cfg.window}, maxHold ${args.cfg.maxHoldBars}, ` +
      `volumeGate ${args.cfg.applyVolumeGate ? `on (>=${args.cfg.minWindowVolume})` : "off"}, ` +
      `network ${config.network}`,
  );

  const results: BacktestResult[] = [];
  for (const p of args.pairs) {
    try {
      const candles = await loadCandles(p.base, p.quote, resolutionMs, lookbackMs, {
        refresh: args.refresh,
        nowMs: args.nowMs,
        onProgress: log,
      });
      if (candles.length < args.cfg.window + 2) {
        log(
          `${p.base}/${p.quote}: only ${candles.length} candles (< window ${args.cfg.window}+2) - skipping.`,
        );
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
    } catch (err) {
      log(`${p.base}/${p.quote}: error - ${(err as Error).message}`);
    }
  }

  if (args.json) {
    const out = results.map((res) => ({
      ...res,
      metrics: computeMetrics(res.trades),
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

  for (const res of results) {
    console.log(formatResult(res, computeMetrics(res.trades)));
  }
  console.log(formatAggregate(aggregate(results)));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
