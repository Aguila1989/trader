import { describe, it, expect } from "vitest";
import {
  armFor,
  isArmRegistered,
  registeredArmIds,
  enabledArms,
  isArmEnabled,
} from "./registry";
import { DIRECTIONAL_ARM_ID } from "./directional";
import { FUNDING_CARRY_ARM_ID } from "./fundingCarry";
import { NEWS_REACTION_ARM_ID } from "./newsReaction";
import { SYNTHESIS_ARM_ID } from "./synthesis";

/**
 * Pure unit tests for the strategy arm registry. No mocks needed - the
 * registry is a plain in-memory Map populated at module load from the real
 * arm modules, so this exercises the real lookup/enable logic end to end.
 */

const ALL_IDS = [DIRECTIONAL_ARM_ID, FUNDING_CARRY_ARM_ID, NEWS_REACTION_ARM_ID, SYNTHESIS_ARM_ID];

describe("registry — armFor / isArmRegistered", () => {
  it("returns the matching arm for each of the 4 known ids", () => {
    for (const id of ALL_IDS) {
      const arm = armFor(id);
      expect(arm.id).toBe(id);
      expect(typeof arm.propose).toBe("function");
    }
  });

  it("throws for an unknown id", () => {
    expect(() => armFor("not-a-real-arm")).toThrow(/no strategyarm registered/i);
  });

  it("throws for an empty-string id", () => {
    expect(() => armFor("")).toThrow();
  });

  it("isArmRegistered is true for known ids and false for unknown ones", () => {
    for (const id of ALL_IDS) {
      expect(isArmRegistered(id)).toBe(true);
    }
    expect(isArmRegistered("not-a-real-arm")).toBe(false);
    expect(isArmRegistered("")).toBe(false);
  });
});

describe("registry — registeredArmIds", () => {
  it("includes all 4 known arm ids, with no duplicates", () => {
    const ids = registeredArmIds();
    for (const id of ALL_IDS) {
      expect(ids).toContain(id);
    }
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(ALL_IDS.length);
  });
});

describe("registry — enabledArms", () => {
  it("returns an empty array for an empty enabled list", () => {
    expect(enabledArms([])).toEqual([]);
  });

  it("returns only the registered arms, in the given order", () => {
    const requested = [SYNTHESIS_ARM_ID, DIRECTIONAL_ARM_ID];
    const out = enabledArms(requested);
    expect(out.map((a) => a.id)).toEqual(requested);
  });

  it("silently drops unknown ids instead of throwing", () => {
    const out = enabledArms(["totally-bogus", FUNDING_CARRY_ARM_ID, "also-bogus"]);
    expect(out).toHaveLength(1);
    expect(out[0]!.id).toBe(FUNDING_CARRY_ARM_ID);
  });

  it("returns [] when every id in the list is unknown", () => {
    expect(enabledArms(["bogus-1", "bogus-2"])).toEqual([]);
  });

  it("preserves duplicate entries if the caller passes duplicates", () => {
    const out = enabledArms([NEWS_REACTION_ARM_ID, NEWS_REACTION_ARM_ID]);
    expect(out.map((a) => a.id)).toEqual([NEWS_REACTION_ARM_ID, NEWS_REACTION_ARM_ID]);
  });
});

describe("registry — isArmEnabled", () => {
  it("is true only when the id is both registered and present in the enabled list", () => {
    expect(isArmEnabled(DIRECTIONAL_ARM_ID, [DIRECTIONAL_ARM_ID, FUNDING_CARRY_ARM_ID])).toBe(true);
  });

  it("is false when the id is registered but absent from the enabled list", () => {
    expect(isArmEnabled(DIRECTIONAL_ARM_ID, [FUNDING_CARRY_ARM_ID])).toBe(false);
  });

  it("is false when the id is present in the list but not actually registered", () => {
    expect(isArmEnabled("not-a-real-arm", ["not-a-real-arm"])).toBe(false);
  });

  it("is false for an empty enabled list even for a known id", () => {
    expect(isArmEnabled(SYNTHESIS_ARM_ID, [])).toBe(false);
  });
});
