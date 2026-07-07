/**
 * Hand-rolled Stripe REST client (2026-07 Feature 2). Same philosophy as the
 * hand-rolled JWT: a few well-understood HTTPS calls beat a large SDK
 * dependency for the tiny surface we use - create a customer, start a
 * subscription Checkout session, read a subscription. Requests are
 * form-encoded per Stripe's API; auth is the secret key as a Bearer token.
 *
 * Prices are INLINE price_data (configurable EUR amounts from
 * dbo.PlatformSettings) so no Stripe dashboard objects need pre-creating;
 * Stripe reuses an internal Price for identical inline definitions.
 */
import { config } from "../config";

const API = "https://api.stripe.com/v1";
const TIMEOUT_MS = 20_000;

export function stripeConfigured(): boolean {
  return config.billing.stripeSecretKey.trim().length > 0;
}

export class StripeError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Flatten nested params to Stripe's form encoding (a[b][0][c]=v). */
function encodeForm(params: Record<string, unknown>, prefix = ""): string[] {
  const pairs: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === "object" && v !== null) pairs.push(...encodeForm(v as Record<string, unknown>, `${name}[${i}]`));
        else pairs.push(`${encodeURIComponent(`${name}[${i}]`)}=${encodeURIComponent(String(v))}`);
      });
    } else if (typeof value === "object") {
      pairs.push(...encodeForm(value as Record<string, unknown>, name));
    } else {
      pairs.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return pairs;
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  params?: Record<string, unknown>,
): Promise<T> {
  if (!stripeConfigured()) throw new StripeError(503, "Stripe is not configured.");
  const body = params && method === "POST" ? encodeForm(params).join("&") : undefined;
  const qs = params && method === "GET" ? `?${encodeForm(params).join("&")}` : "";
  const res = await fetch(`${API}${path}${qs}`, {
    method,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      authorization: `Bearer ${config.billing.stripeSecretKey}`,
      ...(body != null ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    ...(body != null ? { body } : {}),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    // Stripe's error message is safe to surface server-side; routes still mask
    // it from clients via the normal failGeneric path.
    throw new StripeError(res.status, json.error?.message ?? `Stripe HTTP ${res.status}`);
  }
  return json;
}

export interface StripeCustomer {
  id: string;
}

export async function createCustomer(email: string, userId: string): Promise<StripeCustomer> {
  return stripeRequest<StripeCustomer>("POST", "/customers", {
    email,
    metadata: { atriumUserId: userId },
  });
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
}

export async function createSubscriptionCheckout(input: {
  customerId: string;
  userId: string;
  plan: "monthly" | "annual";
  amountEur: number;
  successUrl: string;
  cancelUrl: string;
}): Promise<StripeCheckoutSession> {
  return stripeRequest<StripeCheckoutSession>("POST", "/checkout/sessions", {
    mode: "subscription",
    customer: input.customerId,
    client_reference_id: input.userId,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(input.amountEur * 100),
          recurring: { interval: input.plan === "annual" ? "year" : "month" },
          product_data: { name: `Atrium Premium (${input.plan})` },
        },
      },
    ],
  });
}

export interface StripeSubscription {
  id: string;
  status: string;
  customer: string;
  current_period_start?: number;
  current_period_end?: number;
  /** 2025+ API versions moved the period to the items. */
  items?: { data?: Array<{ current_period_start?: number; current_period_end?: number }> };
}

export async function getSubscription(id: string): Promise<StripeSubscription> {
  return stripeRequest<StripeSubscription>("GET", `/subscriptions/${encodeURIComponent(id)}`);
}

/** Period bounds across API versions (top-level pre-2025, item-level after). */
export function subscriptionPeriod(sub: StripeSubscription): { startMs: number | null; endMs: number | null } {
  const item = sub.items?.data?.[0];
  const start = sub.current_period_start ?? item?.current_period_start;
  const end = sub.current_period_end ?? item?.current_period_end;
  return {
    startMs: typeof start === "number" ? start * 1000 : null,
    endMs: typeof end === "number" ? end * 1000 : null,
  };
}

/** Premium is on only while Stripe says the subscription is being paid for. */
export function isPremiumStatus(status: string): boolean {
  return status === "active" || status === "trialing";
}

export interface StripeBillingPortalSession {
  id: string;
  url: string;
}

/** Self-service cancellation/management (Billing Portal), returned to /#/pricing. */
export async function createBillingPortalSession(input: {
  customerId: string;
  returnUrl: string;
}): Promise<StripeBillingPortalSession> {
  return stripeRequest<StripeBillingPortalSession>("POST", "/billing_portal/sessions", {
    customer: input.customerId,
    return_url: input.returnUrl,
  });
}
