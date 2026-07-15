import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import type { Request, Response, Router } from "express";
import { config } from "../config";
import { signJwt } from "../auth/jwt";
import { JWT_COOKIE } from "../auth/cookies";
import * as authStore from "../auth/store";
import { runWithUserId, resetCurrentUserId } from "../users/context";
import { PUBLIC_API_PATHS } from "../auth/middleware";
import { PREVIEW_LESSON_SLUG, PREVIEW_PROGRESS_PUBLIC_PATH } from "./constants";
import { createAcademyRouter } from "./routes";
import { __resetAcademyMemoryForTests, getProgressForUser } from "./store";

/**
 * Handler-level tests for the /api/academy router (fake req/res, the
 * middleware.test.ts style - no HTTP listener, no DB). The router runs on the
 * in-memory store; auth context is provided via runWithUserId exactly as the
 * requireAuth gate does in production.
 */

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    headersSent: false,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

/** Find a route's handler on the router by method + path. */
function handlerOf(
  router: Router,
  method: "get" | "patch" | "post",
  path: string,
): (req: Request, res: Response) => Promise<void> {
  const stack = (router as unknown as { stack: Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: (req: Request, res: Response) => Promise<void> }> } }> }).stack;
  for (const layer of stack) {
    if (layer.route && layer.route.path === path && layer.route.methods[method]) {
      return layer.route.stack[0]!.handle;
    }
  }
  throw new Error(`route ${method.toUpperCase()} ${path} not found`);
}

function req(params: Record<string, string>, body?: unknown, cookie?: string): Request {
  return {
    params,
    body,
    headers: cookie ? { cookie } : {},
  } as unknown as Request;
}

const USER = "test-user-1";

let router: Router;

beforeEach(() => {
  __resetAcademyMemoryForTests();
  authStore.__resetMemoryStoreForTests();
  resetCurrentUserId();
  router = createAcademyRouter();
});

describe("academy/routes - allowlist shape", () => {
  it("only the preview PATCH path is public; everything else is default-deny", () => {
    expect(PUBLIC_API_PATHS.has(PREVIEW_PROGRESS_PUBLIC_PATH)).toBe(true);
    expect(PUBLIC_API_PATHS.has("/api/academy/progress")).toBe(false);
    expect(PUBLIC_API_PATHS.has("/api/academy/progress/c2-l1")).toBe(false);
    expect(PUBLIC_API_PATHS.has(`${PREVIEW_PROGRESS_PUBLIC_PATH}/quiz`)).toBe(false);
  });
});

describe("academy/routes - GET /progress (endpoint 1)", () => {
  it("returns the authenticated user's progress list", async () => {
    const patch = handlerOf(router, "patch", "/progress/:slug");
    const get = handlerOf(router, "get", "/progress");
    await runWithUserId(USER, async () => {
      await patch(req({ slug: "c2-l1" }, { progressPercent: 40, status: "InProgress" }), mockRes());
      const res = mockRes();
      await get(req({}), res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([
        expect.objectContaining({ lessonSlug: "c2-l1", status: "InProgress", progressPercent: 40 }),
      ]);
    });
  });
});

describe("academy/routes - PATCH /progress/:slug (endpoint 2)", () => {
  it("upserts and applies the no-regression rule (80 -> 60 ignored)", async () => {
    const patch = handlerOf(router, "patch", "/progress/:slug");
    await runWithUserId(USER, async () => {
      await patch(req({ slug: "c2-l1" }, { progressPercent: 80, status: "InProgress" }), mockRes());
      const res = mockRes();
      await patch(req({ slug: "c2-l1" }, { progressPercent: 60, status: "InProgress" }), res);
      expect((res.body as { progressPercent: number }).progressPercent).toBe(80);
    });
  });

  it("rejects a bad slug and a bad percent with 400", async () => {
    const patch = handlerOf(router, "patch", "/progress/:slug");
    await runWithUserId(USER, async () => {
      const bad = mockRes();
      await patch(req({ slug: "../etc" }, { progressPercent: 10 }), bad);
      expect(bad.statusCode).toBe(400);
      const badPct = mockRes();
      await patch(req({ slug: "c2-l1" }, { progressPercent: 250 }), badPct);
      expect(badPct.statusCode).toBe(400);
      const badStatus = mockRes();
      await patch(req({ slug: "c2-l1" }, { progressPercent: 10, status: "Nope" }), badStatus);
      expect(badStatus.statusCode).toBe(400);
    });
  });

  it("derives status from percent when omitted (100 -> Completed)", async () => {
    const patch = handlerOf(router, "patch", "/progress/:slug");
    await runWithUserId(USER, async () => {
      const res = mockRes();
      await patch(req({ slug: "c2-l1" }, { progressPercent: 100 }), res);
      expect((res.body as { status: string }).status).toBe("Completed");
    });
  });

  describe("preview lesson (public path, optional session)", () => {
    beforeAll(() => {
      config.jwtSecret = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    });

    it("silently ignores an anonymous call (200, tracked:false, nothing stored)", async () => {
      const patch = handlerOf(router, "patch", "/progress/:slug");
      const res = mockRes();
      // NO runWithUserId and no cookie: exactly how the public gate delivers it.
      await patch(req({ slug: PREVIEW_LESSON_SLUG }, { progressPercent: 50 }), res);
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ tracked: false });
      // Nothing may land on the operator/default account.
      expect(await getProgressForUser("default")).toEqual([]);
    });

    it("tracks the preview under the session's user when a valid cookie is present", async () => {
      // Mint a real session + JWT the way login does (in-memory auth store).
      // resolveOptionalUserId checks jwt + aud + isSessionActive(jti) only, so
      // no user row is needed.
      const userId = "preview-user-1";
      const jti = "jti-preview-1";
      await authStore.createSession({ id: jti, userId, expiresAt: Date.now() + 3600_000 });
      const token = signJwt(
        { sub: userId, email: "preview@test.local", jti },
        config.jwtSecret,
        { nowSec: Math.floor(Date.now() / 1000), ttlSec: 3600 },
      );

      const patch = handlerOf(router, "patch", "/progress/:slug");
      const res = mockRes();
      await patch(
        req({ slug: PREVIEW_LESSON_SLUG }, { progressPercent: 50 }, `${JWT_COOKIE}=${token}`),
        res,
      );
      expect(res.statusCode).toBe(200);
      expect((res.body as { progressPercent: number }).progressPercent).toBe(50);
      const items = await getProgressForUser(userId);
      expect(items[0]).toMatchObject({ lessonSlug: PREVIEW_LESSON_SLUG, progressPercent: 50 });
    });
  });
});

describe("academy/routes - POST /progress/:slug/quiz (endpoint 3)", () => {
  it("records attempts with incrementing attemptNumber and isNewBest", async () => {
    const post = handlerOf(router, "post", "/progress/:slug/quiz");
    await runWithUserId(USER, async () => {
      const r1 = mockRes();
      await post(req({ slug: "c1" }, { scorePercent: 55, passed: false }), r1);
      expect(r1.body).toMatchObject({ attemptNumber: 1, isNewBest: true, passed: false });
      const r2 = mockRes();
      await post(req({ slug: "c1" }, { scorePercent: 80, passed: true }), r2);
      expect(r2.body).toMatchObject({ attemptNumber: 2, isNewBest: true, passed: true });
    });
  });

  it("a passed attempt completes the lesson row", async () => {
    const post = handlerOf(router, "post", "/progress/:slug/quiz");
    const get = handlerOf(router, "get", "/progress");
    await runWithUserId(USER, async () => {
      await post(req({ slug: "c1" }, { scorePercent: 80, passed: true }), mockRes());
      const res = mockRes();
      await get(req({}), res);
      expect(res.body).toEqual([
        expect.objectContaining({ lessonSlug: "c1", status: "Completed", quizPassed: true, bestQuizScore: 80 }),
      ]);
    });
  });

  it("rejects invalid bodies with 400", async () => {
    const post = handlerOf(router, "post", "/progress/:slug/quiz");
    await runWithUserId(USER, async () => {
      const noBool = mockRes();
      await post(req({ slug: "c1" }, { scorePercent: 80, passed: "yes" }), noBool);
      expect(noBool.statusCode).toBe(400);
      const noScore = mockRes();
      await post(req({ slug: "c1" }, { passed: true }), noScore);
      expect(noScore.statusCode).toBe(400);
    });
  });

  it("GET /progress/:slug/quiz returns the attempt history", async () => {
    const post = handlerOf(router, "post", "/progress/:slug/quiz");
    const history = handlerOf(router, "get", "/progress/:slug/quiz");
    await runWithUserId(USER, async () => {
      await post(req({ slug: "c1" }, { scorePercent: 55, passed: false }), mockRes());
      await post(req({ slug: "c1" }, { scorePercent: 80, passed: true }), mockRes());
      const res = mockRes();
      await history(req({ slug: "c1" }), res);
      expect((res.body as unknown[]).length).toBe(2);
    });
  });
});
