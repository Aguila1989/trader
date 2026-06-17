/**
 * Origin allow-listing for the CSRF guard, factored out of server.ts so the
 * decision is unit-testable in isolation (importing server.ts boots the whole
 * app + DB). server.ts wires this into an Express middleware.
 *
 * Threat model: stop a malicious WEBSITE from driving state-changing /api calls
 * through the user's browser. A browser always sends Origin on a cross-origin
 * POST and cannot forge it, so a page on evil.com (Origin https://evil.com) is
 * rejected. A LOOPBACK origin (localhost / 127.0.0.1 / [::1]) can only be
 * produced by a page served from the user's OWN machine, so it is not a
 * remote-CSRF vector - we trust it WHEN the server itself is bound to a loopback
 * interface (the default, and the entire dev setup: the Vite dev server on
 * :5175 proxies here). When the server is bound to a public interface (0.0.0.0,
 * i.e. deliberately exposed behind a proxy) loopback is NOT blanket-trusted and
 * we fall back to same-origin + X-Forwarded-Host + DASHBOARD_TRUSTED_ORIGINS.
 *
 * NOTE: this used to key off "is a build present" (!webBuilt), so a leftover
 * web/dist from one `npm run build` silently 403'd every POST from the dev
 * server. Binding posture is the correct, intentional signal instead - a stray
 * build artifact has nothing to do with whether loopback origins are safe.
 */

export interface OriginCheckRequest {
  method: string;
  path: string;
  /** Browser Origin header (absent for non-browser clients). */
  origin?: string | undefined;
  /** Host the request reached (Express req.headers.host). */
  host?: string | undefined;
  /** X-Forwarded-Host from a trusted reverse proxy, if any. */
  xForwardedHost?: string | undefined;
}

export interface OriginPolicy {
  /** Backend port, for the same-origin defaults. */
  port: number;
  /** Extra allowed origin hosts (DASHBOARD_TRUSTED_ORIGINS). */
  trustedOrigins: string[];
  /** True when the HTTP server binds to a loopback interface (not 0.0.0.0). */
  trustLoopback: boolean;
}

export type OriginVerdict = "allow" | "bad-origin" | "cross-origin";

const LOOPBACK_ORIGIN = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/** Pure CSRF origin decision. See the module comment for the threat model. */
export function checkOrigin(
  req: OriginCheckRequest,
  policy: OriginPolicy,
): OriginVerdict {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return "allow"; // read-only verbs can't change state
  }
  if (!req.path.startsWith("/api")) return "allow";
  if (!req.origin) return "allow"; // no browser Origin = not a CSRF vector

  let originHost: string;
  try {
    originHost = new URL(req.origin).host;
  } catch {
    return "bad-origin";
  }

  const allowed = new Set<string>([
    `127.0.0.1:${policy.port}`,
    `localhost:${policy.port}`,
  ]);
  if (req.host) allowed.add(req.host);
  // A browser CSRF cannot set X-Forwarded-Host (a non-simple header forces a
  // preflight that a cross-origin request fails), so honoring it is safe.
  if (req.xForwardedHost) {
    for (const h of req.xForwardedHost.split(",")) allowed.add(h.trim());
  }
  for (const h of policy.trustedOrigins) allowed.add(h);

  const loopbackOrigin = LOOPBACK_ORIGIN.test(originHost);
  if ((policy.trustLoopback && loopbackOrigin) || allowed.has(originHost)) {
    return "allow";
  }
  return "cross-origin";
}

/** Does BIND_HOST keep the server reachable only from the local machine? */
export function isLoopbackBind(bindHost: string): boolean {
  return /^(127\.0\.0\.1|localhost|::1)$/i.test(bindHost.trim());
}
