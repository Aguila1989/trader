# Backtest harness

Replays real Stellar trade-aggregation history through a **deterministic
baseline strategy** and reports whether it has an edge **after modeled costs**.
Read-only: it never touches keys, balances, or submits anything.

## Why this exists

The live bot's "strategy" is an LLM prompt — it can't be backtested cheaply,
deterministically, or reproducibly. This module encodes the *same playbook the
prompt describes* (see [`strategy.ts`](./strategy.ts)) as plain TypeScript over
the same `computeIndicators()` the live bot uses. It is a **strict baseline**:
if these rules have no edge on real history, an LLM reading the same numbers and
the same rules almost certainly won't manufacture one. It answers the question
that matters before any funds are risked: *does this make money?*

## Usage

```sh
npm run backtest                      # the live SCAN_ASSETS/SCAN_PAIRS universe
npm run backtest -- --pairs "XLM/USDC,USDC/EURC" --days 90 --res 1h
npm run backtest -- --help            # all options
```

Reads `NETWORK` / `HORIZON_URL` / `SCAN_ASSETS` / `SCAN_PAIRS` / limits from your
`.env`. Candles are cached under `.backtest-cache/` (gitignored); pass
`--refresh` to re-pull, `--pin-now <epoch_ms>` for a reproducible window.

### Key options

| Flag | Default | Meaning |
|------|---------|---------|
| `--cost-bps <n>` | `10` | Per-fill cost (spread + slippage + fee proxy). **The most important knob — see below.** |
| `--days <n>` | `90` | Lookback window. |
| `--res <res>` | `1h` | Candle width: `1m,5m,15m,1h,1d,1w`. |
| `--window <n>` | `24` | Indicator lookback in candles (24 = the live 1h window). |
| `--max-hold <n>` | `48` | Bars before a forced timeout exit. |
| `--no-volume-gate` | off | Disable the `MIN_VOLUME_24H`-style liquidity gate. |
| `--optimistic` | off | On a bar that hits both target and stop, assume target first (default: stop). |
| `--json` | off | Machine-readable output. |

## How to read the output

- **`funnel: signals -> gatedByVolume -> trades`** — where signals went. This is
  the direct answer to "why no trades": either the rules never aligned, or the
  liquidity gate (correctly) killed them on thin books.
- **expectancy (avg R)** and **profit factor** — the headline. `expectancy > 0`
  and `PF > 1` *after costs* is the bar. Win rate alone is misleading.
- **R-multiple** — net cost-adjusted PnL per unit of risk (entry-to-stop). The
  currency-agnostic unit the equity curve and drawdown are measured in.

## ⚠️ Costs are not optional

The single most common way a backtest lies is ignoring costs. **Always sanity
-check the cost assumption against the spread you'd actually pay.** The live
bot's entry gate (`MAX_ENTRY_SPREAD_BPS`) admits books with spreads up to
100bps — so a 10bps cost assumption is wildly optimistic for many pairs. Re-run
with `--cost-bps 50` (or higher) and watch whether the edge survives. On the
curated universe it often does **not**: an apparent edge at 10bps can fully
invert at 50bps. That is a real finding, not a harness bug.

## Not yet covered (honest limitations)

- **No out-of-sample / walk-forward split.** A single in-sample run is a
  hypothesis, not proof. Tuning the `StrategyParams` against one run is
  overfitting — the defaults are deliberately untuned.
- **No historical orderbook**, so spread/depth is modeled as a flat `--cost-bps`
  rather than walked per-bar. Trade-aggregation buckets also skip empty periods
  on thin markets, which can flatter intrabar fills.
- **Fixed risk per trade, one position at a time.** Clean for measuring an edge;
  not a full portfolio/position-sizing simulation.
- It backtests the **deterministic baseline**, not the LLM. If the baseline has
  no edge, that's the strong signal; if it does, the LLM should be measured
  *against* it, not assumed to beat it.
