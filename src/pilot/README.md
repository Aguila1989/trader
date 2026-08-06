# Pilot — the hard-capped live micro-pilot (Phase 5)

This is the last gate before Atrium touches real money unattended. It exists
because the honest risk in a fresh personal build is **not** "the strategy
loses slowly" — that's a known, bounded, statistically-characterized risk
(see the backtest harness). The risk that actually hurts is an **operational
bug**: a sizing error, a reconnected-but-stale price feed, a double-submit, a
reconciliation miss — something that fails open instead of closed and does it
fifty times before anyone notices. Pilot mode's whole job is to make that
class of failure small and boring: **capped notional, capped daily loss,
capped exposure, capped order count, capped pair list — and if anything looks
wrong, stop and wait for a human.**

## Kevin arms it explicitly. Nothing here arms itself.

Pilot mode is off by default and stays off until a human turns it on. There
is no cap value in this module that widens on its own, and no halt condition
that clears itself (see below). Two independent layers have to say yes on
every single order:

1. **`../policy/engine.ts` `checkPolicy`** — the existing risk gate (kill
   switch, whitelist, tier caps, slippage, exposure, cooldown, staleness,
   reward/risk...). Completely unchanged by this module.
2. **`./caps.ts` `checkPilotCaps`** — this pilot's OWN, deliberately dumber,
   independent set of ceilings (see below), evaluated on top.

Neither layer replaces the other. A bug or misconfiguration in one (a stale
risk profile, a mis-scaled tier, a policy regression) still has to get past
the other before it can act. Pilot caps intentionally do **not** grant
`checkPolicy`'s risk-reducing exemption for closing trades — at micro-pilot
scale a blocked exit is a "call Kevin" event, not a solvency risk, and giving
exits a silent bypass here would reopen exactly the "quietly grow" failure
mode this harness exists to close off.

## What's in this folder

| File | What it does |
|---|---|
| `caps.ts` | Pure `checkPilotCaps(intent, state, limits)` — per-trade notional, daily-loss, total-exposure, max-concurrent-orders, max-trades/day and a pair allowlist. Plus `reservePilotOrder`/`settlePilotOrder`/`releasePilotOrder`: a synchronous check-and-reserve (mirrors `../stellar/txReservation.ts`) so two orders racing the async sign→submit gap can never both slip past the same stale cap check. |
| `halt.ts` | `PilotHaltSupervisor` — the auto-halt. `checkAndTrip` reads live signals and trips on: daily-loss cap reached, error/rejection rate over a trailing window, ANY unreconciled fill, cap-check failure rate, or stale market data. Once tripped, `isHalted()` stays `true` until a human calls `clear(who)` — there is no timeout, no self-clear, no "problem went away so we're fine now." Reading state that throws is itself treated as a trip (fail-closed). |

Both files are pure/hermetic on purpose: no config import, no DB, no network.
They take their limits and live numbers as plain arguments so they're trivial
to unit-test and trivial to reason about in isolation. Wiring them to real
config/env values and to the orchestrator's submit path is a separate,
reviewed integration step (not done by this module) — see the Phase 5
integration notes for the exact call sites.

## The caps (env knobs — proposed names, wired by the orchestrator integration)

These are **not yet read anywhere** — `caps.ts`/`halt.ts` take them as plain
arguments. The env names below are the proposed surface for whoever wires
`config.pilot` (see this feature's `integrationSpec`):

| Env var | Meaning | Suggested starting value |
|---|---|---|
| `PILOT_ENABLED` | Master switch. `false` = the pilot layer never runs; every order flows through `checkPolicy` exactly as today. | `false` |
| `PILOT_MAX_TRADE_NOTIONAL_XLM` | Ceiling on a single order's XLM-equivalent notional. | small — a handful of XLM, not a real position size |
| `PILOT_MAX_DAILY_LOSS_XLM` | Realized loss (XLM-equivalent) before every order — including exits — is refused for the day. | small enough that hitting it is a non-event |
| `PILOT_MAX_TOTAL_EXPOSURE_XLM` | Ceiling on total open pilot exposure across every position. | a small multiple of the per-trade cap |
| `PILOT_MAX_CONCURRENT_ORDERS` | Max open (unfilled/unreconciled) pilot orders at once. | 1–2 |
| `PILOT_MAX_TRADES_PER_DAY` | Max orders submitted per pilot day. | single digits |
| `PILOT_ALLOWED_PAIRS` | Comma-separated exact pair allowlist, e.g. `XLM/USDC`. | the single pair being piloted — not "whatever the scan finds" |

Scaling any of these past micro is **a separate, deliberate human decision** —
not a config bump done in passing alongside an unrelated change, and not
something the AI/orchestrator should ever propose changing on its own. If the
pilot is working, that's a reason to schedule a review of the next cap step,
not a reason to raise the number in the same commit.

## Auto-halt conditions (`halt.ts`)

`PilotHaltSupervisor.checkAndTrip` trips on any of:

- **Daily-loss cap reached** — same number as `PILOT_MAX_DAILY_LOSS_XLM`,
  checked independently here so a caps-layer bug doesn't also disable the halt.
- **Error/rejection rate over a window** — too many failed submits/rejections
  among recent attempts means something is behaving unexpectedly; stop before
  it repeats fifty more times.
- **Any unreconciled fill** — a fill that doesn't match a known order handle
  is a correctness bug in the book-keeping, not a market event. Even one is
  disqualifying.
- **Cap-check failure rate** — if `checkPilotCaps` itself is erroring (not
  "refusing", actually throwing/failing to evaluate), the gate can't be
  trusted to be gating anything.
- **Data staleness** — trading on a price feed that's older than expected is
  how you get filled somewhere you'd never have agreed to.

Tripping logs loudly (`error` level) via whatever logger the caller injects
(intended to be `store.log`, so it shows up in the Logs tab like everything
else) and is recorded in `auditTrail()`. **Clearing requires a named human**
(`clear(who)`) and is itself logged (`warn` level) with that name — there is
no code path that clears a halt without one.

## Rotation gate — read this before arming anything

There is an **outstanding exposed mainnet `STELLAR_SECRET` rotation** flagged
2026-06-13 (see the second-brain note `exposed-stellar-secret`). **Do not arm
pilot mode against a wallet whose secret has not been confirmed rotated.**
Arming a real-money pilot on a key that may already be known to someone else
defeats every cap in this file — none of them protect against a
directly-drained wallet. Confirm the rotation is done (new `STELLAR_SECRET`,
old key's funds moved/empty) as a hard precondition, separate from and prior
to anything below.

## Before arming, in order

1. Confirm the `STELLAR_SECRET` rotation gate above is cleared.
2. Set the `PILOT_*` env knobs to genuinely micro values — small enough that
   hitting every cap in the same day would be a non-event, not a scare.
3. Wire `caps.ts`/`halt.ts` into the orchestrator's submit path per the
   integration spec (not part of this module) so every pilot order actually
   passes through both `checkPolicy` and `checkPilotCaps`, and the halt is
   checked before submit.
4. Watch the first few live orders by hand. This is a pilot, not a
   fire-and-forget deployment.
5. Only after that: consider `PILOT_MAX_*` increases, and treat each one as
   its own decision, made deliberately, by Kevin.
