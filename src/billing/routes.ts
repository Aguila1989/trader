/**
 * /api/billing/* (2026-07 Feature 2). Mounted AFTER the default-deny auth gate,
 * so every route here runs with an authenticated user context. The Stripe
 * WEBHOOK is deliberately NOT here - it is registered directly in server.ts
 * (public path + raw-body signature verification).
 *
 * With no database or no STRIPE_SECRET_KEY, checkout answers 503 and /status
 * reports billingConfigured:false - the UI then shows Premium as unavailable
 * rather than broken.
 */
import { Router, type Request, type Response } from "express";
import { config } from "../config";
import { currentUserId } from "../users/context";
import * as auth from "../auth/service";
import * as authStore from "../auth/store";
import * as billing from "../db/billingRepo";
import { dbReady } from "../db/pool";
import { FEE_RATES, feeRateFor, type VolumeTier } from "../fees/engine";
import { feeWalletAddress } from "../fees/collector";
import { createCustomer, createSubscriptionCheckout, stripeConfigured, StripeError } from "./stripeClient";
import { store } from "../trading/store";

function baseUrl(): string {
  const explicit = config.publicBaseUrl.trim().replace(/\/+$/, "");
  return explicit || `http://127.0.0.1:${config.port}`;
}

async function priceEur(key: string, fallback: number): Promise<number> {
  const raw = await billing.getPlatformSetting(key);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function createBillingRouter(): Router {
  const router = Router();

  // GET /api/billing/status - everything the pricing page + premium gates need.
  router.get("/status", async (_req: Request, res: Response) => {
    const user = await auth.getAccount(currentUserId());
    const tier = (user?.volumeTier ?? "Bronze") as VolumeTier;
    const isPremium = user?.isPremium ?? false;
    const [monthlyEur, annualEur, feeWallet] = await Promise.all([
      priceEur(billing.PLATFORM_KEYS.premiumPriceMonthlyEur, config.billing.priceMonthlyEurDefault),
      priceEur(billing.PLATFORM_KEYS.premiumPriceAnnualEur, config.billing.priceAnnualEurDefault),
      feeWalletAddress(),
    ]);
    res.json({
      billingConfigured: stripeConfigured() && dbReady(),
      feesEnabled: feeWallet != null,
      isPremium,
      tier,
      subscriptionStatus: user?.subscriptionStatus ?? null,
      subscriptionEnd: user?.subscriptionEnd ?? null,
      currentRates: {
        manual: feeRateFor(tier, isPremium, "MANUAL"),
        ai: isPremium ? feeRateFor(tier, true, "AI") : null,
      },
      rateTable: FEE_RATES,
      prices: { monthlyEur, annualEur },
    });
  });

  // POST /api/billing/checkout-session {plan: monthly|annual, ack: true}
  // The ack is the MANDATORY cost acknowledgement ("AI API costs are my
  // responsibility...") - the UI disables the button until checked, and the
  // server refuses without it so the flow can't be bypassed.
  router.post("/checkout-session", async (req: Request, res: Response) => {
    const plan = req.body?.plan;
    if (plan !== "monthly" && plan !== "annual") {
      res.status(400).json({ error: "plan must be 'monthly' or 'annual'" });
      return;
    }
    if (req.body?.ack !== true) {
      res.status(400).json({ error: "The AI cost acknowledgement is required before checkout." });
      return;
    }
    if (!dbReady() || !stripeConfigured()) {
      res.status(503).json({ error: "Billing is not configured on this server." });
      return;
    }
    try {
      const userId = currentUserId();
      const user = await auth.getAccount(userId);
      if (!user) {
        res.status(404).json({ error: "account not found" });
        return;
      }
      let { stripeCustomerId } = await authStore.getStripeIds(userId);
      if (!stripeCustomerId) {
        const customer = await createCustomer(user.email, userId);
        stripeCustomerId = customer.id;
        await authStore.setSubscriptionState(userId, {
          isPremium: user.isPremium,
          stripeCustomerId,
        });
      }
      const amountEur = await priceEur(
        plan === "annual"
          ? billing.PLATFORM_KEYS.premiumPriceAnnualEur
          : billing.PLATFORM_KEYS.premiumPriceMonthlyEur,
        plan === "annual" ? config.billing.priceAnnualEurDefault : config.billing.priceMonthlyEurDefault,
      );
      const session = await createSubscriptionCheckout({
        customerId: stripeCustomerId,
        userId,
        plan,
        amountEur,
        successUrl: `${baseUrl()}/#/pricing?checkout=success`,
        cancelUrl: `${baseUrl()}/#/pricing?checkout=cancelled`,
      });
      if (!session.url) {
        res.status(502).json({ error: "Stripe did not return a checkout URL." });
        return;
      }
      res.json({ url: session.url });
    } catch (err) {
      // Never leak Stripe internals to the client; log server-side.
      store.log(
        "error",
        `Checkout session failed: ${err instanceof StripeError ? `${err.status} ${err.message}` : (err as Error).message}`,
      );
      res.status(502).json({ error: "Could not start checkout. Please try again." });
    }
  });

  return router;
}
