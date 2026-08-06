# `src/eval` — honest measurement primitives (Phase 4)

The evaluation layer's one job is to be **unable to flatter a strategy**. It
turns automatic paper trades against **live mainnet data** into a verdict that
only says `edge` when a cost-adjusted, multiplicity-adjusted confidence interval
clears zero on an adequate sample. Everything here is **pure** (no I/O, no
import-time side effects) so it is trivially unit-testable and hermetic.

Files in this note cover the CORE primitives (`types` · `fills` · `attribution`
· `stats`). Higher-level orchestration (`controller`, `iterate`, …) is layered
on top by other parts of Phase 4.

## The pipeline

```
PaperOrder ──▶ fills.ts ──▶ PaperFill ──▶ attribution.ts ──▶ ArmAttribution ──▶ stats.ts ──▶ EvalVerdict
             (conservative     (fee-applied,   (FIFO PnL,        (net returns,      (t-stat, bootstrap CI,
              fill model)        fidelity)       cost split)       drawdown)          multiplicity, verdict)
```

## `types.ts` — plain data

`EvalArmKey` (arm × venue), `PaperOrder`, `PaperFill`, `ClosedTrade`,
`ArmAttribution`, and `EvalConfig` (thresholds `nMin` / `dMin` / `dMax`, `seed`,
`arms`, `venues`). No behavior. `armKeyOf({arm,venue})` is the stable Map key.

Two fields are first-class on purpose, because an optimistic evaluator drops
them: `fidelity` (`observed-taker` vs `modeled-maker`) and `decisionPrice` (the
mid at decision — the anchor for implementation shortfall).

## `fills.ts` — the CONSERVATIVE FILL MODEL (the honesty core)

Paper trading only means something if it cannot invent a fill the real market
would not have given. The two paths are deliberately asymmetric:

- **Taker** (`fillTaker`) walks the **real observed book** (`walkBook`), pays the
  true VWAP through the levels (spread + depth included) plus taker fees, and
  **partials stay partial**. Directly observed → `fidelity: 'observed-taker'`.
- **Maker** (`fillMaker`) does **not** fill on a mere touch. At the touch you sit
  behind the resting queue, so a fill is credited **only from volume that traded
  STRICTLY THROUGH** the resting price (`observedThroughVolume`), and then only a
  `queueHaircut` fraction of it (default `0.5`) — because an unknown share of the
  sweep landed ahead of you. It fills **at its own limit price**. Inferred →
  `fidelity: 'modeled-maker'`. `includeTouch` exists solely to make the *wrong*
  optimistic model expressible in a test.

Why this matters: the repo's own backtest already learned that
`Ignoring costs is the single most common way a backtest lies`, and the
baseline finding was that the XLM/USDC edge existed only at ≤10bps and vanished
at 100bps. A touch-fills maker model manufactures exactly that phantom edge.

Fees are per-venue (`FeeModel`): `makerBps` may be **negative** (a real rebate,
recorded as a negative `feeQuote`), plus an optional flat `perFillQuote`.

## `attribution.ts` — PnL attribution + cost accounting

Signed **FIFO** lot matching mirroring `src/trading/positions.ts` (a long
buy-then-sell and a short sell-then-buy both realize correctly). Per closed
trade: **gross vs net**, fees paid / rebates earned, and `slippageQuote` — the
implementation shortfall vs the decision price (a maker capturing the spread
shows a **negative** shortfall; a taker crossing shows a positive one). Also:
hit-rate, average **R multiple** (when the opening lot carried a stop),
drawdown, and per-**regime** / per-**venue** breakdowns.

All PnL leaves normalized to **XLM** (`realizedToXlm`) so arms on different quote
assets are summable; the raw per-quote split is kept in `byQuote` for audit.

The significance sample it emits (`netReturns`) is each trade's **net** PnL as a
fraction of entry notional — a homogeneous, always-available, **cost-inclusive**
unit, so the CI built from it must clear zero *after* costs.

## `stats.ts` — the significance layer

Mirrors `src/backtest/metrics.ts` (one-sample t-stat, deterministic
mulberry32-seeded percentile bootstrap) and adds what an automatic many-variant
search cannot do without:

- **Multiple-comparisons adjustment** (`sidakAlpha` default, `bonferroniAlpha`):
  the CI bar a winner must clear widens with the number of arm×venue variants
  tried — at α=0.05, ~1 in 20 dead strategies clears the plain bar by luck.
- **Power / MDE** (`powerMDE`): the smallest true mean this `n` could reliably
  detect; flags an `underpowered` result so "can't tell yet" isn't read as "no".
- **`verdictFor`** → `edge` **only** when the adjusted-level CI clears zero on an
  adequate sample; otherwise `no-edge` (adequate sample, CI spans/loses) or
  `inconclusive-need-more-data` (too few trades / too short a horizon). Plus an
  explicit `overfittingWarnings` list (variants tried, in-sample-only, thin
  regimes).

## Tests are the proof

`*.test.ts` are pure and hermetic (no network, no DB, no mocks — the imported
helpers are pure). They pin the load-bearing claims: a **touch that never trades
through does not fill** a maker; a **positive mean whose CI includes zero
verdicts NO-EDGE**; **costs flip** a marginal winner; the **multiple-comparisons
bar rises with variants** (same sample: `edge` at 1 variant → `no-edge` at 50);
and **FIFO** correctness for both long and short round-trips.

Run: `npx vitest run src/eval/`
