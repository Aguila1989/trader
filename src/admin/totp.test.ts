import { describe, it, expect } from "vitest";
import { base32Decode, base32Encode, totpCode, verifyTotp } from "./totp";

// RFC 6238 Appendix B reference secret: ASCII "12345678901234567890" (SHA-1
// rows). The RFC vectors are 8-digit; our implementation is 6-digit (the
// authenticator-app default), so the expected values below are the RFC codes'
// last 6 digits - identical math, truncated modulus.
const RFC_SECRET_B32 = base32Encode(Buffer.from("12345678901234567890", "utf8"));

describe("admin/totp", () => {
  it("base32 round-trips", () => {
    const buf = Buffer.from("12345678901234567890", "utf8");
    expect(base32Decode(base32Encode(buf))).toEqual(buf);
    expect(base32Decode("gezdgnbvgy3tqojqgezdgnbvgy3tqojq".toUpperCase())).toEqual(buf);
  });

  it("matches the RFC 6238 SHA-1 reference vectors (6-digit truncation)", () => {
    // time=59s -> RFC code 94287082; time=1111111109 -> 07081804;
    // time=1234567890 -> 89005924; time=2000000000 -> 69279037.
    expect(totpCode(RFC_SECRET_B32, 59_000)).toBe("287082");
    expect(totpCode(RFC_SECRET_B32, 1_111_111_109_000)).toBe("081804");
    expect(totpCode(RFC_SECRET_B32, 1_234_567_890_000)).toBe("005924");
    expect(totpCode(RFC_SECRET_B32, 2_000_000_000_000)).toBe("279037");
  });

  it("verifies the current code and ±1 step of drift, nothing further", () => {
    const now = 1_234_567_890_000;
    expect(verifyTotp(RFC_SECRET_B32, totpCode(RFC_SECRET_B32, now), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET_B32, totpCode(RFC_SECRET_B32, now - 30_000), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET_B32, totpCode(RFC_SECRET_B32, now + 30_000), now)).toBe(true);
    expect(verifyTotp(RFC_SECRET_B32, totpCode(RFC_SECRET_B32, now - 90_000), now)).toBe(false);
  });

  it("rejects malformed codes and degenerate secrets without throwing", () => {
    expect(verifyTotp(RFC_SECRET_B32, "12345")).toBe(false);
    expect(verifyTotp(RFC_SECRET_B32, "abcdef")).toBe(false);
    expect(verifyTotp(RFC_SECRET_B32, "")).toBe(false);
    expect(verifyTotp("not-base32!!", "123456")).toBe(false);
    expect(verifyTotp("ABCD", "123456")).toBe(false); // too short to be a real secret
  });
});
