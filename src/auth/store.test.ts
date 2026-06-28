import { describe, it, expect, beforeEach } from "vitest";
import * as store from "./store";

/**
 * Runs against the in-memory backend (no SQL Server configured in tests), the
 * same fallback the app uses when no DB is present. Reset between cases.
 */
describe("auth/store (in-memory)", () => {
  beforeEach(() => store.__resetMemoryStoreForTests());

  async function makeUser(email = "a@b.com", verified = true) {
    return store.createAccount({ id: "id-" + email, email, passwordHash: "hash-" + email, emailVerified: verified });
  }

  it("creates an account and rejects a duplicate email", async () => {
    const u = await makeUser();
    expect(u?.email).toBe("a@b.com");
    expect(await makeUser()).toBeNull(); // duplicate
  });

  it("finds credentials with hash + flags by email", async () => {
    await makeUser("c@d.com", false);
    const cred = await store.findCredentialByEmail("c@d.com");
    expect(cred?.passwordHash).toBe("hash-c@d.com");
    expect(cred?.emailVerified).toBe(false);
    expect(cred?.failedLoginAttempts).toBe(0);
    expect(cred?.lockedUntil).toBeNull();
  });

  it("tracks + locks after N failed logins, and resets on success", async () => {
    const u = await makeUser();
    let r = await store.registerFailedLogin(u!.id, 3, 60_000);
    expect(r.attempts).toBe(1);
    expect(r.locked).toBe(false);
    await store.registerFailedLogin(u!.id, 3, 60_000);
    r = await store.registerFailedLogin(u!.id, 3, 60_000);
    expect(r.attempts).toBe(3);
    expect(r.locked).toBe(true);
    expect(r.lockedUntil).toBeGreaterThan(Date.now());

    await store.recordSuccessfulLogin(u!.id);
    const cred = await store.findCredentialByEmail("a@b.com");
    expect(cred?.failedLoginAttempts).toBe(0);
    expect(cred?.lockedUntil).toBeNull();
  });

  it("creates, validates, and revokes sessions", async () => {
    const u = await makeUser();
    await store.createSession({ id: "jti-1", userId: u!.id, expiresAt: Date.now() + 60_000 });
    expect(await store.isSessionActive("jti-1")).toBe(true);
    await store.revokeSession("jti-1");
    expect(await store.isSessionActive("jti-1")).toBe(false);
    expect(await store.isSessionActive("nope")).toBe(false);
  });

  it("treats an expired session as inactive", async () => {
    const u = await makeUser();
    await store.createSession({ id: "jti-old", userId: u!.id, expiresAt: Date.now() - 1 });
    expect(await store.isSessionActive("jti-old")).toBe(false);
  });

  it("revokes all sessions for a user (logout-everywhere / password reset)", async () => {
    const u = await makeUser();
    await store.createSession({ id: "s1", userId: u!.id, expiresAt: Date.now() + 60_000 });
    await store.createSession({ id: "s2", userId: u!.id, expiresAt: Date.now() + 60_000 });
    await store.revokeAllSessionsForUser(u!.id);
    expect(await store.isSessionActive("s1")).toBe(false);
    expect(await store.isSessionActive("s2")).toBe(false);
  });

  it("consumes a link token exactly once", async () => {
    const u = await makeUser();
    await store.createLinkToken({ userId: u!.id, type: "reset", tokenHash: "h1", expiresAt: Date.now() + 60_000 });
    expect(await store.consumeLinkToken("reset", "h1")).toBe(u!.id);
    expect(await store.consumeLinkToken("reset", "h1")).toBeNull(); // single-use
  });

  it("does not consume an expired or wrong-type token", async () => {
    const u = await makeUser();
    await store.createLinkToken({ userId: u!.id, type: "reset", tokenHash: "exp", expiresAt: Date.now() - 1 });
    expect(await store.consumeLinkToken("reset", "exp")).toBeNull();
    await store.createLinkToken({ userId: u!.id, type: "verify", tokenHash: "v1", expiresAt: Date.now() + 60_000 });
    expect(await store.consumeLinkToken("reset", "v1")).toBeNull(); // wrong type
  });

  it("invalidates outstanding tokens of a type", async () => {
    const u = await makeUser();
    await store.createLinkToken({ userId: u!.id, type: "reset", tokenHash: "old", expiresAt: Date.now() + 60_000 });
    await store.invalidateLinkTokens(u!.id, "reset");
    expect(await store.consumeLinkToken("reset", "old")).toBeNull();
  });

  it("setPasswordHash updates the hash and revokes sessions", async () => {
    const u = await makeUser();
    await store.createSession({ id: "ps1", userId: u!.id, expiresAt: Date.now() + 60_000 });
    await store.setPasswordHash(u!.id, "new-hash");
    expect((await store.findCredentialByEmail("a@b.com"))?.passwordHash).toBe("new-hash");
    expect(await store.isSessionActive("ps1")).toBe(false);
  });

  it("setEmailVerified flips the flag", async () => {
    const u = await makeUser("e@f.com", false);
    await store.setEmailVerified(u!.id);
    expect((await store.findCredentialByEmail("e@f.com"))?.emailVerified).toBe(true);
  });
});
