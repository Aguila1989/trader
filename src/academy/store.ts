/**
 * Academy progress store (2026-07 Feature 1): per-user lesson progress + quiz
 * attempts, the server-side source of truth behind /api/academy/progress.
 *
 * Mirrors the auth store's dual-backend contract: when SQL Server is configured
 * (dbReady()) everything persists to dbo.AcademyLessonProgress /
 * dbo.AcademyQuizAttempts (created in src/db/pool.ts); otherwise it falls back
 * to in-memory maps so the app (and the vitest suite) works without a DB.
 *
 * Slug semantics: `lessonSlug` is an opaque key supplied by the frontend. The
 * Academy content model keys LESSON reading progress by lesson id ("c1-l1")
 * and QUIZ attempts by chapter id ("c1" - quizzes are per-chapter). The store
 * is deliberately generic over both; the frontend interprets which keys are
 * lessons vs chapter quizzes.
 *
 * Business rules (see applyProgressRules - the single, unit-tested source of
 * truth; the SQL branch mirrors it with CASE expressions so a concurrent PATCH
 * can never regress a row):
 *   - progressPercent is MONOTONIC: a lower value than what is stored is ignored.
 *   - status is MONOTONIC (NotStarted < InProgress < Completed): completion is
 *     sticky, matching the client store's sticky quizPassed behaviour.
 *   - an effective progressPercent of 100 implies Completed.
 *   - startedAt is set on first touch, never changed.
 *   - completedAt is set once, when the row first becomes Completed.
 *   - a PASSED quiz attempt completes the lesson row for that slug (and forces
 *     progressPercent to 100 so a "completed" card never shows a partial bar).
 */
import { randomUUID } from "node:crypto";
import sql from "mssql";
import { getPool, dbReady } from "../db/pool";

// --- status codes ------------------------------------------------------------

/** DB status codes. Names match the API's string enum. */
export const LESSON_STATUS = { NotStarted: 0, InProgress: 1, Completed: 2 } as const;
export type LessonStatusName = keyof typeof LESSON_STATUS;

const STATUS_NAMES: readonly LessonStatusName[] = ["NotStarted", "InProgress", "Completed"];

export function statusToName(code: number): LessonStatusName {
  return STATUS_NAMES[code] ?? "NotStarted";
}

export function statusFromName(name: string): number | null {
  return name in LESSON_STATUS ? LESSON_STATUS[name as LessonStatusName] : null;
}

// --- shapes ------------------------------------------------------------------

/** One item of GET /api/academy/progress (and the PATCH/quiz responses). */
export interface AcademyProgressItem {
  lessonSlug: string;
  status: LessonStatusName;
  progressPercent: number;
  completedAt: string | null;
  bestQuizScore: number | null;
  quizPassed: boolean;
}

export interface QuizAttemptResult {
  lessonSlug: string;
  attemptNumber: number;
  scorePercent: number;
  passed: boolean;
  /** True when this attempt beats every previous score for the slug. */
  isNewBest: boolean;
  attemptedAt: string;
}

export interface QuizAttemptRecord {
  attemptNumber: number;
  scorePercent: number;
  passed: boolean;
  attemptedAt: string;
}

interface ProgressRow {
  lessonSlug: string;
  status: number;
  progressPercent: number;
  startedAt: Date;
  completedAt: Date | null;
}

export interface ProgressPatch {
  progressPercent: number;
  status: number;
}

// --- pure business rules (unit-tested; both backends follow these) -----------

/**
 * Compute the next persisted state for a (user, lessonSlug) row. Pure so the
 * rules are testable in isolation; the in-memory branch calls this directly and
 * the SQL branch encodes the identical rules as CASE expressions in one atomic
 * UPDATE (so two concurrent PATCHes cannot interleave a regression).
 */
export function applyProgressRules(
  existing: ProgressRow | null,
  slug: string,
  patch: ProgressPatch,
  now: Date,
): ProgressRow {
  const prevPct = existing?.progressPercent ?? 0;
  const prevStatus = existing?.status ?? LESSON_STATUS.NotStarted;
  // Never backwards (PATCH 80% -> 60% is ignored).
  const pct = Math.max(prevPct, patch.progressPercent);
  // Monotonic status; reading to the end (100%) always counts as Completed.
  let status = Math.max(prevStatus, patch.status);
  if (pct >= 100) status = LESSON_STATUS.Completed;
  return {
    lessonSlug: slug,
    status,
    progressPercent: pct,
    startedAt: existing?.startedAt ?? now, // set on first touch only
    completedAt:
      existing?.completedAt ?? (status === LESSON_STATUS.Completed ? now : null), // set once
  };
}

// --- in-memory backend (no-DB mode) -------------------------------------------

interface MemQuizAttempt {
  lessonSlug: string;
  attemptNumber: number;
  scorePercent: number;
  passed: boolean;
  attemptedAt: Date;
}

const mem = {
  /** userId -> (lessonSlug -> row) */
  progress: new Map<string, Map<string, ProgressRow>>(),
  /** userId -> attempts (append-only) */
  quiz: new Map<string, MemQuizAttempt[]>(),
};

/** Test hook: wipe the in-memory backend between cases. */
export function __resetAcademyMemoryForTests(): void {
  mem.progress.clear();
  mem.quiz.clear();
}

interface QuizAgg {
  bestScore: number;
  anyPassed: boolean;
}

function memQuizAggregates(userId: string): Map<string, QuizAgg> {
  const out = new Map<string, QuizAgg>();
  for (const a of mem.quiz.get(userId) ?? []) {
    const cur = out.get(a.lessonSlug);
    out.set(a.lessonSlug, {
      bestScore: Math.max(cur?.bestScore ?? 0, a.scorePercent),
      anyPassed: (cur?.anyPassed ?? false) || a.passed,
    });
  }
  return out;
}

function toItem(row: ProgressRow | null, slug: string, agg: QuizAgg | undefined): AcademyProgressItem {
  return {
    lessonSlug: slug,
    status: statusToName(row?.status ?? LESSON_STATUS.NotStarted),
    progressPercent: row?.progressPercent ?? 0,
    completedAt: row?.completedAt ? row.completedAt.toISOString() : null,
    bestQuizScore: agg ? agg.bestScore : null,
    quizPassed: agg?.anyPassed ?? false,
  };
}

// --- reads --------------------------------------------------------------------

/**
 * All progress for one user: every progress row LEFT-merged with the per-slug
 * best quiz score, PLUS quiz-only slugs (a chapter quiz can be passed before
 * any reading progress exists for that key). Two sibling queries merged in TS -
 * the codebase's standard pattern (no ORM; EF-style SplitQuery does not exist
 * here, and a single FULL OUTER JOIN would be harder to read for no gain at
 * this row count).
 */
export async function getProgressForUser(userId: string): Promise<AcademyProgressItem[]> {
  if (!dbReady()) {
    const rows = mem.progress.get(userId) ?? new Map<string, ProgressRow>();
    const aggs = memQuizAggregates(userId);
    const slugs = new Set<string>([...rows.keys(), ...aggs.keys()]);
    return [...slugs]
      .sort()
      .map((slug) => toItem(rows.get(slug) ?? null, slug, aggs.get(slug)));
  }

  const p = getPool();
  const progress = await p
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query(
      `SELECT lessonSlug, status, progressPercent, startedAt, completedAt
         FROM dbo.AcademyLessonProgress WHERE userId = @userId`,
    );
  const quiz = await p
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .query(
      `SELECT lessonSlug,
              MAX(scorePercent)         AS bestScore,
              MAX(CAST(passed AS INT))  AS anyPassed
         FROM dbo.AcademyQuizAttempts WHERE userId = @userId
        GROUP BY lessonSlug`,
    );

  const aggs = new Map<string, QuizAgg>();
  for (const r of quiz.recordset) {
    aggs.set(String(r.lessonSlug), {
      bestScore: Number(r.bestScore),
      anyPassed: Number(r.anyPassed) === 1,
    });
  }
  const rows = new Map<string, ProgressRow>();
  for (const r of progress.recordset) {
    rows.set(String(r.lessonSlug), {
      lessonSlug: String(r.lessonSlug),
      status: Number(r.status),
      progressPercent: Number(r.progressPercent),
      startedAt: new Date(r.startedAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : null,
    });
  }
  const slugs = new Set<string>([...rows.keys(), ...aggs.keys()]);
  return [...slugs]
    .sort()
    .map((slug) => toItem(rows.get(slug) ?? null, slug, aggs.get(slug)));
}

/** Full attempt history for one slug (oldest first) - the quiz "Poging" list. */
export async function getQuizAttempts(userId: string, slug: string): Promise<QuizAttemptRecord[]> {
  if (!dbReady()) {
    return (mem.quiz.get(userId) ?? [])
      .filter((a) => a.lessonSlug === slug)
      .sort((a, b) => a.attemptNumber - b.attemptNumber)
      .map((a) => ({
        attemptNumber: a.attemptNumber,
        scorePercent: a.scorePercent,
        passed: a.passed,
        attemptedAt: a.attemptedAt.toISOString(),
      }));
  }
  const r = await getPool()
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("slug", sql.NVarChar(120), slug)
    .query(
      `SELECT attemptNumber, scorePercent, passed, attemptedAt
         FROM dbo.AcademyQuizAttempts
        WHERE userId = @userId AND lessonSlug = @slug
        ORDER BY attemptNumber ASC`,
    );
  return r.recordset.map((row) => ({
    attemptNumber: Number(row.attemptNumber),
    scorePercent: Number(row.scorePercent),
    passed: Boolean(row.passed),
    attemptedAt: new Date(row.attemptedAt).toISOString(),
  }));
}

// --- writes -------------------------------------------------------------------

/**
 * Upsert one (user, lessonSlug) row under applyProgressRules. Returns the row's
 * post-write state (including quiz aggregate) so the client can update a single
 * card without refetching the whole list.
 */
export async function upsertProgress(
  userId: string,
  slug: string,
  patch: ProgressPatch,
): Promise<AcademyProgressItem> {
  const now = new Date();

  if (!dbReady()) {
    let rows = mem.progress.get(userId);
    if (!rows) {
      rows = new Map();
      mem.progress.set(userId, rows);
    }
    const next = applyProgressRules(rows.get(slug) ?? null, slug, patch, now);
    rows.set(slug, next);
    return toItem(next, slug, memQuizAggregates(userId).get(slug));
  }

  const p = getPool();
  const write = (): sql.Request =>
    p
      .request()
      .input("id", sql.NVarChar(64), randomUUID())
      .input("userId", sql.NVarChar(64), userId)
      .input("slug", sql.NVarChar(120), slug)
      .input("pct", sql.Int, patch.progressPercent)
      .input("status", sql.Int, patch.status)
      .input("now", sql.DateTime2(3), now);

  // One atomic UPDATE mirroring applyProgressRules: the CASE expressions make
  // percent/status monotonic IN the statement, so two concurrent PATCHes can
  // never interleave a regression (read-modify-write in TS could).
  const updateSql = `
    UPDATE dbo.AcademyLessonProgress SET
      progressPercent = CASE WHEN @pct > progressPercent THEN @pct ELSE progressPercent END,
      status = CASE
                 WHEN (CASE WHEN @pct > progressPercent THEN @pct ELSE progressPercent END) >= 100 THEN 2
                 WHEN @status > status THEN @status
                 ELSE status
               END,
      startedAt = COALESCE(startedAt, @now),
      completedAt = COALESCE(
        completedAt,
        CASE
          WHEN @status = 2
            OR (CASE WHEN @pct > progressPercent THEN @pct ELSE progressPercent END) >= 100
          THEN @now
        END)
    WHERE userId = @userId AND lessonSlug = @slug`;

  const updated = await write().query(updateSql);
  if ((updated.rowsAffected?.[0] ?? 0) === 0) {
    // No row yet: insert the first state via the same pure rules.
    const first = applyProgressRules(null, slug, patch, now);
    try {
      await p
        .request()
        .input("id", sql.NVarChar(64), randomUUID())
        .input("userId", sql.NVarChar(64), userId)
        .input("slug", sql.NVarChar(120), slug)
        .input("status", sql.Int, first.status)
        .input("startedAt", sql.DateTime2(3), first.startedAt)
        .input("completedAt", sql.DateTime2(3), first.completedAt)
        .input("pct", sql.Int, first.progressPercent)
        .query(
          `INSERT INTO dbo.AcademyLessonProgress
             (id, userId, lessonSlug, status, startedAt, completedAt, progressPercent)
           VALUES (@id, @userId, @slug, @status, @startedAt, @completedAt, @pct)`,
        );
    } catch (err) {
      // Unique-index race (UX_AcademyLessonProgress_user_lesson): another
      // request inserted first. The monotonic UPDATE is safe to retry once.
      const num = (err as { number?: number })?.number;
      if (num === 2601 || num === 2627) await write().query(updateSql);
      else throw err;
    }
  }

  // Return fresh post-write state (+ the slug's quiz aggregate).
  const rowQ = await p
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("slug", sql.NVarChar(120), slug)
    .query(
      `SELECT lessonSlug, status, progressPercent, startedAt, completedAt
         FROM dbo.AcademyLessonProgress WHERE userId = @userId AND lessonSlug = @slug`,
    );
  const aggQ = await p
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("slug", sql.NVarChar(120), slug)
    .query(
      `SELECT MAX(scorePercent) AS bestScore, MAX(CAST(passed AS INT)) AS anyPassed
         FROM dbo.AcademyQuizAttempts WHERE userId = @userId AND lessonSlug = @slug`,
    );
  const r = rowQ.recordset[0];
  const row: ProgressRow | null = r
    ? {
        lessonSlug: String(r.lessonSlug),
        status: Number(r.status),
        progressPercent: Number(r.progressPercent),
        startedAt: new Date(r.startedAt),
        completedAt: r.completedAt ? new Date(r.completedAt) : null,
      }
    : null;
  const a = aggQ.recordset[0];
  const agg: QuizAgg | undefined =
    a && a.bestScore !== null
      ? { bestScore: Number(a.bestScore), anyPassed: Number(a.anyPassed) === 1 }
      : undefined;
  return toItem(row, slug, agg);
}

/**
 * Record one quiz attempt. attemptNumber = existing count + 1 (1-based). A
 * passed attempt also completes the lesson row for the slug (rules above).
 *
 * attemptNumber is computed with a plain COUNT (no serializable transaction):
 * it is a display-only sequence on an append-only table, and one user
 * submitting the same quiz from two devices in the same instant is not a
 * failure mode worth a lock. (The unique upsert key protects progress rows,
 * where a race WOULD matter.)
 */
export async function recordQuizAttempt(
  userId: string,
  slug: string,
  attempt: { scorePercent: number; passed: boolean },
): Promise<QuizAttemptResult> {
  const now = new Date();

  if (!dbReady()) {
    let list = mem.quiz.get(userId);
    if (!list) {
      list = [];
      mem.quiz.set(userId, list);
    }
    const prior = list.filter((a) => a.lessonSlug === slug);
    const prevBest = prior.length ? Math.max(...prior.map((a) => a.scorePercent)) : null;
    const rec: MemQuizAttempt = {
      lessonSlug: slug,
      attemptNumber: prior.length + 1,
      scorePercent: attempt.scorePercent,
      passed: attempt.passed,
      attemptedAt: now,
    };
    list.push(rec);
    if (attempt.passed) {
      await upsertProgress(userId, slug, {
        progressPercent: 100,
        status: LESSON_STATUS.Completed,
      });
    }
    return {
      lessonSlug: slug,
      attemptNumber: rec.attemptNumber,
      scorePercent: rec.scorePercent,
      passed: rec.passed,
      isNewBest: prevBest === null || attempt.scorePercent > prevBest,
      attemptedAt: now.toISOString(),
    };
  }

  const p = getPool();
  const priorQ = await p
    .request()
    .input("userId", sql.NVarChar(64), userId)
    .input("slug", sql.NVarChar(120), slug)
    .query(
      `SELECT COUNT(*) AS n, MAX(scorePercent) AS best
         FROM dbo.AcademyQuizAttempts WHERE userId = @userId AND lessonSlug = @slug`,
    );
  const n = Number(priorQ.recordset[0]?.n ?? 0);
  const prevBestRaw = priorQ.recordset[0]?.best;
  const prevBest = prevBestRaw === null || prevBestRaw === undefined ? null : Number(prevBestRaw);
  const attemptNumber = n + 1;

  await p
    .request()
    .input("id", sql.NVarChar(64), randomUUID())
    .input("userId", sql.NVarChar(64), userId)
    .input("slug", sql.NVarChar(120), slug)
    .input("attemptNumber", sql.Int, attemptNumber)
    .input("scorePercent", sql.Int, attempt.scorePercent)
    .input("passed", sql.Bit, attempt.passed)
    .input("attemptedAt", sql.DateTime2(3), now)
    .query(
      `INSERT INTO dbo.AcademyQuizAttempts
         (id, userId, lessonSlug, attemptNumber, scorePercent, passed, attemptedAt)
       VALUES (@id, @userId, @slug, @attemptNumber, @scorePercent, @passed, @attemptedAt)`,
    );

  if (attempt.passed) {
    await upsertProgress(userId, slug, {
      progressPercent: 100,
      status: LESSON_STATUS.Completed,
    });
  }

  return {
    lessonSlug: slug,
    attemptNumber,
    scorePercent: attempt.scorePercent,
    passed: attempt.passed,
    isNewBest: prevBest === null || attempt.scorePercent > prevBest,
    attemptedAt: now.toISOString(),
  };
}
