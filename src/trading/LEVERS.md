# Phase 3.1 — Propose-Stage Mechanics Levers

## Diagnosis

Per the repo's own divergence logging (`trading/explain.ts`), an overnight
autopilot watch (2026-06-20) ran 40 chain scans, fully live+auto-approve, and
executed **nothing**. Every skip that looked like AI over-caution was
**PHANTOM**: `isFundable("buy", base, quote, held)` requires holding the
**quote** asset to buy, `isFundable("sell", ...)` requires holding the
**base** asset to sell — and the wallet held only XLM. On every XLM-quoted
pair a buy signal is structurally unfundable until some quote currency
(USDC, EURC, ...) is held. There were **zero real fundable misses**. The AI
was never the bottleneck; the wallet's one-sided inventory was.

A second, independent bug compounds the first: `risk-profile-no-lever-on-ai-
propose.md` (2026-07-03) — every `effective*()` function in
`policy/riskProfile.ts` governs a **post-proposal** gate (size cap,
slippage, cooldown, drawdown pause) or a **submit-time veto**
(`minConfidenceScore`). None of them touch what counts as a *candidate*
setup in the first place: `backtest/strategy.ts`'s `DEFAULT_PARAMS` and the
prompt's rendering of it (`claude/agent.ts`'s old `rulebookLine()`) were
frozen regardless of risk profile. An all-HIGH operator got a looser
post-hoc gate on the **same** candidates a LOW operator saw — never a wider
net of candidates. Risk profile could veto more, never propose more.

Neither bug is "the AI is too cautious." Both are mechanical: a funding
constraint and a one-sided lever. This phase fixes the mechanics; it does
not touch the AI's judgment.

## Fix 1 — two-sided inventory manager (`src/trading/inventory.ts`)

| Function | Purpose |
|---|---|
| `fundabilityReport(balances, pairs)` | Which side(s) of each pair are fundable right now, and why not — mirrors `explain.ts:isFundable`'s exact rule across a whole pair list, plus a `missingAssets` / `deadPairs` roll-up. |
| `fundabilityFromPredicate(held, pairs)` | Same report from an existing `held` predicate (e.g. orchestrator's `walletHeld()`) — avoids a second balance fetch. |
| `rebalancePlan(balances, targets, limits)` | Banded target-inventory model (default: hold both legs of a pair ~50/50, with a tolerance band). Proposes the **minimal** chain-neutral intent (a buy/sell on the same pair, same `TradeSide` vocabulary a `TradeProposal` uses) that brings a drifted pair back to the **nearest band edge**, never past it. Capped by both a per-trade ceiling and a share-of-total-portfolio ceiling; sub-dust intents are dropped. |
| `explainPhantomSkips(skips, report, plan?)` | Turns a PHANTOM skip into an operator-actionable line: which asset is missing, and — when a matching `rebalancePlan` intent exists — exactly how much to move to unlock it. |

Pure functions, zero I/O, zero chain-SDK dependency (chain-neutral). Prices/
balances are always supplied by the caller — this module never fetches or
converts anything itself.

## Fix 2 — propose-stage risk lever (`src/policy/proposeBias.ts`)

| Function | Purpose |
|---|---|
| `biasedStrategyParams(profile)` | Nudges the rulebook's RSI/rangePos entry bands based on risk appetite (basic mode: `tradeFrequency`; expert mode: `minConfidence`, since it's already the operator's explicit aggressiveness dial). **LOW/base reproduces `DEFAULT_PARAMS` bit-for-bit** — the same backward-compat invariant every `effective*()` function in `riskProfile.ts` already holds, so a default (all-LOW, non-expert) deployment is byte-for-byte unchanged. |
| `proposeBias(profile)` | The full propose-stage bias object: `minConfidence` + `sizeMultiplier` (re-exported from `riskProfile.ts`, never re-implemented) + `strategyParams` (from `biasedStrategyParams`). Read LIVE per request, never cached. |
| `promptDirectives(bias)` | The AI-prompt block stating the **current** thresholds, rendered from the `bias` argument only — no module-level constants. Fixes the "prompts bake stale limits at import time" half of the diagnosed bug: a caller that re-derives `bias` every request can never go stale. |

## Why this isn't a new flag

Everything here piggybacks on the risk-profile dial that already exists and
already defaults to all-LOW / non-expert. Aggressiveness is 0 at that
default, so `biasedStrategyParams` returns `DEFAULT_PARAMS` unchanged and the
whole propose-stage behavior is identical to before for any operator who
hasn't touched their risk profile — exactly like every other `effective*()`
function in `riskProfile.ts`. No new env var, no new toggle.

## What changed vs. before

| Before | After |
|---|---|
| A PHANTOM skip logged as `"(+ N phantom, unfundable)"` — a bare count. | `explainPhantomSkips` names the missing asset and (when queued) the rebalance size to fix it. |
| The rulebook's entry bands were `DEFAULT_PARAMS`, always, regardless of risk profile. | `biasedStrategyParams` widens the entry bands as trade-frequency/aggressiveness rises; LOW is unchanged. |
| The AI prompt's rulebook description was a frozen module-level string (`rulebookLine()` over `DEFAULT_PARAMS`). | `promptDirectives(bias)` renders the LIVE, risk-profile-adjusted thresholds every request. |
| The divergence logger (`orchestrator.ts`) scored the AI against unbiased `DEFAULT_PARAMS` even though the AI's prompt (once wired) sees biased thresholds. | Both `baselineCall` call sites take the SAME `biasedStrategyParams(profile)` the prompt used, so a logged "divergence" means real disagreement, not bias drift (see `integrationSpec.otherSharedEdits`). |

## Non-goals / left for a later phase

- **Executing** a `rebalancePlan` intent (converting its `xlmValue` to a base
  amount at the live price and pushing it through the orchestrator's
  propose→policy→sign pipeline) is not wired here — this phase provides the
  plan; wiring it into an autonomous action is a separate, larger decision
  (it would need its own flag-gate per the "anything that acts on its own
  must default off" rule) and is intentionally out of scope for a MECHANICS
  fix.
- Multi-pair / whole-portfolio target inventory (beyond a per-pair base/quote
  split) is not modeled — XLM legs shared across many pairs would need a
  portfolio-level solve, which is more than "the simplest implementation
  that fully meets the requirement" for this phase.
