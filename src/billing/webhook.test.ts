import { describe, it, expect, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { verifyStripeSignature, handleStripeEvent } from "./webhook";
import * as authStore from "../auth/store";

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

/**
 * Payment-integrity events, run against the in-memory auth store (no SQL
 * Server configured in tests - dbReady() is false, same fallback the app uses
 * without a DB, per src/auth/store.ts). We seed a user via
 * authStore.createAccount, attach a Stripe customer id via
 * authStore.setSubscriptionState (mirrors what checkout-session/webhook
 * bootstrap does), and read the result back via authStore.findUserById -
 * the same public User shape the account/status endpoints expose.
 *
 * billing.setUserFlaggedForReview / billing.insertAdminAudit (src/db/billingRepo.ts)
 * are both no-ops without a DB (`if (!dbReady()) return;`), so they cannot be
 * asserted against here; the premium/subscriptionStatus revocation - the
 * user-visible, security-relevant effect - is what these tests check.
 */
describe("billing/webhook handleStripeEvent - payment integrity", () => {
  beforeEach(() => authStore.__resetMemoryStoreForTests());

  async function seedUserWithCustomer(id: string, customerId: string) {
    const user = await authStore.createAccount({
      id,
      email: `${id}@example.com`,
      passwordHash: "hash",
      emailVerified: true,
    });
    await authStore.setSubscriptionState(id, {
      isPremium: true,
      stripeCustomerId: customerId,
      stripeSubscriptionId: `sub_${id}`,
      subscriptionStatus: "active",
    });
    return user;
  }

  it("charge.refunded revokes premium and marks the subscription refunded", async () => {
    await seedUserWithCustomer("u-refund", "cus_refund_1");
    await handleStripeEvent({
      id: "evt_refund_1",
      type: "charge.refunded",
      data: { object: { id: "ch_1", customer: "cus_refund_1", amount_refunded: 1999 } },
    });
    const u = await authStore.findUserById("u-refund");
    expect(u?.isPremium).toBe(false);
    expect(u?.subscriptionStatus).toBe("refunded");
  });

  it("charge.refunded for an unresolved customer logs and returns without throwing", async () => {
    await expect(
      handleStripeEvent({
        id: "evt_refund_unknown",
        type: "charge.refunded",
        data: { object: { id: "ch_x", customer: "cus_does_not_exist", amount_refunded: 500 } },
      }),
    ).resolves.toBeUndefined();
  });

  it("charge.dispute.created revokes premium and marks the subscription disputed", async () => {
    await seedUserWithCustomer("u-dispute", "cus_dispute_1");
    await handleStripeEvent({
      id: "evt_dispute_1",
      type: "charge.dispute.created",
      data: {
        object: { id: "dp_1", charge: "ch_2", reason: "fraudulent", amount: 2500, customer: "cus_dispute_1" },
      },
    });
    const u = await authStore.findUserById("u-dispute");
    expect(u?.isPremium).toBe(false);
    expect(u?.subscriptionStatus).toBe("disputed");
  });

  it("charge.dispute.created WITHOUT a customer field does not throw (documented API-version gap)", async () => {
    // Some API versions omit `customer` on the Dispute payload; resolving it
    // fully would need a getCharge() follow-up (see the code comment in
    // webhook.ts). The handler must degrade gracefully, not throw.
    await expect(
      handleStripeEvent({
        id: "evt_dispute_no_customer",
        type: "charge.dispute.created",
        data: { object: { id: "dp_2", charge: "ch_3", reason: "fraudulent", amount: 1000 } },
      }),
    ).resolves.toBeUndefined();
  });

  it("customer.subscription.deleted revokes premium (regression)", async () => {
    await seedUserWithCustomer("u-cancel", "cus_cancel_1");
    await handleStripeEvent({
      id: "evt_cancel_1",
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_u-cancel", status: "canceled", customer: "cus_cancel_1" } },
    });
    const u = await authStore.findUserById("u-cancel");
    expect(u?.isPremium).toBe(false);
    expect(u?.subscriptionStatus).toBe("canceled");
  });

  it("invoice.payment_failed revokes premium (regression)", async () => {
    await seedUserWithCustomer("u-failed", "cus_failed_1");
    await handleStripeEvent({
      id: "evt_failed_1",
      type: "invoice.payment_failed",
      data: { object: { customer: "cus_failed_1" } },
    });
    const u = await authStore.findUserById("u-failed");
    expect(u?.isPremium).toBe(false);
    expect(u?.subscriptionStatus).toBe("past_due");
  });
});
