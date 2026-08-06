import { describe, it, expect, beforeEach, beforeAll, afterEach } from "vitest";
import type { Request, Response } from "express";
import { config } from "../config";
import { signJwt } from "./jwt";
import { JWT_COOKIE } from "./cookies";
import { currentUserId, resetCurrentUserId, DEFAULT_USER_ID } from "../users/context";
import * as store from "./store";
import {
  requireAuth,
  authRateLimiter,
  resolveOptionalUserId,
  PUBLIC_API_PATHS,
  __resetAuthRateLimiterForTests,
} from "./middleware";

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("auth/middleware - PUBLIC_API_PATHS allowlist", () => {
  it("includes only health + the unauthenticated auth actions", () => {
    expect(PUBLIC_API_PATHS.has("/api/health")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/login")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/register")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/logout")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/forgot-password")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/reset-password")).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/auth/verify-email")).toBe(true);
  });

  it("does NOT expose any trading/wallet/log/user-data endpoint or /me", () => {
    for (const p of [
      "/api/auth/me",
      "/api/state",
      "/api/balances",
      "/api/portfolio",
      "/api/trades",
      "/api/logs",
      "/api/order",
      "/api/pay",
      "/api/swap",
      "/api/trustlines",
      "/api/claimable",
      "/api/stream",
      "/api/settings",
    ]) {
      expect(PUBLIC_API_PATHS.has(p)).toBe(false);
    }
  });
});

describe("auth/middleware - requireAuth gate", () => {
  beforeAll(() => {
    config.jwtSecret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  });
  beforeEach(() => {
    store.__resetMemoryStoreForTests();
    resetCurrentUserId();
  });

  function req(path: string, cookie?: string): Request {
    return { path, headers: cookie ? { cookie } : {}, ip: "1.2.3.4" } as unknown as Request;
  }

  it("passes non-API requests (the SPA shell renders for login + Academy)", async () => {
    let called = false;
    await requireAuth(req("/"), mockRes(), () => { called = true; });
    await requireAuth(req("/assets/app.js"), mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it("passes the public allowlist without a token", async () => {
    let called = false;
    await requireAuth(req("/api/auth/login"), mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it("401s a protected route with no cookie", async () => {
    const res = mockRes();
    let called = false;
    await requireAuth(req("/api/state"), res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("401s a protected route whose session was revoked", async () => {
    await store.createSession({ id: "jX", userId: "u9", expiresAt: Date.now() + 60_000 });
    await store.revokeSession("jX");
    const jwt = signJwt({ sub: "u9", email: "a@b.com", jti: "jX" }, config.jwtSecret, { nowSec: Math.floor(Date.now() / 1000), ttlSec: 3600 });
    const res = mockRes();
    let called = false;
    await requireAuth(req("/api/state", `${JWT_COOKIE}=${jwt}`), res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("allows a valid session and scopes the request to the user", async () => {
    await store.createSession({ id: "jOk", userId: "user-42", expiresAt: Date.now() + 60_000 });
    const jwt = signJwt({ sub: "user-42", email: "a@b.com", jti: "jOk" }, config.jwtSecret, { nowSec: Math.floor(Date.now() / 1000), ttlSec: 3600 });
    let seenUser = "";
    await requireAuth(req("/api/state", `${JWT_COOKIE}=${jwt}`), mockRes(), () => {
      seenUser = currentUserId(); // read inside the runWithUserId scope
    });
    expect(seenUser).toBe("user-42");
  });

  it("gates case-varied protected paths (fails closed, since Express routing is case-insensitive)", async () => {
    const res = mockRes();
    let called = false;
    await requireAuth(req("/API/STATE"), res, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it("isolates concurrent users across awaits (no AsyncLocalStorage bleed)", async () => {
    await store.createSession({ id: "jA", userId: "userA", expiresAt: Date.now() + 60_000 });
    await store.createSession({ id: "jB", userId: "userB", expiresAt: Date.now() + 60_000 });
    const now = Math.floor(Date.now() / 1000);
    const jwtA = signJwt({ sub: "userA", email: "a@x.io", jti: "jA" }, config.jwtSecret, { nowSec: now, ttlSec: 3600 });
    const jwtB = signJwt({ sub: "userB", email: "b@x.io", jti: "jB" }, config.jwtSecret, { nowSec: now, ttlSec: 3600 });
    const seen: Record<string, string> = {};
    const done: Promise<void>[] = [];
    // The handler reads currentUserId() AFTER an await, so if context leaked
    // across the interleaving request it would read the wrong user.
    function handler(tag: string, delay: number) {
      return () => {
        done.push(
          (async () => {
            await new Promise((r) => setTimeout(r, delay));
            seen[tag] = currentUserId();
          })(),
        );
      };
    }
    // A waits longer than B, so B's context is active while A is suspended.
    await Promise.all([
      requireAuth(req("/api/state", `${JWT_COOKIE}=${jwtA}`), mockRes(), handler("A", 25)),
      requireAuth(req("/api/state", `${JWT_COOKIE}=${jwtB}`), mockRes(), handler("B", 5)),
    ]);
    await Promise.all(done);
    expect(seen.A).toBe("userA");
    expect(seen.B).toBe("userB");
  });
});

describe("auth/middleware - SINGLE_USER personal mode bypass", () => {
  beforeEach(() => {
    config.singleUser = true;
    store.__resetMemoryStoreForTests();
    resetCurrentUserId();
  });
  // CRITICAL: never leak the flag into the other describes/files - flag off
  // must stay the byte-for-byte-unchanged product behavior everywhere else.
  afterEach(() => {
    config.singleUser = false;
  });

  function req(path: string, cookie?: string): Request {
    return { path, headers: cookie ? { cookie } : {}, ip: "1.2.3.4" } as unknown as Request;
  }

  it("passes a protected route with NO cookie and scopes it to the operator", async () => {
    const res = mockRes();
    let seenUser = "";
    let called = false;
    await requireAuth(req("/api/state"), res, () => {
      called = true;
      seenUser = currentUserId(); // read inside the runWithUserId scope
    });
    expect(called).toBe(true);
    expect(seenUser).toBe(DEFAULT_USER_ID);
    expect(res.statusCode).toBe(200);
  });

  it("scopes PUBLIC paths too (academy preview writes are attributed, not anonymous)", async () => {
    let seenUser = "";
    await requireAuth(req("/api/health"), mockRes(), () => {
      seenUser = currentUserId();
    });
    expect(seenUser).toBe(DEFAULT_USER_ID);
  });

  it("works without any JWT_SECRET configured (no sessions exist)", async () => {
    const saved = config.jwtSecret;
    config.jwtSecret = "";
    try {
      let called = false;
      await requireAuth(req("/api/state"), mockRes(), () => { called = true; });
      expect(called).toBe(true);
    } finally {
      config.jwtSecret = saved;
    }
  });

  it("resolveOptionalUserId returns the operator instead of anonymous", async () => {
    expect(await resolveOptionalUserId(req("/api/academy/progress/c1-l1"))).toBe(DEFAULT_USER_ID);
  });

  it("IGNORES a stale/foreign JWT cookie and still scopes to the operator", async () => {
    // "No sessions exist" is the mode's semantics: a leftover cookie from a
    // previous multi-tenant deployment must not re-scope the request.
    await store.createSession({ id: "jStale", userId: "user-42", expiresAt: Date.now() + 60_000 });
    const jwt = signJwt({ sub: "user-42", email: "a@b.com", jti: "jStale" }, config.jwtSecret, {
      nowSec: Math.floor(Date.now() / 1000),
      ttlSec: 3600,
    });
    let seenUser = "";
    await requireAuth(req("/api/state", `${JWT_COOKIE}=${jwt}`), mockRes(), () => {
      seenUser = currentUserId();
    });
    expect(seenUser).toBe(DEFAULT_USER_ID);
  });

  it("flag OFF restores the default-deny gate unchanged (401 with no cookie)", async () => {
    config.singleUser = false;
    const res = mockRes();
    let called = false;
    await requireAuth(req("/api/state"), res, () => { called = true; });
    expect(called).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(await resolveOptionalUserId(req("/api/academy/progress/c1-l1"))).toBe(null);
  });
});

describe("auth/middleware - authRateLimiter", () => {
  beforeAll(() => {
    config.auth.rateLimitPerMinute = 10;
  });
  beforeEach(() => __resetAuthRateLimiterForTests());

  function req(ip: string): Request {
    return { path: "/api/auth/login", ip } as unknown as Request;
  }

  it("allows up to the limit then 429s the same IP", () => {
    let allowed = 0;
    for (let i = 0; i < 12; i++) {
      const res = mockRes();
      authRateLimiter(req("5.5.5.5"), res, () => { allowed++; });
    }
    expect(allowed).toBe(10);
  });

  it("limits per IP independently", () => {
    let allowed = 0;
    for (let i = 0; i < 10; i++) authRateLimiter(req("1.1.1.1"), mockRes(), () => { allowed++; });
    let otherAllowed = false;
    authRateLimiter(req("2.2.2.2"), mockRes(), () => { otherAllowed = true; });
    expect(allowed).toBe(10);
    expect(otherAllowed).toBe(true);
  });

  it("ignores non-auth paths", () => {
    let called = false;
    authRateLimiter({ path: "/api/state", ip: "1.1.1.1" } as unknown as Request, mockRes(), () => { called = true; });
    expect(called).toBe(true);
  });

  it("normalizes case so /API/AUTH/* is still limited (no brute-force bypass)", () => {
    let allowed = 0;
    for (let i = 0; i < 12; i++) {
      authRateLimiter({ path: "/API/AUTH/LOGIN", ip: "7.7.7.7" } as unknown as Request, mockRes(), () => { allowed++; });
    }
    expect(allowed).toBe(10);
  });
});
