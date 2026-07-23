import { describe, it, expect, beforeEach } from "vitest";
import {
  reserveSequence,
  releaseSequence,
  isSequenceReserved,
  clearAllReservations,
} from "./txReservation";

const A = "GA_ACCOUNT_A";
const B = "GB_ACCOUNT_B";

describe("txReservation — non-custodial per-account sequence guard (§4.4)", () => {
  beforeEach(() => clearAllReservations());

  it("reserves an account and refuses a second concurrent build for it", () => {
    expect(reserveSequence(A, 1000, 0)).toBe(true);
    // A second /build for the SAME account while the first is outstanding: refused.
    expect(reserveSequence(A, 1000, 100)).toBe(false);
    expect(isSequenceReserved(A, 100)).toBe(true);
  });

  it("lets different accounts reserve independently", () => {
    expect(reserveSequence(A, 1000, 0)).toBe(true);
    expect(reserveSequence(B, 1000, 0)).toBe(true);
    expect(isSequenceReserved(A, 0)).toBe(true);
    expect(isSequenceReserved(B, 0)).toBe(true);
  });

  it("frees the slot on release so the next build can proceed", () => {
    expect(reserveSequence(A, 1000, 0)).toBe(true);
    releaseSequence(A);
    expect(isSequenceReserved(A, 0)).toBe(false);
    expect(reserveSequence(A, 1000, 1)).toBe(true);
  });

  it("auto-expires after the TTL so an abandoned build never wedges the account", () => {
    expect(reserveSequence(A, 1000, 0)).toBe(true);
    expect(isSequenceReserved(A, 999)).toBe(true); // still within TTL
    expect(isSequenceReserved(A, 1001)).toBe(false); // expired
    // Re-reservable once the stale one has lapsed.
    expect(reserveSequence(A, 1000, 1001)).toBe(true);
  });

  it("releasing an unknown account is a harmless no-op", () => {
    expect(() => releaseSequence("GX_NEVER_RESERVED")).not.toThrow();
    expect(isSequenceReserved("GX_NEVER_RESERVED", 0)).toBe(false);
  });
});
