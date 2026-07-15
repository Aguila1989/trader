/**
 * Academy constants shared between the auth gate (src/auth/middleware.ts) and
 * the academy feature modules. Kept dependency-free so middleware can import
 * the preview path without pulling in the store/db layer.
 *
 * PREVIEW_LESSON_SLUG is the ONE lesson an anonymous visitor may read on the
 * public /academy landing page (the real first lesson, chapter 1 lesson 1).
 * Its PATCH path is the only academy endpoint in PUBLIC_API_PATHS; the handler
 * still resolves an OPTIONAL session so a logged-in user's preview reading is
 * tracked, while a true anonymous call is silently ignored (never written to
 * any user, never to the operator's DEFAULT_USER_ID).
 */
export const PREVIEW_LESSON_SLUG = "c1-l1";

/** Exact lowercase path listed in PUBLIC_API_PATHS (allowlist is exact-match). */
export const PREVIEW_PROGRESS_PUBLIC_PATH = `/api/academy/progress/${PREVIEW_LESSON_SLUG}`;
