# Atrium — Incident Response Runbook

What to do when something goes wrong in production (real users, real money, live
mainnet keys). Keep this short and actionable — during an incident you want a
checklist, not prose.

> **Fill these in before launch** (placeholders):
> - **On-call / owner:** `<name, phone, email>`
> - **Data Protection contact (GDPR):** `<email>` — Belgian DPA: Gegevensbeschermingsautoriteit (APD/GBA), https://www.gegevensbeschermingsautoriteit.be
> - **Hosting / server:** `<provider, project, region>`
> - **Stripe dashboard owner:** `<email>`
> - **Status page / user comms channel:** `<url or email list>`

---

## 0. First 5 minutes — stop the bleeding

Pick the smallest hammer that contains the incident:

| Situation | Immediate action |
|---|---|
| A user's trading is misbehaving / account compromised | Admin backoffice → **Disable** the user (this now **revokes all their live sessions immediately**, not just the next login) |
| A user lost their authenticator and is locked out | Admin backoffice → **Reset 2FA** for that user (`POST /api/admin/users/:id/reset-2fa`) |
| The bot is trading when it shouldn't (any user) | That user's **kill switch** (pauses AI loop, proposals, stop-loss, scanners) |
| Platform-wide runaway (all users) | **Stop the service** (`systemctl stop atrium` / `pm2 stop atrium`). There is no in-app global halt yet — this is the platform-wide stop. |
| Suspected key/secret exposure | Go to **§2 Secret compromise** immediately |
| Data breach (DB / PII) | Go to **§3 Data breach** — the **GDPR 72-hour clock starts at awareness** |

Every admin action lands in the immutable `dbo.AdminAudit` trail — note the time.

---

## 1. Service down / crashing

1. It should self-recover: the process runs under a supervisor with auto-restart
   (see `deploy/atrium.service` or `deploy/ecosystem.config.cjs`). Confirm:
   `systemctl status atrium` or `pm2 status`.
2. If it is crash-looping (supervisor gave up after the burst limit): read logs
   (`journalctl -u atrium -n 200` or `pm2 logs atrium`), fix the cause, then
   `systemctl reset-failed atrium && systemctl start atrium`.
3. Boot guards refuse to start on mainnet without `JWT_SECRET`,
   `WALLET_ENCRYPTION_KEY`, a database, or SMTP — a failed start usually means
   one of these; the console prints exactly which.
4. On recovery, verify daily-loss / volume counters look right (they persist in
   the DB; an in-memory fallback would have reset them).

## 2. Secret / key compromise

Order matters — rotate the blast-radius-widest secret first.

1. **`WALLET_ENCRYPTION_KEY`** — this decrypts every user's signing key. If
   exposed, treat ALL user wallets as compromised: stop the service, notify
   users to move funds to a fresh wallet, rotate the key, and re-encrypt.
2. **`JWT_SECRET`** — if exposed, anyone can mint sessions. Rotate it (this
   invalidates all existing tokens → everyone must re-login) and restart.
3. **`STELLAR_SECRET` / any platform signing key / `PLATFORM_FEE_WALLET`** —
   move funds, rotate, update env.
4. **`STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`** — roll in the Stripe
   dashboard, update env, restart. Check recent Stripe activity for abuse.
5. **A user's AI API key** — the user re-issues it with their provider; clear it
   from their account.
6. Rotate in the secret store / `.env`, restart, and record what/when/why here.

## 3. Data breach (PII / database)

The DB holds emails, encrypted wallet secrets, trade history, and the fee ledger.

1. Contain: isolate the DB, rotate DB credentials, stop the service if needed.
2. Assess scope: what data, how many users, was `WALLET_ENCRYPTION_KEY` also
   exposed (if not, wallet secrets stay encrypted at rest).
3. **GDPR (72h from awareness):** if there is a risk to individuals, notify the
   Belgian DPA within 72 hours; if high risk, notify affected users without
   undue delay. Document the assessment even if you decide notification isn't
   required.
4. Preserve logs/evidence; do the post-mortem (§5).

## 4. Mass account-takeover (credential stuffing / login abuse)

1. Check `dbo.LoginAttempts` for spikes. Lockout + rate limiting already blunt
   this at the auth layer.
2. Disable affected accounts (revokes their sessions). Force-rotate `JWT_SECRET`
   if you suspect session theft (logs everyone out).
3. Encourage/require 2FA for affected users (opt-in today; admin can reset).

## 5. After every incident

1. Restore normal operation; confirm counters/backups are intact.
2. Write a short post-mortem here (timeline, root cause, fix, follow-ups).
3. File the follow-up fixes; if a control was missing, add it to `DEPLOY.md`.

---

### Known gaps (as of this runbook)

- **No platform-wide in-app emergency stop** — the platform-wide stop is
  stopping the service (above). A per-admin global-halt toggle is a tracked
  🟡 item in `DEPLOY.md`.
- **No automated alerting** — you learn of incidents from users or manual log
  checks until error/uptime monitoring is wired (tracked 🟡 in `DEPLOY.md`).
- **2FA has no backup codes** — recovery is the admin reset path above.
