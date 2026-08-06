import { describe, it, expect, beforeEach } from "vitest";
import {
  checkPilotCaps,
  reservePilotOrder,
  settlePilotOrder,
  releasePilotOrder,
  isPilotOrderReserved,
  clearAllPilotReservations,
  type PilotLimits,
  type PilotState,
} from "./caps";

/**
 * Pure/hermetic tests: no mocks needed (caps.ts has no collaborators). Each
 * cap is pinned at its exact boundary (allow at the limit, refuse one unit
 * past it), plus the reserve/settle/release race guard and the pair
 * allowlist.
 */

const LIMITS: PilotLimits = {
  maxTradeNotionalXlm: 10,
  maxDailyLossXlm: 5,
  maxTotalExposureXlm: 20,
  maxConcurrentOrders: 2,
  maxTradesPerDay: 3,
  allowedPairs: ["XLM/USDC"],
};

const FLAT_STATE: PilotState = {
  openOrderCount: 0,
  tradesToday: 0,
  realizedLossTodayXlm: 0,
  currentExposureXlm: 0,
};

function intent(notionalXlm: number, pair = "XLM/USDC") {
  return { pair, notionalXlm };
}

describe("checkPilotCaps — pure cap evaluation", () => {
  it("allows a clean order well within every cap", () => {
    expect(checkPilotCaps(intent(1), FLAT_STATE, LIMITS)).toEqual({ allow: true });
  });

  it("refuses a pair not on the pilot allowlist, even if otherwise fine", () => {
    const r = checkPilotCaps(intent(1, "XLM/EURC"), FLAT_STATE, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/allowlist/i);
  });

  it("per-trade notional: allows exactly at the cap, refuses one unit past it", () => {
    expect(checkPilotCaps(intent(10), FLAT_STATE, LIMITS).allow).toBe(true);
    const r = checkPilotCaps(intent(10.000001), FLAT_STATE, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/per-trade cap/i);
  });

  it("max concurrent open orders: allows below the cap, refuses at it", () => {
    const oneOpen: PilotState = { ...FLAT_STATE, openOrderCount: 1 };
    expect(checkPilotCaps(intent(1), oneOpen, LIMITS).allow).toBe(true);
    const atCap: PilotState = { ...FLAT_STATE, openOrderCount: 2 };
    const r = checkPilotCaps(intent(1), atCap, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/open pilot order/i);
  });

  it("max trades per day: allows below the cap, refuses at it", () => {
    const belowCap: PilotState = { ...FLAT_STATE, tradesToday: 2 };
    expect(checkPilotCaps(intent(1), belowCap, LIMITS).allow).toBe(true);
    const atCap: PilotState = { ...FLAT_STATE, tradesToday: 3 };
    const r = checkPilotCaps(intent(1), atCap, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/submitted 3 trade/i);
  });

  it("daily-loss cap: allows just under, refuses at/over it - even for a small order", () => {
    const justUnder: PilotState = { ...FLAT_STATE, realizedLossTodayXlm: 4.999999 };
    expect(checkPilotCaps(intent(1), justUnder, LIMITS).allow).toBe(true);
    const atCap: PilotState = { ...FLAT_STATE, realizedLossTodayXlm: 5 };
    const r = checkPilotCaps(intent(1), atCap, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/daily loss/i);
  });

  it("a non-positive/non-finite daily-loss cap FAILS CLOSED (never disables the solvency stop)", () => {
    // Review 2026-08-04 (pilot-safety P1): 0 must NOT mean "unlimited" — the
    // loss cap is the most important solvency stop, so a mis-set 0/NaN/negative
    // refuses to trade rather than silently removing the ceiling.
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const misconfigured: PilotLimits = { ...LIMITS, maxDailyLossXlm: bad };
      const r = checkPilotCaps(intent(1), FLAT_STATE, misconfigured);
      expect(r.allow).toBe(false);
      expect(r.reason).toMatch(/not a positive number|fail-closed/i);
    }
  });

  it("total-exposure cap: allows exactly up to the cap, refuses one unit past it", () => {
    const nearFull: PilotState = { ...FLAT_STATE, currentExposureXlm: 19 };
    expect(checkPilotCaps(intent(1), nearFull, LIMITS).allow).toBe(true); // lands exactly at 20
    const r = checkPilotCaps(intent(1.000001), nearFull, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/total pilot exposure/i);
  });

  it("refuses a negative notional outright", () => {
    const r = checkPilotCaps(intent(-1), FLAT_STATE, LIMITS);
    expect(r.allow).toBe(false);
  });
});

describe("reservePilotOrder / settlePilotOrder / releasePilotOrder — TOCTOU guard", () => {
  beforeEach(() => clearAllPilotReservations());

  it("a second concurrent reservation cannot push open orders past the concurrency cap", () => {
    // maxConcurrentOrders = 2, starting from 0 open orders in the persisted
    // state (the state a caller would read BEFORE either async submit lands).
    const r1 = reservePilotOrder("order-1", intent(1), FLAT_STATE, LIMITS);
    const r2 = reservePilotOrder("order-2", intent(1), FLAT_STATE, LIMITS);
    // Both see the SAME stale FLAT_STATE (openOrderCount: 0), but the second
    // call must see order-1's reservation folded in and still allow it
    // (0 + 1 reserved = 1 < cap 2) ...
    expect(r1.allow).toBe(true);
    expect(r2.allow).toBe(true);
    // ... but a THIRD concurrent attempt against the same stale state must be
    // refused: two reservations are already outstanding (0 + 2 = cap 2).
    const r3 = reservePilotOrder("order-3", intent(1), FLAT_STATE, LIMITS);
    expect(r3.allow).toBe(false);
    expect(r3.reason).toMatch(/open pilot order/i);
  });

  it("a second concurrent reservation cannot push exposure past the exposure cap", () => {
    const nearFull: PilotState = { ...FLAT_STATE, currentExposureXlm: 15 };
    // First reservation of 4 XLM: 15 + 4 = 19, within the 20 cap.
    const r1 = reservePilotOrder("order-1", intent(4), nearFull, LIMITS);
    expect(r1.allow).toBe(true);
    // Second reservation of 4 XLM against the SAME stale state (still reads
    // currentExposureXlm: 15) would be 19 + 4 = 23 once order-1's reservation
    // is folded in - over the 20 cap, so it must be refused even though the
    // persisted state alone looks fine.
    const r2 = reservePilotOrder("order-2", intent(4), nearFull, LIMITS);
    expect(r2.allow).toBe(false);
    expect(r2.reason).toMatch(/total pilot exposure/i);
  });

  it("settling frees the reservation so persisted-state accounting takes over", () => {
    reservePilotOrder("order-1", intent(1), FLAT_STATE, LIMITS);
    expect(isPilotOrderReserved("order-1")).toBe(true);
    settlePilotOrder("order-1");
    expect(isPilotOrderReserved("order-1")).toBe(false);
  });

  it("releasing frees the reservation without it ever counting", () => {
    reservePilotOrder("order-1", intent(1), FLAT_STATE, LIMITS);
    releasePilotOrder("order-1");
    expect(isPilotOrderReserved("order-1")).toBe(false);
    // The slot is free again - a fresh reservation for the same id succeeds.
    const r = reservePilotOrder("order-1", intent(1), FLAT_STATE, LIMITS);
    expect(r.allow).toBe(true);
  });

  it("refuses reserving the same id twice while outstanding", () => {
    reservePilotOrder("dup", intent(1), FLAT_STATE, LIMITS);
    const r = reservePilotOrder("dup", intent(1), FLAT_STATE, LIMITS);
    expect(r.allow).toBe(false);
    expect(r.reason).toMatch(/already outstanding/i);
  });

  it("folds outstanding reservations into tradesToday (per-day cap is TOCTOU-safe)", () => {
    // Review 2026-08-04 (pilot-safety P1): before the fix, N concurrent reserves
    // in one tick each saw the same stale tradesToday and all slipped the cap.
    const limits: PilotLimits = { ...LIMITS, maxTradesPerDay: 2, maxConcurrentOrders: 10 };
    const state: PilotState = { ...FLAT_STATE, tradesToday: 1 };
    // 1 already today + this reservation = 2, still within the cap of 2.
    expect(reservePilotOrder("t-1", intent(1), state, limits).allow).toBe(true);
    // A second concurrent reserve would make it 3 today — must be refused now,
    // even though the persisted tradesToday is still 1.
    const r2 = reservePilotOrder("t-2", intent(1), state, limits);
    expect(r2.allow).toBe(false);
    expect(r2.reason).toMatch(/trade\(s\) today/i);
  });

  it("a refused reservation is never actually held", () => {
    const overCap = { ...FLAT_STATE, openOrderCount: 2 };
    const r = reservePilotOrder("refused", intent(1), overCap, LIMITS);
    expect(r.allow).toBe(false);
    expect(isPilotOrderReserved("refused")).toBe(false);
  });
});
