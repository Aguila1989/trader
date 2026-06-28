import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { signJwt, verifyJwt } from "./jwt";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NOW = 1_700_000_000;

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

describe("auth/jwt", () => {
  it("signs and verifies a round-trip token", () => {
    const tok = signJwt({ sub: "u1", email: "a@b.com", jti: "j1" }, SECRET, { nowSec: NOW, ttlSec: 3600 });
    const r = verifyJwt(tok, SECRET, NOW + 10);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.claims.sub).toBe("u1");
      expect(r.claims.email).toBe("a@b.com");
      expect(r.claims.jti).toBe("j1");
      expect(r.claims.exp).toBe(NOW + 3600);
      expect(r.claims.iat).toBe(NOW);
    }
  });

  it("rejects a tampered payload (bad signature)", () => {
    const tok = signJwt({ sub: "u1", email: "a@b.com", jti: "j1" }, SECRET, { nowSec: NOW, ttlSec: 3600 });
    const [h, , s] = tok.split(".");
    const forged = `${h}.${b64url({ sub: "admin", email: "a@b.com", jti: "j1", iat: NOW, exp: NOW + 3600 })}.${s}`;
    expect(verifyJwt(forged, SECRET, NOW).ok).toBe(false);
    expect(verifyJwt(forged, SECRET, NOW)).toMatchObject({ reason: "bad-signature" });
  });

  it("rejects a token signed with a different secret", () => {
    const tok = signJwt({ sub: "u1", email: "a@b.com", jti: "j1" }, "other-secret", { nowSec: NOW, ttlSec: 3600 });
    expect(verifyJwt(tok, SECRET, NOW)).toMatchObject({ reason: "bad-signature" });
  });

  it("rejects an expired token", () => {
    const tok = signJwt({ sub: "u1", email: "a@b.com", jti: "j1" }, SECRET, { nowSec: NOW, ttlSec: 100 });
    expect(verifyJwt(tok, SECRET, NOW + 101)).toMatchObject({ reason: "expired" });
  });

  it("pins the algorithm to HS256 even when the signature is valid (alg confusion / none)", () => {
    // Build a token whose signature is VALID for a NON-HS256 header. The signature
    // checks out, so a naive verifier that trusts header.alg would accept it; ours
    // must still reject on the pinned-alg check.
    const header = b64url({ alg: "HS512", typ: "JWT" });
    const payload = b64url({ sub: "u1", email: "a@b.com", jti: "j1", iat: NOW, exp: NOW + 3600 });
    const sig = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
    expect(verifyJwt(`${header}.${payload}.${sig}`, SECRET, NOW)).toMatchObject({ reason: "bad-alg" });

    // alg:"none" with an empty signature must also fail (here as bad-signature).
    const noneHeader = b64url({ alg: "none", typ: "JWT" });
    expect(verifyJwt(`${noneHeader}.${payload}.`, SECRET, NOW).ok).toBe(false);
  });

  it("rejects malformed tokens without throwing", () => {
    expect(verifyJwt("", SECRET, NOW)).toMatchObject({ reason: "malformed" });
    expect(verifyJwt("a.b", SECRET, NOW)).toMatchObject({ reason: "malformed" });
    expect(verifyJwt("only-one-part", SECRET, NOW)).toMatchObject({ reason: "malformed" });
  });

  it("rejects a validly-signed token whose claims are incomplete", () => {
    const header = b64url({ alg: "HS256", typ: "JWT" });
    const payload = b64url({ email: "a@b.com", iat: NOW, exp: NOW + 3600 }); // no sub/jti
    const sig = createHmac("sha256", SECRET).update(`${header}.${payload}`).digest("base64url");
    expect(verifyJwt(`${header}.${payload}.${sig}`, SECRET, NOW)).toMatchObject({ reason: "bad-claims" });
  });
});
