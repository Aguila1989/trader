/**
 * Data access for the Feature 2 (premium/fees) tables: dbo.PlatformSettings,
 * dbo.FeeLedger and dbo.StripeEvents, plus the cross-user aggregation queries
 * the daily volume-tier job needs. Mirrors src/db/repo.ts conventions: every
 * function starts with a dbReady() guard, all inputs are bound parameters, and
 * DATETIME2 columns convert through toIso().
 *
 * DB-ONLY (TrustlineScans precedent): there is deliberately NO in-memory
 * fallback here. Charging real fees / mirroring paid subscriptions without a
 * database would silently lose financial records - so with no DB the fee
 * system stays disabled and billing endpoints answer 503.
 *
 * SCOPING NOTE: FeeLedger rows carry a userId (USER_SCOPED_TABLES adds the
 * column + FK), but unlike the rest of the app, several queries here are
 * PLATFORM-scoped (no currentUserId() filter): the fee collector, the tax
 * ledger and the tier job all operate across all users by design. Functions
 * that do so say it in their name or doc.
 */
import sql from "mssql";
import { config } from "../config";
import { dbReady, getPool } from "./pool";

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

/* ---- PlatformSettings (network, keyName) -> value --------------------- */

export const PLATFORM_KEYS = {
  feeWalletAddress: "feeWalletAddress",
  premiumPriceMonthlyEur: "premiumPriceMonthlyEur",
  premiumPriceAnnualEur: "premiumPriceAnnualEur",
  stripePriceIdMonthly: "stripePriceIdMonthly",
  stripePriceIdAnnual: "stripePriceIdAnnual",
} as const;

export async function getPlatformSetting(key: string): Promise<string | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("k", sql.NVarChar(64), key)
    .query<{ value: string }>(
      `SELECT value FROM dbo.PlatformSettings WHERE network = @net AND keyName = @k;`,
    );
  return res.recordset[0]?.value ?? null;
}

export async function upsertPlatformSetting(key: string, value: string): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("k", sql.NVarChar(64), key)
    .input("v", sql.NVarChar(sql.MAX), value)
    .input("ts", sql.DateTime2, new Date())
    .query(
      `MERGE dbo.PlatformSettings AS t
       USING (SELECT @net AS network, @k AS keyName) AS s
         ON t.network = s.network AND t.keyName = s.keyName
       WHEN MATCHED THEN UPDATE SET value = @v, updatedAt = @ts
       WHEN NOT MATCHED THEN INSERT (network, keyName, value, updatedAt)
         VALUES (@net, @k, @v, @ts);`,
    );
}

/* ---- FeeLedger --------------------------------------------------------- */

export type FeeStatus = "pending" | "collected" | "failed";

export interface FeeLedgerRow {
  id: string;
  ts: string;
  userId: string;
  tradeType: "MANUAL" | "AI";
  tier: string;
  isPremium: boolean;
  feeRate: number;
  tradeVolumeXlm: number;
  feeXlm: number;
  status: FeeStatus;
  attempts: number;
  tradeTxHash: string | null;
  collectedTxHash: string | null;
  collectedAt: string | null;
  xlmEurRate: number | null;
  feeEur: number | null;
  rateSource: string | null;
}

interface RawFeeRow {
  id: string;
  ts: Date | string;
  userId: string;
  tradeType: string;
  tier: string;
  isPremium: boolean;
  feeRate: number;
  tradeVolumeXlm: number;
  feeXlm: number;
  status: string;
  attempts: number;
  tradeTxHash: string | null;
  collectedTxHash: string | null;
  collectedAt: Date | string | null;
  xlmEurRate: number | null;
  feeEur: number | null;
  rateSource: string | null;
}

const FEE_COLS = `id, ts, userId, tradeType, tier, isPremium, feeRate, tradeVolumeXlm, feeXlm,
  status, attempts, tradeTxHash, collectedTxHash, collectedAt, xlmEurRate, feeEur, rateSource`;

function rowToFee(r: RawFeeRow): FeeLedgerRow {
  return {
    id: r.id,
    ts: toIso(r.ts),
    userId: r.userId,
    tradeType: r.tradeType === "AI" ? "AI" : "MANUAL",
    tier: r.tier,
    isPremium: Boolean(r.isPremium),
    feeRate: Number(r.feeRate),
    tradeVolumeXlm: Number(r.tradeVolumeXlm),
    feeXlm: Number(r.feeXlm),
    status: (["pending", "collected", "failed"].includes(r.status) ? r.status : "failed") as FeeStatus,
    attempts: Number(r.attempts ?? 0),
    tradeTxHash: r.tradeTxHash ?? null,
    collectedTxHash: r.collectedTxHash ?? null,
    collectedAt: r.collectedAt ? toIso(r.collectedAt) : null,
    xlmEurRate: r.xlmEurRate == null ? null : Number(r.xlmEurRate),
    feeEur: r.feeEur == null ? null : Number(r.feeEur),
    rateSource: r.rateSource ?? null,
  };
}

export interface NewFeeLedgerEntry {
  id: string;
  /** Fee accrual moment (fill/swap time), epoch ms. */
  tsMs: number;
  userId: string;
  tradeType: "MANUAL" | "AI";
  tier: string;
  isPremium: boolean;
  feeRate: number;
  tradeVolumeXlm: number;
  feeXlm: number;
  status: FeeStatus;
  tradeTxHash?: string | null;
}

/** Idempotent insert (by id). Tax-critical fields are written once here. */
export async function insertFeeLedger(e: NewFeeLedgerEntry): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), e.id)
    .input("ts", sql.DateTime2, new Date(e.tsMs))
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), e.userId)
    .input("tradeType", sql.NVarChar(8), e.tradeType)
    .input("tier", sql.NVarChar(12), e.tier)
    .input("isPremium", sql.Bit, e.isPremium)
    .input("feeRate", sql.Decimal(10, 7), e.feeRate)
    .input("vol", sql.Decimal(38, 7), e.tradeVolumeXlm)
    .input("feeXlm", sql.Decimal(38, 7), e.feeXlm)
    .input("status", sql.NVarChar(12), e.status)
    .input("tradeTx", sql.NVarChar(80), e.tradeTxHash ?? null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.FeeLedger WHERE id = @id)
       INSERT INTO dbo.FeeLedger (id, ts, network, userId, tradeType, tier, isPremium, feeRate,
                                  tradeVolumeXlm, feeXlm, status, attempts, tradeTxHash)
       VALUES (@id, @ts, @net, @userId, @tradeType, @tier, @isPremium, @feeRate,
               @vol, @feeXlm, @status, 0, @tradeTx);`,
    );
}

/** PLATFORM-scoped: pending fee rows awaiting collection, oldest first. */
export async function listPendingFees(limit = 25): Promise<FeeLedgerRow[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("limit", sql.Int, Math.max(1, Math.min(200, limit)))
    .query<RawFeeRow>(
      `SELECT TOP (@limit) ${FEE_COLS} FROM dbo.FeeLedger
        WHERE network = @net AND status = 'pending'
        ORDER BY ts ASC;`,
    );
  return res.recordset.map(rowToFee);
}

/** Mark a fee collected: the receipt moment + (when available) the EUR rate
 *  captured at that moment. Rate fields are written at most once. */
export async function markFeeCollected(
  id: string,
  c: { collectedTxHash: string; collectedAtMs: number; xlmEurRate?: number; feeEur?: number; rateSource?: string },
): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("tx", sql.NVarChar(80), c.collectedTxHash)
    .input("at", sql.DateTime2, new Date(c.collectedAtMs))
    .input("rate", sql.Decimal(38, 10), c.xlmEurRate ?? null)
    .input("eur", sql.Decimal(38, 2), c.feeEur ?? null)
    .input("src", sql.NVarChar(24), c.rateSource ?? null)
    .query(
      `UPDATE dbo.FeeLedger
          SET status = 'collected', collectedTxHash = @tx, collectedAt = @at,
              xlmEurRate = COALESCE(xlmEurRate, @rate),
              feeEur = COALESCE(feeEur, @eur),
              rateSource = COALESCE(rateSource, @src)
        WHERE id = @id AND status = 'pending';`,
    );
}

/** Bump the attempt counter; flip to 'failed' once maxAttempts is reached. */
export async function bumpFeeAttempt(id: string, maxAttempts: number): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("max", sql.Int, maxAttempts)
    .query(
      `UPDATE dbo.FeeLedger
          SET attempts = attempts + 1,
              status = CASE WHEN attempts + 1 >= @max THEN 'failed' ELSE status END
        WHERE id = @id AND status = 'pending';`,
    );
}

/** PLATFORM-scoped gap repair: collected rows missing their EUR rate. */
export async function listCollectedFeesMissingRate(limit = 20): Promise<FeeLedgerRow[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("limit", sql.Int, Math.max(1, Math.min(100, limit)))
    .query<RawFeeRow>(
      `SELECT TOP (@limit) ${FEE_COLS} FROM dbo.FeeLedger
        WHERE network = @net AND status = 'collected' AND xlmEurRate IS NULL
        ORDER BY collectedAt ASC;`,
    );
  return res.recordset.map(rowToFee);
}

/** Write a repaired receipt-time rate exactly once (COALESCE keeps any
 *  already-stored value - a stored rate is immutable, per the tax rule). */
export async function setFeeEurRate(
  id: string,
  rate: number,
  feeEur: number,
  source: string,
): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("rate", sql.Decimal(38, 10), rate)
    .input("eur", sql.Decimal(38, 2), feeEur)
    .input("src", sql.NVarChar(24), source)
    .query(
      `UPDATE dbo.FeeLedger
          SET xlmEurRate = COALESCE(xlmEurRate, @rate),
              feeEur = COALESCE(feeEur, @eur),
              rateSource = COALESCE(rateSource, @src)
        WHERE id = @id AND xlmEurRate IS NULL;`,
    );
}

/* ---- StripeEvents (webhook idempotency) -------------------------------- */

/** True when this event id was inserted now (first delivery); false when it
 *  was already processed - the webhook must then return 200 with no effects. */
export async function tryRecordStripeEvent(id: string, type: string): Promise<boolean> {
  if (!dbReady()) return false;
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("type", sql.NVarChar(64), type)
    .input("ts", sql.DateTime2, new Date())
    .query<{ inserted: number }>(
      `IF NOT EXISTS (SELECT 1 FROM dbo.StripeEvents WHERE id = @id)
       BEGIN
         INSERT INTO dbo.StripeEvents (id, type, receivedAt) VALUES (@id, @type, @ts);
         SELECT 1 AS inserted;
       END
       ELSE SELECT 0 AS inserted;`,
    );
  return res.recordset[0]?.inserted === 1;
}

/* ---- volume-tier aggregation (PLATFORM-scoped, daily job) --------------- */

export interface PlatformFillRow {
  userId: string;
  ts: string;
  baseAsset: string;
  quoteAsset: string;
  action: string;
  amount: number | null;
  totalValue: number | null;
}

/**
 * PLATFORM-scoped: every executed fill (FILLED/PARTIAL platform trades) in
 * [fromMs, toMs) across ALL users, oldest first - the tier job's raw input.
 * Only platform trades exist in dbo.TradeLog, satisfying "external trades
 * don't count" by construction.
 */
export async function listPlatformFills(fromMs: number, toMs: number): Promise<PlatformFillRow[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("from", sql.DateTime2, new Date(fromMs))
    .input("to", sql.DateTime2, new Date(toMs))
    .query<{
      userId: string;
      ts: Date | string;
      baseAsset: string;
      quoteAsset: string;
      action: string;
      amount: number | null;
      totalValue: number | null;
    }>(
      `SELECT userId, ts, baseAsset, quoteAsset, action, amount, totalValue
         FROM dbo.TradeLog
        WHERE network = @net AND ts >= @from AND ts < @to
          AND status IN ('FILLED', 'PARTIAL')
          AND action IN ('BUY', 'SELL')
        ORDER BY ts ASC;`,
    );
  return res.recordset.map((r) => ({
    userId: r.userId,
    ts: toIso(r.ts),
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    action: r.action,
    amount: r.amount == null ? null : Number(r.amount),
    totalValue: r.totalValue == null ? null : Number(r.totalValue),
  }));
}

/** PLATFORM-scoped: per-user executed-fill counts in [fromMs, toMs) - the
 *  >500 trades/day anomaly check. */
export async function countFillsPerUser(fromMs: number, toMs: number): Promise<Map<string, number>> {
  if (!dbReady()) return new Map();
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("from", sql.DateTime2, new Date(fromMs))
    .input("to", sql.DateTime2, new Date(toMs))
    .query<{ userId: string; n: number }>(
      `SELECT userId, COUNT(*) AS n FROM dbo.TradeLog
        WHERE network = @net AND ts >= @from AND ts < @to
          AND status IN ('FILLED', 'PARTIAL')
        GROUP BY userId;`,
    );
  return new Map(res.recordset.map((r) => [r.userId, Number(r.n)]));
}

/** All user ids + their current tier/override flags (for the daily job). */
export async function listUserTierStates(): Promise<
  Array<{ id: string; volumeTier: string; tierOverride: boolean; flaggedForReview: boolean }>
> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .query<{ id: string; volumeTier: string | null; tierOverride: boolean; flaggedForReview: boolean }>(
      `SELECT id, volumeTier, tierOverride, flaggedForReview FROM dbo.Users;`,
    );
  return res.recordset.map((r) => ({
    id: r.id,
    volumeTier: r.volumeTier || "Bronze",
    tierOverride: Boolean(r.tierOverride),
    flaggedForReview: Boolean(r.flaggedForReview),
  }));
}

export async function setUserVolumeTier(userId: string, tier: string): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("tier", sql.NVarChar(12), tier)
    .query(`UPDATE dbo.Users SET volumeTier = @tier WHERE id = @id AND tierOverride = 0;`);
}

export async function setUserFlaggedForReview(userId: string, flagged: boolean): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), userId)
    .input("flag", sql.Bit, flagged)
    .query(`UPDATE dbo.Users SET flaggedForReview = @flag WHERE id = @id;`);
}
