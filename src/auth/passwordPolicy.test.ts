import { describe, it, expect } from "vitest";
import { checkPassword, validatePasswordOrError, PASSWORD_MIN_LENGTH } from "./passwordPolicy";

describe("auth/passwordPolicy", () => {
  it("accepts a password meeting every rule", () => {
    const r = checkPassword("Str0ng!Passw0rd"); // >=12, upper, lower, number, special
    expect(r.valid).toBe(true);
    expect(r.failed).toEqual([]);
    expect(r.score).toBe(4);
    expect(validatePasswordOrError("Str0ng!Passw0rd")).toBeNull();
  });

  it("requires the minimum length", () => {
    const r = checkPassword("Aa1!aa"); // too short
    expect(r.valid).toBe(false);
    expect(r.failed).toContain("length");
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  it("flags each missing character class", () => {
    expect(checkPassword("alllowercase1!").failed).toContain("upper");
    expect(checkPassword("ALLUPPERCASE1!").failed).toContain("lower");
    expect(checkPassword("NoNumbersHere!!").failed).toContain("number");
    expect(checkPassword("NoSpecialsHere1").failed).toContain("special");
  });

  it("returns a descriptive error string for weak passwords", () => {
    const err = validatePasswordOrError("short");
    expect(err).toBeTypeOf("string");
    expect(err).toContain("requirements");
  });

  it("treats a non-string as fully invalid without throwing", () => {
    const r = checkPassword(undefined as unknown as string);
    expect(r.valid).toBe(false);
    expect(r.score).toBe(0);
  });
});
