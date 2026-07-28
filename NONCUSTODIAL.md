# NONCUSTODIAL.md — testing the non-custodial migration (P0)

Status: **P0 (the payment path) is code-complete and build-green, but runtime-UNVERIFIED.**
This runbook is how you verify it. Everything is behind `NONCUSTODIAL_MODE` (default
**off** → zero change to the custodial app). See the design in the second-brain note
`atrium-noncustodial-engineering-plan`.

> **Verify on TESTNET.** Testnet uses Friendbot play-money (no real value) and exercises
> the *identical* code path. Do **not** use mainnet to "just test" — a mainnet transaction
> moves real funds, and booting against your live `.env` can wake the operator autopilot.
> The mainnet notes at the bottom are for *you* to run deliberately, never automated.

---

## What P0 does (when the flag is on)

- **Create wallet, non-custodial:** the key is generated **in the browser**, encrypted at
  rest with your passphrase (WebCrypto PBKDF2→AES-256-GCM, stored in IndexedDB), and only
  the **public key** is registered server-side (`POST /api/wallet/register`). The server
  never receives a secret.
- **Send:** the server **builds** an unsigned transaction (`POST /api/pay/build`), you
  **review** the decoded operations and **sign on your device**, and the server **relays**
  the signed envelope (`POST /api/submit`) — verifying the source account, operation shape,
  and the egress cap on the way in. It never signs for you.
- **Concurrency guard (§4.4):** at most one built-but-unsubmitted tx per wallet; a second
  `/pay/build` returns `409` until the first submits or its ~150s reservation lapses.

Not yet wired: swap / offers / trustlines / claimable, fees-in-tx, the autonomous paths,
and the live-mainnet key migration. Only the **payment** path is end-to-end.

---

## 1. Testnet setup (safe — recommended)

**Prereqreqs:** Node 22, the local SQL Server (wallet registration needs a DB).

```bash
# 1. Start the dev database + apply the schema (idempotent — adds the nullable
#    encryptedSecret column for client-signed wallets).
docker compose up -d
npm run db:migrate
```

Create a **`.env.sandbox`** (this keeps your live `.env` untouched):

```bash
NETWORK=testnet
NONCUSTODIAL_MODE=true
ALLOW_RAW_TRANSFERS=true          # /api/pay/build is still gated by this
JWT_SECRET=<openssl rand -hex 32>
WALLET_ENCRYPTION_KEY=<openssl rand -hex 32>   # still used for BYO-AI-key encryption
# Point at the docker SQL Server (loopback → TLS guard is exempt on testnet):
SQLSERVER_CONNECTION_STRING=Server=127.0.0.1,1433;Database=atrium;User Id=sa;Password=<your sa pwd>;Encrypt=false
# NOTE: no STELLAR_SECRET needed — the non-custodial user holds their own key.
```

Run the server + web against it (dotenv honours `DOTENV_CONFIG_PATH`):

```bash
DOTENV_CONFIG_PATH=./.env.sandbox npm run dev
```

Open http://localhost:5175.

## 2. Walk the flow

1. **Register + log in** (email/password).
2. On the wallet-setup screen, pick **"Create on this device (non-custodial)"** (this card
   only appears when `NONCUSTODIAL_MODE=true`).
3. **Save the shown secret**, set a passphrase (≥8 chars), tick the backup acknowledgement,
   **Create wallet**. → the public key is registered; you land on "manage".
4. **Fund it:** click **Fund (testnet)** (Friendbot). Wait for the balance to appear.
5. Go to **Receive & Send**. Enter a destination (another testnet `G...` address — make a
   second wallet, or use a friend's testnet account), an amount, optionally a memo. **Send.**
6. The **review dialog** opens: confirm the decoded operation(s), destination (full,
   unelided), and fee are correct. Enter your **passphrase** → **Sign & submit**.
7. Copy the returned tx hash and confirm it on the testnet explorer:
   `https://stellar.expert/explorer/testnet/tx/<hash>`.

## 3. What to check (the things that matter)

- ✅ **The send lands** and the balance drops by amount + network fee.
- ✅ **Wrong passphrase** → "Wrong passphrase", no submission.
- ✅ **The server never saw a secret** — check the server logs / DB: `dbo.Wallets` row for
  this user has `encryptedSecret = NULL`.
- ✅ **Concurrency guard:** fire two `/api/pay/build` for the same wallet without submitting
  the first → the second returns `409` ("another transaction is being prepared").
- ✅ **Egress cap:** set a low `MAX_DAILY_EGRESS` and confirm `/api/submit` refuses once the
  day's total is exceeded (computed server-side from the signed tx, not trusted from the client).
- ✅ **Tamper refusal (client):** the client refuses to sign an XDR whose source isn't your
  wallet or that contains a disallowed op (`setOptions`/`accountMerge`) — `signing.ts`
  `parseAndValidate`.

## 4. Automated checks (no funds, run anytime)

```bash
npm run typecheck                                   # backend tsc
npm test                                            # backend vitest (incl. txReservation)
npx vitest run src/stellar/txReservation.test.ts    # the §4.4 allocator, in isolation
npm --prefix web run build                          # vue-tsc + vite (stellar-base lazy-chunks)
```

Pre-existing: 8 auth-2FA tests fail (environmental regression since `@298f7c9`, unrelated).

---

## 5. Mainnet — YOUR hands only, never automated

If you later smoke-test on mainnet with a tiny amount, **you** run it — an assistant will
not execute fund-moving transactions for you. Before you boot `NONCUSTODIAL_MODE=true`
against a mainnet `.env`:

- **Neutralise the operator autopilot first** so booting can't autonomously trade with the
  operator key: set `AUTO_SCAN_INTERVAL_SECONDS=0`, and leave trading mode **read-only**.
  (The non-custodial *user* wallet is separate from the operator `STELLAR_SECRET` — but the
  operator's own background loops are what a mainnet boot can wake.)
- Use a throwaway amount. Payments are irreversible.
- Everything else (SMTP, DB, TLS boot guards) applies on mainnet as normal.

---

## 6. Known gaps before this is production-trustworthy

- Only `/api/pay` is wired end-to-end; other write paths still use the custodial flow.
- The per-action operation allowlist (signing.ts `allowedOps`) and the
  `ClientSignedWalletError → 409` mapping on the old custodial routes ARE shipped;
  the `localKey` security review (see its header checklist) is still open.
- Fees-in-signed-tx, the autonomous paths, and the **live-mainnet wallet migration** are not
  built — the migration is deadline-driven and must not be a flag flip.
- The design assumes the **one-off legal opinion** (see `juridische-analyse-atrium.md` §7.1)
  precedes enabling this for real users.
