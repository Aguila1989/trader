/**
 * Stripe webhook (2026-07 Feature 2). The endpoint is PUBLIC (Stripe calls it,
 * not a browser session - it is in PUBLIC_API_PATHS), so authenticity rests
 * entirely on the signature check: HMAC-SHA256 over `${t}.${rawBody}` with the
 * endpoint secret, constant-time compared against every v1 candidate, with a
 * replay tolerance window. The RAW body bytes are captured by the express.json
 * verify hook in server.ts - a re-serialized JSON.stringify would not match.
 *
 * Idempotency: each event id is recorded first (dbo.StripeEvents); a replayed
 * delivery returns 200 with no state change. Handlers mirror Stripe state onto
 * dbo.Users via authStore.setSubscriptionState - the webhook is the ONLY
 * writer of premium state besides the admin backoffice.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import * as authStore from "../auth/store";
import * as billing from "../db/billingRepo";
import { store } from "../trading/store";
import {
  getSubscription,
  isPremiumStatus,
  subscriptionPeriod,
  type StripeSubscription,
} from "./stripeClient";

/** Max accepted age/skew of the signature timestamp (Stripe recommends 5min). */
const TOLERANCE_SEC = 300;

/**
 * Verify a Stripe-Signature header against the raw body. Pure - unit tested
 * with synthetic signatures. Returns false on ANY malformation.
 */
export function verifyStripeSignature(
  rawBody: Buffer,
  header: string | undefined,
  secret: string,
  nowSec: number = Math.floor(Date.now() / 1000),
): boolean {
  if (!header || !secret || rawBody.length === 0) return false;
  let t = "";
  const v1: string[] = [];
  for (const part of header.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > TOLERANCE_SEC) return false;
  if (v1.length === 0) return false;
  const expected = createHmac("sha256", secret).update(`${t}.`).update(rawBody).digest("hex");
  const expBuf = Buffer.from(expected, "utf8");
  for (const candidate of v1) {
    const candBuf = Buffer.from(candidate, "utf8");
    if (candBuf.length === expBuf.length && timingSafeEqual(candBuf, expBuf)) return true;
  }
  return false;
}

interface StripeEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

async function applySubscription(userId: string, sub: StripeSubscription): Promise<void> {
  const period = subscriptionPeriod(sub);
  await authStore.setSubscriptionState(userId, {
    isPremium: isPremiumStatus(sub.status),
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : null,
    stripeSubscriptionId: sub.id,
    subscriptionStatus: sub.status,
    subscriptionStart: period.startMs,
    subscriptionEnd: period.endMs,
  });
}

async function userIdForCustomer(customer: unknown): Promise<string | null> {
  return typeof customer === "string" ? authStore.findUserIdByStripeCustomer(customer) : null;
}

/**
 * Handle one verified, first-delivery Stripe event. Unknown types are ignored
 * (Stripe sends many); errors bubble to the route, which answers 500 so Stripe
 * retries the delivery.
 */
export async function handleStripeEvent(evt: StripeEvent): Promise<void> {
  switch (evt.type) {
    case "checkout.session.completed": {
      const s = evt.data.object as {
        client_reference_id?: string | null;
        customer?: string | null;
        subscription?: string | null;
      };
      const userId = s.client_reference_id ?? (await userIdForCustomer(s.customer));
      if (!userId) {
        store.log("warn", `Stripe checkout.session.completed without a resolvable user (customer ${String(s.customer)}).`);
        return;
      }
      if (typeof s.subscription === "string" && s.subscription) {
        // Fetch the subscription for authoritative status + period bounds.
        const sub = await getSubscription(s.subscription);
        await applySubscription(userId, { ...sub, customer: (s.customer as string) ?? sub.customer });
      } else {
        await authStore.setSubscriptionState(userId, {
          isPremium: true,
          stripeCustomerId: (s.customer as string) ?? null,
          subscriptionStatus: "active",
          subscriptionStart: Date.now(),
        });
      }
      store.log("info", `Premium activated for user ${userId.slice(0, 8)}… (Stripe checkout completed).`);
      return;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = evt.data.object as unknown as StripeSubscription;
      const userId = await userIdForCustomer(sub.customer);
      if (!userId) {
        store.log("warn", `Stripe ${evt.type} for unknown customer ${String(sub.customer)}.`);
        return;
      }
      const effective =
        evt.type === "customer.subscription.deleted" ? { ...sub, status: "canceled" } : sub;
      await applySubscription(userId, effective);
      if (!isPremiumStatus(effective.status)) {
        store.log("info", `Premium ended for user ${userId.slice(0, 8)}… (subscription ${effective.status}).`);
      }
      return;
    }

    case "invoice.payment_failed": {
      const inv = evt.data.object as { customer?: string | null };
      const userId = await userIdForCustomer(inv.customer);
      if (!userId) return;
      // Spec: on payment failure, premium (and with it AI trading) turns off
      // immediately; a later successful payment re-activates via
      // customer.subscription.updated.
      await authStore.setSubscriptionState(userId, {
        isPremium: false,
        subscriptionStatus: "past_due",
      });
      store.log("warn", `Premium suspended for user ${userId.slice(0, 8)}… (Stripe payment failed).`);
      return;
    }

    // Payment-integrity: a refund is treated as an immediate premium
    // revocation PLUS a manual-review flag (unlike a simple cancellation,
    // a refund after service was rendered is worth a human look).
    case "charge.refunded": {
      const charge = evt.data.object as { customer?: string | null; id?: string; amount_refunded?: number };
      const userId = await userIdForCustomer(charge.customer);
      if (!userId) {
        store.log("warn", `Stripe charge.refunded for unresolved customer ${String(charge.customer)}.`);
        return;
      }
      const detail = `charge=${charge.id ?? "?"} amount_refunded=${charge.amount_refunded ?? "?"}`;
      await authStore.setSubscriptionState(userId, { isPremium: false, subscriptionStatus: "refunded" });
      await billing.setUserFlaggedForReview(userId, true);
      await billing.insertAdminAudit("stripe-webhook", "charge.refunded", userId, detail);
      store.log("warn", `Premium revoked + flagged for review: user ${userId.slice(0, 8)}… (Stripe charge refunded, ${detail}).`);
      return;
    }

    // Payment-integrity: a dispute (chargeback) also revokes premium + flags
    // for review. NOTE: depending on the Stripe API version, the Dispute
    // object may NOT include `customer` directly - fully resolving it in that
    // case would need a follow-up getCharge(object.charge) call to read the
    // charge's customer id (future follow-up; not implemented here).
    case "charge.dispute.created": {
      const dispute = evt.data.object as { id?: string; charge?: string; reason?: string; amount?: number; customer?: string | null };
      const userId = await userIdForCustomer(dispute.customer);
      if (!userId) {
        store.log("warn", `Stripe charge.dispute.created for unresolved customer (charge ${String(dispute.charge)}).`);
        return;
      }
      const detail = `dispute=${dispute.id ?? "?"} charge=${dispute.charge ?? "?"} reason=${dispute.reason ?? "?"} amount=${dispute.amount ?? "?"}`;
      await authStore.setSubscriptionState(userId, { isPremium: false, subscriptionStatus: "disputed" });
      await billing.setUserFlaggedForReview(userId, true);
      await billing.insertAdminAudit("stripe-webhook", "charge.dispute.created", userId, detail);
      store.log("error", `Premium revoked + flagged for review: user ${userId.slice(0, 8)}… (Stripe dispute created, ${detail}).`);
      return;
    }

    default:
      return; // benign: Stripe sends more event types than we subscribe to
  }
}

/** Route-level composition: verify -> dedupe -> handle. Returns the HTTP
 *  status the webhook should answer with. */
export async function processWebhookDelivery(
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
  secret: string,
): Promise<number> {
  if (!rawBody || !verifyStripeSignature(rawBody, signatureHeader, secret)) return 400;
  let evt: StripeEvent;
  try {
    evt = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
  } catch {
    return 400;
  }
  if (!evt?.id || !evt.type || !evt.data?.object) return 400;
  const firstDelivery = await billing.tryRecordStripeEvent(evt.id, evt.type);
  if (!firstDelivery) return 200; // replay: acknowledged, no effects
  await handleStripeEvent(evt);
  return 200;
}
