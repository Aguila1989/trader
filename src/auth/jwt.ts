/**
 * Minimal, dependency-free JWT (HS256) for session tokens.
 *
 * The repo deliberately hand-rolls its small security primitives (the
 * constant-time DASHBOARD_TOKEN compare, the SSE tickets, the CSRF origin check)
 * and keeps the dependency surface tiny. A JWT is just `base64url(header) .
 * base64url(payload) . base64url(HMAC-SHA256(...))` - the only "crypto" is
 * Node's vetted crypto.createHmac, so this is structure, not home-grown crypto.
 *
 * Hardening baked in against the classic JWT pitfalls:
 *  - Algorithm is PINNED to HS256. The token's own `alg` header is verified to
 *    equal "HS256"; `alg:"none"` and an asymmetric-confusion `alg:"RS256"` are
 *    rejected outright (we never branch on the attacker-supplied alg).
 *  - The signature is compared with crypto.timingSafeEqual (no early-out leak).
 *  - `exp` is REQUIRED and enforced; `iat`/`nbf` are enforced with a small skew.
 *  - Parsing is total: any malformed segment returns null, never throws.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Registered + custom claims this app issues. Times are UNIX SECONDS. */
export interface JwtClaims {
  /** Subject = the user id (Feature 1 dbo.Users.id). */
  sub: string;
  /** The account email, carried for convenience (never authoritative on its own). */
  email: string;
  /** Session id (dbo.AuthSessions.id) for server-side revocation/logout. */
  jti: string;
  /** Issued-at (seconds since epoch). */
  iat: number;
  /** Expires-at (seconds since epoch). */
  exp: number;
}

const HEADER = { alg: "HS256", typ: "JWT" } as const;
/** Tolerated clock skew (seconds) when checking iat/nbf. */
const CLOCK_SKEW_SEC = 60;

function b64urlEncode(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function b64urlDecodeToString(seg: string): string {
  return Buffer.from(seg, "base64url").toString("utf8");
}

function sign(signingInput: string, secret: string): string {
  return createHmac("sha256", secret).update(signingInput).digest("base64url");
}

/**
 * Mint a signed HS256 token. `nowSec`/`ttlSec` are explicit so callers (and
 * tests) control time precisely; iat = nowSec, exp = nowSec + ttlSec.
 */
export function signJwt(
  claims: Omit<JwtClaims, "iat" | "exp">,
  secret: string,
  opts: { nowSec: number; ttlSec: number },
): string {
  if (!secret) throw new Error("JWT secret is required to sign a token.");
  // Defend against a misconfigured lifetime producing an already-expired token
  // (ttl <= 0) or a practically-immortal one. Bounded to <= ~1 year.
  if (!Number.isFinite(opts.ttlSec) || opts.ttlSec <= 0 || opts.ttlSec > 366 * 86_400) {
    throw new Error("JWT ttlSec must be a positive number no greater than 366 days.");
  }
  const full: JwtClaims = {
    ...claims,
    iat: opts.nowSec,
    exp: opts.nowSec + opts.ttlSec,
  };
  const headerSeg = b64urlEncode(JSON.stringify(HEADER));
  const payloadSeg = b64urlEncode(JSON.stringify(full));
  const signingInput = `${headerSeg}.${payloadSeg}`;
  const sig = sign(signingInput, secret);
  return `${signingInput}.${sig}`;
}

/** Constant-time string compare on equal-or-unequal length inputs. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export type JwtVerifyResult =
  | { ok: true; claims: JwtClaims }
  | { ok: false; reason: "malformed" | "bad-alg" | "bad-signature" | "expired" | "not-yet-valid" | "bad-claims" };

/**
 * Verify a token against `secret` at time `nowSec`. Returns the decoded claims
 * only when the signature, algorithm, and time window all check out. Never
 * throws.
 */
export function verifyJwt(token: string, secret: string, nowSec: number): JwtVerifyResult {
  if (!token || typeof token !== "string") return { ok: false, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed" };
  const [headerSeg, payloadSeg, sigSeg] = parts as [string, string, string];

  // 1) Verify the signature FIRST so we never act on unauthenticated bytes.
  const expectedSig = sign(`${headerSeg}.${payloadSeg}`, secret);
  if (!safeEqual(sigSeg, expectedSig)) return { ok: false, reason: "bad-signature" };

  // 2) Algorithm pinning: only HS256. Reject "none"/asymmetric confusion.
  let header: unknown;
  try {
    header = JSON.parse(b64urlDecodeToString(headerSeg));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof header !== "object" ||
    header === null ||
    (header as { alg?: unknown }).alg !== "HS256"
  ) {
    return { ok: false, reason: "bad-alg" };
  }

  // 3) Decode + validate claims.
  let payload: unknown;
  try {
    payload = JSON.parse(b64urlDecodeToString(payloadSeg));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof payload !== "object" || payload === null) return { ok: false, reason: "bad-claims" };
  const c = payload as Record<string, unknown>;
  if (
    typeof c.sub !== "string" ||
    typeof c.email !== "string" ||
    typeof c.jti !== "string" ||
    typeof c.iat !== "number" ||
    typeof c.exp !== "number"
  ) {
    return { ok: false, reason: "bad-claims" };
  }

  // 4) Time window (exp is mandatory; small skew tolerated on iat/nbf).
  if (nowSec >= c.exp) return { ok: false, reason: "expired" };
  if (c.iat - CLOCK_SKEW_SEC > nowSec) return { ok: false, reason: "not-yet-valid" };
  const nbf = typeof c.nbf === "number" ? c.nbf : undefined;
  if (nbf !== undefined && nbf - CLOCK_SKEW_SEC > nowSec) return { ok: false, reason: "not-yet-valid" };

  return {
    ok: true,
    claims: { sub: c.sub, email: c.email, jti: c.jti, iat: c.iat, exp: c.exp },
  };
}
