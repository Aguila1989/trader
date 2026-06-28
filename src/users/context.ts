/**
 * Ambient "current user" context.
 *
 * This is the single seam through which the data-access layer (src/db/repo.ts)
 * learns WHOSE rows it is reading or writing. It deliberately mirrors how the
 * rest of the app already treats `config.network`: an ambient value the queries
 * read at call time, rather than a parameter threaded through every call site.
 * That kept this foundation change surgical - no repo caller signatures changed.
 *
 * RIGHT NOW the app is still single-user: there is no login, so this always
 * resolves to the bootstrapped DEFAULT user (see ensureDefaultUser in
 * src/db/pool.ts). Every existing row is migrated to that user, and every new
 * row is attributed to it, so the whole database is correctly partitioned by
 * userId before any per-user feature is built on top.
 *
 * AUTHENTICATION (Feature 2) is now wired in: the auth middleware resolves the
 * logged-in user per request and runs the rest of the request inside
 * runWithUserId(), backed by AsyncLocalStorage so concurrent requests from
 * different users never read each other's rows (a plain module global would race
 * across awaits). The public surface - currentUserId() - is unchanged, so no
 * repo caller was touched. setCurrentUserId/resetCurrentUserId still set the
 * process-wide FALLBACK used outside any request scope (background loops,
 * scripts, and tests); a request-scoped value from runWithUserId() always wins.
 */
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Stable id of the default account. A fixed sentinel (not random) so the
 * idempotent boot migration always targets the SAME row across restarts and is
 * identical on every deployment. Fits the existing NVARCHAR(64) id columns.
 */
export const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001";

/** Login identifier of the default account (unique, used as the email key). */
export const DEFAULT_USER_EMAIL = "default@local";

/** Display name shown for the default account. */
export const DEFAULT_USER_DISPLAY_NAME = "Default Account";

/**
 * Process-wide fallback user, used only OUTSIDE an active request scope (the
 * autopilot/monitor loops, CLI scripts, and tests). Inside a request the
 * AsyncLocalStorage value set by runWithUserId() takes precedence.
 */
let fallbackUserId: string = DEFAULT_USER_ID;

/** Request-scoped user id (set per request by the auth middleware). */
const userIdStore = new AsyncLocalStorage<string>();

/**
 * The id of the user whose data the current operation belongs to. The data
 * layer scopes every read/write to this id. Resolves to the request-scoped user
 * when inside runWithUserId(), otherwise the process-wide fallback.
 */
export function currentUserId(): string {
  return userIdStore.getStore() ?? fallbackUserId;
}

/**
 * Run `fn` (and everything it awaits) with `id` as the current user. The auth
 * middleware wraps each authenticated request in this so concurrent users stay
 * isolated. Nesting is supported; the innermost scope wins.
 */
export function runWithUserId<T>(id: string, fn: () => T): T {
  return userIdStore.run(id, fn);
}

/**
 * Override the PROCESS-WIDE FALLBACK user (used outside any request scope, and
 * by tests). Does not affect requests already running inside runWithUserId().
 */
export function setCurrentUserId(id: string): void {
  fallbackUserId = id;
}

/** Restore the process-wide fallback user to the default account. */
export function resetCurrentUserId(): void {
  fallbackUserId = DEFAULT_USER_ID;
}
