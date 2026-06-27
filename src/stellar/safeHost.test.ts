import { describe, it, expect } from "vitest";
import { assertPublicDomain } from "./safeHost";

describe("assertPublicDomain (SEC-06 SSRF guard)", () => {
  it("allows plausibly-public domains", () => {
    for (const d of ["centre.io", "circle.com", "ultracapital.xyz", "sub.example.org", "a.b.c.io"]) {
      expect(() => assertPublicDomain(d)).not.toThrow();
    }
  });

  it("rejects IPv4 literals (incl. private / loopback / link-local)", () => {
    for (const d of ["127.0.0.1", "10.0.0.5", "192.168.1.1", "169.254.169.254", "8.8.8.8"]) {
      expect(() => assertPublicDomain(d)).toThrow();
    }
  });

  it("rejects IPv6 literals and host:port forms", () => {
    for (const d of ["::1", "[::1]", "fe80::1", "example.com:8080"]) {
      expect(() => assertPublicDomain(d)).toThrow();
    }
  });

  it("rejects localhost, bare hostnames and internal TLDs", () => {
    for (const d of ["localhost", "router", "db.local", "service.internal", "x.lan", ""]) {
      expect(() => assertPublicDomain(d)).toThrow();
    }
  });

  it("ignores a trailing dot and case", () => {
    expect(() => assertPublicDomain("Centre.IO.")).not.toThrow();
    expect(() => assertPublicDomain("LOCALHOST")).toThrow();
  });
});
