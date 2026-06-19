import sql from "mssql";
import { config, dbConfigured } from "../config";

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
    pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
    connectionTimeout: 15_000,
    requestTimeout: 30_000,
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
  if (pool) {
    try {
      await pool.close();
    } catch {
      /* ignore */
    }
    pool = null;
  }
}
