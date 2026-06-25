// Academy progress store — a SEPARATE Pinia store ("academy"), independent of
// the trading store. Persists to localStorage (same defensive try/catch pattern
// the trader store uses for its tab key) so progress survives across sessions
// and never touches any trading state.
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { CHAPTER_INDEX } from "./content";
import { LEVELS, PASS_RATIO } from "./types";
import type {
  Chapter,
  ChapterProgress,
  Level,
  ProgressMap,
  QuizAttempt,
} from "./types";

const STORAGE_KEY = "academy_progress_v1";

function emptyChapter(): ChapterProgress {
  return { viewedLessons: [], quizPassed: false, attempts: [] };
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

  /** Record that a lesson was opened (idempotent). */
  function markLessonViewed(chapterId: string, lessonIndex: number): void {
    const cp = ensure(chapterId);
    if (!cp.viewedLessons.includes(lessonIndex)) {
      cp.viewedLessons.push(lessonIndex);
      cp.viewedLessons.sort((a, b) => a - b);
      persist();
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
    return attempt;
  }

  /** Clear ALL saved Academy progress. */
  function resetAll(): void {
    progress.value = {};
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

  /** Overall completed-chapters count (quiz passed), for a global summary. */
  const totalPassed = computed(
    () => CHAPTER_INDEX.filter((c) => chapterProgress(c.id).quizPassed).length,
  );

  return {
    progress,
    levels: LEVELS,
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
    totalPassed,
  };
});
