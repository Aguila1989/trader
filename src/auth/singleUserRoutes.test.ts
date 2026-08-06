import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

/**
 * The SINGLE_USER auth stub (createSingleUserAuthRouter) — the ONLY /api/auth
 * surface in personal mode, and what the SPA's authApi.account() + the
 * onboarding tour depend on. Exercised through the router's own layer stack
 * with fake req/res (same hand-rolled style as middleware.test.ts; no
 * supertest dependency).
 */

const authService = vi.hoisted(() => ({
  getAccount: vi.fn(),
  setOnboardingCompleted: vi.fn(async () => {}),
}));

vi.mock("./service", () => authService);
vi.mock("../config", () => ({
  config: { singleUser: true, auth: { cookieSecure: false }, jwtSecret: "x".repeat(40) },
}));

const { createSingleUserAuthRouter } = await import("./routes");
const { DEFAULT_USER_ID, DEFAULT_USER_EMAIL } = await import("../users/context");

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

/** Drive one request through the router's matching layer. */
async function call(
  method: "get" | "post",
  path: string,
  body?: unknown,
): Promise<Response & { statusCode: number; body: unknown }> {
  const router = createSingleUserAuthRouter();
  const res = mockRes();
  const req = { method: method.toUpperCase(), url: path, path, body, headers: {} } as unknown as Request;
  const layer = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: Function }> } }> }).stack.find(
    (l) => l.route?.path === path && l.route.methods[method],
  );
  if (!layer?.route) throw new Error(`no route registered for ${method.toUpperCase()} ${path}`);
  await layer.route.stack[0]!.handle(req, res, () => {});
  return res;
}

beforeEach(() => {
  authService.getAccount.mockReset();
  authService.setOnboardingCompleted.mockReset().mockResolvedValue(undefined);
});

describe("createSingleUserAuthRouter - GET /me", () => {
  it("returns the operator row when one exists", async () => {
    authService.getAccount.mockResolvedValue({
      id: DEFAULT_USER_ID,
      email: DEFAULT_USER_EMAIL,
      displayName: "Default Account",
      createdAt: "2026-01-01T00:00:00.000Z",
      onboardingCompleted: false,
      totpEnabled: false,
    });
    const res = await call("get", "/me");
    expect(res.statusCode).toBe(200);
    expect((res.body as { user: { id: string; onboardingCompleted: boolean } }).user.id).toBe(DEFAULT_USER_ID);
    expect((res.body as { user: { onboardingCompleted: boolean } }).user.onboardingCompleted).toBe(false);
  });

  it("falls back to the DEFAULT identity when there is no Users row (no DB)", async () => {
    authService.getAccount.mockResolvedValue(null);
    const res = await call("get", "/me");
    const user = (res.body as { user: Record<string, unknown> }).user;
    expect(res.statusCode).toBe(200);
    expect(user.id).toBe(DEFAULT_USER_ID);
    expect(user.email).toBe(DEFAULT_USER_EMAIL);
    // Never nag the operator with the tour when nothing can persist.
    expect(user.onboardingCompleted).toBe(true);
    expect(user.totpEnabled).toBe(false);
  });

  it("never 500s when the account lookup throws (DB down)", async () => {
    authService.getAccount.mockRejectedValue(new Error("db down"));
    const res = await call("get", "/me");
    expect(res.statusCode).toBe(200);
    expect((res.body as { user: { id: string } }).user.id).toBe(DEFAULT_USER_ID);
  });
});

describe("createSingleUserAuthRouter - POST /onboarding", () => {
  it("persists a boolean and echoes it", async () => {
    const res = await call("post", "/onboarding", { completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, onboardingCompleted: true });
    expect(authService.setOnboardingCompleted).toHaveBeenCalledWith(DEFAULT_USER_ID, true);
  });

  it("400s a non-boolean", async () => {
    for (const bad of [{ completed: "yes" }, {}, undefined]) {
      const res = await call("post", "/onboarding", bad);
      expect(res.statusCode).toBe(400);
    }
    expect(authService.setOnboardingCompleted).not.toHaveBeenCalled();
  });

  it("still answers ok when persistence fails (best-effort, no DB)", async () => {
    authService.setOnboardingCompleted.mockRejectedValue(new Error("db down"));
    const res = await call("post", "/onboarding", { completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, onboardingCompleted: true });
  });
});
