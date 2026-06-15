# Stellar AI Trading Bot

Let an **AI propose** trades on the Stellar DEX while **you watch along** and your
own backend stays in full control of risk, signing and submission.

The core idea: **the AI is the trader, your backend is the broker, risk manager and
signer.** The AI can ask for a trade through a tool call, but it never holds your
keys and never submits anything. Every proposal passes a hard policy engine, and
(by default) waits for you to click *Approve* on a live dashboard.

The analyst is model-agnostic: it runs on Anthropic's Claude by default, but any
OpenAI-compatible provider (OpenAI, DeepSeek, OpenRouter, Groq, Mistral, xAI,
Together, or a local Ollama/LM Studio server) works too - pick one in the
dashboard's provider dropdown or via `AI_PROVIDER`. See *Use a different AI model*.

> This is a technical scaffold, not financial advice. Trading is risky. Start on
> testnet with a throwaway wallet.

## Architecture

```
AI analyst  (any LLM, no keys)   fed server-computed indicators + regime tags,
  | tool call: propose_stellar_trade(side, size, limit, confidence,
  v                               target_price, invalidation_price, ...)
Orchestrator             live-trading arm switch (read-only by default) + serial lock
  v
Policy engine            kill switch | asset whitelist | max per trade (loss-tapered)
  |                      daily loss (realized + unrealized) | daily volume + trade cap
  |                      slippage cap + size-vs-depth book walk | entry spread cap
  |                      min 24h volume | per-pair + total exposure caps | cooldown
  |                      min reward/risk | proposal max age | fail-closed when auto
  v
Preflight                trustline + spendable-balance check (free pre-sign gate)
  v
Signer service           secret key lives ONLY here; timeout reconcile + fill read
  v
Stellar Horizon          builds + signs + submits manageSellOffer / manageBuyOffer
  ^
Position monitor         marks positions to market (unrealized PnL) | stop-loss
  |                      closes | books late fills of resting offers | cancels
  |                      stale offers | +1h/+24h outcome marks per trade
  v
Vue dashboard (SSE)      AI reasoning, proposals, approve/reject, mode toggle,
                         evolution charts, trade history, status, live log
                         (auto-reconnecting; survives a backend restart)
  v
SQL Server (optional)    persists trades + daily counters; charts & history survive restarts
```

Read-only tools (`get_account_balances`, `get_market`) let the AI ground its
decision in live data. The only "write" path is `propose_stellar_trade`, and that
goes through the policy engine before anything is signed.

## Scanning the chain

Two ways to put a market in front of the AI:

- **Ask AI** on a single base/quote pair you type in.
- **Scan chain** sweeps a curated universe of reputable Stellar credit tokens,
  each quoted against XLM, **plus a few cross pairs** (see below), in one pass.
  The AI reviews all of them and proposes the strongest zero-to-few trades.

### Cross pairs (fx / peg books)

Not all liquidity is visible through XLM: some of the best mean-reversion books
trade token-vs-token. The scan therefore also covers **`SCAN_PAIRS`** (default
`USDC/EURC,yUSDC/USDC`, both verified liquid on mainnet):

- **USDC/EURC** - effectively a EUR/USD fx book (~20bps spread): it moves on
  the fx rate, not on XLM, so it is an opportunity stream independent of every
  XLM-based market.
- **yUSDC/USDC** - a redeemable **peg** pair that belongs near 1.0: deviations
  with depth behind them are bounded mean-reversion setups. (Its XLM book is
  dead wide - cross-pair scanning is what makes it reachable at all.)

Cross-pair legs are auto-whitelisted, PnL/volume/exposure from cross trades are
converted to XLM through live rates sampled from the XLM books each scan, and
cross pairs always use the *standard* per-trade cap (the caps are denominated
in base units, and 50 USDC is ~5x the real size of 50 XLM). Set
`SCAN_PAIRS=none` to disable.

The curated universe is split into two **risk tiers** that drive the per-trade
size cap:

| Tier | Default tokens | Per-trade cap |
| ---- | -------------- | ------------- |
| **High** (deep, low-volatility blue-chips) | USDC, EURC | `MAX_AMOUNT_PER_TRADE_HIGH` (default 50) |
| **Low** (smaller-cap / more volatile / exotic-fiat) | AQUA, yXLM, yUSDC, SHX, ARST, NGNT, LSP, AFR, GOLD, USDT | `MAX_AMOUNT_PER_TRADE` (default 10) |

The bigger cap applies **only** when an XLM-based pair's other leg is a
high-tier asset; any low-tier, custom/unknown or cross-pair leg falls back to
the standard cap. Sizing up only in the deepest, most stable names is the
risk-correct place to take a larger clip.

The universe is deliberately a hand-picked, *creditable* set rather than every
asset on Horizon (the long tail is mostly dust and dead issuers). Every curated
issuer is **verified against the live ledger** - it is the dominant issuer of
its code (most trustlines + supply), its account resolves to the project's real
`home_domain`, and it has a live XLM order book. Override the set with
`SCAN_ASSETS` (comma-separated `CODE:ISSUER`); re-verify any token you add, since
a wrong issuer can be a scam clone of a well-known ticker. The defaults are
**mainnet** issuers; on testnet, set your own `SCAN_ASSETS`. Scanned tokens are
folded into the policy whitelist automatically, and markets with no orderbook
are skipped.

## Trading modes

The dashboard has two independent controls plus a kill switch.

### 1. Read-only ⟷ Live trading (the master arm switch)

This is the primary safety gate. **The bot always boots in read-only mode**, even
when a `STELLAR_SECRET` is configured - it will analyze and propose, but the signer
is disarmed and nothing can be submitted on-chain until you deliberately flip
**Live trading** on in the dashboard. The toggle is live and resets to read-only on
every restart, so a crash or reboot can never leave it silently armed.

- The **Live trading** button is disabled unless a signing key is configured - you
  can't arm what you can't sign.
- While read-only, a proposal that would otherwise execute is *held* (it waits for
  you to arm live trading and approve), not lost.

### 2. Approve every trade ⟷ Auto-trade (the headline mode toggle)

Only relevant once you're live:

1. **Approve every trade (default).** The AI analyzes and proposes. You see the side,
   asset, amount, price, reason and risk. You click **Approve**, then the backend
   builds, signs and submits. This is `AUTO_APPROVE_ENABLED=false`.
2. **Auto-trade.** Flip the toggle (or set `AUTO_APPROVE_ENABLED=true`) and
   policy-passing proposals execute automatically with no manual click - but only
   inside your configured caps (max size, daily volume, slippage, cooldown,
   whitelist), which are still enforced and re-checked at execution time. The
   toggle is live, so you can switch between the two at any moment.

Auto-trade still obeys the arm switch: with live trading off, an auto-approved
proposal is held for approval rather than submitted.

### 3. Hands-free scanning (autopilot)

By default the bot only analyzes when you click **Ask AI** or **Scan chain** -
auto-trade just removes the approval *click*, it doesn't *generate* proposals on
its own. To run fully hands-free, set **`AUTO_SCAN_INTERVAL_SECONDS`** > 0: the
backend then scans the curated universe every N seconds by itself. Combined with
the two switches above, the three settings compose like this:

| Want | `AUTO_SCAN_INTERVAL_SECONDS` | Auto-trade | Live trading |
| ---- | ---------------------------- | ---------- | ------------ |
| Manual everything (default) | `0` | off | read-only |
| Auto-execute what *you* scan | `0` | on | live |
| **Fully hands-free** | `> 0` (e.g. `300`) | **on** | **live (armed)** |

The loop changes *nothing* about risk: every auto-generated proposal still passes
the full policy engine + preflight, still needs live trading armed to submit, and
still obeys the kill switch, daily caps and cooldown. Each scan calls your LLM
provider, so a short interval costs tokens continuously - start around 5 minutes.
The interval is floored at 30s, and live trading still re-disarms on every
restart, so a reboot can't silently resume hands-free trading.

There is always a **kill switch** on the dashboard that halts all trading instantly.

## Trade quality & exit management

The bot is built to keep trade **quality** high, not volume - everything that
protects an entry or manages an exit is enforced server-side, not just asked of
the model:

- **Server-computed indicators.** Every market snapshot carries RSI(14),
  EMA(8/24), ATR%, realized volatility, Kaufman efficiency ratio, range
  position, a volume pulse, taker-flow imbalance and a **regime tag**
  (`trending-up/down`, `ranging`, `volatile`). The analyst is instructed to
  condition its playbook on the regime (momentum with the trend, mean-reversion
  in ranges, stand aside in volatility) instead of eyeballing raw candles.
- **Structured proposals.** Every proposal must state a `confidence`
  (low/medium/high) plus `target_price` and `invalidation_price`. The policy
  engine enforces a minimum reward/risk (`MIN_RISK_REWARD`); low-confidence
  proposals are **held for manual review even in auto-trade mode**; and the
  provider/model that made each call is stored for attribution.
- **Liquidity gates.** Entries are blocked when the live spread exceeds
  `MAX_ENTRY_SPREAD_BPS`, when 24h volume is under `MIN_VOLUME_24H`, or when
  walking the actual orderbook shows the proposed SIZE would sweep past the
  slippage cap (the touch can be tight while the depth behind it is dust).
- **Exposure caps.** Daily volume bounds activity, not accumulation - so net
  exposure is capped per pair (`PAIR_EXPOSURE_MULTIPLIER` x the per-trade cap)
  and in total across pairs (`MAX_OPEN_EXPOSURE`, XLM-equivalent).
- **Exit management (position monitor).** A background loop marks open
  positions to market every `POSITION_MONITOR_INTERVAL_SECONDS`. Unrealized
  losses count toward `MAX_DAILY_LOSS` and taper the per-trade size cap (full
  size for the first half of the budget, ramping to 25% at the limit). A
  position `STOP_LOSS_PCT` under water gets a **closing proposal** through the
  policy engine. Because a close is risk-REDUCING it **auto-executes whenever
  live (or paper) trading is armed - even in manual-approval mode** (only
  *entries* wait for your click), and it is exempt from cooldown, daily caps,
  staleness and the loss halt - a stop-loss can never be locked out or stranded
  waiting for approval (only the kill switch stops everything).
- **Resting-offer lifecycle.** A partially-filled order's resting remainder is
  tracked by offer id: later fills are booked into PnL/volume as they happen,
  and offers unfilled after `MAX_OFFER_AGE_MINUTES` are cancelled - a stale
  resting order fills exactly when the market turns against it.
- **Outcome tracking.** Every submitted trade gets +1h and +24h forward marks
  (side-adjusted % move vs the fill). The analyst sees its recent calls'
  outcomes in its context (a real feedback loop), and the data accumulates in
  SQL Server per provider/model/confidence - so you can measure whether a
  prompt, model or setting change actually improved the calls.
- **Stale proposals can't execute.** A proposal older than
  `MAX_PROPOSAL_AGE_SECONDS` is blocked at execution (mainly the
  manual-approval path) - re-analyze instead of filling at yesterday's price.
- **Fail-closed automation.** When auto-trade would submit unattended and live
  market data can't be fetched, the trade is blocked instead of skipping the
  market checks.

## Safety rules (baked in)

- The secret key is read only by the signer in your backend. It is **never**
  serialized into any AI prompt or tool result.
- Leave `STELLAR_SECRET` empty to run fully **read-only** (the AI can analyze and
  propose, but nothing can ever be submitted).
- **Boots disarmed.** Even *with* a secret, live trading starts **off** on every
  boot - the signer is armed only when you flip **Live trading** on in the
  dashboard, and that switch is disabled without a key. A restart never leaves it
  silently live.
- Use a **separate, small hot wallet** - never your main wallet.
- Both legs of every trade must be on your **asset whitelist**.
- Per-trade size, daily volume, daily trade count, slippage, cooldown **and a
  realized daily-loss limit** are all enforced server-side, re-checked again at
  execution time. The loss limit is driven by a real signed-FIFO PnL ledger (see
  *Realized PnL* below).
- **Pre-sign preflight.** Before signing, the backend confirms the wallet has a
  trustline for the asset it would receive and enough *spendable* balance for the
  asset it would give up (accounting for the XLM base reserve and funds already
  locked in resting offers). A doomed trade is blocked for free instead of
  burning a fee on-chain.
- **Submit-timeout reconciliation.** If Horizon times out (504), the signer polls
  for the transaction by hash rather than blindly resubmitting - so a slow network
  never turns into a duplicate trade.
- **Real fill accounting.** An offer can rest, fill partially, or fill at a better
  price than your limit. The backend reads the actual filled amount and volume-
  weighted price back from Horizon's `offerResults` and books *that* into the
  ledger and daily volume - not an assumed full fill. A resting or partial offer is
  logged as such. (It only falls back to "assume full fill at limit" when Horizon
  returns no offer result, e.g. on the timeout/poll path.)
- **Fee: bid the cap, pay the market.** The signer always bids `MAX_FEE_STROOPS` as
  its *maximum* fee, but Stellar charges only the market-clearing fee - so you pay
  the base fee in calm markets and more only under surge pricing, never above the
  cap. Bidding the ceiling means a trade still clears during congestion instead of
  being starved by a stale estimate.
- **Local by default.** The server binds to `127.0.0.1` (`BIND_HOST`), and an
  optional `DASHBOARD_TOKEN` gates the whole API. On mainnet it refuses to start
  without a database, so your daily caps survive a restart.

## Setup

Requires Node.js 20+ (built and tested on Node 22).

```bash
npm install              # backend deps
npm --prefix web install # Vue frontend deps
cp .env.example .env     # then edit .env  (on Windows: copy .env.example .env)
```

Edit `.env`. Minimum to just watch the AI analyze (read-only, no trading):

```
NETWORK=testnet
STELLAR_PUBLIC=G...your testnet account...
ANTHROPIC_API_KEY=sk-ant-...
# leave STELLAR_SECRET empty for read-only
```

To enable signing, add `STELLAR_SECRET=S...` for the **same** account.

### Use a different AI model

The analyst can run on any LLM, not just Claude. Set `AI_PROVIDER` plus a key
and model. `anthropic` (the default) uses the native Claude SDK with prompt
caching + extended thinking; every other provider speaks the OpenAI
chat-completions dialect, so OpenAI, DeepSeek, OpenRouter (one key for *any*
model), Groq, Mistral, xAI, Together, and local servers (Ollama, LM Studio) all
work via a base URL.

The dashboard has a **provider dropdown** so you can switch the active model
live. It lists every provider that has an API key configured on the backend
(providers with no key are hidden), so you can keep several keys in `.env` and
flip between them without a restart.

```
# OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o

# DeepSeek
AI_PROVIDER=deepseek
AI_API_KEY=sk-...
AI_MODEL=deepseek-chat

# OpenRouter (reach Claude, Gemini, Llama, ... with one key)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-...
AI_MODEL=anthropic/claude-sonnet-4.6

# Local (Ollama); any non-empty key works
AI_PROVIDER=ollama
AI_API_KEY=local
AI_BASE_URL=http://localhost:11434/v1
AI_MODEL=llama3.1
```

`ANTHROPIC_THINKING_BUDGET` only applies to the `anthropic` provider; the
OpenAI-compatible path ignores it.

Create + fund a testnet account at https://lab.stellar.org (Friendbot) or:

```bash
# generate a keypair, then fund it:
curl "https://friendbot.stellar.org/?addr=GYOURPUBLICKEY"
```

To trade a pair you must whitelist **both** assets, e.g.:

```
ASSET_WHITELIST=XLM,USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
```

## Run

**Development** (hot-reloading Vue + auto-restarting backend):

```bash
npm run dev
```

This runs both processes via `concurrently`: the Express API on **:3000** and the
Vite dev server on **:5175** (which proxies `/api` and the SSE stream to :3000).
Open **http://localhost:5175**.

**Production** (Express serves the built Vue app from `web/dist`):

```bash
npm run build    # builds the Vue app into web/dist
npm start        # serves UI + API on one origin
```

Open **http://localhost:3000**.

Either way: enter a base/quote pair (e.g. `XLM` / `USDC:GBBD47IF...`), click
**Refresh** to see the live orderbook, then **Ask AI** - or click **Scan chain**
to let the AI sweep the whole reputable-token universe at once. The AI's reasoning
and any proposals appear live; approve or reject from the card, or flip the
**Approve every trade ⟷ Auto-trade** toggle. The Evolution charts and Trade history
fill in as trades execute (and persist if SQL Server is configured).

## Database (optional persistence)

Without a database the app runs fully in-memory: everything works, but proposals,
logs, daily counters, the evolution charts and the trade history reset when you
restart. Point it at **Microsoft SQL Server** to persist trades and follow the
evolution over time.

Quickest local DB (Docker):

```bash
docker compose up -d     # starts SQL Server 2022 on localhost:1433
```

Then set the `SQLSERVER_*` values in `.env` (see `.env.example`; they ship filled
with the docker-compose defaults). Create the schema with the standalone
migration, then start:

```bash
docker compose up -d     # 1. start SQL Server 2022 on localhost:1433
npm run db:migrate       # 2. create the stellar_trader DB + dbo.Proposals schema
npm start                # 3. run (hydrates history, restores same-day caps)
```

`npm run db:migrate` runs the **same** idempotent bootstrap the app applies on
boot, just on its own - safe to run repeatedly, and it applies additive column
migrations to an existing database too. (If you skip it the app still auto-creates
everything on first boot; the command just lets you stand up or upgrade the schema
without starting the trader, which is handy for a least-privilege setup.)

On **mainnet** the app now refuses to start if SQL Server is configured but
unreachable - so a down database can't silently disarm `MAX_DAILY_LOSS` by running
in-memory. Override with `ALLOW_MAINNET_WITHOUT_DB=true` only if you accept
resettable caps.

### Moving to another machine

Everything needed is in the repo - on the new PC:

1. `npm install`, then `npm --prefix web install` (or just `npm run build`).
2. Copy your `.env` across (it holds the wallet secret + API key - **never commit it**).
3. `docker compose up -d` (or point `SQLSERVER_*` at your own SQL Server).
4. `npm run db:migrate` - creates the database + schema.
5. `npm run build && npm start` (or `npm run dev`).

The schema travels with the code; only the **data** (trade history / realized PnL)
lives in the old database. To carry it over, back up and restore the
`stellar_trader` database with your SQL Server tooling - a fresh `db:migrate`
starts empty.

### Database hardening

The `docker compose` defaults (the `sa` login, `TrustServerCertificate=true`) are
for local development only. For a database that touches real money, tighten it:

- **Don't run as `sa`.** Pre-create the `stellar_trader` database and a dedicated
  login granted only `db_datareader` + `db_datawriter`. The app's schema bootstrap
  (CREATE DATABASE / CREATE TABLE) needs elevated rights it then shouldn't keep, so
  create the schema once with an admin, then run the app on the limited login.
- **Skip the bootstrap on a locked-down login** by pointing the app at the ready
  database with `SQLSERVER_CONNECTION_STRING` - it will use the existing schema
  (and the idempotent `ALTER TABLE` migrations) rather than trying to `CREATE`.
- **Use real TLS.** Prefer `SQLSERVER_ENCRYPT=true` with a verified certificate
  (`SQLSERVER_TRUST_CERT=false`) instead of trusting any presented cert.
- **Keep the DB private.** Bind it to localhost or a private network; never expose
  port 1433 to the internet. Treat the password like the wallet secret - it's not
  in `.env.example`'s committed defaults for a reason.

## Recommended path

1. Run read-only and watch the AI analyze ("what would you do and why?").
2. Add a testnet `STELLAR_SECRET` and use **manual approval**.
3. Test thoroughly on **testnet**.
4. Only then consider a small **mainnet** hot wallet.
5. Tune the limits, and consider Auto-trade last.

## Going live on mainnet (from localhost)

Running against the real chain from your own machine is supported and is the
intended deployment - you keep the keys local and expose nothing. Walk this
checklist before flipping `NETWORK=public`:

1. **Fund a brand-new throwaway wallet** with only what you're willing to lose.
   Never reuse your main wallet's key. Keep `STELLAR_SECRET` and `STELLAR_PUBLIC`
   for the *same* account.
2. **Establish trustlines** on that wallet for every issued asset you want to
   trade (XLM needs none). The preflight check will block a trade for an asset you
   don't trust, but it can't create the trustline for you.
3. **Configure a database** (`SQLSERVER_*`). On mainnet the app refuses to start
   without one so your daily caps + realized PnL survive a restart. (Override only
   with `ALLOW_MAINNET_WITHOUT_DB=true` if you truly accept resettable caps.)
4. **Set real `SCAN_ASSETS`/`ASSET_WHITELIST`.** The curated scan defaults are
   mainnet issuers; double-check the issuer keys are the ones you intend.
5. **Tighten the risk limits** for real money: `MAX_AMOUNT_PER_TRADE`,
   `MAX_AMOUNT_PER_TRADE_HIGH` (the larger blue-chip cap), `MAX_DAILY_VOLUME`,
   `MAX_DAILY_LOSS`, `MAX_SLIPPAGE_BPS`, `TRADE_COOLDOWN_SECONDS`.
   Start small. `MAX_DAILY_LOSS` is now live - it halts trading once the day's
   realized loss hits the limit.
6. **Keep it loopback** (`BIND_HOST=127.0.0.1`, the default). If you must reach it
   from another device, set a strong `DASHBOARD_TOKEN` and put a TLS reverse proxy
   in front - never expose the raw API.
7. **Start in manual approval** (`AUTO_APPROVE_ENABLED=false`). Watch the realized
   PnL and open-positions panel accrue over real trades before considering
   Auto-trade.
8. **Arm live trading deliberately.** The bot boots read-only; submit your first
   real trade only after flipping **Live trading** on. It re-disarms on every
   restart, so re-arm consciously each session.
9. The **kill switch** halts everything instantly; keep the dashboard open.

Then build and run:

```bash
npm run build && npm start     # serves UI + API on http://127.0.0.1:3000
```

## API

| Method | Path                  | Purpose                              |
| ------ | --------------------- | ------------------------------------ |
| GET    | `/api/state`          | Full snapshot (config, daily, logs)  |
| GET    | `/api/stream`         | Server-Sent Events live feed         |
| GET    | `/api/balances`       | Account balances                     |
| GET    | `/api/market`         | Orderbook + recent trades (`?base=&quote=`) |
| GET    | `/api/trades`         | Paginated persisted history (`?limit=&offset=&status=`) |
| GET    | `/api/evolution`      | Cumulative volume / trades / PnL series |
| POST   | `/api/analyze`        | Ask the AI about one pair (`{ base, quote }`) |
| POST   | `/api/scan`           | Scan the curated reputable-token universe |
| POST   | `/api/approve/:id`    | Approve a pending proposal           |
| POST   | `/api/auto-approve/:id` | Execute a proposal without the manual click (policy still enforced) |
| POST   | `/api/reject/:id`     | Reject a pending proposal            |
| POST   | `/api/kill`           | Kill switch (`{ active }`)           |
| POST   | `/api/auto-approve`   | Toggle auto-trade mode (`{ enabled }`) |
| POST   | `/api/live-trading`   | Arm/disarm live trading (`{ enabled }`); refused with no secret |
| POST   | `/api/provider`       | Switch the active AI provider (`{ id }`); key-gated |

## Project layout

```
src/
  config.ts            env + network + risk limits + per-provider AI catalog
  types.ts             shared types
  time.ts              configurable timezone: day key + day-start for daily caps
  stellar/
    client.ts          Horizon server
    assets.ts          "XLM" / "CODE:ISSUER" parsing
    market.ts          read-only: balances, orderbook, trades, indicator-enriched stats
    indicators.ts      RSI/EMA/ATR/realized-vol/regime + orderbook walk (pure math)
    universe.ts        curated reputable-token set + risk tiers (chain scan)
    builder.ts         build manageSellOffer / manageBuyOffer + cancel-offer (capped fee)
    preflight.ts       pre-sign trustline + spendable-balance gate
    signer.ts          holds the key, signs + submits, reconciles timeouts + reads fills
  policy/engine.ts     the hard risk gate: loss caps (realized+unrealized), liquidity
                       gates, exposure caps, reward/risk, taper, risk-reducing exemptions
  ai/
    index.ts           provider registry: live switching + dashboard catalog
    types.ts           the provider-agnostic AiProvider interface
    anthropic.ts       native Claude SDK (prompt caching + extended thinking)
    openai.ts          OpenAI-compatible dialect (OpenAI, DeepSeek, OpenRouter, local, ...)
  claude/
    tools.ts           tool schemas (incl. propose_stellar_trade)
    agent.ts           provider-agnostic tool-use loop (trade memory, market grounding)
  trading/
    store.ts           in-memory state + SSE fan-out + DB write-through
    positions.ts       signed-FIFO realized-PnL ledger (XLM-normalized) + open positions
    orchestrator.ts    proposal -> policy -> preflight -> approval/auto-trade -> sign (serial lock)
    monitor.ts         exit management: mark-to-market, stop-loss closes, resting-offer
                       fills + stale-offer cancels, +1h/+24h outcome marks, late landings
    autopilot.ts       hands-free chain-scan loop (AUTO_SCAN_INTERVAL_SECONDS)
  db/
    pool.ts            SQL Server connection pool + schema bootstrap/migration (optional)
    repo.ts            trade persistence + history/evolution queries
  server.ts            Express API + SSE + serves the built Vue app
web/                   Vue 3 + Vite + TS dashboard
  src/
    stores/trader.ts   Pinia store: SSE + REST, mode toggle, pagination
    components/        TopBar, Stats, Positions, Market, Proposals, Evolution, History, Log
    api.ts             typed REST client
docker-compose.yml     local Microsoft SQL Server for development
```

## Honest limitations

- **State is in-memory unless you configure SQL Server.** With a database, trades and
  daily counters persist (history + evolution charts survive restarts); logs and the
  live in-memory proposal list are still ephemeral. Without one, everything resets on
  restart - which is why mainnet refuses to boot without a database.
- **Realized PnL measures *this system's own* round-trips**, via a signed-FIFO lot
  ledger normalized to **XLM** (a buy then a later sell, or vice-versa). Each leg is
  booked at the *actual* filled amount and price read back from Horizon, not an
  assumed full fill - so partial and price-improved fills are accounted correctly.
  It does **not** mark-to-market pre-existing holdings (their cost basis is unknown).
  Normalizing to XLM lets a single `MAX_DAILY_LOSS` cap span trades that settle
  against different quotes; the conversion uses the realizing fill's own price, which
  is exact when one leg is XLM and an approximation otherwise. It drives the live
  `MAX_DAILY_LOSS` guard and the open-positions panel. Treat it as honest feedback on
  the bot's calls, not a full portfolio accounting.
- **Resting/later fills ARE now reconciled - within limits.** The position
  monitor tracks each resting offer by id, books later fills at the offer's own
  price (a maker fills at its quoted price) and cancels offers older than
  `MAX_OFFER_AGE_MINUTES`. Remaining gaps: fills are detected at the monitor's
  cadence (not per-ledger), a fill that lands in the same ledger as our cancel
  can escape booking, and offers that pre-date tracking are warn-only (the
  monitor won't cancel an offer it didn't place).
- **LLM-driven DEX trading is unproven alpha.** Nothing here guarantees profit. Run
  read-only or in manual approval first, watch the realized PnL accumulate, and only
  risk capital you can lose. The risk caps limit *losses per day*; they do not make a
  strategy profitable.
- **Classic DEX only** (`manageSellOffer` / `manageBuyOffer`). Soroban/AMM contract
  calls (simulate -> sign -> submit via Stellar RPC) are not included.
- Single account, single user. The dashboard has an **optional** shared-secret token
  (`DASHBOARD_TOKEN`) and binds to loopback by default; it is not multi-user auth.
```
