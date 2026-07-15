/**
 * The free-preview lesson: the ONE lesson an anonymous visitor may read
 * (chapter 1, lesson 1 — the real first lesson of the curriculum). Everything
 * else in the Academy is account-gated (2026-07 Feature 1).
 *
 * Mirrors src/academy/constants.ts on the backend, where the matching progress
 * PATCH path is the only public /api/academy route.
 */
export const PREVIEW_CHAPTER_ID = "c1";
export const PREVIEW_LESSON_ID = "c1-l1";

/** Is this (chapterId, lessonId) pair the free preview lesson? */
export function isPreviewLesson(chapterId: unknown, lessonId: unknown): boolean {
  return chapterId === PREVIEW_CHAPTER_ID && lessonId === PREVIEW_LESSON_ID;
}
