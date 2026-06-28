import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { generateLinkToken, hashToken, isValidEmail, normalizeEmail, newId } from "./tokens";

describe("auth/tokens", () => {
  it("generates a raw token plus its SHA-256 hash (raw not derivable from storage)", () => {
    const { raw, hash } = generateLinkToken();
    expect(raw.length).toBeGreaterThanOrEqual(40); // 32 bytes base64url
    expect(hash).toHaveLength(64); // sha256 hex
    expect(hash).toBe(createHash("sha256").update(raw).digest("hex"));
    expect(hash).not.toContain(raw);
  });

  it("hashToken is deterministic", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("generates distinct tokens each call", () => {
    expect(generateLinkToken().raw).not.toBe(generateLinkToken().raw);
  });

  it("normalizes emails (trim + lowercase)", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
    expect(normalizeEmail(null)).toBe("");
  });

  it("validates email shape", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("first.last@sub.domain.io")).toBe(true);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("no@domain")).toBe(false);
    expect(isValidEmail("a b@c.com")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("newId returns a uuid-shaped string", () => {
    expect(newId()).toMatch(/^[0-9a-f-]{36}$/i);
    expect(newId()).not.toBe(newId());
  });
});
