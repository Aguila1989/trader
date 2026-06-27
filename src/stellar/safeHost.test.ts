import { describe, it, expect } from "vitest";
import { assertPublicDomain, isPrivateAddress } from "./safeHost";

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

describe("isPrivateAddress (SEC-06 DNS-resolution guard)", () => {
  it("flags private / loopback / link-local / reserved v4", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.1", "192.168.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "224.0.0.1"]) {
      expect(isPrivateAddress(ip, 4)).toBe(true);
    }
  });
  it("allows public v4", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.15.0.1", "172.32.0.1", "93.184.216.34"]) {
      expect(isPrivateAddress(ip, 4)).toBe(false);
    }
  });
  it("flags loopback / ULA / link-local / mapped v6", () => {
    for (const ip of ["::1", "fe80::1", "fc00::1", "fd12::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateAddress(ip, 6)).toBe(true);
    }
    expect(isPrivateAddress("2606:4700:4700::1111", 6)).toBe(false);
  });
  it("treats malformed addresses as unsafe", () => {
    expect(isPrivateAddress("not-an-ip", 4)).toBe(true);
  });
});
