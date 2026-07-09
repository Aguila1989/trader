import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";

// currentUserId() only throws when called outside any request/fallback scope,
// which never happens for real traffic (requireAuth always wraps the rest of
// the request in runWithUserId() before this middleware runs - see the doc
// comment in rateLimit.ts). These tests call the middleware directly with no
// such scope, so mock it to throw here: that exercises the IP-fallback path
// for real (instead of silently falling through to the process-wide default
// user) and lets each test control isolation via req.ip.
vi.mock("./users/context", () => ({
  currentUserId: () => {
    throw new Error("no request scope");
  },
}));

const { createGeneralRateLimiter } = await import("./rateLimit");

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

function req(method: string, path: string, ip = "9.9.9.9"): Request {
  return { method, path, ip } as unknown as Request;
}

describe("rateLimit - createGeneralRateLimiter", () => {
  it("allows requests up to the general budget, then 429s the same key", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 65; i++) {
      const res = mockRes();
      limiter(req("POST", "/api/settings"), res, () => {
        allowed++;
      });
      if (i === 60) {
        expect(res.statusCode).toBe(429);
        expect(res.body).toEqual({
          error: "Too many requests - please slow down and try again shortly.",
        });
      }
    }
    expect(allowed).toBe(60);
  });

  it("applies a tighter budget to money-moving routes", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 20; i++) {
      limiter(req("POST", "/api/pay"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(12);
  });

  it("gives money and general budgets to the same caller independently", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let moneyAllowed = 0;
    let generalAllowed = 0;
    for (let i = 0; i < 12; i++) {
      limiter(req("POST", "/api/swap"), mockRes(), () => {
        moneyAllowed++;
      });
    }
    // The money budget for this caller is now exhausted; general mutations
    // from the SAME caller must still go through on their own budget.
    for (let i = 0; i < 12; i++) {
      limiter(req("POST", "/api/settings"), mockRes(), () => {
        generalAllowed++;
      });
    }
    expect(moneyAllowed).toBe(12);
    expect(generalAllowed).toBe(12);
  });

  it("matches money prefixes for sub-paths (e.g. cancel/modify actions)", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 20; i++) {
      limiter(req("POST", "/api/offers/42/cancel"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(12);
  });

  it("slides the window: capacity frees up once old hits age out", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    for (let i = 0; i < 12; i++) {
      limiter(req("POST", "/api/pay"), mockRes(), () => {});
    }
    // Immediately over budget.
    let blockedRes = mockRes();
    let called = false;
    limiter(req("POST", "/api/pay"), blockedRes, () => {
      called = true;
    });
    expect(called).toBe(false);
    expect(blockedRes.statusCode).toBe(429);

    // Advance past the 60s window: the whole budget should be available again.
    now += 60_001;
    let allowedAfterSlide = false;
    limiter(req("POST", "/api/pay"), mockRes(), () => {
      allowedAfterSlide = true;
    });
    expect(allowedAfterSlide).toBe(true);
  });

  it("keys independently per caller via the IP fallback", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    for (let i = 0; i < 12; i++) {
      limiter(req("POST", "/api/pay", "1.1.1.1"), mockRes(), () => {});
    }
    let otherAllowed = false;
    limiter(req("POST", "/api/pay", "2.2.2.2"), mockRes(), () => {
      otherAllowed = true;
    });
    expect(otherAllowed).toBe(true);
  });

  it("never throttles /api/kill, no matter how many requests", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 200; i++) {
      limiter(req("POST", "/api/kill"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(200);
  });

  it("never throttles /api/auth/* or /api/admin/* or the billing webhook", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    for (const path of ["/api/auth/login", "/api/admin/login", "/api/billing/webhook"]) {
      let allowed = 0;
      for (let i = 0; i < 100; i++) {
        limiter(req("POST", path), mockRes(), () => {
          allowed++;
        });
      }
      expect(allowed).toBe(100);
    }
  });

  it("never throttles GET/HEAD/OPTIONS, even on money routes", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 100; i++) {
      limiter(req("GET", "/api/pay"), mockRes(), () => {
        allowed++;
      });
      limiter(req("HEAD", "/api/pay"), mockRes(), () => {
        allowed++;
      });
      limiter(req("OPTIONS", "/api/pay"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(300);
  });

  it("ignores non-API paths entirely", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 100; i++) {
      limiter(req("POST", "/some/other/path"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(100);
  });

  it("normalizes case so a case-varied path can't dodge the budget", () => {
    let now = 0;
    const limiter = createGeneralRateLimiter(() => now);
    let allowed = 0;
    for (let i = 0; i < 20; i++) {
      limiter(req("POST", "/API/PAY"), mockRes(), () => {
        allowed++;
      });
    }
    expect(allowed).toBe(12);
  });
});
