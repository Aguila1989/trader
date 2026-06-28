import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, BCRYPT_ROUNDS, NO_PASSWORD } from "./password";

/**
 * The User entity mandates a bcrypt hash at >= 12 rounds. These tests pin that
 * contract: the produced hash is a real bcrypt hash at the configured cost, it
 * round-trips, and an empty/"no password set" hash can never be logged into.
 */
describe("users/password", () => {
  it("uses a cost factor of at least 12", () => {
    expect(BCRYPT_ROUNDS).toBeGreaterThanOrEqual(12);
  });

  it("hashes to a bcrypt string whose embedded cost matches BCRYPT_ROUNDS", async () => {
    const hash = await hashPassword("correct horse battery staple");
    // bcrypt format: $2<x>$<cost>$<22-char salt><31-char hash>
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
    const cost = Number(hash.split("$")[2]);
    expect(cost).toBe(BCRYPT_ROUNDS);
  });

  it("verifies the correct password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-pass");
    expect(await verifyPassword("s3cret-pass", hash)).toBe(true);
    expect(await verifyPassword("not-the-pass", hash)).toBe(false);
  });

  it("produces a different salt each time (no two hashes are equal)", async () => {
    const a = await hashPassword("same-input");
    const b = await hashPassword("same-input");
    expect(a).not.toBe(b);
    // ...yet both still verify against the original input.
    expect(await verifyPassword("same-input", a)).toBe(true);
    expect(await verifyPassword("same-input", b)).toBe(true);
  });

  it("never authenticates against an empty / no-password hash", async () => {
    expect(await verifyPassword("anything", NO_PASSWORD)).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
    expect(await verifyPassword("anything", "not-a-bcrypt-hash")).toBe(false);
  });

  it("refuses to hash an empty password", async () => {
    await expect(hashPassword("")).rejects.toThrow();
  });
});
