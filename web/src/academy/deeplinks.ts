// Feature 5 — Academy deeplinks. Single source of truth mapping app concepts to
// the existing Academy lesson that teaches them, plus the stable URL builder.
// Lesson ids (cN-lM) and chapter ids (cN) are the permanent keys already defined
// in the static content (academy/content/*); we only reference them here.
import type { WarningTrigger } from "../types";

/** Stable deeplink path to one lesson. Hash-routed by the app router, i.e.
 *  this resolves to `#/academy/chapter/{chapterId}/lesson/{lessonId}`. */
export function lessonPath(chapterId: string, lessonId: string): string {
  return `/academy/chapter/${chapterId}/lesson/${lessonId}`;
}

/**
 * Concept -> [chapterId, lessonId] of the existing lesson that best teaches it.
 * NOTE: the Academy has no BASIC stop-loss / trailing-stop lesson, so those link
 * to the real (ADVANCED) lessons that actually cover the concept — linking to
 * the right content matters more than the difficulty band.
 */
export const LESSON_IDS = {
  stopLoss: ["c5", "c5-l1"],
  trailingStop: ["c6", "c6-l1"],
  targetPrice: ["c7", "c7-l1"],
  invalidationPrice: ["c7", "c7-l2"],
  slippage: ["c2", "c2-l4"],
  tradingCap: ["c9", "c9-l3"],
  spread: ["c2", "c2-l3"],
  liquidity: ["c2", "c2-l5"],
  riskFactors: ["c11", "c11-l1"],
  portfolioValue: ["c4", "c4-l6"],
  receiveFunds: ["c17", "c17-l6"],
  whatIsTrustline: ["c19", "c19-l1"],
  trustlineRisk: ["c19", "c19-l3"],
  toml: ["c20", "c20-l2"],
  tokenEvaluation: ["c21", "c21-l1"],
  readingSuggestions: ["c20", "c20-l1"],
  deteriorationWarning: ["c20", "c20-l3"],
} as const satisfies Record<string, readonly [string, string]>;

export type LessonKey = keyof typeof LESSON_IDS;

/** Concept -> ready-to-use deeplink path (e.g. LESSONS.spread). */
export const LESSONS = Object.fromEntries(
  Object.entries(LESSON_IDS).map(([k, [c, l]]) => [k, lessonPath(c, l)]),
) as Record<LessonKey, string>;

/**
 * The most relevant lesson for a deterioration warning, chosen by the highest-
 * priority trigger present (spec §4). Triggers the spec does not name
 * (liquidity_low / trustline_count_drop / trend_down) fall back to the
 * "interpret a deterioration warning" lesson.
 */
export function warningLessonPath(triggers: WarningTrigger[]): string {
  const order: ReadonlyArray<[WarningTrigger, LessonKey]> = [
    ["toml_lost", "toml"],
    ["new_red_flags", "trustlineRisk"],
    ["score_drop", "tokenEvaluation"],
    ["volume_drop", "deteriorationWarning"],
  ];
  for (const [trig, key] of order) {
    if (triggers.includes(trig)) return LESSONS[key];
  }
  return LESSONS.deteriorationWarning;
}
