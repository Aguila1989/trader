/**
 * PILOT AUTO-HALT — Phase 5 (hard-capped live micro-pilot).
 *
 * A supervisor that can trip a global "stop the pilot" flag on its own, on top
 * of the operator's manual kill switch (src/trading/store.ts killSwitch) and
 * the caps in ./caps.ts. Where caps.ts refuses ONE order against a static
 * ceiling, this module watches for signs that something is WRONG WITH THE
 * SYSTEM ITSELF (errors, an unreconciled fill, stale data) and halts
 * everything until a human looks at it.
 *
 * Contract (deliberately stricter than checkPolicy/caps):
 *   - Once tripped, `isHalted()` stays true until `clear(who)` is called by a
 *     human. There is NO auto-reset, NO timeout, NO "clears itself once the
 *     condition passes" - a halt that clears itself the moment things look
 *     okay again is not a halt, it's a retry loop wearing a safety costume.
 *   - `clear` REQUIRES a non-empty `who` (a human identity) and is recorded in
 *     the audit trail. There is no anonymous or automatic clear path anywhere
 *     in this file.
 *   - Fails CLOSED: if the caller can't even read the state needed to decide
 *     whether to trip (the `readInputs` callback throws), that is treated as
 *     a trip, not a skip. An observability outage must not look like "all
 *     clear".
 *
 * Pure/hermetic: no config import, no DB, no network, no timers. The caller
 * wires `readInputs` (pulls live numbers from store/positions/monitor) and an
 * optional logger (typically `store.log.bind(store)`) - see the Phase 5
 * integrationSpec for exactly where this gets called from the orchestrator.
 */

export interface HaltLogger {
  log(level: "warn" | "error", message: string, data?: unknown): void;
}

export interface HaltAuditEntry {
  ts: string;
  action: "trip" | "clear";
  reason: string;
  /** Set only on a "clear" entry - the human who cleared it. */
  who?: string;
}

/** Live numbers the halt conditions are evaluated against. All optional
 *  counts default to 0 / not-applicable so a caller that doesn't track a
 *  particular signal yet (e.g. no cap-check telemetry wired up) can omit it
 *  without accidentally tripping a rate check on 0/0. */
export interface HaltConditionInputs {
  /** Realized loss booked today (XLM-equivalent, positive number). */
  dailyLossXlm: number;
  /** Daily-loss ceiling (0 disables this condition). */
  maxDailyLossXlm: number;
  /** Errors + rejected submissions observed in the trailing window. */
  errorOrRejectionCount: number;
  /** Total order attempts in that same trailing window (the denominator). */
  windowAttemptCount: number;
  /** Max acceptable (errorOrRejectionCount / windowAttemptCount), e.g. 0.2. */
  maxErrorRate: number;
  /** Fills observed that don't reconcile to a known order handle - should
   *  always be 0; any positive value is a correctness bug, not a risk event. */
  unreconciledFillCount: number;
  /** Cap-check (checkPilotCaps) calls that themselves errored (not "refused",
   *  actually threw/failed to evaluate) in the trailing window. */
  capCheckFailureCount: number;
  /** Total cap-check attempts in that window (denominator). */
  capCheckAttemptCount: number;
  /** Max acceptable (capCheckFailureCount / capCheckAttemptCount). */
  maxCapCheckFailureRate: number;
  /** Age (ms) of the market data the pilot would trade on. */
  dataAgeMs: number;
  /** Max acceptable data age (ms) before it's considered stale. */
  maxDataAgeMs: number;
}

export interface HaltEvaluation {
  shouldTrip: boolean;
  reason?: string;
}

/**
 * Pure evaluation of the halt conditions - no state, no side effects. Returns
 * the FIRST condition that fires (same "first violation wins" shape as
 * checkPilotCaps, for the same reason: simple to test each boundary in
 * isolation). A `0` threshold/denominator always disables its condition
 * rather than dividing by zero or false-tripping.
 */
export function evaluateHaltConditions(inp: HaltConditionInputs): HaltEvaluation {
  // Fail CLOSED on malformed input. A non-finite reading (e.g. dataAgeMs = NaN
  // from a missing last-tick timestamp, or a NaN loss from a broken ledger
  // read) is exactly the "something is wrong" state the halt exists to catch -
  // yet `NaN > x` is false, so without this guard every such condition would
  // silently NOT trip (fail OPEN). (Review 2026-08-04, pilot-safety P1.)
  const numericInputs = [
    inp.dailyLossXlm,
    inp.maxDailyLossXlm,
    inp.errorOrRejectionCount,
    inp.windowAttemptCount,
    inp.maxErrorRate,
    inp.unreconciledFillCount,
    inp.capCheckFailureCount,
    inp.capCheckAttemptCount,
    inp.maxCapCheckFailureRate,
    inp.dataAgeMs,
    inp.maxDataAgeMs,
  ];
  if (numericInputs.some((x) => !Number.isFinite(x))) {
    return {
      shouldTrip: true,
      reason: "A halt input was non-finite (NaN/Infinity) - failing closed.",
    };
  }

  if (inp.maxDailyLossXlm > 0 && inp.dailyLossXlm >= inp.maxDailyLossXlm) {
    return {
      shouldTrip: true,
      reason: `Daily loss ${inp.dailyLossXlm} XLM reached the pilot cap ${inp.maxDailyLossXlm} XLM.`,
    };
  }

  if (inp.windowAttemptCount > 0) {
    const rate = inp.errorOrRejectionCount / inp.windowAttemptCount;
    if (rate > inp.maxErrorRate) {
      return {
        shouldTrip: true,
        reason: `Error/rejection rate ${(rate * 100).toFixed(0)}% over the last ${inp.windowAttemptCount} attempt(s) exceeds the cap ${(inp.maxErrorRate * 100).toFixed(0)}%.`,
      };
    }
  }

  if (inp.unreconciledFillCount > 0) {
    return {
      shouldTrip: true,
      reason: `${inp.unreconciledFillCount} unreconciled fill(s) - a fill was observed that doesn't match any known order handle.`,
    };
  }

  if (inp.capCheckAttemptCount > 0) {
    const rate = inp.capCheckFailureCount / inp.capCheckAttemptCount;
    if (rate > inp.maxCapCheckFailureRate) {
      return {
        shouldTrip: true,
        reason: `Cap-check failure rate ${(rate * 100).toFixed(0)}% over the last ${inp.capCheckAttemptCount} attempt(s) exceeds the cap ${(inp.maxCapCheckFailureRate * 100).toFixed(0)}%.`,
      };
    }
  }

  if (inp.dataAgeMs > inp.maxDataAgeMs) {
    return {
      shouldTrip: true,
      reason: `Market data is ${inp.dataAgeMs}ms old (max ${inp.maxDataAgeMs}ms) - refusing to evaluate the pilot on stale data.`,
    };
  }

  return { shouldTrip: false };
}

/**
 * The stateful supervisor. One instance is the source of truth for "is the
 * pilot halted right now" - construct a single shared instance (see
 * `pilotHalt` below) rather than one per call site, or different parts of the
 * app could disagree about the halt state.
 */
export class PilotHaltSupervisor {
  private halted = false;
  private readonly audit: HaltAuditEntry[] = [];

  /** True once ANY trip has fired and no human has cleared it since. */
  isHalted(): boolean {
    return this.halted;
  }

  /**
   * Trip the halt. Idempotent while already halted: it stays halted and the
   * new reason is appended to the audit trail (so a second, different failure
   * during an existing halt is still visible), but it never "extends" or
   * resets anything - there is nothing to reset, since only a human `clear`
   * can ever turn it off.
   */
  trip(reason: string, logger?: HaltLogger): void {
    this.halted = true;
    this.audit.unshift({ ts: new Date().toISOString(), action: "trip", reason });
    logger?.log("error", `[PILOT AUTO-HALT] ${reason}`);
  }

  /**
   * Clear the halt. Requires a non-empty human identity - there is
   * deliberately no way to call this without one, so the audit trail always
   * answers "who cleared this and decided the pilot was safe to resume".
   */
  clear(who: string, logger?: HaltLogger): void {
    if (!who || !who.trim()) {
      throw new Error("PilotHaltSupervisor.clear requires a non-empty human identity (who).");
    }
    this.halted = false;
    this.audit.unshift({ ts: new Date().toISOString(), action: "clear", reason: "manually cleared", who: who.trim() });
    logger?.log("warn", `[PILOT AUTO-HALT] cleared by ${who.trim()}.`);
  }

  /** Full audit trail, newest first. Read-only. */
  auditTrail(): readonly HaltAuditEntry[] {
    return this.audit;
  }

  /**
   * Read live inputs and trip if warranted. FAILS CLOSED: if `readInputs`
   * throws (the underlying state couldn't even be read), that is itself
   * treated as a trip condition, not skipped. Already-halted is a fast no-op
   * that still returns true without re-reading state (a human hasn't cleared
   * it yet, so there is nothing new to decide).
   *
   * Returns the post-check halted state, so callers can gate a submission on
   * the return value directly: `if (pilotHalt.checkAndTrip(...)) refuse();`.
   */
  checkAndTrip(readInputs: () => HaltConditionInputs, logger?: HaltLogger): boolean {
    if (this.halted) return true;

    let inputs: HaltConditionInputs;
    try {
      inputs = readInputs();
    } catch (err) {
      this.trip(
        `Pilot state unreadable (${(err as Error).message}) - failing closed.`,
        logger,
      );
      return true;
    }

    const evaluation = evaluateHaltConditions(inputs);
    if (evaluation.shouldTrip) {
      this.trip(evaluation.reason!, logger);
      return true;
    }
    return false;
  }
}

/**
 * Shared singleton. Constructing it has zero side effects (no I/O, no
 * timers), so importing this module is always safe even though the app
 * imports widely - it only ever holds an in-memory flag + audit array until
 * something calls into it.
 */
export const pilotHalt = new PilotHaltSupervisor();
