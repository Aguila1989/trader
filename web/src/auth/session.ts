// Client-side session state.
//
// The real credential is the httpOnly `trader_jwt` cookie, which JS cannot read
// (by design - an XSS payload can't steal it). Alongside it the server sets a
// NON-httpOnly `trader_session` marker carrying only {email, displayName, exp} -
// no signature, no authority. The SPA reads THAT to know whether it is logged in
// and who the user is, WITHOUT an authenticated API call (as the spec requires).
// The marker is advisory only: every protected API call is still validated
// server-side against the signed JWT + the session record.
import { reactive } from "vue";
import { authApi, type AuthApiResult } from "../api";

const SESSION_COOKIE = "trader_session";

interface Marker {
  email: string;
  displayName: string | null;
  exp: number; // unix seconds
}

function readRawCookie(name: string): string | null {
  try {
    for (const part of document.cookie.split(";")) {
      const eq = part.indexOf("=");
      if (eq < 0) continue;
      if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
    }
  } catch {
    /* no document */
  }
  return null;
}

function decodeMarker(): Marker | null {
  const raw = readRawCookie(SESSION_COOKIE);
  if (!raw) return null;
  try {
    // base64url -> base64 -> JSON
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(raw.length / 4) * 4, "=");
    const json = atob(b64);
    const m = JSON.parse(json) as Marker;
    if (typeof m.exp !== "number" || typeof m.email !== "string") return null;
    return m;
  } catch {
    return null;
  }
}

/**
 * Login state from the marker cookie ALONE (no network). Used by the router
 * guard and the Academy back-button. A present-but-expired marker counts as
 * logged out.
 */
export function isLoggedIn(): boolean {
  const m = decodeMarker();
  return !!m && m.exp * 1000 > Date.now();
}

/** Reactive copy of the current user for the UI (email + display name). */
export const session = reactive<{ user: { email: string; displayName: string | null } | null }>({
  user: null,
});

/** Re-read the marker cookie into the reactive `session` (after login/logout). */
export function refreshSession(): void {
  const m = decodeMarker();
  session.user = m && m.exp * 1000 > Date.now() ? { email: m.email, displayName: m.displayName } : null;
}

// Initialise from whatever cookie is present at load (survives a page refresh).
refreshSession();

export async function login(email: string, password: string, rememberMe: boolean): Promise<AuthApiResult> {
  const r = await authApi.login(email, password, rememberMe);
  if (r.ok) refreshSession();
  return r;
}

export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } finally {
    // Reflect logout locally regardless of the server result. The server clears
    // the httpOnly JWT cookie on success; we ALSO drop the readable session
    // marker here so logout works even if the backend is unreachable (offline) —
    // isLoggedIn() reads only the marker, so this alone logs the SPA out. The
    // JWT is still enforced server-side on every API call.
    try {
      document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      /* no document */
    }
    session.user = null;
    refreshSession();
  }
}

export const register = authApi.register;
export const forgotPassword = authApi.forgotPassword;
export const resetPassword = authApi.resetPassword;
export const verifyEmail = authApi.verifyEmail;
