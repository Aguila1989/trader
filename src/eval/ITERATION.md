# The iterate-until-ready loop (Phase 4b)

This document is the loop's contract in prose: what runs automatically, what
never does, why fresh windows are the whole point, and the exact bar an arm
has to clear before it is allowed to touch real money. The code is
`iterate.ts` (the loop controller) + `readiness.ts` (the pure go/no-go
decision); tests in `iterate.test.ts` / `readiness.test.ts` pin every rule
below to an executable example.

## The one-sentence version

Run the paper-trading eval on a window it has never seen, read the result,
propose a small bounded improvement, run it again on the NEXT never-seen
window — and once improvement stalls, freeze the knobs and demand the result
survive several more untouched confirmations before it is called "ready".
Nothing here ever arms real money. Phase 5 (Kevin flipping that switch by
hand) is a separate, human decision.

## Why fresh windows are the whole point

This repo has already caught itself doing the dishonest version of this once.
`src/backtest/search.ts` and `src/backtest/walkforward.ts` exist specifically
because tuning a strategy's parameters and then scoring it on the SAME data
you tuned on manufactures an edge that isn't real — you're just fitting noise,
and a big enough grid search will always find *some* configuration that looks
great on history it has already memorized. `walkforward.ts`'s own header says
it plainly: "optimize ONLY on a training slice, then trade those frozen
parameters on the NEXT, never-seen test slice... THAT number, not the
in-sample one, is what you are allowed to believe."

The iterate loop is that same discipline, one level up, running live instead
of once offline:

- **Every iteration confirms on a window it has never used before.**
  `WindowSource.nextConfirmationWindow` hands out a fresh slice each tick;
  `iterate.ts` throws immediately if one is ever replayed
  (`seenConfirmationWindowIds`). A loop that quietly re-scored an old window
  would just be `walkforward.ts`'s train/test leak, wearing a live disguise.
- **The tuner never sees the window it's about to be judged on.**
  `WindowSource.nextTrainingSlice` supplies whatever historical data the
  AUTO-tier search is allowed to use, and `iterate.ts` throws if that slice and
  the confirmation window are ever the same id. Tuning on the confirmation
  data is exactly the leak above, just moved one layer up.
- **`variantsTried` is tracked and fed into the significance bar.** A search
  that quietly tries 200 parameter combinations and reports the best one has
  the same multiple-comparisons problem as `search.ts`'s own grid
  (`search.ts`: "test 200 configs and the best one looks brilliant by pure
  chance"). `readiness.ts`'s `adjustedConfidenceLevel` tightens the required
  confidence (Bonferroni-style) as `variantsTried` grows, so a wider search has
  to clear a correspondingly higher bar before its best result is believed.
- **Judged on a plateau + a consecutive run, never a single best iteration.**
  One lucky window is exactly the kind of result a wide-enough search will
  eventually produce by chance. See "Readiness criteria" below.

## What's AUTOMATIC vs GATED

**AUTO-tier (applied without asking):**
- Bounded parameter/threshold tuning within `StrategyParams` — the same
  surface `search.ts`'s grid already sweeps (reward/risk, ATR stop multiple,
  RSI thresholds, range-position edges). The default tuner
  (`createWalkForwardTuner`) is a thin wrapper around `walkforward.ts` +
  `search.ts` over the training slice only.
- Sizing/gate tweaks that live inside that same bounded space.
- Enabling/disabling an arm (`TuningOutcome.kind === "disable"`) — a
  hypothesis that keeps losing gets benched, it doesn't get deleted or
  rewritten.

**GATED-tier (recorded, NEVER auto-applied):**
- Anything that isn't a parameter tweak — new signal logic, a new regime
  classifier, a structurally different bracket rule, a new arm entirely.
- The tuner reports these via `TuningOutcome.kind === "gated"` with a plain
  -English description; `iterate.ts` appends it to `LoopState.gatedTodos` and
  moves on with the CURRENT frozen params unchanged. A gated suggestion has
  zero effect on what actually trades — it is a to-do list for a human (or a
  future Claude session with someone reviewing the diff), never a silent
  code change.

## The confirmation lock (the "final K iterations, no more tuning" rule)

Rather than trying to predict in advance which iterations will be "the last
K before the run ends" (the loop doesn't know when it will stop until it
stops), the lock is implemented as a one-way latch per arm:

1. While unlocked, each iteration may be tuned (AUTO-tier) using a training
   slice, then confirmed on a fresh window.
2. After each confirmation, `detectPlateau` checks the arm's whole
   expectancy trail (`plateauWindow` consecutive deltas, all below
   `materialImprovement`). The moment it plateaus — i.e. tuning has
   stopped materially helping — the arm is **locked**.
3. Once locked, `iterate.ts`'s tuner branch never runs again for that arm,
   for the rest of THIS run. Every subsequent iteration is a pure, untouched
   confirmation. This is enforced structurally (the tuner call is inside an
   `if (lockedAtIteration === null)` block that can never re-open), not just
   asserted after the fact — `iterate.test.ts`'s "stops calling the tuner
   forever once the arm's trail plateaus" test drives real iterations past
   the lock point and checks the tuner's call count never moves again.

`readiness.ts` independently double-checks this: `trailingConfirmationRun`
walks the iteration history backward and stops at the first iteration that
was either tuned or not out-of-sample. A single tuned iteration anywhere in
what would otherwise be a qualifying run resets the count to whatever
untouched run remains after it. Two independent layers refusing the same
leak is deliberate — the lock is the loop's *policy*, the trailing-run check
is the gate's *audit* of that policy.

## Readiness criteria (all of these, together)

An arm is `ready-for-tiny-live` only when its trailing confirmation run
satisfies every one of:

1. **Statistically significant, cost-surviving edge.** The pooled net returns
   across the confirmation tail get a deterministic bootstrap CI (same method
   + fixed seed as `backtest/metrics.ts`'s `expectancyCI`); it must clear zero
   at a confidence level tightened by `variantsTried` (see above). `attribution
   .netReturns` already comes out of the Phase-4 evaluator cost-adjusted, so
   "clears zero" already means "after costs."
2. **Stable across regimes.** Regime buckets are pooled across the
   confirmation tail; any bucket with enough trades to trust
   (`minTradesPerRegimeBucket`) must be net-positive, and at least
   `minRegimesCovered` distinct regimes must have that many trades. An edge
   that only exists in one regime is a curve-fit to that regime, not a
   tradeable edge.
3. **Out-of-sample.** Enforced by construction — only iterations that are both
   `isOutOfSample` and NOT `tunedThisIteration` ever enter the trailing run at
   all.
4. **Sustained: `minConsecutiveIterations` (K) in a row.** A single great
   iteration — however dazzling — is explicitly insufficient; see
   `readiness.test.ts`'s "a single lucky iteration must NOT be ready".
5. **Plateaued.** The full expectancy trail must show no delta greater than
   `materialImprovement` over the last `plateauWindow` iterations. An edge
   that is still visibly getting better with each tuning pass hasn't finished
   being searched for yet — "ready" means the search stopped paying off, not
   that it never started.

Fail any one of these and the recommendation is `keep-iterating` — there is
still budget left and something legitimate left to learn.

## Budget exhaustion is a valid answer

If the iteration cap or the wall-clock budget (`IterateConfig.maxIterations` /
`isBudgetExhausted`) runs out before any arm clears every gate above, the
recommendation is `no-proven-edge` — never `keep-iterating` (there's nothing
left to iterate with), and never silently `ready` (budget pressure is not
evidence). This is the honest, expected outcome for most hypotheses: as
`backtest/report.ts`'s own verdict language puts it, most configurations
"loses money on this history" or don't survive walk-forward. A loop that
always eventually finds *something* to call ready is a loop that has quietly
disabled its own significance bar. `no-proven-edge` is exactly as legitimate a
final state as `ready-for-tiny-live`, and the reasons array says so
explicitly rather than dressing it up as a near-miss.

## The hard rule: this loop never arms real money

`iterate.ts` and `readiness.ts` produce data — a `LoopState` and a
`ReadinessResult` — and nothing else. Neither module imports
`src/trading/orchestrator.ts`, touches `killSwitch`/`liveTrading`/
`autoApprove` in `src/trading/store.ts`, or performs any network/DB I/O.
`ready-for-tiny-live` is a RECOMMENDATION string, not a command: turning it
into an actual (tiny) live allocation is Phase 5, and Phase 5 is Kevin's
switch to flip by hand, deliberately, with the readiness report in front of
him. If a future change ever makes this module reach into live trading state,
that is a regression of this contract, not a feature.

## Known follow-up (not yet wired)

`src/eval/types.ts` documents a `stats.ts` module (via its `verdictFor`
reference) that didn't exist in the tree when this was written — it's one of
several files a concurrent Phase-4a build was producing at the same time.
`readiness.ts` therefore implements its own small deterministic bootstrap CI
(`bootstrapCI`) over `ArmAttribution.netReturns` rather than importing it.
Once `stats.ts` lands with an equivalent helper, `bootstrapCI` here should be
retired in favor of it so there is exactly one significance implementation in
the codebase — everything else in this contract (the readiness criteria, the
lock, the fresh-window discipline) is unaffected by that swap.
