import { describe, it, expect, beforeEach } from "vitest";
import {
  evaluateHaltConditions,
  PilotHaltSupervisor,
  type HaltConditionInputs,
} from "./halt";

/** A complete, all-clear input set - each test mutates only the field(s) it
 *  means to exercise, so an unrelated condition can never accidentally fire. */
const CLEAN: HaltConditionInputs = {
  dailyLossXlm: 0,
  maxDailyLossXlm: 5,
  errorOrRejectionCount: 0,
  windowAttemptCount: 10,
  maxErrorRate: 0.2,
  unreconciledFillCount: 0,
  capCheckFailureCount: 0,
  capCheckAttemptCount: 10,
  maxCapCheckFailureRate: 0.1,
  dataAgeMs: 1_000,
  maxDataAgeMs: 30_000,
};

describe("evaluateHaltConditions — pure boundary checks", () => {
  it("does not trip on an all-clear input set", () => {
    expect(evaluateHaltConditions(CLEAN)).toEqual({ shouldTrip: false });
  });

  it("daily-loss cap: trips exactly at the cap, not just under it", () => {
    expect(evaluateHaltConditions({ ...CLEAN, dailyLossXlm: 4.999999 }).shouldTrip).toBe(false);
    const r = evaluateHaltConditions({ ...CLEAN, dailyLossXlm: 5 });
    expect(r.shouldTrip).toBe(true);
    expect(r.reason).toMatch(/daily loss/i);
  });

  it("daily-loss cap of 0 disables the condition", () => {
    const r = evaluateHaltConditions({ ...CLEAN, maxDailyLossXlm: 0, dailyLossXlm: 9999 });
    expect(r.shouldTrip).toBe(false);
  });

  it("error/rejection rate: trips just over the cap, not at or under it", () => {
    // 2/10 = 0.2 = the cap exactly - must NOT trip (over, not at-or-over).
    expect(
      evaluateHaltConditions({ ...CLEAN, errorOrRejectionCount: 2, windowAttemptCount: 10 })
        .shouldTrip,
    ).toBe(false);
    const r = evaluateHaltConditions({ ...CLEAN, errorOrRejectionCount: 3, windowAttemptCount: 10 });
    expect(r.shouldTrip).toBe(true);
    expect(r.reason).toMatch(/error\/rejection rate/i);
  });

  it("a zero-attempt window never divides by zero / never trips the rate check", () => {
    const r = evaluateHaltConditions({ ...CLEAN, windowAttemptCount: 0, errorOrRejectionCount: 0 });
    expect(r.shouldTrip).toBe(false);
  });

  it("any unreconciled fill trips immediately, even just one", () => {
    const r = evaluateHaltConditions({ ...CLEAN, unreconciledFillCount: 1 });
    expect(r.shouldTrip).toBe(true);
    expect(r.reason).toMatch(/unreconciled fill/i);
  });

  it("cap-check failure rate: trips just over the cap, not at or under it", () => {
    // 1/10 = 0.1 = the cap exactly - must NOT trip.
    expect(
      evaluateHaltConditions({ ...CLEAN, capCheckFailureCount: 1, capCheckAttemptCount: 10 })
        .shouldTrip,
    ).toBe(false);
    const r = evaluateHaltConditions({ ...CLEAN, capCheckFailureCount: 2, capCheckAttemptCount: 10 });
    expect(r.shouldTrip).toBe(true);
    expect(r.reason).toMatch(/cap-check failure rate/i);
  });

  it("data staleness: trips just over the max age, not at or under it", () => {
    expect(evaluateHaltConditions({ ...CLEAN, dataAgeMs: 30_000 }).shouldTrip).toBe(false);
    const r = evaluateHaltConditions({ ...CLEAN, dataAgeMs: 30_001 });
    expect(r.shouldTrip).toBe(true);
    expect(r.reason).toMatch(/stale/i);
  });

  it("FAILS CLOSED on a non-finite input (NaN/Infinity trips, never silently passes)", () => {
    // Review 2026-08-04 (pilot-safety P1): a NaN dataAgeMs (missing last-tick
    // timestamp) or NaN dailyLoss (broken ledger read) is exactly the "wrong"
    // state the halt exists to catch, yet `NaN > x` is false — so without the
    // guard it would fail OPEN. Every non-finite input must trip.
    for (const bad of [
      { dataAgeMs: Number.NaN },
      { dailyLossXlm: Number.NaN },
      { dataAgeMs: Number.POSITIVE_INFINITY },
      { maxErrorRate: Number.NaN },
    ]) {
      const r = evaluateHaltConditions({ ...CLEAN, ...bad });
      expect(r.shouldTrip).toBe(true);
      expect(r.reason).toMatch(/non-finite/i);
    }
  });
});

describe("PilotHaltSupervisor — sticky, human-only clear, fail-closed", () => {
  let sup: PilotHaltSupervisor;
  beforeEach(() => {
    sup = new PilotHaltSupervisor();
  });

  it("starts clear", () => {
    expect(sup.isHalted()).toBe(false);
  });

  it("trip() halts and it stays halted (no auto-reset) across repeated checks", () => {
    sup.trip("test trip");
    expect(sup.isHalted()).toBe(true);
    expect(sup.isHalted()).toBe(true); // reading it again never clears it
  });

  it("checkAndTrip trips and STAYS tripped even once the underlying condition clears", () => {
    let loss = 5; // at the cap
    const halted1 = sup.checkAndTrip(() => ({ ...CLEAN, dailyLossXlm: loss }));
    expect(halted1).toBe(true);
    expect(sup.isHalted()).toBe(true);

    // The condition that caused the trip is now gone (loss reset to 0), but a
    // self-clearing halt is not a halt - it must remain tripped regardless.
    loss = 0;
    const halted2 = sup.checkAndTrip(() => ({ ...CLEAN, dailyLossXlm: loss }));
    expect(halted2).toBe(true);
    expect(sup.isHalted()).toBe(true);
  });

  it("checkAndTrip fails CLOSED when state can't be read", () => {
    const halted = sup.checkAndTrip(() => {
      throw new Error("DB unreachable");
    });
    expect(halted).toBe(true);
    expect(sup.isHalted()).toBe(true);
    expect(sup.auditTrail()[0].reason).toMatch(/unreadable/i);
  });

  it("clear(who) requires a non-empty human identity", () => {
    sup.trip("test trip");
    expect(() => sup.clear("")).toThrow(/human identity/i);
    expect(() => sup.clear("   ")).toThrow(/human identity/i);
    expect(sup.isHalted()).toBe(true); // the failed clear attempts never cleared it
  });

  it("clear(who) with a real identity clears it and is recorded in the audit trail", () => {
    sup.trip("test trip");
    sup.clear("Kevin");
    expect(sup.isHalted()).toBe(false);
    const entry = sup.auditTrail()[0];
    expect(entry.action).toBe("clear");
    expect(entry.who).toBe("Kevin");
  });

  it("audit trail records every trip and clear, newest first", () => {
    sup.trip("first reason");
    sup.clear("Kevin");
    sup.trip("second reason");
    const trail = sup.auditTrail();
    expect(trail.map((e) => e.action)).toEqual(["trip", "clear", "trip"]);
    expect(trail[0].reason).toBe("second reason");
  });

  it("tripping again while already halted appends a new reason but never un-halts", () => {
    sup.trip("first reason");
    sup.trip("second reason - different failure while still halted");
    expect(sup.isHalted()).toBe(true);
    expect(sup.auditTrail()[0].reason).toMatch(/second reason/i);
    expect(sup.auditTrail()).toHaveLength(2);
  });

  it("logger is called with a loud level on trip and clear", () => {
    const calls: Array<{ level: string; message: string }> = [];
    const logger = { log: (level: "warn" | "error", message: string) => calls.push({ level, message }) };
    sup.trip("loud reason", logger);
    sup.clear("Kevin", logger);
    expect(calls[0].level).toBe("error");
    expect(calls[0].message).toMatch(/loud reason/);
    expect(calls[1].level).toBe("warn");
    expect(calls[1].message).toMatch(/Kevin/);
  });
});
