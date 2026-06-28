/**
 * Tiny cookie helpers - parse the incoming `Cookie` header and build hardened
 * `Set-Cookie` strings. Kept dependency-free (no cookie-parser): Express 5 has
 * no built-in request cookie parsing, and we want full control over the flags
 * for the security-sensitive session cookies anyway.
 *
 * Two cookies make up a session (see src/auth/service.ts):
 *   - JWT_COOKIE      httpOnly  -> the actual credential; JS can NEVER read it.
 *   - SESSION_COOKIE  readable  -> a NON-sensitive marker {email,name,exp} the
 *                                  SPA reads to know it is logged in without an
 *                                  API call. It carries no signature/authority;
 *                                  the server ignores it entirely for auth.
 */

/** httpOnly cookie holding the signed JWT - the credential. */
export const JWT_COOKIE = "trader_jwt";
/** Non-httpOnly companion the SPA reads for login-state + display name. */
export const SESSION_COOKIE = "trader_session";

export interface CookieOptions {
  maxAgeSec: number;
  httpOnly: boolean;
  secure: boolean;
  /** Strict is correct for a same-origin SPA and is our CSRF defence-in-depth. */
  sameSite: "Strict" | "Lax" | "None";
  path: string;
}

/** Parse a raw `Cookie` header into a name->value map. Total (never throws). */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (!name) continue;
    const rawVal = part.slice(eq + 1).trim();
    try {
      out[name] = decodeURIComponent(rawVal);
    } catch {
      out[name] = rawVal;
    }
  }
  return out;
}

/** Serialize one `Set-Cookie` value with the given hardened attributes. */
export function serializeCookie(name: string, value: string, opts: CookieOptions): string {
  const segs = [`${name}=${encodeURIComponent(value)}`];
  segs.push(`Path=${opts.path}`);
  segs.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAgeSec))}`);
  segs.push(`SameSite=${opts.sameSite}`);
  if (opts.httpOnly) segs.push("HttpOnly");
  if (opts.secure) segs.push("Secure");
  return segs.join("; ");
}

/** Serialize an expiry cookie (Max-Age=0) that clears `name` on the client. */
export function clearCookie(name: string, opts: Pick<CookieOptions, "secure" | "sameSite" | "path" | "httpOnly">): string {
  return serializeCookie(name, "", { ...opts, maxAgeSec: 0 });
}
