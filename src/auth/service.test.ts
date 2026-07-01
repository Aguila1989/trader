import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { config } from "../config";
import { verifyJwt } from "./jwt";
import { hashToken } from "./tokens";
import * as store from "./store";
import * as auth from "./service";

const GOOD_PW = "Str0ng!Passw0rd";

describe("auth/service (in-memory)", () => {
  beforeAll(() => {
    // Ensure deterministic config regardless of the ambient .env: a usable JWT
    // secret and NO SMTP (so registration auto-verifies, per spec).
    config.jwtSecret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    config.smtp.host = "";
  });
  beforeEach(() => store.__resetMemoryStoreForTests());

  // --- registration ---
  it("rejects a weak password and a mismatch with specific (non-enumerating) errors", async () => {
    const weak = await auth.registerUser({ email: "a@b.com", password: "weak", confirmPassword: "weak" });
    expect(weak).toMatchObject({ ok: false, status: 400 });
    const mismatch = await auth.registerUser({ email: "a@b.com", password: GOOD_PW, confirmPassword: "different" });
    expect(mismatch).toMatchObject({ ok: false, status: 400 });
  });

  it("returns the SAME generic message for a new and an already-taken email", async () => {
    const r1 = await auth.registerUser({ email: "dup@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const r2 = await auth.registerUser({ email: "dup@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    expect(r1).toMatchObject({ ok: true });
    expect(r2).toMatchObject({ ok: true });
    if (r1.ok && r2.ok) expect(r1.message).toBe(r2.message);
  });

  // --- login ---
  it("issues a verifiable JWT on correct credentials (auto-verified, no SMTP)", async () => {
    await auth.registerUser({ email: "login@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const r = await auth.login({ email: "login@b.com", password: GOOD_PW, ip: "1.1.1.1" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const v = verifyJwt(r.jwt, config.jwtSecret, Math.floor(Date.now() / 1000));
      expect(v.ok).toBe(true);
      if (v.ok) {
        expect(v.claims.email).toBe("login@b.com");
        expect(v.claims.jti).toBe(r.jti);
      }
      expect(await store.isSessionActive(r.jti)).toBe(true);
    }
  });

  it("returns one generic error for unknown email AND wrong password", async () => {
    await auth.registerUser({ email: "u@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const unknown = await auth.login({ email: "nobody@b.com", password: GOOD_PW, ip: null });
    const wrong = await auth.login({ email: "u@b.com", password: "Wr0ng!Passw0rd", ip: null });
    expect(unknown).toMatchObject({ ok: false, status: 401 });
    expect(wrong).toMatchObject({ ok: false, status: 401 });
    if (!unknown.ok && !wrong.ok) expect(unknown.error).toBe(wrong.error);
  });

  it("honours Remember me with a longer TTL", async () => {
    await auth.registerUser({ email: "rm@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const normal = await auth.login({ email: "rm@b.com", password: GOOD_PW, ip: null });
    const remember = await auth.login({ email: "rm@b.com", password: GOOD_PW, rememberMe: true, ip: null });
    if (normal.ok && remember.ok) expect(remember.ttlSec).toBeGreaterThan(normal.ttlSec);
  });

  it("locks the account after the configured number of failures", async () => {
    await auth.registerUser({ email: "lock@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    for (let i = 0; i < config.auth.maxFailedLogins; i++) {
      await auth.login({ email: "lock@b.com", password: "Wr0ng!Passw0rd", ip: "9.9.9.9" });
    }
    // Even the CORRECT password is now refused with a lockout message.
    const r = await auth.login({ email: "lock@b.com", password: GOOD_PW, ip: "9.9.9.9" });
    expect(r).toMatchObject({ ok: false, status: 403 });
    if (!r.ok) expect(r.error.toLowerCase()).toContain("lock");
  });

  it("blocks login until email is verified when verification is required", async () => {
    // Simulate the SMTP path: create an unverified account directly.
    await store.createAccount({ id: "uv", email: "unv@b.com", passwordHash: await import("../users/password").then((m) => m.hashPassword(GOOD_PW)), emailVerified: false });
    const r = await auth.login({ email: "unv@b.com", password: GOOD_PW, ip: null });
    expect(r).toMatchObject({ ok: false, status: 403 });
    if (!r.ok) expect(r.error.toLowerCase()).toContain("verify");
  });

  // --- logout ---
  it("revokes the session on logout", async () => {
    await auth.registerUser({ email: "out@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const r = await auth.login({ email: "out@b.com", password: GOOD_PW, ip: null });
    if (r.ok) {
      await auth.logout(r.jti);
      expect(await store.isSessionActive(r.jti)).toBe(false);
    }
  });

  // --- password reset ---
  it("resets a password with a valid single-use token and revokes sessions", async () => {
    await auth.registerUser({ email: "reset@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const login1 = await auth.login({ email: "reset@b.com", password: GOOD_PW, ip: null });
    const cred = await store.findCredentialByEmail("reset@b.com");
    // Issue a reset token directly (the raw is normally emailed).
    const raw = "raw-reset-token";
    await store.createLinkToken({ userId: cred!.user.id, type: "reset", tokenHash: hashToken(raw), expiresAt: Date.now() + 60_000 });

    const NEW_PW = "N3w!Passw0rd!!";
    const r = await auth.resetPassword({ token: raw, password: NEW_PW, confirmPassword: NEW_PW });
    expect(r).toMatchObject({ ok: true });
    // Old session revoked, old password rejected, new password works.
    if (login1.ok) expect(await store.isSessionActive(login1.jti)).toBe(false);
    expect((await auth.login({ email: "reset@b.com", password: GOOD_PW, ip: null })).ok).toBe(false);
    expect((await auth.login({ email: "reset@b.com", password: NEW_PW, ip: null })).ok).toBe(true);
    // The token cannot be reused.
    expect(await auth.resetPassword({ token: raw, password: NEW_PW, confirmPassword: NEW_PW })).toMatchObject({ ok: false });
  });

  it("rejects a bad/expired reset token and a weak new password", async () => {
    expect(await auth.resetPassword({ token: "nope", password: "N3w!Passw0rd!!", confirmPassword: "N3w!Passw0rd!!" })).toMatchObject({ ok: false, status: 400 });
    expect(await auth.resetPassword({ token: "x", password: "weak", confirmPassword: "weak" })).toMatchObject({ ok: false, status: 400 });
  });

  // --- email verification ---
  it("verifies an email with a valid single-use token", async () => {
    await store.createAccount({ id: "ve", email: "ve@b.com", passwordHash: "h", emailVerified: false });
    const cred = await store.findCredentialByEmail("ve@b.com");
    const raw = "raw-verify-token";
    await store.createLinkToken({ userId: cred!.user.id, type: "verify", tokenHash: hashToken(raw), expiresAt: Date.now() + 60_000 });
    expect(await auth.verifyEmail({ token: raw })).toMatchObject({ ok: true });
    expect((await store.findCredentialByEmail("ve@b.com"))?.emailVerified).toBe(true);
    expect(await auth.verifyEmail({ token: raw })).toMatchObject({ ok: false }); // single-use
  });

  // --- forgot password is always generic ---
  it("forgot-password returns the same message whether or not the account exists", async () => {
    await auth.registerUser({ email: "known@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const known = await auth.forgotPassword({ email: "known@b.com" });
    const unknown = await auth.forgotPassword({ email: "ghost@b.com" });
    expect(known.message).toBe(unknown.message);
  });

  // --- change password ---
  it("change-password: rejects a wrong current password (generic error) and leaves it unchanged", async () => {
    await auth.registerUser({ email: "cp1@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const cred = await store.findCredentialByEmail("cp1@b.com");
    const NEW_PW = "N3w!Passw0rd!!";
    const r = await auth.changePassword({
      userId: cred!.user.id,
      currentJti: null,
      currentPassword: "Wr0ng!Passw0rd",
      newPassword: NEW_PW,
    });
    expect(r).toMatchObject({ ok: false, status: 400 });
    // The original password still works; the new one does not (unchanged).
    expect((await auth.login({ email: "cp1@b.com", password: GOOD_PW, ip: null })).ok).toBe(true);
    expect((await auth.login({ email: "cp1@b.com", password: NEW_PW, ip: null })).ok).toBe(false);
  });

  it("change-password: rejects a weak new password", async () => {
    await auth.registerUser({ email: "cp2@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const cred = await store.findCredentialByEmail("cp2@b.com");
    const r = await auth.changePassword({
      userId: cred!.user.id,
      currentJti: null,
      currentPassword: GOOD_PW,
      newPassword: "weak",
    });
    expect(r).toMatchObject({ ok: false, status: 400 });
  });

  it("change-password: updates the password, keeps the current session, revokes the others", async () => {
    await auth.registerUser({ email: "cp3@b.com", password: GOOD_PW, confirmPassword: GOOD_PW });
    const s1 = await auth.login({ email: "cp3@b.com", password: GOOD_PW, ip: null });
    const s2 = await auth.login({ email: "cp3@b.com", password: GOOD_PW, ip: null });
    const cred = await store.findCredentialByEmail("cp3@b.com");
    const NEW_PW = "N3w!Passw0rd!!";
    if (s1.ok && s2.ok) {
      const r = await auth.changePassword({
        userId: cred!.user.id,
        currentJti: s1.jti,
        currentPassword: GOOD_PW,
        newPassword: NEW_PW,
      });
      expect(r).toMatchObject({ ok: true });
      // The caller's session survives; every OTHER session is revoked.
      expect(await store.isSessionActive(s1.jti)).toBe(true);
      expect(await store.isSessionActive(s2.jti)).toBe(false);
      // Old password no longer logs in; the new one does.
      expect((await auth.login({ email: "cp3@b.com", password: GOOD_PW, ip: null })).ok).toBe(false);
      expect((await auth.login({ email: "cp3@b.com", password: NEW_PW, ip: null })).ok).toBe(true);
    }
  });
});
