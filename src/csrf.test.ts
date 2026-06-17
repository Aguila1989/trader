import { describe, it, expect } from "vitest";
import { checkOrigin, isLoopbackBind, type OriginPolicy } from "./csrf";

// Server bound to loopback (the default + dev): loopback origins are trusted.
const loopback: OriginPolicy = { port: 3000, trustedOrigins: [], trustLoopback: true };
// Server deliberately exposed on 0.0.0.0: loopback is NOT blanket-trusted.
const exposed: OriginPolicy = { port: 3000, trustedOrigins: [], trustLoopback: false };

describe("checkOrigin - exemptions", () => {
  it("allows read-only verbs regardless of origin", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      expect(
        checkOrigin({ method, path: "/api/state", origin: "https://evil.com" }, exposed),
      ).toBe("allow");
    }
  });

  it("allows non-/api paths", () => {
    expect(
      checkOrigin({ method: "POST", path: "/health", origin: "https://evil.com" }, exposed),
    ).toBe("allow");
  });

  it("allows requests with no Origin (non-browser clients can't be CSRF'd)", () => {
    expect(checkOrigin({ method: "POST", path: "/api/kill" }, exposed)).toBe("allow");
  });

  it("rejects an unparseable Origin", () => {
    expect(
      checkOrigin({ method: "POST", path: "/api/kill", origin: "not a url" }, loopback),
    ).toBe("bad-origin");
  });
});

describe("checkOrigin - same-origin and reverse proxy", () => {
  it("allows same-origin POSTs (Origin host == backend host)", () => {
    expect(
      checkOrigin({ method: "POST", path: "/api/live-trading", origin: "http://localhost:3000" }, exposed),
    ).toBe("allow");
    expect(
      checkOrigin({ method: "POST", path: "/api/live-trading", origin: "http://127.0.0.1:3000" }, exposed),
    ).toBe("allow");
  });

  it("honors X-Forwarded-Host from a reverse proxy", () => {
    expect(
      checkOrigin(
        {
          method: "POST",
          path: "/api/scan",
          origin: "https://trader.example.com",
          xForwardedHost: "trader.example.com",
        },
        exposed,
      ),
    ).toBe("allow");
  });

  it("honors an explicit DASHBOARD_TRUSTED_ORIGINS entry even when exposed", () => {
    const policy: OriginPolicy = { port: 3000, trustedOrigins: ["dash.example.com"], trustLoopback: false };
    expect(
      checkOrigin({ method: "POST", path: "/api/scan", origin: "https://dash.example.com" }, policy),
    ).toBe("allow");
  });
});

describe("checkOrigin - the dev-server fix (loopback origins)", () => {
  it("allows the Vite dev origin :5175 when the server is bound to loopback", () => {
    // The regression this fixes: a leftover web/dist used to flip the server
    // into 'production' mode and 403 every POST from the dev server.
    expect(
      checkOrigin({ method: "POST", path: "/api/paper-trading", origin: "http://localhost:5175" }, loopback),
    ).toBe("allow");
    expect(
      checkOrigin({ method: "POST", path: "/api/live-trading", origin: "http://127.0.0.1:5175" }, loopback),
    ).toBe("allow");
  });

  it("does NOT blanket-trust loopback when the server is exposed on 0.0.0.0", () => {
    expect(
      checkOrigin({ method: "POST", path: "/api/paper-trading", origin: "http://localhost:5175" }, exposed),
    ).toBe("cross-origin");
  });

  it("rejects a remote site's origin in either posture", () => {
    expect(
      checkOrigin({ method: "POST", path: "/api/kill", origin: "https://evil.com" }, loopback),
    ).toBe("cross-origin");
    expect(
      checkOrigin({ method: "POST", path: "/api/kill", origin: "https://evil.com" }, exposed),
    ).toBe("cross-origin");
  });
});

describe("isLoopbackBind", () => {
  it("treats loopback bind hosts as local-only", () => {
    for (const h of ["127.0.0.1", "localhost", "::1"]) expect(isLoopbackBind(h)).toBe(true);
  });

  it("treats 0.0.0.0 and routable IPs as exposed", () => {
    for (const h of ["0.0.0.0", "192.168.1.10", "10.0.0.5"]) expect(isLoopbackBind(h)).toBe(false);
  });
});
