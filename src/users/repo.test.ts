import { describe, it, expect } from "vitest";
import { getUserById, getUserByEmail, listUsers, createUser } from "./repo";
import { DEFAULT_USER_ID } from "./context";

/**
 * With no SQL Server configured in the test env, dbReady() is false, so every
 * users/repo function short-circuits WITHOUT touching the DB (mirrors the
 * db/repo.test.ts contract). Reads return null/[]; createUser is a no-op.
 */
describe("users/repo (no DB)", () => {
  it("getUserById returns null without a DB", async () => {
    expect(await getUserById(DEFAULT_USER_ID)).toBeNull();
  });

  it("getUserByEmail returns null without a DB", async () => {
    expect(await getUserByEmail("default@local")).toBeNull();
  });

  it("listUsers returns an empty list without a DB", async () => {
    expect(await listUsers()).toEqual([]);
  });

  it("createUser is a no-op (returns null) without a DB", async () => {
    expect(await createUser({ email: "x@y.z", passwordHash: "h" })).toBeNull();
  });
});
