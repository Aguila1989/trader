import sql from "mssql";
import { config, dbConfigured } from "../config";
import {
  DEFAULT_USER_ID,
  DEFAULT_USER_EMAIL,
  DEFAULT_USER_DISPLAY_NAME,
} from "../users/context";

/**
 * SQL Server connection pool + schema bootstrap.
 *
 * The whole layer is optional: if no SQL Server is configured (or it cannot be
 * reached at boot) the app keeps running fully in-memory and `dbReady()` stays
 * false. Persistence simply lights up when a database becomes available.
 */

let pool: sql.ConnectionPool | null = null;
let ready = false;

export function dbReady(): boolean {
  return ready;
}

/**
 * AUDIT-016: `ready` used to flip false only on initial-connect failure or
 * explicit shutdown - if SQL Server died MID-SESSION, dbReady() stayed true
 * forever and every write failed one-by-one while the UI kept reporting
 * "SQL Server (persisting)". A lightweight periodic probe (SELECT 1) now trips
 * `ready` after a few consecutive failures (so dbReady()-gated code reacts and
 * the operator gets ONE loud message instead of an error per write) and
 * re-enables persistence automatically when the connection recovers.
 */
const HEALTH_INTERVAL_MS = 60_000;
const HEALTH_FAILS_TO_TRIP = 3;
let healthTimer: ReturnType<typeof setInterval> | null = null;
let healthFails = 0;

async function probeHealth(): Promise<void> {
  if (!pool) return;
  try {
    await pool.request().query("SELECT 1 AS ok");
    if (!ready) {
      ready = true;
      console.warn("[db] SQL Server connection RESTORED - persistence re-enabled.");
    }
    healthFails = 0;
  } catch (err) {
    healthFails += 1;
    if (ready && healthFails >= HEALTH_FAILS_TO_TRIP) {
      ready = false;
      console.error(
        `[db] SQL Server unreachable for ${healthFails} consecutive health checks ` +
          `(${(err as Error).message}) - persistence DISABLED (in-memory only) until the connection recovers.`,
      );
    }
  }
}

function startHealthCheck(): void {
  if (healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(() => void probeHealth(), HEALTH_INTERVAL_MS);
  // Never hold the process open for the probe.
  healthTimer.unref?.();
}

export function getPool(): sql.ConnectionPool {
  if (!pool || !ready) {
    throw new Error("SQL Server pool is not connected.");
  }
  return pool;
}

function baseConfig(database: string): sql.config {
  return {
    server: config.db.server || "localhost",
    port: config.db.port,
    database,
    user: config.db.user || undefined,
    password: config.db.password || undefined,
    options: {
      encrypt: config.db.encrypt,
      trustServerCertificate: config.db.trustServerCertificate,
    },
    // AUDIT-039: pool sizing/timeouts are env-tunable like every other
    // operational parameter (a hardcoded max of 5 was a hidden concurrency
    // ceiling for a multi-user deployment). Connection-string deployments keep
    // the driver defaults - tune via the discrete settings when it matters.
    pool: {
      max: config.db.poolMax,
      min: 0,
      idleTimeoutMillis: config.db.poolIdleMs,
    },
    connectionTimeout: config.db.connectTimeoutMs,
    requestTimeout: config.db.requestTimeoutMs,
  };
}

/**
 * Create the target database if it does not exist (discrete-config path only).
 *
 * HARDENING: this connects to `master` and issues CREATE DATABASE, which needs
 * a privileged login (dbcreator/sysadmin). For a least-privilege production
 * deployment, pre-create the database and grant the app login only db_datareader
 * + db_datawriter (plus DDL once, to create dbo.Proposals), then run with a full
 * SQLSERVER_CONNECTION_STRING so this bootstrap path is skipped entirely. Also
 * prefer SQLSERVER_TRUST_CERT=false with a real server certificate so the
 * connection isn't vulnerable to MITM. See README "Database hardening".
 */
async function ensureDatabase(): Promise<void> {
  const master = await new sql.ConnectionPool(baseConfig("master")).connect();
  try {
    await master
      .request()
      .input("db", sql.NVarChar(128), config.db.database)
      .query(
        `IF DB_ID(@db) IS NULL
         BEGIN
           DECLARE @stmt NVARCHAR(300) = N'CREATE DATABASE [' + REPLACE(@db, ']', ']]') + N']';
           EXEC sp_executesql @stmt;
         END`,
      );
  } finally {
    await master.close();
  }
}

async function ensureSchema(p: sql.ConnectionPool): Promise<void> {
  await p.request().batch(`
    IF OBJECT_ID('dbo.Proposals', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Proposals (
        id               NVARCHAR(64)  NOT NULL CONSTRAINT PK_Proposals PRIMARY KEY,
        createdAt        DATETIME2(3)  NOT NULL,
        updatedAt        DATETIME2(3)  NOT NULL,
        side             NVARCHAR(8)   NOT NULL,
        baseAsset        NVARCHAR(120) NOT NULL,
        quoteAsset       NVARCHAR(120) NOT NULL,
        amount           DECIMAL(38,7) NOT NULL,
        limitPrice       DECIMAL(38,7) NOT NULL,
        maxSlippageBps   INT           NOT NULL,
        reason           NVARCHAR(MAX) NULL,
        status           NVARCHAR(32)  NOT NULL,
        policyViolations NVARCHAR(MAX) NULL,
        txHash           NVARCHAR(128) NULL,
        errorMsg         NVARCHAR(MAX) NULL,
        submittedAt      DATETIME2(3)  NULL,
        filledAmount     DECIMAL(38,7) NULL,
        filledPrice      DECIMAL(38,7) NULL,
        network          NVARCHAR(16)  NOT NULL,
        provider         NVARCHAR(40)  NULL,
        model            NVARCHAR(120) NULL,
        confidence       NVARCHAR(8)   NULL,
        targetPrice      DECIMAL(38,7) NULL,
        invalidationPrice DECIMAL(38,7) NULL,
        timeHorizon      NVARCHAR(32)  NULL,
        offerId          NVARCHAR(32)  NULL,
        mark1hPrice      DECIMAL(38,7) NULL,
        mark1hPnlPct     FLOAT         NULL,
        mark24hPrice     DECIMAL(38,7) NULL,
        mark24hPnlPct    FLOAT         NULL
      );
      CREATE INDEX IX_Proposals_net_status_updated
        ON dbo.Proposals (network, status, updatedAt DESC);
      CREATE INDEX IX_Proposals_updated
        ON dbo.Proposals (updatedAt DESC);
    END

    -- Migrate databases created before fill reconciliation was added.
    IF COL_LENGTH('dbo.Proposals', 'filledAmount') IS NULL
      ALTER TABLE dbo.Proposals ADD filledAmount DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.Proposals', 'filledPrice') IS NULL
      ALTER TABLE dbo.Proposals ADD filledPrice DECIMAL(38,7) NULL;

    -- Migrate databases created before attribution / structured proposals /
    -- offer tracking / outcome marks were added (all additive + nullable).
    IF COL_LENGTH('dbo.Proposals', 'submittedAt') IS NULL
      ALTER TABLE dbo.Proposals ADD submittedAt DATETIME2(3) NULL;
    IF COL_LENGTH('dbo.Proposals', 'provider') IS NULL
      ALTER TABLE dbo.Proposals ADD provider NVARCHAR(40) NULL;
    IF COL_LENGTH('dbo.Proposals', 'model') IS NULL
      ALTER TABLE dbo.Proposals ADD model NVARCHAR(120) NULL;
    IF COL_LENGTH('dbo.Proposals', 'confidence') IS NULL
      ALTER TABLE dbo.Proposals ADD confidence NVARCHAR(8) NULL;
    IF COL_LENGTH('dbo.Proposals', 'targetPrice') IS NULL
      ALTER TABLE dbo.Proposals ADD targetPrice DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.Proposals', 'invalidationPrice') IS NULL
      ALTER TABLE dbo.Proposals ADD invalidationPrice DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.Proposals', 'timeHorizon') IS NULL
      ALTER TABLE dbo.Proposals ADD timeHorizon NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Proposals', 'offerId') IS NULL
      ALTER TABLE dbo.Proposals ADD offerId NVARCHAR(32) NULL;
    IF COL_LENGTH('dbo.Proposals', 'mark1hPrice') IS NULL
      ALTER TABLE dbo.Proposals ADD mark1hPrice DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.Proposals', 'mark1hPnlPct') IS NULL
      ALTER TABLE dbo.Proposals ADD mark1hPnlPct FLOAT NULL;
    IF COL_LENGTH('dbo.Proposals', 'mark24hPrice') IS NULL
      ALTER TABLE dbo.Proposals ADD mark24hPrice DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.Proposals', 'mark24hPnlPct') IS NULL
      ALTER TABLE dbo.Proposals ADD mark24hPnlPct FLOAT NULL;

    IF OBJECT_ID('dbo.Logs', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Logs (
        id       NVARCHAR(64)  NOT NULL CONSTRAINT PK_Logs PRIMARY KEY,
        ts       DATETIME2(3)  NOT NULL,
        level    NVARCHAR(16)  NOT NULL,
        message  NVARCHAR(MAX) NOT NULL,
        data     NVARCHAR(MAX) NULL,
        network  NVARCHAR(16)  NOT NULL
      );
      CREATE INDEX IX_Logs_net_ts
        ON dbo.Logs (network, ts DESC);
      CREATE INDEX IX_Logs_net_level_ts
        ON dbo.Logs (network, level, ts DESC);
    END

    -- Hourly liquidity-scanner snapshots (observe-only; one row per asset per
    -- tick within that tick's top-N). Ranked by XLM-pair SDEX volume.
    IF OBJECT_ID('dbo.LiquiditySnapshots', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.LiquiditySnapshots (
        id             NVARCHAR(64)  NOT NULL CONSTRAINT PK_LiquiditySnapshots PRIMARY KEY,
        ts             DATETIME2(3)  NOT NULL,
        network        NVARCHAR(16)  NOT NULL,
        asset          NVARCHAR(120) NOT NULL,
        assetCode      NVARCHAR(32)  NOT NULL,
        assetIssuer    NVARCHAR(64)  NOT NULL,
        quoteAsset     NVARCHAR(120) NOT NULL,
        rankPos        INT           NOT NULL,
        baseVolume24h  DECIMAL(38,7) NULL,
        numTrades24h   INT           NULL,
        spreadBps      FLOAT         NULL,
        bestBid        DECIMAL(38,7) NULL,
        bestAsk        DECIMAL(38,7) NULL
      );
      CREATE INDEX IX_LiquiditySnapshots_net_asset_ts
        ON dbo.LiquiditySnapshots (network, asset, ts DESC);
      CREATE INDEX IX_LiquiditySnapshots_net_ts
        ON dbo.LiquiditySnapshots (network, ts DESC);
    END

    -- First-class stop-loss orders (manual + AI). The monitor consults the
    -- ACTIVE rows for a position's trigger; the close still flows through the
    -- existing policy-gated proposeStopClose path. Never deleted - status only.
    IF OBJECT_ID('dbo.StopLosses', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StopLosses (
        id                NVARCHAR(64)  NOT NULL CONSTRAINT PK_StopLosses PRIMARY KEY,
        createdAt         DATETIME2(3)  NOT NULL,
        updatedAt         DATETIME2(3)  NOT NULL,
        network           NVARCHAR(16)  NOT NULL,
        baseAsset         NVARCHAR(120) NOT NULL,
        quoteAsset        NVARCHAR(120) NOT NULL,
        triggerPrice      DECIMAL(38,7) NOT NULL,
        sellAll           BIT           NOT NULL,
        quantityToSell    DECIMAL(38,7) NULL,
        setBy             NVARCHAR(8)   NOT NULL,
        status            NVARCHAR(16)  NOT NULL,
        notes             NVARCHAR(MAX) NULL,
        triggeredAt       DATETIME2(3)  NULL,
        triggerProposalId NVARCHAR(64)  NULL,
        attemptCount      INT           NOT NULL CONSTRAINT DF_StopLosses_attempt DEFAULT 0,
        lastError         NVARCHAR(MAX) NULL,
        isTrailing        BIT           NULL,
        trailAmount       DECIMAL(38,7) NULL,
        trailPercent      FLOAT         NULL,
        highWaterMark     DECIMAL(38,7) NULL,
        currentTrailPrice DECIMAL(38,7) NULL
      );
      CREATE INDEX IX_StopLosses_net_status_pair
        ON dbo.StopLosses (network, status, baseAsset, quoteAsset);
    END

    -- Migrate databases created before trailing stop losses (all additive + nullable).
    IF COL_LENGTH('dbo.StopLosses', 'isTrailing') IS NULL
      ALTER TABLE dbo.StopLosses ADD isTrailing BIT NULL;
    IF COL_LENGTH('dbo.StopLosses', 'trailAmount') IS NULL
      ALTER TABLE dbo.StopLosses ADD trailAmount DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.StopLosses', 'trailPercent') IS NULL
      ALTER TABLE dbo.StopLosses ADD trailPercent FLOAT NULL;
    IF COL_LENGTH('dbo.StopLosses', 'highWaterMark') IS NULL
      ALTER TABLE dbo.StopLosses ADD highWaterMark DECIMAL(38,7) NULL;
    IF COL_LENGTH('dbo.StopLosses', 'currentTrailPrice') IS NULL
      ALTER TABLE dbo.StopLosses ADD currentTrailPrice DECIMAL(38,7) NULL;

    -- Price alerts (observe-only): notify when a pair crosses a price.
    IF OBJECT_ID('dbo.PriceAlerts', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.PriceAlerts (
        id           NVARCHAR(64)  NOT NULL CONSTRAINT PK_PriceAlerts PRIMARY KEY,
        createdAt    DATETIME2(3)  NOT NULL,
        network      NVARCHAR(16)  NOT NULL,
        baseAsset    NVARCHAR(120) NOT NULL,
        quoteAsset   NVARCHAR(120) NOT NULL,
        direction    NVARCHAR(8)   NOT NULL,
        price        DECIMAL(38,7) NOT NULL,
        status       NVARCHAR(16)  NOT NULL,
        note         NVARCHAR(MAX) NULL,
        triggeredAt  DATETIME2(3)  NULL,
        triggerPrice DECIMAL(38,7) NULL
      );
      CREATE INDEX IX_PriceAlerts_net_status
        ON dbo.PriceAlerts (network, status);
    END

    -- Immutable stop-loss audit trail (create/update/trigger/cancel/...).
    IF OBJECT_ID('dbo.StopLossAudit', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StopLossAudit (
        id           NVARCHAR(64)  NOT NULL CONSTRAINT PK_StopLossAudit PRIMARY KEY,
        ts           DATETIME2(3)  NOT NULL,
        network      NVARCHAR(16)  NOT NULL,
        stopLossId   NVARCHAR(64)  NOT NULL,
        baseAsset    NVARCHAR(120) NOT NULL,
        quoteAsset   NVARCHAR(120) NOT NULL,
        action       NVARCHAR(16)  NOT NULL,
        field        NVARCHAR(40)  NULL,
        oldValue     NVARCHAR(200) NULL,
        newValue     NVARCHAR(200) NULL,
        initiator    NVARCHAR(16)  NOT NULL,
        note         NVARCHAR(MAX) NULL
      );
      CREATE INDEX IX_StopLossAudit_net_pair_ts
        ON dbo.StopLossAudit (network, baseAsset, quoteAsset, ts DESC);
    END

    -- Persisted key/value settings (per network): the AI risk profile, etc.
    -- One JSON row per key; upserted in place (the only non-append-only store).
    IF OBJECT_ID('dbo.Settings', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Settings (
        network   NVARCHAR(16)  NOT NULL,
        keyName   NVARCHAR(64)  NOT NULL,
        value     NVARCHAR(MAX) NOT NULL,
        updatedAt DATETIME2(3)  NOT NULL,
        CONSTRAINT PK_Settings PRIMARY KEY (network, keyName)
      );
    END

    -- Append-only structured TRADE log (distinct from the generic Logs table).
    IF OBJECT_ID('dbo.TradeLog', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.TradeLog (
        id         NVARCHAR(64)  NOT NULL CONSTRAINT PK_TradeLog PRIMARY KEY,
        ts         DATETIME2(3)  NOT NULL,
        network    NVARCHAR(16)  NOT NULL,
        baseAsset  NVARCHAR(120) NOT NULL,
        quoteAsset NVARCHAR(120) NOT NULL,
        action     NVARCHAR(12)  NOT NULL,
        amount     DECIMAL(38,7) NULL,
        price      DECIMAL(38,7) NULL,
        totalValue DECIMAL(38,7) NULL,
        initiator  NVARCHAR(8)   NOT NULL,
        status     NVARCHAR(12)  NOT NULL,
        txHash     NVARCHAR(80)  NULL,
        orderId    NVARCHAR(64)  NULL
      );
      CREATE INDEX IX_TradeLog_net_ts ON dbo.TradeLog (network, ts DESC);
    END
    -- Provenance of a MANUAL action (e.g. "PENDING_PAYMENT"); additive migration.
    IF COL_LENGTH('dbo.TradeLog', 'source') IS NULL
      ALTER TABLE dbo.TradeLog ADD source NVARCHAR(24) NULL;

    -- Append-only structured AI log (reasoning + risk-profile snapshots).
    IF OBJECT_ID('dbo.AiLog', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.AiLog (
        id          NVARCHAR(64)  NOT NULL CONSTRAINT PK_AiLog PRIMARY KEY,
        ts          DATETIME2(3)  NOT NULL,
        network     NVARCHAR(16)  NOT NULL,
        eventType   NVARCHAR(24)  NOT NULL,
        baseAsset   NVARCHAR(120) NULL,
        quoteAsset  NVARCHAR(120) NULL,
        reasoning   NVARCHAR(MAX) NOT NULL,
        riskProfile NVARCHAR(MAX) NULL,
        confidence  NVARCHAR(8)   NULL,
        direction   NVARCHAR(8)   NULL,
        price       DECIMAL(38,7) NULL
      );
      CREATE INDEX IX_AiLog_net_ts ON dbo.AiLog (network, ts DESC);
    END

    -- Portfolio value snapshots over time (drives the "Portfolio Value Over
    -- Time" chart). One row per throttled refresh. userId is added by
    -- ensureUserScoping (PortfolioSnapshots is in USER_SCOPED_TABLES).
    IF OBJECT_ID('dbo.PortfolioSnapshots', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.PortfolioSnapshots (
        id        NVARCHAR(64)  NOT NULL CONSTRAINT PK_PortfolioSnapshots PRIMARY KEY,
        ts        DATETIME2(3)  NOT NULL,
        network   NVARCHAR(16)  NOT NULL,
        totalUsd  DECIMAL(38,7) NULL,
        totalXlm  DECIMAL(38,7) NOT NULL
      );
      CREATE INDEX IX_PortfolioSnapshots_net_ts ON dbo.PortfolioSnapshots (network, ts DESC);
    END

    -- Per-user wallets (Feature 3). Stores ONLY the AES-256-GCM-encrypted
    -- Stellar secret (base64 blob = version|salt|iv|tag|ciphertext) + the public
    -- key, never plaintext. status: 'pending' (created, last-4 not confirmed) ->
    -- 'active' (the one signing wallet) -> 'replaced' (superseded; never deleted,
    -- like StopLosses). userId is added by ensureUserScoping (Wallets is in
    -- USER_SCOPED_TABLES); the single-active invariant is a filtered unique index
    -- added afterwards (it needs the userId column to exist first).
    IF OBJECT_ID('dbo.Wallets', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Wallets (
        id              NVARCHAR(64)  NOT NULL CONSTRAINT PK_Wallets PRIMARY KEY,
        createdAt       DATETIME2(3)  NOT NULL,
        updatedAt       DATETIME2(3)  NOT NULL,
        network         NVARCHAR(16)  NOT NULL,
        publicKey       NVARCHAR(64)  NOT NULL,
        encryptedSecret NVARCHAR(MAX) NOT NULL,
        status          NVARCHAR(16)  NOT NULL
      );
    END

    -- Feature 4: weekly AI trustline-scan snapshots. One row per analysed token
    -- per scan (the top tokens by XLM volume + the tokens the user already
    -- holds). Append-only; the scanner prunes rows older than the retention
    -- window (>= 12 weeks). Scores are 1-10 ints (riskScore: higher = safer).
    -- userId is added by ensureUserScoping (TrustlineScans is USER_SCOPED).
    IF OBJECT_ID('dbo.TrustlineScans', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.TrustlineScans (
        id              NVARCHAR(64)  NOT NULL CONSTRAINT PK_TrustlineScans PRIMARY KEY,
        scanDate        DATETIME2(3)  NOT NULL,
        network         NVARCHAR(16)  NOT NULL,
        asset           NVARCHAR(120) NOT NULL,
        assetCode       NVARCHAR(32)  NOT NULL,
        assetIssuer     NVARCHAR(64)  NOT NULL,
        liquidityScore  INT           NOT NULL,
        legitimacyScore INT           NOT NULL,
        trendScore      INT           NOT NULL,
        riskScore       INT           NOT NULL,
        overallScore    INT           NOT NULL,
        summary         NVARCHAR(MAX) NULL,
        redFlags        NVARCHAR(MAX) NULL,   -- JSON string[]
        rawData         NVARCHAR(MAX) NULL,   -- JSON TokenRawData snapshot
        held            BIT           NOT NULL CONSTRAINT DF_TrustlineScans_held DEFAULT 0
      );
      CREATE INDEX IX_TrustlineScans_net_asset_date
        ON dbo.TrustlineScans (network, asset, scanDate DESC);
    END

    -- Feature 4: dismissed suggestions / snoozed warnings (per user). A
    -- 'suggestion' row hides a card until the next scan (cleared at scan start);
    -- a 'warning' row snoozes a card until expiresAt (now + 7 days). userId is
    -- added by ensureUserScoping (TrustlineDismissals is USER_SCOPED).
    IF OBJECT_ID('dbo.TrustlineDismissals', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.TrustlineDismissals (
        id        NVARCHAR(64)  NOT NULL CONSTRAINT PK_TrustlineDismissals PRIMARY KEY,
        createdAt DATETIME2(3)  NOT NULL,
        network   NVARCHAR(16)  NOT NULL,
        asset     NVARCHAR(120) NOT NULL,
        kind      NVARCHAR(16)  NOT NULL,   -- 'suggestion' | 'warning'
        expiresAt DATETIME2(3)  NULL
      );
      CREATE INDEX IX_TrustlineDismissals_net_kind
        ON dbo.TrustlineDismissals (network, kind, asset);
    END

    -- Premium/fees (2026-07 Feature 2): the platform fee ledger. One row per
    -- fee charge. TAX-CRITICAL fields (amounts + the XLM/EUR rate captured at
    -- receipt time) are written once and never recomputed; only the collection
    -- lifecycle transitions (pending -> collected|failed, attempts, the receipt
    -- fields set AT collection). userId is added by ensureUserScoping.
    IF OBJECT_ID('dbo.FeeLedger', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.FeeLedger (
        id              NVARCHAR(64)   NOT NULL CONSTRAINT PK_FeeLedger PRIMARY KEY,
        ts              DATETIME2(3)   NOT NULL,  -- fee accrual moment (fill/swap, UTC)
        network         NVARCHAR(16)   NOT NULL,
        tradeType       NVARCHAR(8)    NOT NULL,  -- 'MANUAL' | 'AI'
        tier            NVARCHAR(12)   NOT NULL,  -- volume tier at trade time
        isPremium       BIT            NOT NULL,
        feeRate         DECIMAL(10,7)  NOT NULL,  -- applied rate, e.g. 0.0028000
        tradeVolumeXlm  DECIMAL(38,7)  NOT NULL,
        feeXlm          DECIMAL(38,7)  NOT NULL,
        status          NVARCHAR(12)   NOT NULL,  -- 'pending' | 'collected' | 'failed'
        attempts        INT            NOT NULL CONSTRAINT DF_FeeLedger_attempts DEFAULT 0,
        tradeTxHash     NVARCHAR(80)   NULL,      -- the trade that incurred the fee
        collectedTxHash NVARCHAR(80)   NULL,      -- the payment that PAID the fee
        collectedAt     DATETIME2(3)   NULL,      -- receipt moment (the tax timestamp, UTC)
        xlmEurRate      DECIMAL(38,10) NULL,      -- XLM/EUR at receipt; stored once, forever
        feeEur          DECIMAL(38,2)  NULL,
        rateSource      NVARCHAR(24)   NULL       -- 'kraken' | 'coingecko' | 'kraken-hist'
      );
      CREATE INDEX IX_FeeLedger_net_status ON dbo.FeeLedger (network, status, ts);
      CREATE INDEX IX_FeeLedger_net_ts ON dbo.FeeLedger (network, ts DESC);
    END

    -- Feature 2: processed Stripe webhook event ids (idempotent delivery).
    -- Insert-only; a replayed event id short-circuits before any state change.
    IF OBJECT_ID('dbo.StripeEvents', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.StripeEvents (
        id         NVARCHAR(64) NOT NULL CONSTRAINT PK_StripeEvents PRIMARY KEY,
        type       NVARCHAR(64) NOT NULL,
        receivedAt DATETIME2(3) NOT NULL
      );
    END

    -- Feature 2: PLATFORM-scoped settings (fee wallet address, premium prices,
    -- ...). Distinct from the per-user dbo.Settings: keyed (network, keyName)
    -- only, edited by boot seeding + the admin backoffice (Feature 4), never by
    -- end users.
    IF OBJECT_ID('dbo.PlatformSettings', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.PlatformSettings (
        network   NVARCHAR(16)  NOT NULL,
        keyName   NVARCHAR(64)  NOT NULL,
        value     NVARCHAR(MAX) NOT NULL,
        updatedAt DATETIME2(3)  NOT NULL,
        CONSTRAINT PK_PlatformSettings PRIMARY KEY (network, keyName)
      );
    END

    -- Feature 3 (2026-07, AI keys): one BYO AI API key per user, encrypted with
    -- the same AES-256-GCM box as wallet seeds (purpose "ai-api-key" - own KDF
    -- domain). The plaintext exists only in memory at the moment the AI makes a
    -- request; it is never returned to a client and never logged. userId is
    -- added by ensureUserScoping; the one-row-per-user unique index is added
    -- after scoping (it references that column).
    IF OBJECT_ID('dbo.UserAiKeys', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.UserAiKeys (
        id           NVARCHAR(64)  NOT NULL CONSTRAINT PK_UserAiKeys PRIMARY KEY,
        createdAt    DATETIME2(3)  NOT NULL,
        updatedAt    DATETIME2(3)  NOT NULL,
        provider     NVARCHAR(24)  NOT NULL,  -- anthropic | openai | google | deepseek
        encryptedKey NVARCHAR(MAX) NOT NULL,
        keyLast4     NVARCHAR(4)   NOT NULL   -- display-only identification
      );
    END
  `);

  // User accounts + per-user scoping. Runs after the data tables exist so the
  // userId foreign keys can reference them.
  await ensureUserScoping(p);

  // Authentication (Feature 2): extra dbo.Users columns + the auth tables. Runs
  // after dbo.Users exists so the foreign keys resolve.
  await ensureAuthSchema(p);

  // User profile flags (2026-07 Feature 1: onboarding tutorial). Additive and
  // idempotent like every other migration here.
  await ensureProfileSchema(p);

  // Premium subscription + volume tiers (2026-07 Feature 2): billing columns
  // on dbo.Users. Runs after ensureUserScoping so dbo.Users exists.
  await ensureBillingSchema(p);

  // Wallets (Feature 3): the single-active-wallet invariant. A FILTERED UNIQUE
  // index lets a user keep many 'replaced' rows but at most ONE 'active' wallet
  // per network - a hard DB guarantee, not just app logic. Added here (after
  // ensureUserScoping) because it references the userId column it adds; via EXEC
  // so it compiles once that column exists.
  await p.request().batch(`
    IF OBJECT_ID('dbo.Wallets', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.Wallets', 'userId') IS NOT NULL
       AND INDEXPROPERTY(OBJECT_ID('dbo.Wallets'), 'UX_Wallets_active', 'IndexID') IS NULL
      EXEC('CREATE UNIQUE INDEX UX_Wallets_active
              ON dbo.Wallets (userId, network) WHERE status = ''active''');
  `);

  // AI keys (2026-07 Feature 3): ONE key row per user - a hard DB guarantee,
  // same EXEC-after-scoping pattern as UX_Wallets_active.
  await p.request().batch(`
    IF OBJECT_ID('dbo.UserAiKeys', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.UserAiKeys', 'userId') IS NOT NULL
       AND INDEXPROPERTY(OBJECT_ID('dbo.UserAiKeys'), 'UX_UserAiKeys_user', 'IndexID') IS NULL
      EXEC('CREATE UNIQUE INDEX UX_UserAiKeys_user ON dbo.UserAiKeys (userId)');
  `);

  // AUDIT-025: the Logs tab filters TradeLog by action/token and AiLog by
  // eventType, but only (userId, network, ts) was indexed - every filtered
  // query scanned the user's whole partition. Additive + idempotent like all
  // other migrations; guarded on userId existing (ensureUserScoping ran above).
  await p.request().batch(`
    IF OBJECT_ID('dbo.TradeLog', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.TradeLog', 'userId') IS NOT NULL
    BEGIN
      IF INDEXPROPERTY(OBJECT_ID('dbo.TradeLog'), 'IX_TradeLog_user_action', 'IndexID') IS NULL
        EXEC('CREATE INDEX IX_TradeLog_user_action
                ON dbo.TradeLog (userId, network, action, ts DESC)');
      IF INDEXPROPERTY(OBJECT_ID('dbo.TradeLog'), 'IX_TradeLog_user_base', 'IndexID') IS NULL
        EXEC('CREATE INDEX IX_TradeLog_user_base
                ON dbo.TradeLog (userId, network, baseAsset, ts DESC)');
    END
    IF OBJECT_ID('dbo.AiLog', 'U') IS NOT NULL
       AND COL_LENGTH('dbo.AiLog', 'userId') IS NOT NULL
       AND INDEXPROPERTY(OBJECT_ID('dbo.AiLog'), 'IX_AiLog_user_event', 'IndexID') IS NULL
      EXEC('CREATE INDEX IX_AiLog_user_event
              ON dbo.AiLog (userId, network, eventType, ts DESC)');
  `);
}

/**
 * Feature 2 (authentication) schema: the login/lockout/verification columns on
 * dbo.Users, plus the sessions, link-tokens and login-attempt tables. Additive
 * and idempotent, exactly like the rest of ensureSchema - safe to re-run.
 *
 * dbo.AuthSessions     one row per issued JWT (jti = id); the auth gate checks it
 *                      is present + unrevoked + unexpired, so logout / password
 *                      reset can revoke a session immediately (stateless JWTs
 *                      alone cannot be invalidated before they expire).
 * dbo.AuthTokens       single-use email-verification + password-reset tokens. We
 *                      store only the SHA-256 HASH of the token (the raw value
 *                      lives only in the emailed link), so a DB leak yields no
 *                      working links.
 * dbo.LoginAttempts    append-only audit of every login attempt with IP + reason
 *                      (the spec's "log each failed attempt with IP and timestamp").
 */
async function ensureAuthSchema(p: sql.ConnectionPool): Promise<void> {
  await p.request().batch(`
    -- Login / lockout / verification columns on the existing Users table.
    IF COL_LENGTH('dbo.Users', 'emailVerified') IS NULL
      ALTER TABLE dbo.Users ADD emailVerified BIT NOT NULL
        CONSTRAINT DF_Users_emailVerified DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'failedLoginAttempts') IS NULL
      ALTER TABLE dbo.Users ADD failedLoginAttempts INT NOT NULL
        CONSTRAINT DF_Users_failedLoginAttempts DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'lockedUntil') IS NULL
      ALTER TABLE dbo.Users ADD lockedUntil DATETIME2(3) NULL;

    IF OBJECT_ID('dbo.AuthSessions', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.AuthSessions (
        id        NVARCHAR(64)  NOT NULL CONSTRAINT PK_AuthSessions PRIMARY KEY,
        userId    NVARCHAR(64)  NOT NULL,
        createdAt DATETIME2(3)  NOT NULL,
        expiresAt DATETIME2(3)  NOT NULL,
        revokedAt DATETIME2(3)  NULL,
        ip        NVARCHAR(64)  NULL,
        userAgent NVARCHAR(256) NULL,
        CONSTRAINT FK_AuthSessions_userId FOREIGN KEY (userId) REFERENCES dbo.Users(id)
      );
      CREATE INDEX IX_AuthSessions_user ON dbo.AuthSessions (userId, expiresAt DESC);
    END

    IF OBJECT_ID('dbo.AuthTokens', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.AuthTokens (
        id        NVARCHAR(64)  NOT NULL CONSTRAINT PK_AuthTokens PRIMARY KEY,
        userId    NVARCHAR(64)  NOT NULL,
        type      NVARCHAR(16)  NOT NULL,   -- 'verify' | 'reset'
        tokenHash NVARCHAR(128) NOT NULL,   -- SHA-256 hex of the raw token
        createdAt DATETIME2(3)  NOT NULL,
        expiresAt DATETIME2(3)  NOT NULL,
        usedAt    DATETIME2(3)  NULL,
        CONSTRAINT FK_AuthTokens_userId FOREIGN KEY (userId) REFERENCES dbo.Users(id)
      );
      CREATE INDEX IX_AuthTokens_lookup ON dbo.AuthTokens (type, tokenHash);
      CREATE INDEX IX_AuthTokens_user ON dbo.AuthTokens (userId, type);
    END

    IF OBJECT_ID('dbo.LoginAttempts', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.LoginAttempts (
        id      NVARCHAR(64)  NOT NULL CONSTRAINT PK_LoginAttempts PRIMARY KEY,
        ts      DATETIME2(3)  NOT NULL,
        email   NVARCHAR(256) NULL,
        userId  NVARCHAR(64)  NULL,
        ip      NVARCHAR(64)  NULL,
        success BIT           NOT NULL,
        reason  NVARCHAR(64)  NULL
      );
      CREATE INDEX IX_LoginAttempts_ts ON dbo.LoginAttempts (ts DESC);
      CREATE INDEX IX_LoginAttempts_email ON dbo.LoginAttempts (email, ts DESC);
    END
  `);
}

/**
 * Per-user profile flags on dbo.Users (2026-07 Feature 1: onboarding tutorial).
 * onboardingCompleted starts 0 for every account (including pre-existing rows,
 * so existing operators see the tour once too) and flips via
 * POST /api/auth/onboarding; "Restart Tutorial" in Settings resets it.
 */
async function ensureProfileSchema(p: sql.ConnectionPool): Promise<void> {
  await p.request().batch(`
    IF COL_LENGTH('dbo.Users', 'onboardingCompleted') IS NULL
      ALTER TABLE dbo.Users ADD onboardingCompleted BIT NOT NULL
        CONSTRAINT DF_Users_onboardingCompleted DEFAULT 0;
  `);
}

/**
 * Premium subscription + volume-tier columns on dbo.Users (2026-07 Feature 2).
 * isPremium/subscription* mirror Stripe state (webhook-driven); volumeTier is
 * recalculated daily from the previous calendar month's platform volume (new
 * users start Bronze); tierOverride marks an admin-pinned tier the daily job
 * must not touch; flaggedForReview / disabledByAdmin are the Feature 4 user-
 * management switches (added here so one migration covers both features).
 */
async function ensureBillingSchema(p: sql.ConnectionPool): Promise<void> {
  await p.request().batch(`
    IF COL_LENGTH('dbo.Users', 'isPremium') IS NULL
      ALTER TABLE dbo.Users ADD isPremium BIT NOT NULL
        CONSTRAINT DF_Users_isPremium DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'stripeCustomerId') IS NULL
      ALTER TABLE dbo.Users ADD stripeCustomerId NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Users', 'stripeSubscriptionId') IS NULL
      ALTER TABLE dbo.Users ADD stripeSubscriptionId NVARCHAR(64) NULL;
    IF COL_LENGTH('dbo.Users', 'subscriptionStatus') IS NULL
      ALTER TABLE dbo.Users ADD subscriptionStatus NVARCHAR(24) NULL;
    IF COL_LENGTH('dbo.Users', 'subscriptionStart') IS NULL
      ALTER TABLE dbo.Users ADD subscriptionStart DATETIME2(3) NULL;
    IF COL_LENGTH('dbo.Users', 'subscriptionEnd') IS NULL
      ALTER TABLE dbo.Users ADD subscriptionEnd DATETIME2(3) NULL;
    IF COL_LENGTH('dbo.Users', 'volumeTier') IS NULL
      ALTER TABLE dbo.Users ADD volumeTier NVARCHAR(12) NOT NULL
        CONSTRAINT DF_Users_volumeTier DEFAULT 'Bronze';
    IF COL_LENGTH('dbo.Users', 'tierOverride') IS NULL
      ALTER TABLE dbo.Users ADD tierOverride BIT NOT NULL
        CONSTRAINT DF_Users_tierOverride DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'flaggedForReview') IS NULL
      ALTER TABLE dbo.Users ADD flaggedForReview BIT NOT NULL
        CONSTRAINT DF_Users_flaggedForReview DEFAULT 0;
    IF COL_LENGTH('dbo.Users', 'disabledByAdmin') IS NULL
      ALTER TABLE dbo.Users ADD disabledByAdmin BIT NOT NULL
        CONSTRAINT DF_Users_disabledByAdmin DEFAULT 0;
  `);
}

/** The tables whose rows belong to a single user, with the column the dominant
 *  read query orders by (used to build a userId-leading covering index). The
 *  per-user Settings table has a composite primary key and is handled apart. */
const USER_SCOPED_TABLES: ReadonlyArray<{ table: string; orderCol: string }> = [
  { table: "Proposals", orderCol: "createdAt" },
  { table: "Logs", orderCol: "ts" },
  { table: "LiquiditySnapshots", orderCol: "ts" },
  { table: "StopLosses", orderCol: "createdAt" },
  { table: "PriceAlerts", orderCol: "createdAt" },
  { table: "StopLossAudit", orderCol: "ts" },
  { table: "TradeLog", orderCol: "ts" },
  { table: "AiLog", orderCol: "ts" },
  { table: "PortfolioSnapshots", orderCol: "ts" },
  { table: "Wallets", orderCol: "createdAt" },
  { table: "TrustlineScans", orderCol: "scanDate" },
  { table: "TrustlineDismissals", orderCol: "createdAt" },
  { table: "FeeLedger", orderCol: "ts" },
  { table: "UserAiKeys", orderCol: "updatedAt" },
];

/** SQL-safe single-quote escaping for our own (non-user-supplied) constants. */
function sqlLit(v: string): string {
  return v.replace(/'/g, "''");
}

/**
 * Create dbo.Users, bootstrap the default account, and add a userId foreign key
 * to every per-user table - migrating any existing rows to the default user.
 *
 * Idempotent and additive (the whole app's persistence layer follows this
 * pattern): each step is guarded so re-running it on an up-to-date database is a
 * no-op. Runs on both `npm start` (via initDb) and `npm run db:migrate`.
 *
 * Migration of existing single-user data: each userId column is added NOT NULL
 * with a DEFAULT of the default user's id, which backfills every existing row in
 * one statement; the DEFAULT constraint is then dropped so future inserts must
 * attribute a user explicitly (a forgotten scope fails loudly rather than
 * silently landing in the default account). The FK is added AFTER the default
 * user row exists so its validation passes. Statements that reference the
 * freshly-added column run via EXEC so they compile after the column exists.
 */
async function ensureUserScoping(p: sql.ConnectionPool): Promise<void> {
  const id = sqlLit(DEFAULT_USER_ID);
  const email = sqlLit(DEFAULT_USER_EMAIL);
  const display = sqlLit(DEFAULT_USER_DISPLAY_NAME);

  // 1) The Users table itself (separate batch so later batches can reference it).
  await p.request().batch(`
    IF OBJECT_ID('dbo.Users', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Users (
        id           NVARCHAR(64)  NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        email        NVARCHAR(256) NOT NULL,
        passwordHash NVARCHAR(256) NOT NULL,
        displayName  NVARCHAR(120) NULL,
        createdAt    DATETIME2(3)  NOT NULL,
        lastLoginAt  DATETIME2(3)  NULL,
        isActive     BIT           NOT NULL CONSTRAINT DF_Users_isActive DEFAULT 1
      );
      CREATE UNIQUE INDEX UX_Users_email ON dbo.Users (email);
    END
  `);

  // 2) Bootstrap the default account (empty passwordHash = no usable password
  //    until the authentication feature sets one), then scope every table.
  const blocks = USER_SCOPED_TABLES.map(
    ({ table, orderCol }) => `
    IF COL_LENGTH('dbo.${table}', 'userId') IS NULL
    BEGIN
      ALTER TABLE dbo.${table}
        ADD userId NVARCHAR(64) NOT NULL
            CONSTRAINT DF_${table}_userId DEFAULT '${id}';
      EXEC('ALTER TABLE dbo.${table} DROP CONSTRAINT DF_${table}_userId');
      EXEC('ALTER TABLE dbo.${table} ADD CONSTRAINT FK_${table}_userId
              FOREIGN KEY (userId) REFERENCES dbo.Users(id)');
      EXEC('CREATE INDEX IX_${table}_user
              ON dbo.${table} (userId, network, ${orderCol} DESC)');
    END`,
  ).join("\n");

  await p.request().batch(`
    IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE id = '${id}' OR email = '${email}')
      INSERT INTO dbo.Users (id, email, passwordHash, displayName, createdAt, isActive)
      VALUES ('${id}', '${email}', '', '${display}', SYSUTCDATETIME(), 1);

    ${blocks}

    -- Settings has a composite primary key (network, keyName); widen it to
    -- include userId so each account keeps its own settings, then add the FK.
    IF COL_LENGTH('dbo.Settings', 'userId') IS NULL
    BEGIN
      ALTER TABLE dbo.Settings
        ADD userId NVARCHAR(64) NOT NULL
            CONSTRAINT DF_Settings_userId DEFAULT '${id}';
      EXEC('ALTER TABLE dbo.Settings DROP CONSTRAINT DF_Settings_userId');
      EXEC('ALTER TABLE dbo.Settings DROP CONSTRAINT PK_Settings');
      EXEC('ALTER TABLE dbo.Settings
              ADD CONSTRAINT PK_Settings PRIMARY KEY (userId, network, keyName)');
      EXEC('ALTER TABLE dbo.Settings ADD CONSTRAINT FK_Settings_userId
              FOREIGN KEY (userId) REFERENCES dbo.Users(id)');
    END
  `);
}

/**
 * Attempt to connect and ensure the schema. Returns true on success.
 * Throws on failure so the caller can log a clear, single warning.
 */
export async function initDb(): Promise<boolean> {
  if (!dbConfigured) return false;
  try {
    if (!config.db.connectionString) {
      await ensureDatabase();
    }
    pool = config.db.connectionString
      ? new sql.ConnectionPool(config.db.connectionString)
      : new sql.ConnectionPool(baseConfig(config.db.database));
    await pool.connect();
    await ensureSchema(pool);
    ready = true;
    // AUDIT-016: watch the connection from here on. A pool-level error also
    // triggers an immediate probe so a hard drop trips fast, not in 3 minutes.
    pool.on("error", (err: Error) => {
      console.error(`[db] SQL Server pool error: ${err.message}`);
      void probeHealth();
    });
    startHealthCheck();
    return true;
  } catch (err) {
    ready = false;
    if (pool) {
      try {
        await pool.close();
      } catch {
        /* ignore close errors */
      }
    }
    pool = null;
    throw err;
  }
}

export async function closeDb(): Promise<void> {
  ready = false;
  if (healthTimer) {
    clearInterval(healthTimer);
    healthTimer = null;
  }
  if (pool) {
    try {
      await pool.close();
    } catch {
      /* ignore */
    }
    pool = null;
  }
}
