import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature } from "./webhook";

const SECRET = "whsec_test_0123456789abcdef";

function sign(body: string, tSec: number, secret = SECRET): string {
  const mac = createHmac("sha256", secret).update(`${tSec}.${body}`).digest("hex");
  return `t=${tSec},v1=${mac}`;
}

describe("billing/webhook verifyStripeSignature", () => {
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: {} } });
  const now = 1_760_000_000;

  it("accepts a valid signature over the exact raw bytes", () => {
    const header = sign(body, now);
    expect(verifyStripeSignature(Buffer.from(body), header, SECRET, now)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const header = sign(body, now);
    const tampered = body.replace("evt_1", "evt_2");
    expect(verifyStripeSignature(Buffer.from(tampered), header, SECRET, now)).toBe(false);
  });

  it("rejects the wrong endpoint secret", () => {
    const header = sign(body, now, "whsec_other");
    expect(verifyStripeSignature(Buffer.from(body), header, SECRET, now)).toBe(false);
  });

  it("rejects a stale timestamp (replay window)", () => {
    const header = sign(body, now - 301);
    expect(verifyStripeSignature(Buffer.from(body), header, SECRET, now)).toBe(false);
    // ... but accepts within tolerance.
    const fresh = sign(body, now - 299);
    expect(verifyStripeSignature(Buffer.from(body), fresh, SECRET, now)).toBe(true);
  });

  it("accepts when ONE of several v1 candidates matches (secret rotation)", () => {
    const good = sign(body, now).split("v1=")[1];
    const header = `t=${now},v1=${"0".repeat(64)},v1=${good}`;
    expect(verifyStripeSignature(Buffer.from(body), header, SECRET, now)).toBe(true);
  });

  it("rejects malformed/missing headers and empty bodies", () => {
    expect(verifyStripeSignature(Buffer.from(body), undefined, SECRET)).toBe(false);
    expect(verifyStripeSignature(Buffer.from(body), "", SECRET)).toBe(false);
    expect(verifyStripeSignature(Buffer.from(body), "t=abc,v1=zz", SECRET)).toBe(false);
    expect(verifyStripeSignature(Buffer.from(body), `t=${now}`, SECRET, now)).toBe(false);
    expect(verifyStripeSignature(Buffer.alloc(0), sign("", now), SECRET, now)).toBe(false);
  });
});
