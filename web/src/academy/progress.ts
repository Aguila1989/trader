// Academy progress store — a SEPARATE Pinia store ("academy"), independent of
// the trading store. Persists to localStorage (same defensive try/catch pattern
// the trader store uses for its tab key) so progress survives across sessions
// and never touches any trading state.
//
// 2026-07 Feature 1: for a SIGNED-IN user this store also write-through-syncs
// to the server (/api/academy/progress) and hydrates from it on mount, making
// the account the source of truth across devices. localStorage remains the
// offline/anonymous fallback; every server call is fire-and-forget so a dead
// network never breaks the reading experience.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { academyApi, type AcademyProgressItem } from "../api";
import { isLoggedIn } from "../auth/session";
import { CHAPTER_INDEX, getChapterById } from "./content";
import { LEVELS, PASS_RATIO } from "./types";
import type {
  Chapter,
  ChapterProgress,
  Level,
  ProgressMap,
  QuizAttempt,
} from "./types";

const STORAGE_KEY = "academy_progress_v1";
const BYPASS_KEY = "academy_expert_bypass";

function emptyChapter(): ChapterProgress {
  return { viewedLessons: [], quizPassed: false, attempts: [] };
}

function readBypass(): boolean {
  try {
    return localStorage.getItem(BYPASS_KEY) === "1";
  } catch {
    return false;
  }
}

function read(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

export const useAcademyStore = defineStore("academy", () => {
  const progress = ref<ProgressMap>(read());
  // Expert bypass: "Skip to Advanced" unlocks every level without passing the
  // BASIC/ADVANCED quizzes (for users who already know the basics).
  const expertBypass = ref<boolean>(readBypass());
  function setExpertBypass(on: boolean): void {
    expertBypass.value = on;
    try {
      localStorage.setItem(BYPASS_KEY, on ? "1" : "0");
    } catch {
      /* private mode — still works for the session */
    }
  }

  function persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value));
    } catch {
      /* private mode / storage disabled — still works for the session */
    }
  }

  /** Read-only progress for a chapter (never returns undefined). */
  function chapterProgress(id: string): ChapterProgress {
    return progress.value[id] ?? emptyChapter();
  }

  /** Get-or-create the mutable progress record for a chapter. */
  function ensure(id: string): ChapterProgress {
    let cp = progress.value[id];
    if (!cp) {
      cp = emptyChapter();
      progress.value[id] = cp;
    }
    return cp;
  }

  // --- server sync (2026-07 Feature 1) ---
  // Raw per-slug server items ("cN-lM" = lesson reading, "cN" = chapter quiz),
  // the source for card progress bars / badges once hydrated.
  const serverProgress = ref<Record<string, AcademyProgressItem>>({});
  const serverLoaded = ref(false);

  /** The locale-independent lesson id ("c3-l2") for a chapter + index. */
  function lessonIdOf(chapterId: string, lessonIndex: number): string | null {
    // Ids are identical across locales; EN is the canonical index.
    return getChapterById("en", chapterId)?.lessons[lessonIndex]?.id ?? null;
  }

  function absorbServerItem(item: AcademyProgressItem | null | undefined): void {
    if (!item || item.error || !item.lessonSlug) return;
    serverProgress.value = { ...serverProgress.value, [item.lessonSlug]: item };
  }

  /** Merge one server row into the local (localStorage) map — additive only. */
  function mergeServerItem(item: AcademyProgressItem): void {
    const lesson = /^(c\d+)-l(\d+)$/.exec(item.lessonSlug);
    if (lesson) {
      const idx = Number(lesson[2]) - 1;
      if (item.status !== "NotStarted" || item.progressPercent > 0) {
        const cp = ensure(lesson[1]!);
        if (!cp.viewedLessons.includes(idx)) {
          cp.viewedLessons.push(idx);
          cp.viewedLessons.sort((a, b) => a - b);
        }
      }
      return;
    }
    if (/^c\d+$/.test(item.lessonSlug) && item.quizPassed) {
      ensure(item.lessonSlug).quizPassed = true;
    }
  }

  /**
   * Pull the account's progress from the server (signed-in only) and merge it
   * into the local view — so a user switching devices sees their real state.
   * Never throws; offline just leaves the localStorage view in place.
   */
  async function hydrateFromServer(): Promise<void> {
    if (!isLoggedIn()) return;
    try {
      const items = await academyApi.progress();
      if (!Array.isArray(items)) return;
      const map: Record<string, AcademyProgressItem> = {};
      for (const it of items) map[it.lessonSlug] = it;
      serverProgress.value = map;
      serverLoaded.value = true;
      for (const it of items) mergeServerItem(it);
      persist();
    } catch {
      /* offline / expired session — local view still works */
    }
  }

  // Debounced scroll-progress PATCHes (Feature 1F): thresholds arrive per
  // scroll event; we keep only the highest percent per lesson and flush at
  // most once every 600ms so the API is never hammered.
  const pendingScroll = new Map<string, number>();
  let scrollTimer: ReturnType<typeof setTimeout> | null = null;

  function flushScrollPatches(): void {
    scrollTimer = null;
    const batch = [...pendingScroll.entries()];
    pendingScroll.clear();
    for (const [slug, pct] of batch) {
      void academyApi
        .updateProgress(slug, { progressPercent: pct })
        .then(absorbServerItem)
        .catch(() => {});
    }
  }

  /** Report scroll progress (25/50/75/100) for a lesson — debounced PATCH. */
  function updateLessonScroll(chapterId: string, lessonIndex: number, percent: number): void {
    if (!isLoggedIn()) return;
    const slug = lessonIdOf(chapterId, lessonIndex);
    if (!slug) return;
    pendingScroll.set(slug, Math.max(pendingScroll.get(slug) ?? 0, percent));
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(flushScrollPatches, 600);
  }

  /** Record that a lesson was opened (idempotent locally; syncs when signed in). */
  function markLessonViewed(chapterId: string, lessonIndex: number): void {
    const cp = ensure(chapterId);
    if (!cp.viewedLessons.includes(lessonIndex)) {
      cp.viewedLessons.push(lessonIndex);
      cp.viewedLessons.sort((a, b) => a - b);
      persist();
    }
    // Write-through: opening a lesson marks it InProgress server-side (sets
    // startedAt on first touch). Anonymous readers (the preview lesson) stay
    // local-only — the server would ignore the write anyway.
    if (isLoggedIn()) {
      const slug = lessonIdOf(chapterId, lessonIndex);
      if (slug) {
        void academyApi
          .updateProgress(slug, { progressPercent: 0, status: "InProgress" })
          .then(absorbServerItem)
          .catch(() => {});
      }
    }
  }

  /** Save a finished quiz attempt; pass is sticky once achieved. */
  function recordQuizAttempt(
    chapterId: string,
    score: number,
    total: number,
    at: string,
  ): QuizAttempt {
    const cp = ensure(chapterId);
    const passed = total > 0 && score / total >= PASS_RATIO;
    const attempt: QuizAttempt = { score, total, passed, at };
    cp.attempts.push(attempt);
    if (passed) cp.quizPassed = true;
    persist();
    // Write-through (signed-in): the chapter quiz is recorded under the
    // chapter id; a pass also completes the lesson row server-side. Afterwards
    // re-hydrate so the chapter's aggregate (bestQuizScore/quizPassed/status)
    // reflects the server's view.
    if (isLoggedIn()) {
      const scorePercent = total > 0 ? Math.round((score / total) * 100) : 0;
      void academyApi
        .recordQuiz(chapterId, { scorePercent, passed })
        .then((r) => {
          if (r && !r.error) void hydrateFromServer();
        })
        .catch(() => {});
    }
    return attempt;
  }

  /** Clear ALL saved Academy progress (and the expert bypass). */
  function resetAll(): void {
    progress.value = {};
    setExpertBypass(false);
    persist();
  }

  // --- derived helpers (unlock gating + progress bars) ---

  /** Passed-quiz counts per level. */
  const passedByLevel = computed(() => {
    const out: Record<Level, { passed: number; total: number }> = {
      BASIC: { passed: 0, total: 0 },
      ADVANCED: { passed: 0, total: 0 },
      EXPERT: { passed: 0, total: 0 },
    };
    for (const ch of CHAPTER_INDEX) {
      out[ch.level].total += 1;
      if (chapterProgress(ch.id).quizPassed) out[ch.level].passed += 1;
    }
    return out;
  });

  /** Every chapter quiz in a level has been passed. */
  function isLevelComplete(level: Level): boolean {
    const s = passedByLevel.value[level];
    return s.total > 0 && s.passed === s.total;
  }

  /**
   * Unlock gating: BASIC is always open; ADVANCED unlocks once every BASIC quiz
   * is passed; EXPERT unlocks once every ADVANCED quiz is passed.
   */
  function isLevelUnlocked(level: Level): boolean {
    if (expertBypass.value) return true; // "Skip to Advanced" expert bypass
    if (level === "BASIC") return true;
    if (level === "ADVANCED") return isLevelComplete("BASIC");
    return isLevelComplete("ADVANCED");
  }

  function isChapterUnlocked(chapter: Chapter): boolean {
    return isLevelUnlocked(chapter.level);
  }

  /** Viewed-vs-total lesson counts for a level's progress bar. */
  function levelLessonStats(level: Level): { viewed: number; total: number } {
    let viewed = 0;
    let total = 0;
    for (const ch of CHAPTER_INDEX) {
      if (ch.level !== level) continue;
      total += ch.lessonCount;
      viewed += chapterProgress(ch.id).viewedLessons.filter(
        (i) => i >= 0 && i < ch.lessonCount,
      ).length;
    }
    return { viewed, total };
  }

  /** Viewed-vs-total lessons for a single chapter. */
  function chapterLessonsViewed(chapter: Chapter): number {
    return chapterProgress(chapter.id).viewedLessons.filter(
      (i) => i >= 0 && i < chapter.lessons.length,
    ).length;
  }

  /**
   * Card state for a chapter (Feature 1E), derived from the SERVER view when
   * hydrated (per-lesson percents + quiz aggregate), falling back to the local
   * viewed-lessons map otherwise. States:
   *   completed  — chapter quiz passed, or every lesson Completed
   *   inProgress — any reading/quiz activity but not completed
   *   percent    — average per-lesson progress (completed lesson = 100)
   *   certified  — quiz passed (drives the certificate icon)
   */
  function chapterCardState(chapter: Chapter): {
    state: "not-started" | "in-progress" | "completed";
    percent: number;
    certified: boolean;
  } {
    const local = chapterProgress(chapter.id);
    const quizAgg = serverProgress.value[chapter.id];
    const certified = local.quizPassed || quizAgg?.quizPassed === true;

    let sum = 0;
    let completedLessons = 0;
    let touched = certified;
    chapter.lessons.forEach((l, i) => {
      const item = serverProgress.value[l.id];
      const viewedLocally = local.viewedLessons.includes(i);
      const pct = item
        ? item.status === "Completed"
          ? 100
          : item.progressPercent
        : viewedLocally
          ? 100 // pre-sync local data only knows "viewed" — count it as read
          : 0;
      if (pct > 0 || item?.status === "InProgress") touched = true;
      if (item?.status === "Completed" || (!item && viewedLocally)) completedLessons += 1;
      sum += pct;
    });
    const percent = chapter.lessons.length ? Math.round(sum / chapter.lessons.length) : 0;
    const completed = certified || (chapter.lessons.length > 0 && completedLessons === chapter.lessons.length);
    return {
      state: completed ? "completed" : touched ? "in-progress" : "not-started",
      percent: completed ? 100 : percent,
      certified,
    };
  }

  /** Overall completed-chapters count (quiz passed), for a global summary. */
  const totalPassed = computed(
    () => CHAPTER_INDEX.filter((c) => chapterProgress(c.id).quizPassed).length,
  );

  /**
   * Dashboard metrics (Feature 1H), lesson-granular: completed = server row
   * Completed (or locally viewed pre-sync), inProgress = touched but not
   * completed. Certificates = passed chapter quizzes (totalPassed).
   */
  const dashboardStats = computed(() => {
    let lessonsCompleted = 0;
    let lessonsInProgress = 0;
    let lessonsTotal = 0;
    for (const meta of CHAPTER_INDEX) {
      const ch = getChapterById("en", meta.id);
      if (!ch) continue;
      const local = chapterProgress(meta.id);
      ch.lessons.forEach((l, i) => {
        lessonsTotal += 1;
        const item = serverProgress.value[l.id];
        const done = item ? item.status === "Completed" : local.viewedLessons.includes(i);
        if (done) lessonsCompleted += 1;
        else if (item && (item.status === "InProgress" || item.progressPercent > 0)) lessonsInProgress += 1;
      });
    }
    return { lessonsCompleted, lessonsInProgress, lessonsTotal, certificates: totalPassed.value };
  });

  /**
   * True once the user has opened at least one lesson in any chapter. Lets a
   * sidebar show a "New" badge on the Academy entry while this is still false.
   */
  const hasStartedAnyLesson = computed(() =>
    Object.values(progress.value).some((ch) => ch.viewedLessons.length > 0),
  );

  return {
    progress,
    levels: LEVELS,
    expertBypass,
    setExpertBypass,
    chapterProgress,
    markLessonViewed,
    recordQuizAttempt,
    resetAll,
    passedByLevel,
    isLevelComplete,
    isLevelUnlocked,
    isChapterUnlocked,
    levelLessonStats,
    chapterLessonsViewed,
    chapterCardState,
    totalPassed,
    dashboardStats,
    hasStartedAnyLesson,
    serverProgress,
    serverLoaded,
    hydrateFromServer,
    updateLessonScroll,
  };
});
