/**
 * /api/admin/* (Feature 4). Mounted in server.ts BEFORE the user auth gate and
 * guarded by requireAdminAuth (admin/auth.ts): env-credential login with
 * mandatory TOTP, its own 4h aud-scoped JWT cookie, zero shared session state
 * with the main app. Every mutating action lands in the immutable
 * dbo.AdminAudit trail. Users are referenced by opaque userId only - emails
 * never appear in any backoffice payload (GDPR).
 */
import { Router, type Request, type Response } from "express";
import { config } from "../config";
import { horizon } from "../stellar/client";
import { store } from "../trading/store";
import * as billing from "../db/billingRepo";
import { dbReady } from "../db/pool";
import { runWithUserId, DEFAULT_USER_ID } from "../users/context";
import { feeWalletAddress, invalidateFeeWalletCache } from "../fees/collector";
import { runTierRecalc } from "../fees/tierScheduler";
import * as authStore from "../auth/store";
import {
  adminLogin,
  clearAdminCookie,
  requireAdminAuth,
  setAdminCookie,
} from "./auth";

const G_ADDR = /^G[A-Z2-7]{55}$/;
const TIERS = ["Bronze", "Silver", "Gold", "Platinum"];

function adminOf(req: Request): string {
  return (req as Request & { adminEmail?: string }).adminEmail ?? "admin";
}

/** ISO 8601 "YYYY-MM-DD HH:MM:SS" (UTC) per the tax-export spec. */
function isoUtc(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 19);
}

const xlm7 = (n: number): string => n.toFixed(7);
const eur2 = (n: number | null): string => (n == null ? "" : n.toFixed(2));

/** Minimal CSV escaping (fields are ids/numbers/dates; commas only in detail). */
function csv(rows: string[][]): string {
  return rows
    .map((r) => r.map((f) => (/[",\n]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f)).join(","))
    .join("\r\n");
}

async function priceSetting(key: string, fallback: number): Promise<number> {
  const raw = await billing.getPlatformSetting(key);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function createAdminRouter(): Router {
  const router = Router();
  router.use(requireAdminAuth);

  // ---- session ---------------------------------------------------------
  router.post("/login", async (req: Request, res: Response) => {
    const r = await adminLogin(req.body?.email, req.body?.password, req.body?.totp);
    if (!r.ok) {
      // Failed attempts are part of the immutable trail too.
      void billing.insertAdminAudit(String(req.body?.email ?? "?").slice(0, 200), "login-failed");
      res.status(r.status).json({ error: r.error });
      return;
    }
    setAdminCookie(res, r.jwt, r.ttlSec);
    void billing.insertAdminAudit(config.admin.email, "login");
    res.json({ ok: true, expiresInSec: r.ttlSec });
  });

  router.post("/logout", (_req: Request, res: Response) => {
    clearAdminCookie(res);
    res.json({ ok: true });
  });

  // ---- overview --------------------------------------------------------
  router.get("/overview", async (_req: Request, res: Response) => {
    const wallet = await feeWalletAddress();
    let xlmBalance: string | null = null;
    if (wallet) {
      try {
        const acct = await horizon.loadAccount(wallet);
        xlmBalance =
          (acct.balances as Array<{ asset_type: string; balance: string }>).find(
            (b) => b.asset_type === "native",
          )?.balance ?? null;
      } catch {
        xlmBalance = null; // unfunded / Horizon hiccup: show address anyway
      }
    }
    const monthStart = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1);
    const subs = await billing.subscriptionStats(monthStart);
    const monthlyEur = await priceSetting(
      billing.PLATFORM_KEYS.premiumPriceMonthlyEur,
      config.billing.priceMonthlyEurDefault,
    );
    res.json({
      network: config.network,
      dbReady: dbReady(),
      feeWallet: wallet,
      feeWalletBalanceXlm: xlmBalance,
      subscriptions: {
        ...subs,
        // Monthly-equivalent approximation: plan intervals aren't stored
        // locally, so MRR = active premium x monthly price. Exact revenue
        // lives in Stripe (deep link in the UI).
        mrrEurApprox: Math.round(subs.activePremium * monthlyEur * 100) / 100,
      },
    });
  });

  // ---- fee ledger + tax reporting ---------------------------------------
  router.get("/fees", async (req: Request, res: Response) => {
    const from = Date.parse(String(req.query.from ?? "")) || 0;
    const to = Date.parse(String(req.query.to ?? "")) || Date.now() + 86_400_000;
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);
    res.json(await billing.listCollectedFees(from, to, limit, offset));
  });

  router.get("/fees/summary", async (req: Request, res: Response) => {
    const year = Number(req.query.year) || new Date().getUTCFullYear();
    const [months, tiers] = await Promise.all([
      billing.monthlyFeeSummary(year),
      billing.feeTierBreakdown(year),
    ]);
    const prevYear = await billing.monthlyFeeSummary(year - 1);
    const total = (list: billing.MonthlyFeeSummary[]) =>
      list.reduce(
        (a, m) => ({
          feeXlm: a.feeXlm + m.feeXlm,
          feeEur: a.feeEur + m.feeEur,
          txCount: a.txCount + m.txCount,
        }),
        { feeXlm: 0, feeEur: 0, txCount: 0 },
      );
    res.json({
      year,
      months,
      tierBreakdown: tiers,
      yearTotal: total(months),
      previousYearTotal: { year: year - 1, ...total(prevYear) },
    });
  });

  // CSV: full transaction log for a date range. Columns per spec; XLM 7dp,
  // EUR 2dp, timestamps ISO 8601 UTC. userId only - never emails.
  router.get("/fees/export.csv", async (req: Request, res: Response) => {
    const from = Date.parse(String(req.query.from ?? "")) || 0;
    const to = Date.parse(String(req.query.to ?? "")) || Date.now() + 86_400_000;
    const { rows } = await billing.listCollectedFees(from, to, 500_000, 0);
    const body = csv([
      [
        "Transaction ID",
        "Timestamp (UTC)",
        "Amount XLM",
        "XLM/EUR rate at receipt",
        "EUR equivalent at receipt",
        "User ID",
        "Volume tier",
        "Trade type",
        "Trade volume XLM",
        "Rate source",
      ],
      ...rows.map((r) => [
        r.collectedTxHash ?? r.id,
        isoUtc(r.collectedAt ?? r.ts),
        xlm7(r.feeXlm),
        r.xlmEurRate == null ? "" : String(r.xlmEurRate),
        eur2(r.feeEur),
        r.userId,
        r.tier,
        r.tradeType,
        xlm7(r.tradeVolumeXlm),
        r.rateSource ?? "",
      ]),
    ]);
    void billing.insertAdminAudit(adminOf(req), "export-fees-csv", null, `${rows.length} rows`);
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="atrium-fees.csv"`);
    res.send(body);
  });

  router.get("/fees/summary.csv", async (req: Request, res: Response) => {
    const year = Number(req.query.year) || new Date().getUTCFullYear();
    const months = await billing.monthlyFeeSummary(year);
    const body = csv([
      ["Month", "Total fees XLM", "Total fees EUR (at receipt)", "Transactions", "Average fee XLM", "Rows missing EUR rate"],
      ...months.map((m) => [
        m.month,
        xlm7(m.feeXlm),
        eur2(m.feeEur),
        String(m.txCount),
        xlm7(m.avgFeeXlm),
        String(m.missingRateCount),
      ]),
    ]);
    void billing.insertAdminAudit(adminOf(req), "export-summary-csv", String(year));
    res.setHeader("content-type", "text/csv; charset=utf-8");
    res.setHeader("content-disposition", `attachment; filename="atrium-fees-${year}.csv"`);
    res.send(body);
  });

  // ---- user management ---------------------------------------------------
  router.get("/users", async (_req: Request, res: Response) => {
    res.json({ users: await billing.listUsersForAdmin() });
  });

  router.post("/users/:id/tier", async (req: Request, res: Response) => {
    const tier = req.body?.tier;
    const id = String(req.params.id);
    if (tier !== null && tier !== "auto" && !TIERS.includes(tier)) {
      res.status(400).json({ error: "tier must be Bronze|Silver|Gold|Platinum|auto" });
      return;
    }
    const pin = tier === "auto" || tier === null ? null : (tier as string);
    await billing.setUserTierOverride(id, pin);
    // Returning to automatic mode: recalc immediately so the tier is fresh.
    if (pin === null) void runTierRecalc("manual");
    await billing.insertAdminAudit(adminOf(req), "tier-override", id, pin ?? "auto (cleared)");
    res.json({ ok: true });
  });

  router.post("/users/:id/disable", async (req: Request, res: Response) => {
    if (typeof req.body?.disabled !== "boolean") {
      res.status(400).json({ error: "disabled (boolean) is required" });
      return;
    }
    const id = String(req.params.id);
    await billing.setUserDisabledByAdmin(id, req.body.disabled);
    // Disabling must take effect IMMEDIATELY. requireAuth checks isSessionActive
    // on every request, so revoking all of the user's sessions here forces the
    // next call from any live/compromised session to 401 - instead of letting it
    // keep trading until its JWT TTL expires (previously disable only blocked the
    // NEXT login). Re-enabling touches no sessions (there are none while disabled).
    if (req.body.disabled) await authStore.revokeAllSessionsForUser(id);
    await billing.insertAdminAudit(adminOf(req), "account-disable", id, String(req.body.disabled));
    res.json({ ok: true });
  });

  router.post("/users/:id/flag", async (req: Request, res: Response) => {
    if (typeof req.body?.flagged !== "boolean") {
      res.status(400).json({ error: "flagged (boolean) is required" });
      return;
    }
    const id = String(req.params.id);
    await billing.setUserFlaggedForReview(id, req.body.flagged);
    await billing.insertAdminAudit(adminOf(req), "flag-review", id, String(req.body.flagged));
    res.json({ ok: true });
  });

  // End-user 2FA has no backup codes by design (see src/auth/service.ts), so a
  // user who loses their authenticator app is otherwise permanently locked out
  // of a funded account. This is the ONLY recovery path: it clears totpEnabled
  // (and the secret) so the user can log in with just their password and,
  // if they want, re-enroll from scratch. Referenced by opaque userId only -
  // no email in the payload, per the GDPR convention of this router.
  router.post("/users/:id/reset-2fa", async (req: Request, res: Response) => {
    const id = String(req.params.id);
    await authStore.setTotpEnabled(id, false);
    await billing.insertAdminAudit(adminOf(req), "reset-2fa", id);
    res.json({ ok: true });
  });

  // ---- platform settings ---------------------------------------------------
  router.get("/settings", async (_req: Request, res: Response) => {
    res.json({
      feeWalletAddress: await feeWalletAddress(),
      premiumPriceMonthlyEur: await priceSetting(
        billing.PLATFORM_KEYS.premiumPriceMonthlyEur,
        config.billing.priceMonthlyEurDefault,
      ),
      premiumPriceAnnualEur: await priceSetting(
        billing.PLATFORM_KEYS.premiumPriceAnnualEur,
        config.billing.priceAnnualEurDefault,
      ),
      trustlineScanMinScore: config.trustlineScan.minScore,
    });
  });

  router.post("/settings", async (req: Request, res: Response) => {
    const key = String(req.body?.key ?? "");
    const value = req.body?.value;
    const admin = adminOf(req);
    if (key === "feeWalletAddress") {
      const addr = String(value ?? "").trim();
      if (!G_ADDR.test(addr)) {
        res.status(400).json({ error: "A valid G... Stellar address is required." });
        return;
      }
      await billing.upsertPlatformSetting(billing.PLATFORM_KEYS.feeWalletAddress, addr);
      invalidateFeeWalletCache(); // takes effect immediately, as the confirm dialog says
      await billing.insertAdminAudit(admin, "fee-wallet-change", addr);
      res.json({ ok: true, feeWalletAddress: addr });
      return;
    }
    if (key === "premiumPriceMonthlyEur" || key === "premiumPriceAnnualEur") {
      const n = Number(value);
      if (!Number.isFinite(n) || n <= 0 || n > 10_000) {
        res.status(400).json({ error: "A positive EUR amount is required." });
        return;
      }
      await billing.upsertPlatformSetting(billing.PLATFORM_KEYS[key], String(n));
      // Checkout sessions read the price live (inline price_data), so new
      // subscriptions pick this up immediately - no Stripe object to update.
      await billing.insertAdminAudit(admin, "price-change", key, String(n));
      res.json({ ok: true, [key]: n });
      return;
    }
    if (key === "trustlineScanMinScore") {
      try {
        const applied = await runWithUserId(DEFAULT_USER_ID, async () =>
          store.applySetting("trustlineScanMinScore", value),
        );
        await billing.insertAdminAudit(admin, "setting-change", key, String(applied));
        res.json({ ok: true, trustlineScanMinScore: applied });
      } catch (err) {
        res.status(400).json({ error: (err as Error).message });
      }
      return;
    }
    res.status(400).json({ error: `unknown setting: ${key}` });
  });

  // ---- audit trail ---------------------------------------------------------
  router.get("/audit", async (req: Request, res: Response) => {
    res.json({ entries: await billing.listAdminAudit(Number(req.query.limit ?? 100)) });
  });

  // Convenience: the flagged-accounts view + a manual tier recalc trigger.
  router.get("/users/flagged", async (_req: Request, res: Response) => {
    const users = (await billing.listUsersForAdmin()).filter((u) => u.flaggedForReview);
    res.json({ users });
  });

  router.post("/tier-recalc", async (req: Request, res: Response) => {
    void runTierRecalc("manual");
    await billing.insertAdminAudit(adminOf(req), "tier-recalc-run");
    res.json({ started: true });
  });

  return router;
}
