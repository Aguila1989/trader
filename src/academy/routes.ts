/**
 * Academy progress endpoints (2026-07 Feature 1). Mounted in server.ts AFTER
 * the auth gate at /api/academy, so every route is default-deny protected -
 * with ONE deliberate exception: PATCH /progress/<preview slug> is in
 * PUBLIC_API_PATHS so the free preview lesson can be read anonymously. Because
 * the gate short-circuits public paths BEFORE reading the JWT, that handler
 * resolves an OPTIONAL session itself: a logged-in reader's preview progress is
 * tracked under their own account, a true anonymous call is silently ignored
 * (200, tracked:false) and NEVER written - not to any user and especially not
 * to the operator's DEFAULT_USER_ID fallback.
 *
 *   GET   /api/academy/progress             all progress for the current user
 *   PATCH /api/academy/progress/:slug       upsert (monotonic; see store rules)
 *   POST  /api/academy/progress/:slug/quiz  record a quiz attempt
 *   GET   /api/academy/progress/:slug/quiz  attempt history for the slug
 *
 * Error contract mirrors wallet/routes.ts (SEC-25): invalid input answers a
 * specific 400; anything thrown is masked behind a generic 500 with the real
 * cause logged server-side.
 */
import { Router, type Request, type Response } from "express";
import { store as tradingStore } from "../trading/store";
import { currentUserId } from "../users/context";
import { resolveOptionalUserId } from "../auth/middleware";
import { PREVIEW_LESSON_SLUG } from "./constants";
import {
  LESSON_STATUS,
  statusFromName,
  getProgressForUser,
  getQuizAttempts,
  upsertProgress,
  recordQuizAttempt,
} from "./store";

/** Slug shape: the content model's ids ("c1", "c1-l1", ...). Fail closed. */
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,119}$/;

function fail(res: Response, err: unknown): void {
  tradingStore.log("error", `academy request failed: ${(err as Error)?.message ?? String(err)}`);
  if (!res.headersSent) res.status(500).json({ error: "request failed" });
}

/** Parse + clamp an integer percent; null when not a finite number in [0,100]. */
function parsePercent(v: unknown): number | null {
  const n = typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i >= 0 && i <= 100 ? i : null;
}

export function createAcademyRouter(): Router {
  const router = Router();

  // All lesson progress + best quiz scores for the authenticated user.
  router.get("/progress", async (_req: Request, res: Response) => {
    try {
      res.json(await getProgressForUser(currentUserId()));
    } catch (err) {
      fail(res, err);
    }
  });

  // Upsert progress for one slug. Body: { progressPercent, status? }.
  router.patch("/progress/:slug", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? "").toLowerCase();
      if (!SLUG_RE.test(slug)) {
        res.status(400).json({ error: "invalid lesson slug" });
        return;
      }
      const b = (req.body ?? {}) as Record<string, unknown>;
      const progressPercent = parsePercent(b.progressPercent);
      if (progressPercent === null) {
        res.status(400).json({ error: "progressPercent must be a number between 0 and 100" });
        return;
      }
      // status is optional; when omitted it is derived from the percent.
      let status: number;
      if (b.status === undefined) {
        status = progressPercent >= 100 ? LESSON_STATUS.Completed : LESSON_STATUS.InProgress;
      } else {
        const parsed = statusFromName(String(b.status));
        if (parsed === null) {
          res.status(400).json({ error: "status must be NotStarted, InProgress or Completed" });
          return;
        }
        status = parsed;
      }

      // The preview lesson's PATCH path is PUBLIC (see constants.ts), so the
      // auth gate did NOT establish a user context here - resolve one
      // optionally. Anonymous: silently ignore, per spec.
      let userId: string;
      if (slug === PREVIEW_LESSON_SLUG) {
        const uid = await resolveOptionalUserId(req);
        if (!uid) {
          res.json({ tracked: false });
          return;
        }
        userId = uid;
      } else {
        userId = currentUserId();
      }

      res.json(await upsertProgress(userId, slug, { progressPercent, status }));
    } catch (err) {
      fail(res, err);
    }
  });

  // Record a quiz attempt. Body: { scorePercent, passed }.
  router.post("/progress/:slug/quiz", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? "").toLowerCase();
      if (!SLUG_RE.test(slug)) {
        res.status(400).json({ error: "invalid lesson slug" });
        return;
      }
      const b = (req.body ?? {}) as Record<string, unknown>;
      const scorePercent = parsePercent(b.scorePercent);
      if (scorePercent === null) {
        res.status(400).json({ error: "scorePercent must be a number between 0 and 100" });
        return;
      }
      if (typeof b.passed !== "boolean") {
        res.status(400).json({ error: "passed must be a boolean" });
        return;
      }
      res.json(await recordQuizAttempt(currentUserId(), slug, { scorePercent, passed: b.passed }));
    } catch (err) {
      fail(res, err);
    }
  });

  // Attempt history for the quiz result screen ("Poging 1: 55% | ...").
  router.get("/progress/:slug/quiz", async (req: Request, res: Response) => {
    try {
      const slug = String(req.params.slug ?? "").toLowerCase();
      if (!SLUG_RE.test(slug)) {
        res.status(400).json({ error: "invalid lesson slug" });
        return;
      }
      res.json(await getQuizAttempts(currentUserId(), slug));
    } catch (err) {
      fail(res, err);
    }
  });

  return router;
}
