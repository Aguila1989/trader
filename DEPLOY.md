# Deploying Atrium

Step-by-step for taking a build to production and confirming it's healthy.
Everything here happens **on the server that runs the bot** — not in a dev
sandbox. The app reads its configuration from a `.env` file (or real
environment variables) next to `package.json`.

> **Nothing below blocks startup.** The server boots fine with any of these
> unset — the corresponding feature just stays switched off until you fill it
> in. Turn on only what you need. The only two variables that are *mandatory at
> boot* are `JWT_SECRET` and `WALLET_ENCRYPTION_KEY` (each ≥ 32 chars); the
> server refuses to start without them. See `.env.example` for the full list.

---

## 1. Build both front-ends

The main app and the admin backoffice are **two separate Vue apps**. The normal
build only produces the main app, so the admin panel does not exist at `/admin`
until you also run its build — this is the easy step to forget.

```bash
npm install
npm run build          # main app  → web/dist
npm run build:admin    # admin app → admin-web/dist   ← extra, required for /admin
```

Then start (or restart) the server:

```bash
npm start              # tsx src/server.ts
```

Restart after **any** `.env` change — config is read once at boot.

---

## 2. Configure the optional feature groups

Copy the lines you need from `.env.example` into your real `.env` and fill them
in. There are three independent groups.

### A. Stripe — only if you want to charge for Premium

```env
STRIPE_SECRET_KEY=sk_live_...        # Stripe dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_...      # Stripe → Developers → Webhooks → your endpoint
```

- Leave `STRIPE_SECRET_KEY` empty → billing is disabled: the pricing page shows
  "not configured" and AI trading stays locked for everyone. The app is
  otherwise fully functional.
- Register your webhook in Stripe pointing at
  **`https://YOUR-DOMAIN/api/billing/webhook`** and subscribe it to:
  `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`.
  This requires the server to be reachable over public HTTPS.
- Prices default to €10/month and €96/year; override with
  `PREMIUM_PRICE_MONTHLY_EUR` / `PREMIUM_PRICE_ANNUAL_EUR`, or change them later
  in the admin backoffice (Settings tab) with no redeploy.

### B. Platform fee wallet — the account that receives trade fees

```env
PLATFORM_FEE_WALLET=G...             # a Stellar G... address you control
```

- Until this is set, **no fees are charged at all** — fee collection is skipped
  entirely.
- It only *seeds* the value on first boot. After that, change the fee wallet
  from the admin backoffice (Overview / Settings) without touching `.env`.

### C. Admin backoffice — only if you want the `/admin` panel

Admin credentials live **only in env**, never in the user database, and there
is no registration flow. All three must be set or `/admin` refuses every login.
Generate them with the bundled scripts (run once, locally or on the server):

**Password hash:**
```bash
npm run admin:hash-password -- "your-strong-admin-password"
# prints:  ADMIN_PASSWORD_HASH=$2b$12$....
```

**TOTP secret (mandatory 2FA):**
```bash
npm run admin:totp-setup
# prints:
#   ADMIN_TOTP_SECRET=AAAABBBB...
#   otpauth://totp/Atrium%20Admin:admin?secret=AAAABBBB...   ← add to your authenticator app
#   Current code (sanity check): 826226
```

Add the `otpauth://` line (or the raw secret) to Google Authenticator /
1Password / Aegis, confirm the 6-digit code it shows matches the "Current code"
line, then put all three into `.env`:

```env
ADMIN_EMAIL=you@yourdomain.com
ADMIN_PASSWORD_HASH=$2b$12$....      # from admin:hash-password
ADMIN_TOTP_SECRET=AAAABBBB...        # from admin:totp-setup
```

The TOTP secret is shown once — store it in the server env and nowhere else.
Log in at `https://YOUR-DOMAIN/admin` with email + password + the current
6-digit code. Sessions last 4 hours; 5 failed attempts trigger a 30-minute
lockout.

---

## 3. Post-deploy watch (verify the AI-no-trade fixes)

This is a **verification, not a config task**: read the running bot's logs for
one evening (the app's **Logs** tab / live-log drawer, or the server's stdout).
The AI-trading fixes only fully prove themselves against live market data, so
confirm two behaviors:

**1. Every no-trade scan ends with a real explanation.**
Previously a scan that didn't trade logged `(no commentary)` with no reason.
Now, when the AI passes on everything, it's forced to write 2–3 sentences
naming the specific candidates and numbers (e.g. *"Passed on XLM/USDC: rangePos
0.84 fired the rulebook SELL but the spread was 45 bps on a thin book…"*).
- ✅ **Good:** you never see `(no commentary)` again; each pass reads as a
  reasoned decision. You'll also see a line like
  `Effective minRiskReward this scan: 1.1` confirming the risk profile reached
  the model.
- ❌ **Regression:** `(no commentary)` reappears.

**2. No duplicate scan pairs.**
The manual scan button and the auto-pilot used to be able to run at once (two
near-identical `Scanning… / Analyzing…` bursts seconds apart = double paid LLM
calls). Now an overlap logs
`Auto-pilot tick skipped — scan already in progress` instead of a second scan.
- ✅ **Good:** no doubled scan bursts.

You may also occasionally see `AI turn truncated at max_tokens — raising reply
budget for one retry` — that's the truncation-recovery fix working, not an
error.

**Honest caveat:** these fixes removed the *artificial* reasons the AI stayed
silent and made every decision explained — they do **not** force it to trade.
If it still declines often, the logs now say *why* in plain sentences, and the
next lever is strategy/prompt tuning, not bug-hunting.

---

## Quick reference

| Env var | Needed for | If unset |
|---|---|---|
| `JWT_SECRET`, `WALLET_ENCRYPTION_KEY` | everything (≥32 chars) | **server won't start** |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Premium billing | billing disabled, AI stays locked |
| `PLATFORM_FEE_WALLET` | collecting trade fees | no fees charged |
| `PREMIUM_PRICE_MONTHLY_EUR` / `_ANNUAL_EUR` | custom pricing | defaults €10 / €96 |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH` + `ADMIN_TOTP_SECRET` | `/admin` panel | `/admin` login refused |

| Command | Does |
|---|---|
| `npm run build` | build main app → `web/dist` |
| `npm run build:admin` | build admin app → `admin-web/dist` |
| `npm start` | run the server |
| `npm run admin:hash-password -- "<pw>"` | print `ADMIN_PASSWORD_HASH` |
| `npm run admin:totp-setup` | print `ADMIN_TOTP_SECRET` + enrollment QR URI |
| `npm run db:migrate` | apply the idempotent DB schema (safe to re-run) |
| `npm run cap:sync` | build the web app and sync it into the native iOS/Android shells |

---

# Pre-launch work — gap analysis follow-up (2026-07)

This chapter tracks the outcome of the full competitive / UX / production-readiness
review in [`COMPETITIVE-GAP-ANALYSIS.md`](./COMPETITIVE-GAP-ANALYSIS.md). The six
highest-priority items were implemented in code this pass; **everything else from
the analysis that is still open is listed below** so nothing is lost. Section
references point back to that report.

> These changes were verified with `tsc`, `vue-tsc`, and `vitest` only. They were
> **not** run against a live server (the deployment holds live-mainnet keys). Do a
> staging/testnet pass before relying on any of them in production.

## A. Implemented in this pass — operator setup required

Each of these ships in the code but needs a one-time operator action before it
works in production:

1. **Fund-safety UX fixes (no setup needed).** Failed money-moving calls can no
   longer look like a success (`web/src/api.ts` `postJSON` now surfaces every
   non-2xx / network error); balances are preserved on a transient error instead
   of flashing "insufficient funds" (`web/src/stores/trader.ts`); the
   trading-paused banner is now styled; approve/reject/claim show busy state and
   inline errors; Send has a confirmation + memo-required warning; enabling
   Live/Auto-Approve now requires a consequences confirmation; fee/slippage is
   shown before a swap and a manual trade commits; a global error boundary
   prevents a blank-screen crash; a wallet-funding banner nudges unfunded users.

2. **Transactional email (now mandatory on mainnet).** `nodemailer` is now a real
   dependency. Run `npm install`, then set `SMTP_HOST/SMTP_PORT/SMTP_USER/
   SMTP_PASSWORD/SMTP_FROM` (see `.env.example`). **On mainnet the server now
   refuses to start without SMTP** (reset links are undeliverable otherwise);
   override only with `ALLOW_MAINNET_WITHOUT_SMTP=true`.

3. **End-user 2FA (TOTP).** Users can enable authenticator-app 2FA from Account
   settings; it is enforced at login only when the user has enabled it (opt-in,
   to avoid locking funded users out — there are **no backup codes yet**, so an
   admin reset path is the recovery mechanism). No env config needed. **Decision
   still to make:** whether to hard-require 2FA for funded accounts (blocked
   today because there is no self-service recovery — add backup codes first).

4. **Billing lifecycle + payment integrity.** A "Manage subscription" button opens
   the Stripe Billing Portal for self-service cancellation, and the webhook now
   revokes premium on `charge.refunded` / `charge.dispute.created`. **In the
   Stripe dashboard you must:** enable the Customer Billing Portal, and add
   `charge.refunded` + `charge.dispute.created` to the webhook's event
   subscription (alongside the existing checkout/subscription/invoice events).

5. **Native mobile shell (scaffold only).** `capacitor.config.ts`, a PWA
   `manifest.webmanifest`, and mobile `<meta>` tags are in place, and root
   `package.json` has `cap:*` scripts. **Producing the store binaries still
   requires a machine with the native toolchains** (macOS + Xcode for iOS;
   Android Studio for Android) — these cannot run in CI/this environment:
   ```bash
   npm install                       # pulls @capacitor/* + nodemailer
   npm run build                     # web/dist
   npx cap add ios && npx cap add android
   npm run cap:sync
   npx cap open ios | android        # build + submit from the native IDE
   ```
   Before submission also add **store-grade PNG icons** (192/512, maskable) under
   `web/public/` and list them in `manifest.webmanifest` (only an SVG icon is
   wired today), and register **Universal Links (iOS) / App Links (Android)** so
   emailed verify/reset `https` links open the app, not the browser.

## B. Still blocking launch — 🔴 must fix (not yet implemented)

Legal is the dominant blocker; see report Section 6.

- **Resolve the custodial/non-custodial question (legal, dominant path driver).**
  The app is marketed as non-custodial, but wallet keys are generated and
  decrypted **server-side** and the backend signs autonomously — that is
  effectively custodial and likely triggers **MiCA CASP / FSMA** licensing.
  Either obtain a legal opinion + registration, or re-architect to true
  client-side signing. Nothing else legal is safe to finalize until this is
  settled. (Report Section 5 → Must Have.)
- **Privacy Policy** (GDPR Art. 13/14; required URL for both app stores),
  **Terms of Service** with accept-at-signup, **Risk Disclaimer** gating live/AI
  trading, and a **Cookie Policy** section — none exist in the repo.
- **Belgian legal entity + KBO/VAT** displayed, and **VAT collection** on Stripe
  checkout (`automatic_tax` / `tax_id_collection`) for EU B2C SaaS.
- **Database backups.** The DB holds encrypted wallet secrets + the tax-critical
  fee ledger + loss-halt counters; there is no backup/restore today. Add
  scheduled `BACKUP DATABASE` + offsite copy + a tested restore.
- **Disable-account must revoke live sessions.** Admin "disable" only blocks the
  next login; a compromised session keeps trading for its full TTL. Call the
  existing session-revocation path inside the admin disable action.
- **Incident-response plan** (GDPR 72h breach notification, key-compromise, mass
  ATO) and a **process supervisor / auto-restart** (systemd/PM2) — a crash
  currently leaves the bot dead.
- **404 / not-found page** (unknown URLs silently redirect to the dashboard) and
  **GDPR data export + account deletion** (Art. 17/20).

## C. Fix soon after launch — 🟡 important (not yet implemented)

- **Error monitoring (Sentry)** on backend + frontend, and **uptime monitoring**
  with a real health check (`/api/health` is a 200 stub even when the DB is down).
- **Blanket API rate limiting** across money-moving / state-changing routes
  (only auth + LLM endpoints are throttled today).
- **Platform-wide admin emergency stop** (only per-user kill switches exist).
- **CI/CD** running `tsc` + `vue-tsc` + `vitest` on every PR (deploys are manual;
  the 369 tests never run pre-deploy) and a documented **rollback procedure**.
- **2FA backup/recovery codes** (prerequisite to hard-requiring 2FA for funded
  accounts), and **wallet-setup "I saved my secret" acknowledgement**.
- **UX polish:** first-screen value proposition; trading-access mode badge on the
  Manual tab; standardize all confirmations on one dialog; confirm on
  reject-proposal / cancel-alert / logout; friendly error-message translation
  layer; P&L + daily caps above the fold; declutter the TopBar status hierarchy;
  URL-driven Academy + Manual/Bot tab navigation; page titles / breadcrumbs; an
  in-app support/help channel.
- **Accessibility:** modal focus-trap + Escape (Settings, Onboarding); make the
  order-book tap-to-fill rows keyboard-operable.
- **GDPR sub-processor disclosure + DPAs** for the LLM providers (Anthropic /
  OpenAI / Google / DeepSeek) that receive trading data.
- **App-store listing assets:** description, screenshots, age rating, Apple
  privacy-nutrition-label / data-safety form, EULA.

## D. Could have / explicitly deferred — ⚪ (see report Sections 5 & 8)

- Grid / DCA templated bots and copy/social trading (feature parity with
  3Commas/Pionex; large scope, not required to launch).
- An **independent third-party security audit** (only an internal audit exists).
- **Mainnet fee-collection verification** — the atomic claim+swap fee path has
  never been proven against mainnet; do a small controlled live test.
- Report **Section 8** flags the Academy lessons that these new features warrant
  (risk disclaimer, non-custodial key ownership, fees/slippage & minimum
  received, memo-required sends, subscription/billing, 2FA). Those are flagged
  only — not written.
