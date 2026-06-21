# Feature Gap Analysis — Stellar AI Trading Bot vs. LOBSTR.co

*Generated from a direct read of the implemented codebase (see file/function
references throughout) and sourced research of LOBSTR.co's publicly documented
features. LOBSTR is treated as a reference-grade consumer Stellar wallet +
trading platform; this project is an **automated AI trading bot with a watch
dashboard**, so several "gaps" are wallet/product features that are out of scope
for the bot's current purpose — flagged where relevant.*

---

## Section 1 — Current Bot Feature Inventory

Verified against source. Asset trading is **SDEX-only** via `manageSellOffer` /
`manageBuyOffer` ([builder.ts](src/stellar/builder.ts)); there is no path
payment, claimable balance, AMM, or arbitrary payment send in the codebase.

### Trading core
- **AI analyst loop** — `analyze()` (single pair) and `analyzeChain()` (curated
  universe + cross pairs) in [agent.ts](src/claude/agent.ts). Tool schemas in
  [tools.ts](src/claude/tools.ts): `get_account_balances`, `get_market`,
  `get_price_history`, `propose_stellar_trade`, `set_stop_loss`,
  `update_stop_loss`, `cancel_stop_loss`.
- **Multi-LLM providers** — Anthropic (native SDK) + OpenAI-compatible (OpenAI,
  DeepSeek, OpenRouter, Groq, Mistral, xAI, Together) in [src/ai/](src/ai),
  runtime-switchable via `POST /api/provider` → `store.setAiProvider`.
- **Orchestrator** [orchestrator.ts](src/trading/orchestrator.ts) — `runAnalysis`,
  `runChainScan`, `intake` (policy → approval/auto routing), `execute`/
  `executeInner` (build → sign → submit), `submitSystemProposal`,
  `placeManualOrder`, `approve`/`autoApprove`/`reject`, `runExclusive` serial
  lock, maker-first repricing (`makerLimitPrice`), paper-fill simulation
  (`simulatePaperFill`), on-chain fill reconciliation (`reconcileOfferFill`).
- **Order types** — Limit (resting maker, `post_only`) and marketable-limit
  (crossing taker). No native "market" or "stop" order type on SDEX; stops are
  monitored (below).
- **Policy risk engine** [engine.ts](src/policy/engine.ts) `checkPolicy` — kill
  switch, asset whitelist, **per-trade size cap (now split by initiator — manual
  exempt, AI/system enforced)**, daily volume/trade/loss caps + loss-budget size
  taper, declared-slippage + price-deviation, size-vs-depth book walk, entry
  spread + min-24h-volume gates, per-pair + total XLM exposure caps, reward/risk
  ratio, proposal staleness, cooldown, crossing-maker guard. `isRiskReducing`
  exempts closes.
- **Manual order placement** — `placeManualOrder` + `POST /api/order`, UI form in
  [MarketPanel.vue](web/src/components/MarketPanel.vue).

### Position management & monitoring
- **Position monitor** [monitor.ts](src/trading/monitor.ts) — mark-to-market +
  unrealized PnL, stop-loss exits, resting-offer reconciliation + stale-offer
  cancel, +1h/+24h outcome marks, late-landing recheck for timed-out submits,
  stop-loss lifecycle reconciliation.
- **Stop-loss system** [stopLossService.ts](src/trading/stopLossService.ts)
  (`IStopLossService`) — manual + AI, `SetBy` (manual|ai), direction-aware
  trail-only, conflict resolution, retry/alert; persisted `dbo.StopLosses` +
  `dbo.StopLossAudit`; UI + audit on [TokenDetail.vue](web/src/components/TokenDetail.vue);
  AI tools enforced by the independent monitor.
- **Liquidity scanner** [liquidityScanner.ts](src/trading/liquidityScanner.ts) +
  [src/liquidity/](src/liquidity) — hourly top-N assets by measured 24h XLM
  volume, trend/consistency analysis, "worth watching" recommendations,
  `GetLiquidityRecommendations()`, persisted `dbo.LiquiditySnapshots`,
  [LiquidityPanel.vue](web/src/components/LiquidityPanel.vue).
- **PnL ledger** [positions.ts](src/trading/positions.ts) — signed-FIFO realized
  PnL normalized to XLM, cross-pair XLM-rate map, cumulative evolution series.

### Market data & dashboard
- **Stellar/Horizon layer** [src/stellar/](src/stellar) — order book
  (`getOrderbook`, `getMarketSnapshot`), OHLC candles (`getTradeAggregations`,
  paginated), balances + open offers, asset discovery (`listAssets`),
  best-market resolution (`resolveBestQuote`), server-computed indicators
  (RSI/EMA/ATR/regime + `walkBook`), curated token universe + risk tiers
  ([universe.ts](src/stellar/universe.ts)).
- **Token detail page** — clickable token list → live order book (30s refresh) +
  price chart with Hour/Day/Week/Year timeframes (`GET /api/orderbook`,
  `/api/candles`), [TokenDetail.vue](web/src/components/TokenDetail.vue) /
  [TokenChart.vue](web/src/components/TokenChart.vue).
- **Dashboard** (Vue 3 + Pinia + Chart.js, SSE-live) — stats, positions,
  market + manual order form, proposals, evolution charts, liquidity panel,
  paginated trade + log history.
- **Paper-trading mode** — simulated fills against the live book (no keys/chain).
- **Backtest suite** [src/backtest/](src/backtest) — data/engine/metrics/
  strategy/sizing/walk-forward/search with t-stat/CI + depth haircut.

### Infra & safety
- **Persistence** [src/db/](src/db) — SQL Server (mssql): `Proposals`, `Logs`,
  `LiquiditySnapshots`, `StopLosses`, `StopLossAudit`; in-memory fallback.
- **State + SSE** [store.ts](src/trading/store.ts) — single source of truth,
  live/paper/auto-approve/kill toggles, daily counters, serialized writes,
  boot hydration.
- **Server/API** [server.ts](src/server.ts) — Express + SSE + static SPA; CSRF
  guard ([csrf.ts](src/csrf.ts)), optional `DASHBOARD_TOKEN` bearer/query auth,
  loopback-bind default, **read-only by default** (no secret ⇒ cannot sign),
  kill switch, live-arm switch, mainnet-without-DB boot guard, opt-in
  `AUTO_ARM_LIVE_TRADING`.
- **Wallet model** — a **single hot wallet** from `STELLAR_SECRET`; reads
  balances + open offers; trustlines via a CLI script
  ([trustlines.ts](src/stellar/trustlines.ts), `npm run trustlines`), not the UI.

---

## Section 2 — Feature Comparison Table

`MISSING` = LOBSTR has it, this bot does not · `PRESENT` = both · `BOT-ONLY` =
this bot has it, LOBSTR does not.

| Feature | LOBSTR.co | This Bot |
|---|---|---|
| **Account & wallet** | | |
| Single wallet from a key | Yes | **PRESENT** (`STELLAR_SECRET`) |
| Multi-account / multi-wallet | Yes (v11+) | **MISSING** |
| Mnemonic/seed backup & restore | Yes (12/24-word) | **MISSING** |
| Import wallet (public/secret key) | Yes (v12.1) | **MISSING** (env only) |
| **Trading** | | |
| Limit orders | Yes | **PRESENT** (`post_only` maker) |
| Market / marketable orders | Yes | **PRESENT** (crossing taker) |
| Stop-loss / stop orders | **No** | **BOT-ONLY** (manual + AI + monitor) |
| AI-proposed trades | No | **BOT-ONLY** |
| Maker-first spread capture | No (manual) | **BOT-ONLY** |
| Risk/policy engine (caps, slippage, R/R) | No | **BOT-ONLY** |
| Paper-trading / forward test | No | **BOT-ONLY** |
| Backtesting (walk-forward, t-stat) | No | **BOT-ONLY** |
| **Order book & history** | | |
| Live order book display | Yes | **PRESENT** (token detail) |
| Tap order book to fill price | Yes | **MISSING** (display only) |
| Open/active offers ("My Orders") | Yes | **PRESENT** (proposals/offer tracking) |
| Trade/offer history | Yes | **PRESENT** (history table + DB) |
| **Portfolio** | | |
| Balances + total value | Yes | **PRESENT** (balances; XLM-equiv via ledger) |
| Realized/unrealized P&L | **No** | **BOT-ONLY** (FIFO ledger + marks + charts) |
| Asset-allocation breakdown | Unverified/No | **MISSING** (no allocation view) |
| Performance-over-time chart | Unverified/No | **PRESENT-ish** (evolution charts) |
| **Alerts & notifications** | | |
| Price alerts | Yes | **MISSING** |
| Push notifications | Yes (payments/CB) | **MISSING** (SSE log feed only) |
| **Discovery & listings** | | |
| Curated/verified asset lists | Yes | **PRESENT** (curated universe) |
| Asset info pages + charts | Yes | **PRESENT** (token detail) |
| Liquidity/volume trend tracking | No | **BOT-ONLY** (scanner + recs) |
| Asset search / add custom by domain | Yes | **MISSING** (whitelist via env) |
| **Liquidity & DEX** | | |
| SDEX trading | Yes | **PRESENT** |
| AMM pools (provide/deposit/withdraw) | Partial (Aquarius) | **MISSING** (reads LP balances only) |
| Path-payment swaps (multi-hop) | Yes | **MISSING** |
| Smart/split-route swap | Yes | **MISSING** |
| **Stellar-specific** | | |
| Trustline add/remove (in UI) | Yes | **MISSING** (CLI script only) |
| Claimable balances (claim/send) | Yes | **MISSING** |
| Path payments | Yes | **MISSING** |
| Federation addresses (`name*domain`) | Yes | **MISSING** |
| Send/receive payments | Yes | **MISSING** (trades only) |
| QR receive + payment requests | Yes | **MISSING** |
| Soroban / dApp signing | Partial | **MISSING** |
| WalletConnect | Yes | **MISSING** |
| **Security** | | |
| 2FA | Yes | **MISSING** (shared token only) |
| Dashboard token / CSRF / loopback | n/a | **BOT-ONLY** (operator hardening) |
| Read-only-by-default + kill switch | No | **BOT-ONLY** |
| Multisig (Vault) | Yes | **MISSING** |
| Hardware wallet (Ledger) | Yes (web) | **MISSING** |
| **Analytics & reporting** | | |
| CSV transaction export | Yes | **MISSING** (data in DB, no export) |
| Tax reports | No (3rd-party) | **MISSING** (parity: neither native) |
| AI calibration / outcome tracking | No | **BOT-ONLY** (+1h/+24h marks) |
| **Fiat & platform** | | |
| Fiat on/off ramp (MoonPay/Stripe) | Yes | **MISSING** |
| Mobile apps (iOS/Android) | Yes | **MISSING** (web only) |
| Address book / contacts | Unverified | **MISSING** |

---

## Section 3 — Missing Features: Prioritized Implementation Plan

**Priority = User Impact (1–5) + Inverse Complexity (High=1, Med=2, Low=3).**
Higher = build first. Ties broken by lower complexity / fewer dependencies.

| # | Feature | Impact | Complexity | Priority |
|---|---|---|---|---|
| 1 | Trustline management (UI/API) | 4 | Low (3) | **7** |
| 2 | CSV trade/transaction export | 3 | Low (3) | **6** |
| 3 | Portfolio asset-allocation view | 3 | Low (3) | **6** |
| 4 | Send / receive payments | 4 | Med (2) | **6** |
| 5 | Price alerts | 4 | Med (2) | **6** |
| 6 | Path-payment swap (any-asset) | 4 | Med (2) | **6** |
| 7 | Tap-order-book-to-fill | 2 | Low (3) | **5** |
| 8 | Federation address (resolve + claim) | 2 | Low (3) | **5** |
| 9 | QR receive + payment requests | 2 | Low (3) | **5** |
| 10 | Claimable balances (claim/send) | 3 | Med (2) | **5** |
| 11 | Push / browser notifications | 3 | Med (2) | **5** |
| 12 | 2FA / dashboard auth hardening | 3 | Med (2) | **5** |
| 13 | Key mgmt: mnemonic backup/import | 4 | High (1) | **5** |
| 14 | Asset search / add custom by domain | 2 | Med (2) | **4** |
| 15 | Multi-account / multi-wallet | 3 | High (1) | **4** |
| 16 | Fiat on/off ramp (MoonPay) | 3 | High (1) | **4** |
| 17 | AMM liquidity pools (LP deposit/withdraw) | 3 | High (1) | **4** |
| 18 | Mobile app | 3 | High (1) | **4** |
| 19 | Hardware wallet (Ledger) | 2 | High (1) | **3** |
| 20 | Multisig (Vault-style) | 2 | High (1) | **3** |
| 21 | WalletConnect / dApp signing | 2 | High (1) | **3** |

### Detail for the top-priority missing features

**1. Trustline management (UI/API) — Priority 7**
- *Why:* the bot can only trade assets it already trusts; new whitelist assets
  require a CLI run. In-UI add/remove unlocks holding/trading any asset.
- *Dependencies:* none — `Operation.changeTrust` already used in
  [trustlines.ts](src/stellar/trustlines.ts).
- *Approach:* extract the changeTrust build/submit from the script into a
  `src/stellar/trustlines.ts` exported function; add `GET /api/trustlines`
  (from balances) + `POST /api/trustlines` (add) + `POST /api/trustlines/remove`
  (zero-limit changeTrust) in [server.ts](src/server.ts), routed through
  `runExclusive` + the live-arm/kill gates; small Vue panel listing trustlines
  with add (code+issuer or home-domain lookup) and remove buttons.

**2. CSV trade/transaction export — Priority 6**
- *Why:* operators/users need records for accounting; LOBSTR offers CSV, this
  bot has the data but no export.
- *Dependencies:* none — data is in `dbo.Proposals` / `store`.
- *Approach:* `GET /api/trades.csv` in [server.ts](src/server.ts) streaming
  `repo.listTrades` (all rows, not paginated) as CSV; "Export CSV" button in
  [HistoryTable.vue](web/src/components/HistoryTable.vue).

**3. Portfolio asset-allocation view — Priority 6**
- *Why:* a balances list doesn't show concentration; an allocation breakdown is
  table-stakes portfolio UX.
- *Dependencies:* XLM rate map (`xlmRateFor`/`xlmNotional` in
  [positions.ts](src/trading/positions.ts)) — already populated by the
  scanner/monitor.
- *Approach:* compute XLM-equivalent per balance, render a Chart.js Doughnut in a
  new `PortfolioPanel.vue`; reuse `getBalances` + the rate map (no new Horizon
  calls).

**4. Send / receive payments — Priority 6**
- *Why:* a reference wallet must move assets, not only trade them.
- *Dependencies:* trustline check (preflight), signer.
- *Approach:* `Operation.payment` (same asset) and
  `Operation.pathPaymentStrictSend` (cross-asset) builders in
  [builder.ts](src/stellar/builder.ts); `POST /api/pay` through
  `runExclusive` + preflight + live-arm/kill gates; a Send form + Receive
  (address/QR) panel.

**5. Price alerts — Priority 6**
- *Why:* lets the operator react without watching; LOBSTR has it, the bot only
  logs.
- *Dependencies:* the position monitor loop (a place to evaluate alerts cheaply).
- *Approach:* `dbo.PriceAlerts` table + repo helpers (mirror the stop-loss
  shape), an `AlertService`, a check folded into the monitor tick using
  `getMarketSnapshot`/`getOrderbook`; surface fired alerts on the SSE `state`/
  `log` channel and (later) browser notifications.

**6. Path-payment swap (any-asset) — Priority 6**
- *Why:* one-click "swap A→B" is the most-used DEX action; the bot only places
  raw offers.
- *Dependencies:* path finding.
- *Approach:* `server.strictSendPaths()` / `strictReceivePaths()` for routing +
  `Operation.pathPaymentStrictSend/Receive`; `GET /api/paths` + `POST /api/swap`;
  a Swap UI on the token detail page.

*(Features 7–21 follow the same template; see the roadmap in Section 6 for
implementation steps, acceptance criteria, effort, and risks on the build-order
subset.)*

---

## Section 4 — Bot-Only Advantages

Features this bot has that LOBSTR does not, and whether each is
**externalizable** (could be exposed to end users if productized):

| Advantage | Externalizable? |
|---|---|
| **AI trade proposals** (analyze → scan → propose loop, multi-LLM) | **Yes** — flagship differentiator; gate behind per-user keys/limits |
| **AI-controlled stop losses + trailing** (LOBSTR has *no* stops at all) | **Yes** — high-value; pairs with manual stops |
| **Stop-loss system** (manual + AI + independent monitor + audit) | **Yes** — LOBSTR users would adopt this immediately |
| **Liquidity trend scanner** (top-N by volume + "worth watching" recs) | **Yes** — a discovery feed; pure observe-only |
| **Policy risk engine** (size/exposure/loss caps, slippage, reward/risk) | **Partly** — per-user risk presets; some is operator-only |
| **Paper-trading mode** | **Yes** — risk-free onboarding |
| **Backtesting suite** (walk-forward, t-stat/CI, depth haircut) | **Yes** — "prove a strategy before you run it" |
| **Realized/unrealized P&L ledger + evolution charts** (LOBSTR has none) | **Yes** — closes LOBSTR's biggest analytics gap |
| **AI outcome tracking** (+1h/+24h side-adjusted marks per call/model) | **Yes** — transparency/calibration feature |
| **Maker-first execution** (spread capture, stale-offer cancel) | **Partly** — execution quality, mostly under the hood |
| **Operator safety rails** (read-only default, kill switch, live-arm, CSRF, token auth) | **Partly** — repackage as account security |

The cluster of **AI proposals + AI/auto stop-losses + risk engine + backtesting +
P&L analytics** is genuinely beyond what LOBSTR offers and is the strongest basis
for productization.

---

## Section 5 — Recommended Next 3 Features to Build

1. **Trustline management (UI/API)** — *Priority 7, lowest effort.* Unblocks
   holding/trading any asset from the dashboard; `changeTrust` logic already
   exists, so it is a thin extract + endpoint + panel. Highest score, fastest win.
2. **Send / receive payments** — *Priority 6.* The single biggest "this is a
   trading tool, not a wallet" gap; converts the bot toward a usable wallet and
   is a prerequisite for swaps and claimable balances.
3. **Price alerts** — *Priority 6, reuses the monitor.* High perceived value for
   low marginal cost (the monitor loop already fetches prices each tick), and it
   lays the notification plumbing the rest of the roadmap builds on.

---

## Section 6 — Full Implementation Roadmap

Phases group missing features by effort. Each feature lists numbered,
codebase-specific steps, acceptance criteria, effort, and risks.

### Phase 1 — Quick Wins (Low complexity, high impact)

**1.1 Trustline management** — add/remove trustlines from the dashboard.
1. Refactor [trustlines.ts](src/stellar/trustlines.ts): export
   `buildAddTrustline(asset)` / `buildRemoveTrustline(asset)` (zero-limit
   changeTrust) returning unsigned txs; keep the CLI as a thin caller.
2. Add endpoints in [server.ts](src/server.ts): `GET /api/trustlines` (derive
   from `getBalances`), `POST /api/trustlines` `{code, issuer}`,
   `POST /api/trustlines/remove` `{code, issuer}` — each via `runExclusive`,
   `isReadOnly`/`liveTrading`/`killSwitch` gates, `signOnly`+`submitSigned`.
3. Horizon: none new (account load via existing client); op = `changeTrust`.
4. UI: `TrustlinesPanel.vue` listing current trustlines with a remove button and
   an add form (code + issuer, or home-domain TOML lookup).
- *Acceptance:* add a new asset's trustline → it appears in balances at 0;
  remove a zero-balance trustline → it disappears and 0.5 XLM reserve frees;
  removing a non-zero trustline is blocked with a clear error.
- *Effort:* 0.5–1 day. *Risks:* removing a trustline with a non-zero balance
  fails on-chain — pre-check balance and block in the UI; base-reserve math.

**1.2 CSV trade/transaction export** — download full trade history.
1. `GET /api/trades.csv` in [server.ts](src/server.ts) → `repo.listTrades` with a
   large/looped limit; stream `text/csv` with a header row.
2. UI: "Export CSV" button in [HistoryTable.vue](web/src/components/HistoryTable.vue)
   hitting the endpoint with the auth token.
- *Acceptance:* exported CSV row count equals the DB total; opens cleanly in a
  spreadsheet; respects `DASHBOARD_TOKEN`.
- *Effort:* 0.5 day. *Risks:* CSV injection (prefix `=,+,-,@` cells); large
  exports — stream rather than buffer.

**1.3 Portfolio asset-allocation view** — allocation doughnut + XLM-equiv values.
1. New `PortfolioPanel.vue`: consume `store.balances` + the XLM rate map exposed
   via a small `GET /api/portfolio` (balance × `xlmNotional`).
2. Render a Chart.js `Doughnut` (already a dependency) of XLM-equivalent weights.
- *Acceptance:* slices sum to ~100%; unpriced assets grouped as "unknown";
  updates on balance refresh.
- *Effort:* 0.5 day. *Risks:* assets with no XLM rate (label "unpriced", exclude
  from %); dust rounding.

**1.4 Tap-order-book-to-fill** — click a book level to prefill the order form.
1. Emit a click handler on book rows in
   [TokenDetail.vue](web/src/components/TokenDetail.vue) / MarketPanel that sets
   the order form's `limitPrice` (and optionally amount) in the store.
- *Acceptance:* clicking a bid/ask populates the manual-order price field.
- *Effort:* 0.25 day. *Risks:* none material.

### Phase 2 — Core Gaps (Medium complexity)

**2.1 Send / receive payments** — move assets, not just trade.
1. [builder.ts](src/stellar/builder.ts): `buildPayment({destination, asset, amount})`
   and `buildPathPaymentSend({destination, sendAsset, destAsset, ...})`.
2. [server.ts](src/server.ts): `POST /api/pay` via `runExclusive` + `preflightCheck`
   + live-arm/kill gates; validate destination (`StrKey`/federation).
3. Horizon: `Operation.payment`, `Operation.pathPaymentStrictSend`; recipient
   account existence via `loadAccount`.
4. UI: `SendPanel.vue` (recipient, asset, amount) + a Receive view (address + QR).
- *Acceptance:* a same-asset payment to a funded account settles; sending to an
  unfunded/ no-trustline account is blocked with a clear reason; path payment
  delivers the destination asset.
- *Effort:* 2–3 days. *Risks:* sending to accounts lacking a trustline; memo
  requirements for exchange deposits; irreversibility — add a confirm step.

**2.2 Price alerts** — notify on price thresholds.
1. `dbo.PriceAlerts` table + repo helpers (mirror `dbo.StopLosses`); an
   `AlertService` (constructor-injected like `StopLossService`).
2. Fold an alert check into the [monitor.ts](src/trading/monitor.ts) tick
   (reuse the `SnapCache`); fire via `store.log` + a new `alert` SSE event.
3. UI: alert form on the token detail page + an alerts list.
- *Acceptance:* an above/below alert fires once when crossed and is marked
  triggered; survives restart (DB-hydrated).
- *Effort:* 2 days. *Risks:* duplicate fires (dedupe like stop-loss); thin-market
  price spikes (use mid, require confirmation tick).

**2.3 Path-payment swap (any-asset)** — one-click A→B.
1. `GET /api/paths` using `server.strictSendPaths()`/`strictReceivePaths()`;
   `POST /api/swap` building `pathPaymentStrictSend` with a slippage-bounded
   `destMin`.
2. UI: Swap panel (from/to asset, amount, quoted rate, slippage).
- *Acceptance:* a quoted swap executes within the slippage bound; no-path is
  surfaced; `destMin` protects against adverse fills.
- *Effort:* 2–3 days. *Risks:* path staleness between quote and submit; setting
  `destMin` too tight (fails) or too loose (slippage).

**2.4 Claimable balances** — claim "pending payments"; send claimables.
1. `GET /api/claimable` (`server.claimableBalances().claimant(pub)`);
   `POST /api/claimable/:id/claim` (`Operation.claimClaimableBalance`); optional
   `Operation.createClaimableBalance` to send.
2. UI: a "Pending payments" list with Claim buttons.
- *Acceptance:* a claimable addressed to the account is listed and claimable;
  trustline auto-handled or prompted.
- *Effort:* 1.5–2 days. *Risks:* claim predicates (not-yet-claimable windows);
  missing trustline on claim.

**2.5 Push / browser notifications** — surface alerts/fills off-screen.
1. Browser `Notification` API driven by the existing SSE `alert`/`proposal`/`log`
   events in [trader.ts](web/src/stores/trader.ts); optional Web Push (VAPID) for
   true background delivery.
- *Acceptance:* a fired alert/stop raises a desktop notification when permitted.
- *Effort:* 1–2 days (in-page) / +2 days (Web Push). *Risks:* permission UX;
  Web Push needs a service worker + VAPID keys.

**2.6 2FA / dashboard auth hardening** — TOTP on top of the token.
1. Add TOTP (e.g. `otplib`) enrolment + verification layered on the existing
   `DASHBOARD_TOKEN` middleware in [server.ts](src/server.ts); store the secret
   server-side (config/DB).
- *Acceptance:* state-changing `/api` calls require a valid TOTP after login;
  health/read endpoints unaffected.
- *Effort:* 2 days. *Risks:* lockout/recovery; clock skew; this is operator auth,
  not on-chain security.

### Phase 3 — Advanced (High complexity or lower priority)

**3.1 Key management: mnemonic backup & import** — BIP39 seed, encrypted at rest.
1. `stellar-hd-wallet`/BIP39 for mnemonic ↔ keypair; encrypted keystore replacing
   the raw `STELLAR_SECRET` env; backup/reveal + import flows behind 2FA.
- *Acceptance:* generate → back up → restore yields the same account; secret is
  never logged or sent to the client in plaintext.
- *Effort:* 3–5 days. *Risks:* **security-critical** (a prior exposed-secret
  incident exists); never expose the secret over the API; encryption-at-rest.

**3.2 Multi-account / multi-wallet** — manage several accounts.
1. Key the [store.ts](src/trading/store.ts) state, signer, and DB rows by account
   id; add account switch in the API + UI; per-account policy/daily counters.
- *Acceptance:* switching accounts isolates balances, positions, proposals, and
  caps; the monitor manages each independently.
- *Effort:* 5–8 days (significant refactor). *Risks:* global singletons
  (signer, ledger, daily counters) assume one account; serial-lock scoping.

**3.3 Fiat on/off ramp** — buy/sell with card via a provider.
1. Integrate MoonPay/Stripe widget (hosted), keyed to the account address.
- *Acceptance:* a test-mode purchase credits the account.
- *Effort:* 3–5 days + provider onboarding/KYC. *Risks:* compliance/KYC; provider
  contracts; mostly an embed, little on-chain code.

**3.4 AMM liquidity pools** — provide/withdraw liquidity.
1. `Operation.liquidityPoolDeposit/liquidityPoolWithdraw`; pool data via
   `server.liquidityPools()`; LP balance already surfaced as `LP:<id>` in
   [market.ts](src/stellar/market.ts).
- *Acceptance:* deposit into a pool mints LP shares; withdraw returns the
  underlying.
- *Effort:* 3–4 days. *Risks:* price bounds on deposit; impermanent-loss UX;
  pool-share accounting in the PnL ledger.

**3.5 Mobile app** — native or PWA.
1. Quick path: make the SPA a PWA (manifest + service worker) for installability;
   full path: a React Native/Flutter client on the same API.
- *Acceptance:* installable, usable on a phone screen.
- *Effort:* 3 days (PWA) / weeks (native). *Risks:* secure auth on mobile; SSE on
  background.

**3.6 Hardware wallet (Ledger)** — sign on-device (web).
1. `@ledgerhq/hw-app-str` + WebHID in the browser; backend builds the tx, the
   device signs, the backend submits.
- *Acceptance:* a trade signs on a Ledger and submits.
- *Effort:* 4–6 days. *Risks:* browser transport quirks; changes the
  build→sign→submit flow (signing moves client-side).

**3.7 Multisig (Vault-style)** — n-of-m signing.
1. Set account signers/thresholds (`Operation.setOptions`); collect signatures;
   submit when threshold met.
- *Acceptance:* a 2-of-3 account requires two signatures to submit.
- *Effort:* 6–10 days. *Risks:* tx envelope coordination; conflicts with the
  single-hot-wallet auto-trading model.

**3.8 WalletConnect / dApp signing** — sign external requests.
- *Effort:* 4–6 days. *Risks:* arbitrary-tx signing security; least aligned with
  an automated trading bot.

### Roadmap summary table

| Phase | Feature | Effort | Depends On | Priority |
|---|---|---|---|---|
| 1 | Trustline management | 0.5–1 d | — | 7 |
| 1 | CSV export | 0.5 d | — | 6 |
| 1 | Asset-allocation view | 0.5 d | XLM rate map | 6 |
| 1 | Tap-book-to-fill | 0.25 d | — | 5 |
| 2 | Send / receive payments | 2–3 d | trustlines | 6 |
| 2 | Price alerts | 2 d | monitor loop | 6 |
| 2 | Path-payment swap | 2–3 d | send/receive | 6 |
| 2 | Claimable balances | 1.5–2 d | trustlines | 5 |
| 2 | Push notifications | 1–4 d | price alerts | 5 |
| 2 | 2FA hardening | 2 d | — | 5 |
| 3 | Key mgmt (mnemonic) | 3–5 d | 2FA | 5 |
| 3 | Multi-account | 5–8 d | key mgmt | 4 |
| 3 | Fiat on/off ramp | 3–5 d | — | 4 |
| 3 | AMM liquidity pools | 3–4 d | — | 4 |
| 3 | Mobile (PWA→native) | 3 d–weeks | — | 4 |
| 3 | Hardware wallet | 4–6 d | — | 3 |
| 3 | Multisig | 6–10 d | key mgmt | 3 |
| 3 | WalletConnect | 4–6 d | — | 3 |

### Recommended build order

1. **Trustline management** *(Phase 1)* — highest priority, lowest effort, and a
   prerequisite for holding any asset that send/receive and claimable balances
   will move.
2. **CSV export** *(Phase 1)* — near-zero risk, immediate operator value; no
   dependencies, so it ships alongside #1.
3. **Asset-allocation view** *(Phase 1)* — reuses the existing rate map; rounds
   out the portfolio surface before adding money-movement features.
4. **Send / receive payments** *(Phase 2)* — the foundational money-movement
   primitive; swaps and claimable balances build directly on its builder + gates.
5. **Price alerts** *(Phase 2)* — slots into the monitor loop cheaply and
   establishes the notification plumbing #6 reuses.
6. **Push notifications** *(Phase 2)* — small increment once alerts exist; makes
   alerts/fills useful when the dashboard isn't open.
7. **Path-payment swap** *(Phase 2)* — the most-used DEX action; depends on the
   send/receive builder being in place first.
8. **Claimable balances** *(Phase 2)* — completes Stellar payment parity; depends
   on trustline handling from #1.
9. **2FA hardening** *(Phase 2)* — do before key management so the key flows are
   protected by a second factor from day one.
10. **Key management (mnemonic)** *(Phase 3)* — security-critical; sequence right
    after 2FA and before multi-account, which keys everything by account.
11. **Multi-account** *(Phase 3)* — the largest refactor; build only after key
    management exists to key state/signer per account.
12. **Asset search / add-by-domain, fiat ramp, AMM pools, mobile, hardware
    wallet, multisig, WalletConnect** — remaining Phase 3 items, sequenced by
    priority score and product direction (consumer wallet vs. automated trader).

---

*Note on the trading-cap change shipped alongside this analysis:* the per-trade
**size** cap is now split by initiator in [engine.ts](src/policy/engine.ts) —
**manual** orders (from the dashboard) bypass it; **AI/system** orders remain
capped. Only that one size cap is lifted for manual; the daily-volume, exposure,
loss, slippage, whitelist, kill-switch and preflight gates still apply.
