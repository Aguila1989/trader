// Academy (Learning Centre) data model — fully standalone. These types are NOT
// shared with the trading types in ../types.ts; the Academy never imports any
// trading logic, AI service, or Stellar SDK. All lesson/quiz content is static
// data authored in ./content/*; all progress lives in ./progress.ts (localStorage).

/** Supported content languages. English is the source + fallback. */
export type Locale = "en" | "nl" | "fr" | "es";

/** Locales with their native display labels (drives the language switcher). */
export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
];

/** Difficulty band. Drives grouping, level badges, and unlock gating. */
export type Level = "BASIC" | "ADVANCED" | "EXPERT";

/** Ordered list of levels, basic → expert. Single source of truth for grouping. */
export const LEVELS: Level[] = ["BASIC", "ADVANCED", "EXPERT"];

/** A score of correct/total at or above this ratio passes a chapter quiz. */
export const PASS_RATIO = 0.7;

/** One multiple-choice option with the feedback shown after it's chosen. */
export interface QuizOption {
  text: string;
  /** Why this option is correct or incorrect — surfaced as per-answer feedback. */
  explanation: string;
}

/** One multiple-choice question. `correctIndex` is an index into `options`. */
export interface QuizQuestion {
  id: string;
  prompt: string;
  /** 3–4 options. Exactly one is correct (`correctIndex`). */
  options: QuizOption[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
}

/** One lesson: plain-language prose plus a single concrete worked example. */
export interface Lesson {
  id: string;
  title: string;
  /** 2–4 paragraphs of plain-language explanation. */
  paragraphs: string[];
  /** One concrete example, rendered in a highlighted callout. */
  example: string;
}

/** A chapter: a set of lessons followed by a quiz, within one level band. */
export interface Chapter {
  /** Stable id, e.g. "c1". Used as the progress key — never reuse across chapters. */
  id: string;
  /** 1-based display order across the whole curriculum. */
  number: number;
  level: Level;
  title: string;
  /** 1–2 line summary shown on the chapter card. */
  description: string;
  lessons: Lesson[];
  quiz: QuizQuestion[];
}

// --- progress (persisted to localStorage by ./progress.ts) ------------------

/** One recorded quiz attempt. */
export interface QuizAttempt {
  /** Number of questions answered correctly. */
  score: number;
  /** Total number of questions in the attempt. */
  total: number;
  /** score / total >= PASS_RATIO. */
  passed: boolean;
  /** ISO timestamp of when the attempt finished. */
  at: string;
}

/** Saved progress for a single chapter. */
export interface ChapterProgress {
  /** Unique 0-based lesson indexes the user has opened. */
  viewedLessons: number[];
  /** True once any attempt passed (sticky — a later fail never un-passes). */
  quizPassed: boolean;
  /** Every attempt, newest last. */
  attempts: QuizAttempt[];
}

/** All saved progress, keyed by chapter id. */
export type ProgressMap = Record<string, ChapterProgress>;
