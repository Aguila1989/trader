import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { config } from "../config";
import { totpCode } from "../admin/totp";
import * as store from "./store";
import * as auth from "./service";

const GOOD_PW = "Str0ng!Passw0rd";
// Characters the backup-code alphabet deliberately excludes (visually
// ambiguous): 0/O and 1/I.
const AMBIGUOUS_CHARS = /[01OI]/;
const BACKUP_CODE_SHAPE = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/;

/** Register + enable 2FA for a fresh account; returns everything a test needs
 *  to drive the login-challenge flow (userId, secret, the initial backup codes). */
async function registerWithTwoFactor(email: string): Promise<{ userId: string; secret: string; backupCodes: string[] }> {
  const reg = await auth.registerUser({ email, password: GOOD_PW, confirmPassword: GOOD_PW });
  expect(reg).toMatchObject({ ok: true });
  const cred = await store.findCredentialByEmail(email);
  const userId = cred!.user.id;

  const setup = await auth.setupTwoFactor(userId);
  expect(setup).toMatchObject({ ok: true });
  if (!setup.ok) throw new Error("unreachable");

  const enabled = await auth.enableTwoFactor(userId, totpCode(setup.secret));
  expect(enabled).toMatchObject({ ok: true });
  if (!enabled.ok) throw new Error("unreachable");

  return { userId, secret: setup.secret, backupCodes: enabled.backupCodes };
}

/** Log in (password only) and return the pending-2FA challenge. */
async function getChallenge(email: string): Promise<string> {
  const r = await auth.login({ email, password: GOOD_PW, ip: null });
  expect(r.ok).toBe("2fa");
  if (r.ok !== "2fa") throw new Error("unreachable");
  return r.challenge;
}

describe("auth/service - 2FA backup codes (in-memory)", () => {
  beforeAll(() => {
    config.jwtSecret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    config.smtp.host = "";
  });
  beforeEach(() => store.__resetMemoryStoreForTests());

  it("enable returns 10 well-formed, unique, unambiguous codes", async () => {
    const { backupCodes } = await registerWithTwoFactor("enable@b.com");
    expect(backupCodes).toHaveLength(10);
    const seen = new Set<string>();
    for (const code of backupCodes) {
      expect(code).toMatch(BACKUP_CODE_SHAPE);
      expect(AMBIGUOUS_CHARS.test(code)).toBe(false);
      seen.add(code);
    }
    expect(seen.size).toBe(10); // all distinct
  });

  it("accepts a backup code at the login challenge and consumes it (second use fails)", async () => {
    const { backupCodes } = await registerWithTwoFactor("consume@b.com");
    const code = backupCodes[0]!;

    const challenge1 = await getChallenge("consume@b.com");
    const first = await auth.verifyTwoFactor({ challenge: challenge1, code, ip: null });
    expect(first).toMatchObject({ ok: true });

    // Same code, fresh challenge: must now be rejected (single-use).
    const challenge2 = await getChallenge("consume@b.com");
    const second = await auth.verifyTwoFactor({ challenge: challenge2, code, ip: null });
    expect(second).toMatchObject({ ok: false, status: 401 });
  });

  it("also accepts codes typed without the dash / in lowercase (normalized comparison)", async () => {
    const { backupCodes } = await registerWithTwoFactor("normalize@b.com");
    const raw = backupCodes[0]!;
    const messy = raw.replace("-", "").toLowerCase();

    const challenge = await getChallenge("normalize@b.com");
    const r = await auth.verifyTwoFactor({ challenge, code: messy, ip: null });
    expect(r).toMatchObject({ ok: true });
  });

  it("still accepts a normal 6-digit TOTP code after backup codes exist", async () => {
    const { secret } = await registerWithTwoFactor("totp-still@b.com");
    const challenge = await getChallenge("totp-still@b.com");
    const r = await auth.verifyTwoFactor({ challenge, code: totpCode(secret), ip: null });
    expect(r).toMatchObject({ ok: true });
  });

  it("rejects an unknown/garbage backup code without consuming anything", async () => {
    const { backupCodes } = await registerWithTwoFactor("bad-backup@b.com");
    const challenge = await getChallenge("bad-backup@b.com");
    const r = await auth.verifyTwoFactor({ challenge, code: "ZZZZZ-ZZZZZ", ip: null });
    expect(r).toMatchObject({ ok: false, status: 401 });
    // The real codes are still all usable afterwards.
    const challenge2 = await getChallenge("bad-backup@b.com");
    const good = await auth.verifyTwoFactor({ challenge: challenge2, code: backupCodes[0]!, ip: null });
    expect(good).toMatchObject({ ok: true });
  });

  it("regenerate requires a valid TOTP code, invalidates old codes, and issues a fresh set", async () => {
    const { userId, secret, backupCodes } = await registerWithTwoFactor("regen@b.com");

    // A backup code cannot be used to regenerate (must be a real TOTP code).
    const rejected = await auth.regenerateBackupCodes(userId, backupCodes[1]);
    expect(rejected).toMatchObject({ ok: false, status: 400 });

    const regenerated = await auth.regenerateBackupCodes(userId, totpCode(secret));
    expect(regenerated).toMatchObject({ ok: true });
    if (!regenerated.ok) throw new Error("unreachable");
    expect(regenerated.backupCodes).toHaveLength(10);
    // The new set shares no codes with the original set.
    const overlap = regenerated.backupCodes.filter((c) => backupCodes.includes(c));
    expect(overlap).toHaveLength(0);

    // An old (never-used) code from the original set no longer works.
    const challenge1 = await getChallenge("regen@b.com");
    const oldCodeResult = await auth.verifyTwoFactor({ challenge: challenge1, code: backupCodes[1]!, ip: null });
    expect(oldCodeResult).toMatchObject({ ok: false, status: 401 });

    // A code from the NEW set works.
    const challenge2 = await getChallenge("regen@b.com");
    const newCodeResult = await auth.verifyTwoFactor({
      challenge: challenge2,
      code: regenerated.backupCodes[0]!,
      ip: null,
    });
    expect(newCodeResult).toMatchObject({ ok: true });
  });

  it("disable clears the backup codes (and re-enabling issues a brand new set)", async () => {
    const { userId, secret } = await registerWithTwoFactor("disable@b.com");

    const disabled = await auth.disableTwoFactor({ userId, password: GOOD_PW, code: totpCode(secret) });
    expect(disabled).toMatchObject({ ok: true });

    const credAfterDisable = await store.findCredentialByEmail("disable@b.com");
    expect(credAfterDisable?.totpEnabled).toBe(false);
    expect(credAfterDisable?.totpBackupCodes).toBeNull();

    // Re-enrolling issues a fresh secret + a fresh set of 10 codes.
    const setup2 = await auth.setupTwoFactor(userId);
    expect(setup2).toMatchObject({ ok: true });
    if (!setup2.ok) throw new Error("unreachable");
    const enabled2 = await auth.enableTwoFactor(userId, totpCode(setup2.secret));
    expect(enabled2).toMatchObject({ ok: true });
    if (!enabled2.ok) throw new Error("unreachable");
    expect(enabled2.backupCodes).toHaveLength(10);
  });
});
