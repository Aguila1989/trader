/**
 * PILOT CAPS — Phase 5 (hard-capped live micro-pilot).
 *
 * ADDITIVE, NOT A REPLACEMENT: every pilot order still has to clear
 * `checkPolicy` (src/policy/engine.ts) exactly as it does today - the tier
 * caps, exposure caps, slippage/deviation, cooldown, kill switch, etc. are all
 * unchanged and still evaluated. This module is a SECOND, independent,
 * intentionally dumber set of ceilings evaluated ONLY in pilot mode, in front
 * of `checkPolicy`, so a bug or misconfiguration in one layer (a stale risk
 * profile, a mis-scaled tier, a policy regression) can't by itself let the
 * pilot grow past what Kevin explicitly armed it for. Two independent gates
 * that both have to say yes is the whole point - never merge these into one.
 *
 * Deliberately NOT integrated with checkPolicy's "risk-reducing" exemption:
 * checkPolicy lets a position-shrinking trade skip its daily/exposure gates so
 * a stop-loss is never stranded. Pilot caps do NOT grant that exemption - at
 * micro-pilot scale a blocked exit is a "call Kevin" event, not a real solvency
 * risk, and giving exits a bypass here would reopen exactly the "quietly grow"
 * failure mode this harness exists to close off. If that tradeoff ever bites in
 * practice, loosen it deliberately (see README.md) rather than special-casing
 * it silently.
 *
 * Everything here is pure and hermetic: no config import, no DB, no network,
 * no timers. The caller (the orchestrator's pilot integration, wired
 * separately - see the Phase 5 integrationSpec) is responsible for building
 * `PilotLimits` from config/env and `PilotState` from the live ledger, and for
 * converting a proposal's amount/price into an XLM-equivalent notional the
 * same way checkPolicy's exposure caps already do (src/stellar/positions.ts
 * `xlmNotional`) before calling in here.
 */

/** One order the pilot wants to place, already reduced to the numbers these
 *  caps care about. `pair` MUST be canonicalized the same way the caller
 *  canonicalizes `limits.allowedPairs` (e.g. "XLM/USDC") - this module does
 *  no asset-spec normalization of its own, to stay dependency-free. */
export interface PilotOrderIntent {
  pair: string;
  /** XLM-equivalent notional value of this order (always >= 0). */
  notionalXlm: number;
}

/** Hard ceilings for the pilot. Every field is a HARD cap - there is no
 *  taper, no risk-profile scaling, no manual-order exemption. That is
 *  deliberate: this layer exists to be boring and impossible to game. */
export interface PilotLimits {
  /** Max XLM-equivalent notional for a SINGLE order. */
  maxTradeNotionalXlm: number;
  /** Max realized loss (XLM-equivalent, positive number) allowed today before
   *  every new order is refused - exits included (see file header). */
  maxDailyLossXlm: number;
  /** Max total XLM-equivalent exposure across every open pilot position,
   *  AFTER this order fills. */
  maxTotalExposureXlm: number;
  /** Max number of open (unfilled/unreconciled) orders at once. */
  maxConcurrentOrders: number;
  /** Max number of orders submitted today. */
  maxTradesPerDay: number;
  /** Exact allowlist of pairs the pilot may trade, e.g. ["XLM/USDC"]. Anything
   *  not in this list is refused regardless of every other cap. */
  allowedPairs: string[];
}

/** The pilot's live counters, read fresh by the caller before every check. */
export interface PilotState {
  /** Number of currently-open pilot orders (including any in-flight reserved
   *  ones - see `reservePilotOrder`, which folds those in automatically). */
  openOrderCount: number;
  /** Orders already submitted today (pilot day, whatever boundary the caller
   *  uses - the same dayKey() the rest of the app uses is recommended). */
  tradesToday: number;
  /** Realized loss booked today, XLM-equivalent, as a POSITIVE number (0 if
   *  flat or net positive). Unrealized marks are the caller's call whether to
   *  fold in - see checkPolicy's own unrealizedPnl handling for precedent. */
  realizedLossTodayXlm: number;
  /** Current total XLM-equivalent exposure across open pilot positions,
   *  BEFORE this order. */
  currentExposureXlm: number;
}

export interface PilotCapsResult {
  allow: boolean;
  /** Populated iff allow is false - which cap refused it and by how much. */
  reason?: string;
}

const EPS = 1e-7;

/**
 * The pure cap check. Evaluates every ceiling and returns the FIRST violation
 * (unlike checkPolicy's full violation list - the pilot UI only needs "why
 * not", not an exhaustive report, and stopping at the first keeps this
 * trivial to reason about and test at each boundary independently).
 */
export function checkPilotCaps(
  intent: PilotOrderIntent,
  state: PilotState,
  limits: PilotLimits,
): PilotCapsResult {
  if (!(intent.notionalXlm >= 0)) {
    return { allow: false, reason: "Order notional must be a non-negative number." };
  }

  // 1. Pair allowlist - the pilot may only ever touch the pairs Kevin armed
  //    it for, independent of whatever the main asset whitelist allows.
  if (!limits.allowedPairs.includes(intent.pair)) {
    return {
      allow: false,
      reason: `Pilot pair "${intent.pair}" is not in the pilot allowlist (${limits.allowedPairs.join(", ") || "none"}).`,
    };
  }

  // 2. Per-trade notional ceiling.
  if (intent.notionalXlm > limits.maxTradeNotionalXlm + EPS) {
    return {
      allow: false,
      reason: `Order notional ${intent.notionalXlm} XLM exceeds the pilot per-trade cap ${limits.maxTradeNotionalXlm} XLM.`,
    };
  }

  // 3. Max concurrent open orders.
  if (state.openOrderCount >= limits.maxConcurrentOrders) {
    return {
      allow: false,
      reason: `${state.openOrderCount} open pilot order(s) already outstanding (cap ${limits.maxConcurrentOrders}).`,
    };
  }

  // 4. Max trades per day.
  if (state.tradesToday >= limits.maxTradesPerDay) {
    return {
      allow: false,
      reason: `Pilot has already submitted ${state.tradesToday} trade(s) today (cap ${limits.maxTradesPerDay}).`,
    };
  }

  // 5. Daily-loss cap - a hard stop, no taper. Once reached, EVERY order is
  //    refused (including exits - see file header for why).
  //    A non-positive / non-finite cap is a MISCONFIGURATION and fails CLOSED
  //    (refuse), never silently-disabled: the loss cap is the single most
  //    important solvency stop, so "0"/NaN must not read as "unlimited". Every
  //    other cap already treats 0 as fully restrictive; this one now matches.
  //    (Review 2026-08-04, pilot-safety P1.)
  if (!(limits.maxDailyLossXlm > 0) || !Number.isFinite(limits.maxDailyLossXlm)) {
    return {
      allow: false,
      reason: `Pilot daily-loss cap is not a positive number (${limits.maxDailyLossXlm}) - refusing to trade (fail-closed).`,
    };
  }
  if (state.realizedLossTodayXlm >= limits.maxDailyLossXlm - EPS) {
    return {
      allow: false,
      reason: `Pilot daily loss ${state.realizedLossTodayXlm} XLM has reached the cap ${limits.maxDailyLossXlm} XLM - halted for the day.`,
    };
  }

  // 6. Total-exposure cap - what this order would bring the book to.
  const projectedExposure = state.currentExposureXlm + intent.notionalXlm;
  if (projectedExposure > limits.maxTotalExposureXlm + EPS) {
    return {
      allow: false,
      reason: `This order would bring total pilot exposure to ${round7(projectedExposure)} XLM, above the cap ${limits.maxTotalExposureXlm} XLM.`,
    };
  }

  return { allow: true };
}

// ---------------------------------------------------------------------------
// Reserve-before-await: a TOCTOU-safe guard for the gap between "caps say yes"
// and "the order is actually booked into PilotState" (sign + submit + persist
// is async; two proposals could otherwise both pass checkPilotCaps against the
// SAME stale state before either lands). Mirrors the idiom in
// src/stellar/txReservation.ts: the check-and-reserve is a single SYNCHRONOUS
// call, and Node's single-threaded event loop makes that atomic - no two
// concurrent callers can both observe capacity and both win. Reserved orders
// are folded into `openOrderCount`/`currentExposureXlm` for every subsequent
// check until `settlePilotOrder`/`releasePilotOrder` removes them.
// ---------------------------------------------------------------------------

interface Reservation {
  notionalXlm: number;
}

const reservations = new Map<string, Reservation>();

function reservedCount(): number {
  return reservations.size;
}

function reservedNotionalXlm(): number {
  let sum = 0;
  for (const r of reservations.values()) sum += r.notionalXlm;
  return sum;
}

/**
 * Atomically check `intent` against `state` PLUS every currently-outstanding
 * reservation, and - if it passes - reserve it under `id` before returning.
 * The caller must follow up with exactly one of `settlePilotOrder(id)` (the
 * order was booked; the caller's own persisted PilotState now reflects it) or
 * `releasePilotOrder(id)` (the order failed/was rejected - free the slot
 * without it ever counting). No `await` happens inside this function, so two
 * concurrent calls can never both observe the pre-reservation state.
 */
export function reservePilotOrder(
  id: string,
  intent: PilotOrderIntent,
  state: PilotState,
  limits: PilotLimits,
): PilotCapsResult {
  if (reservations.has(id)) {
    return { allow: false, reason: `Reservation id "${id}" is already outstanding.` };
  }
  const liveState: PilotState = {
    ...state,
    openOrderCount: state.openOrderCount + reservedCount(),
    // Fold in-flight reservations into tradesToday too, so the per-day cap is
    // TOCTOU-safe: N concurrent reserves in one scan tick can't each see the
    // same stale tradesToday and all slip under the cap. (Review 2026-08-04,
    // pilot-safety P1 — previously only openOrderCount/exposure were folded.)
    tradesToday: state.tradesToday + reservedCount(),
    currentExposureXlm: state.currentExposureXlm + reservedNotionalXlm(),
  };
  const result = checkPilotCaps(intent, liveState, limits);
  if (!result.allow) return result;
  reservations.set(id, { notionalXlm: intent.notionalXlm });
  return { allow: true };
}

/** The reserved order was booked; drop the in-flight reservation (the
 *  caller's persisted PilotState is the source of truth for it from now on). */
export function settlePilotOrder(id: string): void {
  reservations.delete(id);
}

/** The reserved order failed/was rejected/was never submitted; free the slot
 *  without it ever having counted against any cap. */
export function releasePilotOrder(id: string): void {
  reservations.delete(id);
}

/** Whether `id` currently holds an outstanding reservation. */
export function isPilotOrderReserved(id: string): boolean {
  return reservations.has(id);
}

/** Test/ops helper: drop every outstanding reservation. */
export function clearAllPilotReservations(): void {
  reservations.clear();
}

function round7(n: number): number {
  return Number(n.toFixed(7));
}
