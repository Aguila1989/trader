import { describe, it, expect, beforeEach } from "vitest";
import {
  LESSON_STATUS,
  statusToName,
  statusFromName,
  applyProgressRules,
  getProgressForUser,
  getQuizAttempts,
  upsertProgress,
  recordQuizAttempt,
  __resetAcademyMemoryForTests,
} from "./store";

/**
 * With no SQL Server configured in the test env, dbReady() is false, so the
 * store runs on its in-memory backend - which shares applyProgressRules with
 * the SQL branch, so these tests cover the actual business rules the API
 * enforces (mirrors the auth/store.test.ts contract).
 */

const U = "user-a";
const U2 = "user-b";

beforeEach(() => __resetAcademyMemoryForTests());

describe("academy/store - status mapping", () => {
  it("maps codes to API names and back", () => {
    expect(statusToName(0)).toBe("NotStarted");
    expect(statusToName(1)).toBe("InProgress");
    expect(statusToName(2)).toBe("Completed");
    expect(statusFromName("NotStarted")).toBe(0);
    expect(statusFromName("InProgress")).toBe(1);
    expect(statusFromName("Completed")).toBe(2);
    expect(statusFromName("nope")).toBeNull();
  });
});

describe("academy/store - applyProgressRules (pure)", () => {
  const now = new Date("2026-07-11T10:00:00Z");

  it("first touch sets startedAt and stores the patch", () => {
    const r = applyProgressRules(null, "c1-l1", { progressPercent: 25, status: 1 }, now);
    expect(r.startedAt).toBe(now);
    expect(r.progressPercent).toBe(25);
    expect(r.status).toBe(LESSON_STATUS.InProgress);
    expect(r.completedAt).toBeNull();
  });

  it("never lets progressPercent go backwards (80 -> 60 ignored)", () => {
    const at80 = applyProgressRules(null, "c1-l1", { progressPercent: 80, status: 1 }, now);
    const later = new Date(now.getTime() + 60_000);
    const r = applyProgressRules(at80, "c1-l1", { progressPercent: 60, status: 1 }, later);
    expect(r.progressPercent).toBe(80);
    expect(r.startedAt).toBe(now); // first-touch timestamp is preserved
  });

  it("status is monotonic: Completed cannot be downgraded", () => {
    const done = applyProgressRules(null, "c1-l1", { progressPercent: 40, status: 2 }, now);
    expect(done.status).toBe(LESSON_STATUS.Completed);
    expect(done.completedAt).toBe(now);
    const later = new Date(now.getTime() + 60_000);
    const r = applyProgressRules(done, "c1-l1", { progressPercent: 50, status: 1 }, later);
    expect(r.status).toBe(LESSON_STATUS.Completed);
    expect(r.completedAt).toBe(now); // set once, never overwritten
  });

  it("reaching 100% implies Completed and stamps completedAt", () => {
    const r = applyProgressRules(null, "c1-l1", { progressPercent: 100, status: 1 }, now);
    expect(r.status).toBe(LESSON_STATUS.Completed);
    expect(r.completedAt).toBe(now);
  });
});

describe("academy/store - upsertProgress (endpoint 2 behaviour)", () => {
  it("creates the record when none exists (upsert)", async () => {
    const item = await upsertProgress(U, "c1-l1", { progressPercent: 25, status: 1 });
    expect(item.lessonSlug).toBe("c1-l1");
    expect(item.status).toBe("InProgress");
    expect(item.progressPercent).toBe(25);
    expect(item.completedAt).toBeNull();
    expect(item.bestQuizScore).toBeNull();
    expect(item.quizPassed).toBe(false);
  });

  it("REGRESSION: PATCH 80% then 60% keeps 80%", async () => {
    await upsertProgress(U, "c1-l1", { progressPercent: 80, status: 1 });
    const after = await upsertProgress(U, "c1-l1", { progressPercent: 60, status: 1 });
    expect(after.progressPercent).toBe(80);
  });

  it("marking Completed stamps completedAt exactly once", async () => {
    const first = await upsertProgress(U, "c1-l1", { progressPercent: 100, status: 2 });
    expect(first.status).toBe("Completed");
    expect(first.completedAt).not.toBeNull();
    const again = await upsertProgress(U, "c1-l1", { progressPercent: 100, status: 2 });
    expect(again.completedAt).toBe(first.completedAt);
  });

  it("scopes rows per user", async () => {
    await upsertProgress(U, "c1-l1", { progressPercent: 80, status: 1 });
    await upsertProgress(U2, "c1-l1", { progressPercent: 10, status: 1 });
    const a = await getProgressForUser(U);
    const b = await getProgressForUser(U2);
    expect(a[0]?.progressPercent).toBe(80);
    expect(b[0]?.progressPercent).toBe(10);
  });
});

describe("academy/store - recordQuizAttempt (endpoint 3 behaviour)", () => {
  it("attemptNumber increments 1, 2, 3 per user + lesson", async () => {
    const a1 = await recordQuizAttempt(U, "c1", { scorePercent: 40, passed: false });
    const a2 = await recordQuizAttempt(U, "c1", { scorePercent: 55, passed: false });
    const a3 = await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });
    expect([a1.attemptNumber, a2.attemptNumber, a3.attemptNumber]).toEqual([1, 2, 3]);
    // Another lesson and another user both start back at 1.
    expect((await recordQuizAttempt(U, "c2", { scorePercent: 10, passed: false })).attemptNumber).toBe(1);
    expect((await recordQuizAttempt(U2, "c1", { scorePercent: 10, passed: false })).attemptNumber).toBe(1);
  });

  it("flags a new best score correctly", async () => {
    const a1 = await recordQuizAttempt(U, "c1", { scorePercent: 55, passed: false });
    expect(a1.isNewBest).toBe(true); // first attempt is always the best so far
    const a2 = await recordQuizAttempt(U, "c1", { scorePercent: 40, passed: false });
    expect(a2.isNewBest).toBe(false);
    const a3 = await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });
    expect(a3.isNewBest).toBe(true);
    const a4 = await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });
    expect(a4.isNewBest).toBe(false); // ties are not a NEW best
  });

  it("a PASSED quiz sets the lesson to Completed with completedAt", async () => {
    await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });
    const items = await getProgressForUser(U);
    const c1 = items.find((i) => i.lessonSlug === "c1");
    expect(c1?.status).toBe("Completed");
    expect(c1?.completedAt).not.toBeNull();
    expect(c1?.progressPercent).toBe(100);
    expect(c1?.quizPassed).toBe(true);
    expect(c1?.bestQuizScore).toBe(80);
  });

  it("a FAILED quiz does not complete the lesson", async () => {
    await recordQuizAttempt(U, "c1", { scorePercent: 40, passed: false });
    const items = await getProgressForUser(U);
    const c1 = items.find((i) => i.lessonSlug === "c1");
    expect(c1?.status).toBe("NotStarted"); // quiz-only slug, no reading progress
    expect(c1?.quizPassed).toBe(false);
    expect(c1?.bestQuizScore).toBe(40);
  });

  it("getQuizAttempts returns the full history oldest-first", async () => {
    await recordQuizAttempt(U, "c1", { scorePercent: 55, passed: false });
    await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });
    const history = await getQuizAttempts(U, "c1");
    expect(history.map((h) => [h.attemptNumber, h.scorePercent, h.passed])).toEqual([
      [1, 55, false],
      [2, 80, true],
    ]);
  });
});

describe("academy/store - getProgressForUser (endpoint 1 behaviour)", () => {
  it("merges reading progress with best quiz score per slug", async () => {
    await upsertProgress(U, "c1-l1", { progressPercent: 50, status: 1 });
    await recordQuizAttempt(U, "c1", { scorePercent: 55, passed: false });
    await recordQuizAttempt(U, "c1", { scorePercent: 80, passed: true });

    const items = await getProgressForUser(U);
    const bySlug = new Map(items.map((i) => [i.lessonSlug, i]));

    // Reading-only slug: progress fields set, quiz fields empty.
    expect(bySlug.get("c1-l1")).toMatchObject({
      status: "InProgress",
      progressPercent: 50,
      bestQuizScore: null,
      quizPassed: false,
    });
    // Quiz slug: best score aggregated + completion from the passed attempt.
    expect(bySlug.get("c1")).toMatchObject({
      status: "Completed",
      progressPercent: 100,
      bestQuizScore: 80,
      quizPassed: true,
    });
  });

  it("returns an empty list for a user with no activity", async () => {
    expect(await getProgressForUser("nobody")).toEqual([]);
  });
});
