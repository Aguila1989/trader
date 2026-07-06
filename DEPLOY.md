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
