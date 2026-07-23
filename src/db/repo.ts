import sql from "mssql";
import { randomUUID } from "node:crypto";
import { config } from "../config";
import { dayStartUtc } from "../time";
import { dbReady, getPool } from "./pool";
import { currentUserId } from "../users/context";
import { computeEvolution, type Fill } from "../trading/positions";
import type {
  AiLogEntry,
  AiLogPage,
  EvolutionPoint,
  PortfolioSnapshot,
  LiquiditySnapshotRow,
  LogEntry,
  LogLevel,
  LogsPage,
  PriceAlert,
  StopLoss,
  TradeLogEntry,
  TradeLogPage,
  StopLossAuditPage,
  StopLossAuditRow,
  StopLossSetBy,
  StopLossStatus,
  TokenRawData,
  TokenScanResult,
  TradeProposal,
  TradeSide,
  TradeStatus,
  TradesPage,
} from "../types";

/** Raw row shape as returned by SQL Server. */
interface ProposalRow {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  side: string;
  baseAsset: string;
  quoteAsset: string;
  amount: number;
  limitPrice: number;
  maxSlippageBps: number;
  reason: string | null;
  status: string;
  policyViolations: string | null;
  txHash: string | null;
  errorMsg: string | null;
  submittedAt: Date | string | null;
  filledAmount: number | null;
  filledPrice: number | null;
  provider: string | null;
  model: string | null;
  confidence: string | null;
  targetPrice: number | null;
  invalidationPrice: number | null;
  timeHorizon: string | null;
  offerId: string | null;
  mark1hPrice: number | null;
  mark1hPnlPct: number | null;
  mark24hPrice: number | null;
  mark24hPnlPct: number | null;
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

function parseViolations(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
  } catch {
    return [];
  }
}

function rowToProposal(r: ProposalRow): TradeProposal {
  return {
    id: r.id,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    side: r.side as TradeSide,
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    amount: String(r.amount),
    limitPrice: String(r.limitPrice),
    maxSlippageBps: r.maxSlippageBps,
    reason: r.reason ?? "",
    status: r.status as TradeStatus,
    policyViolations: parseViolations(r.policyViolations),
    ...(r.txHash ? { txHash: r.txHash } : {}),
    ...(r.errorMsg ? { error: r.errorMsg } : {}),
    ...(r.submittedAt ? { submittedAt: toIso(r.submittedAt) } : {}),
    ...(r.filledAmount != null ? { filledAmount: String(r.filledAmount) } : {}),
    ...(r.filledPrice != null ? { filledPrice: String(r.filledPrice) } : {}),
    ...(r.provider ? { provider: r.provider } : {}),
    ...(r.model ? { model: r.model } : {}),
    ...(r.confidence === "low" || r.confidence === "medium" || r.confidence === "high"
      ? { confidence: r.confidence }
      : {}),
    ...(r.targetPrice != null ? { targetPrice: String(r.targetPrice) } : {}),
    ...(r.invalidationPrice != null
      ? { invalidationPrice: String(r.invalidationPrice) }
      : {}),
    ...(r.timeHorizon ? { horizon: r.timeHorizon } : {}),
    ...(r.offerId ? { offerId: r.offerId } : {}),
    ...(r.mark1hPrice != null ? { mark1hPrice: String(r.mark1hPrice) } : {}),
    ...(r.mark1hPnlPct != null ? { mark1hPnlPct: r.mark1hPnlPct } : {}),
    ...(r.mark24hPrice != null ? { mark24hPrice: String(r.mark24hPrice) } : {}),
    ...(r.mark24hPnlPct != null ? { mark24hPnlPct: r.mark24hPnlPct } : {}),
  };
}

const SELECT_COLS = `id, createdAt, updatedAt, side, baseAsset, quoteAsset,
  amount, limitPrice, maxSlippageBps, reason, status, policyViolations,
  txHash, errorMsg, submittedAt, filledAmount, filledPrice, provider, model,
  confidence, targetPrice, invalidationPrice, timeHorizon, offerId,
  mark1hPrice, mark1hPnlPct, mark24hPrice, mark24hPnlPct`;

/** Minimal row used to rebuild fills for the PnL ledger / evolution series. */
interface FillRow {
  ts: Date | string;
  side: string;
  baseAsset: string;
  quoteAsset: string;
  amount: number;
  limitPrice: number;
}

function rowToFill(r: FillRow): Fill {
  return {
    side: r.side as TradeSide,
    base: r.baseAsset,
    quote: r.quoteAsset,
    amount: Number(r.amount) || 0,
    price: Number(r.limitPrice) || 0,
    ts: toIso(r.ts),
  };
}

/** Insert a brand-new proposal (idempotent on id). */
export async function insertProposal(p: TradeProposal): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), p.id)
    .input("createdAt", sql.DateTime2, new Date(p.createdAt))
    .input("updatedAt", sql.DateTime2, new Date(p.updatedAt))
    .input("side", sql.NVarChar(8), p.side)
    .input("baseAsset", sql.NVarChar(120), p.baseAsset)
    .input("quoteAsset", sql.NVarChar(120), p.quoteAsset)
    .input("amount", sql.Decimal(38, 7), Number(p.amount))
    .input("limitPrice", sql.Decimal(38, 7), Number(p.limitPrice))
    .input("maxSlippageBps", sql.Int, p.maxSlippageBps)
    .input("reason", sql.NVarChar(sql.MAX), p.reason)
    .input("status", sql.NVarChar(32), p.status)
    .input("policyViolations", sql.NVarChar(sql.MAX), JSON.stringify(p.policyViolations ?? []))
    .input("txHash", sql.NVarChar(128), p.txHash ?? null)
    .input("errorMsg", sql.NVarChar(sql.MAX), p.error ?? null)
    .input("submittedAt", sql.DateTime2, p.submittedAt ? new Date(p.submittedAt) : null)
    .input("filledAmount", sql.Decimal(38, 7), p.filledAmount != null ? Number(p.filledAmount) : null)
    .input("filledPrice", sql.Decimal(38, 7), p.filledPrice != null ? Number(p.filledPrice) : null)
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("provider", sql.NVarChar(40), p.provider ?? null)
    .input("model", sql.NVarChar(120), p.model ?? null)
    .input("confidence", sql.NVarChar(8), p.confidence ?? null)
    .input("targetPrice", sql.Decimal(38, 7), p.targetPrice != null ? Number(p.targetPrice) : null)
    .input("invalidationPrice", sql.Decimal(38, 7), p.invalidationPrice != null ? Number(p.invalidationPrice) : null)
    .input("timeHorizon", sql.NVarChar(32), p.horizon ?? null)
    .input("offerId", sql.NVarChar(32), p.offerId ?? null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.Proposals WHERE id = @id)
       INSERT INTO dbo.Proposals
         (id, createdAt, updatedAt, side, baseAsset, quoteAsset, amount,
          limitPrice, maxSlippageBps, reason, status, policyViolations,
          txHash, errorMsg, submittedAt, filledAmount, filledPrice, network, userId,
          provider, model, confidence, targetPrice, invalidationPrice,
          timeHorizon, offerId)
       VALUES
         (@id, @createdAt, @updatedAt, @side, @baseAsset, @quoteAsset, @amount,
          @limitPrice, @maxSlippageBps, @reason, @status, @policyViolations,
          @txHash, @errorMsg, @submittedAt, @filledAmount, @filledPrice, @network, @userId,
          @provider, @model, @confidence, @targetPrice, @invalidationPrice,
          @timeHorizon, @offerId);`,
    );
}

/** Persist the mutable fields after a status change. */
export async function updateProposal(p: TradeProposal): Promise<void> {
  if (!dbReady()) return;
  const result = await getPool()
    .request()
    .input("id", sql.NVarChar(64), p.id)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("updatedAt", sql.DateTime2, new Date(p.updatedAt))
    .input("status", sql.NVarChar(32), p.status)
    .input("policyViolations", sql.NVarChar(sql.MAX), JSON.stringify(p.policyViolations ?? []))
    .input("txHash", sql.NVarChar(128), p.txHash ?? null)
    .input("errorMsg", sql.NVarChar(sql.MAX), p.error ?? null)
    .input("filledAmount", sql.Decimal(38, 7), p.filledAmount != null ? Number(p.filledAmount) : null)
    .input("filledPrice", sql.Decimal(38, 7), p.filledPrice != null ? Number(p.filledPrice) : null)
    .input("submittedAt", sql.DateTime2, p.submittedAt ? new Date(p.submittedAt) : null)
    .input("offerId", sql.NVarChar(32), p.offerId ?? null)
    .input("mark1hPrice", sql.Decimal(38, 7), p.mark1hPrice != null ? Number(p.mark1hPrice) : null)
    .input("mark1hPnlPct", sql.Float, p.mark1hPnlPct ?? null)
    .input("mark24hPrice", sql.Decimal(38, 7), p.mark24hPrice != null ? Number(p.mark24hPrice) : null)
    .input("mark24hPnlPct", sql.Float, p.mark24hPnlPct ?? null)
    .query(
      `UPDATE dbo.Proposals
         SET updatedAt = @updatedAt,
             status = @status,
             policyViolations = @policyViolations,
             txHash = @txHash,
             errorMsg = @errorMsg,
             submittedAt = @submittedAt,
             filledAmount = @filledAmount,
             filledPrice = @filledPrice,
             offerId = @offerId,
             mark1hPrice = @mark1hPrice,
             mark1hPnlPct = @mark1hPnlPct,
             mark24hPrice = @mark24hPrice,
             mark24hPnlPct = @mark24hPnlPct
       WHERE id = @id AND userId = @userId;`,
    );
  // Upsert fallback: if the original INSERT failed transiently (its error is
  // swallowed by store.persist so the app keeps trading), every UPDATE here
  // would silently match 0 rows and the trade would be missing from every
  // persistence-backed counter after a restart. Re-insert with current state.
  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    await insertProposal(p);
  }
}

/**
 * Rows with PENDING post-trade work, regardless of recency: tracked resting
 * offers (later fills to book, stale cancels to fire) and submitting/failed
 * rows whose tx hash may still settle. Merged into the in-memory view on boot
 * so the monitor never loses them to the recent-100 hydration window.
 */
export async function listActionableProposals(): Promise<TradeProposal[]> {
  if (!dbReady()) return [];
  const result = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<ProposalRow>(
      `SELECT ${SELECT_COLS}
         FROM dbo.Proposals
        WHERE network = @net AND userId = @userId
          AND ((status = 'submitted' AND offerId IS NOT NULL)
            OR (status IN ('submitting', 'failed') AND txHash IS NOT NULL
                AND createdAt > DATEADD(hour, -24, SYSUTCDATETIME())))
        ORDER BY createdAt DESC;`,
    );
  return result.recordset.map(rowToProposal);
}

/** Newest-created proposals, for hydrating the in-memory live view on boot. */
export async function listRecentProposals(
  limit: number,
): Promise<TradeProposal[]> {
  if (!dbReady()) return [];
  const result = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, limit)
    .query<ProposalRow>(
      `SELECT TOP (@limit) ${SELECT_COLS}
         FROM dbo.Proposals
        WHERE network = @net AND userId = @userId
        ORDER BY createdAt DESC;`,
    );
  return result.recordset.map(rowToProposal);
}

const VALID_STATUSES = new Set<TradeStatus>([
  "proposed",
  "blocked",
  "pending_approval",
  "rejected",
  "submitting",
  "submitted",
  "failed",
]);

/** Paginated history for the table view. */
export async function listTrades(opts: {
  limit: number;
  offset: number;
  status?: string;
}): Promise<TradesPage> {
  const limit = Math.min(Math.max(opts.limit, 1), 500);
  const offset = Math.max(opts.offset, 0);
  const status =
    opts.status && VALID_STATUSES.has(opts.status as TradeStatus)
      ? opts.status
      : undefined;
  if (!dbReady()) return { rows: [], total: 0, limit, offset };

  const where = status
    ? "WHERE network = @net AND userId = @userId AND status = @status"
    : "WHERE network = @net AND userId = @userId";

  const rowsReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);
  if (status) rowsReq.input("status", sql.NVarChar(32), status);
  const rowsRes = await rowsReq.query<ProposalRow>(
    // createdAt (stable) rather than updatedAt: outcome marks and offer
    // reconciliation touch updatedAt later, which would reshuffle the table.
    `SELECT ${SELECT_COLS}
       FROM dbo.Proposals
       ${where}
      ORDER BY createdAt DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`,
  );

  const countReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  if (status) countReq.input("status", sql.NVarChar(32), status);
  const countRes = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.Proposals ${where};`,
  );

  return {
    rows: rowsRes.recordset.map(rowToProposal),
    total: countRes.recordset[0]?.total ?? 0,
    limit,
    offset,
  };
}

/**
 * Every submitted fill in chronological order. Used to (a) rebuild the realized
 * PnL ledger on boot and (b) derive the evolution series. Returns the FULL
 * history (not just the recent live-view window) so FIFO lot matching is exact.
 */
export async function listSubmittedFills(): Promise<Fill[]> {
  if (!dbReady()) return [];
  const result = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<FillRow>(
      // Prefer the reconciled on-chain fill; fall back to the requested
      // amount/limit for rows submitted before reconciliation existed (or whose
      // submit timed out). The fill instant is the SUBMIT time (createdAt for
      // rows that pre-date the submittedAt column) - NOT updatedAt, which the
      // monitor bumps later for outcome marks, so replay order and the
      // "today" boundary stay correct.
      `SELECT COALESCE(submittedAt, createdAt)   AS ts,
              side, baseAsset, quoteAsset,
              COALESCE(filledAmount, amount)     AS amount,
              COALESCE(filledPrice, limitPrice)  AS limitPrice
         FROM dbo.Proposals
        WHERE network = @net AND userId = @userId AND status = 'submitted'
        ORDER BY COALESCE(submittedAt, createdAt) ASC;`,
    );
  return result.recordset.map(rowToFill);
}

/** Cumulative volume / trade-count / realized-PnL over time from submitted trades. */
export async function getEvolution(): Promise<EvolutionPoint[]> {
  return computeEvolution(await listSubmittedFills());
}

/** Persist one portfolio-value snapshot for the current user. */
export async function insertPortfolioSnapshot(e: PortfolioSnapshot): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), randomUUID())
    .input("ts", sql.DateTime2, new Date(e.ts))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("totalUsd", sql.Decimal(38, 7), e.totalUsd != null ? Number(e.totalUsd) : null)
    .input("totalXlm", sql.Decimal(38, 7), Number(e.totalXlm))
    .query(
      `INSERT INTO dbo.PortfolioSnapshots (id, ts, network, userId, totalUsd, totalXlm)
       VALUES (@id, @ts, @network, @userId, @totalUsd, @totalXlm);`,
    );
}

/**
 * AUDIT-013: retention for dbo.PortfolioSnapshots, which otherwise grows
 * without bound (~105k rows per user per year at the 5-min throttle). Rows
 * older than `cutoffIso` are THINNED to the last snapshot per user/network/day
 * — the chart's widest bucket is daily, so every UI range keeps its exact
 * shape while old data stops accumulating. GLOBAL by design (a retention job
 * covers every user, unlike the per-user read/write helpers). Returns the
 * number of rows deleted.
 */
export async function thinPortfolioSnapshots(cutoffIso: string): Promise<number> {
  if (!dbReady()) return 0;
  const res = await getPool()
    .request()
    .input("cutoff", sql.DateTime2, new Date(cutoffIso))
    .query<{ n: number }>(
      `WITH old AS (
         SELECT id,
                ROW_NUMBER() OVER (
                  PARTITION BY userId, network, CAST(ts AS DATE)
                  ORDER BY ts DESC) AS rn
           FROM dbo.PortfolioSnapshots
          WHERE ts < @cutoff)
       DELETE FROM old WHERE rn > 1;
       SELECT @@ROWCOUNT AS n;`,
    );
  return Number(res.recordset[0]?.n ?? 0);
}

/**
 * Portfolio-value snapshots for the current user, oldest-first. `sinceIso` bounds
 * the window (null = all history). When `bucketMinutes` is set, the rows are
 * downsampled to the LAST snapshot in each fixed-size time bucket, so a long
 * range (e.g. 1Y at 5-min cadence) returns a few hundred points, not 100k.
 */
export async function getPortfolioSnapshots(
  sinceIso: string | null,
  bucketMinutes: number | null,
): Promise<PortfolioSnapshot[]> {
  if (!dbReady()) return [];
  const req = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("since", sql.DateTime2, sinceIso ? new Date(sinceIso) : null);
  let query: string;
  if (bucketMinutes && bucketMinutes > 0) {
    req.input("bucket", sql.Int, bucketMinutes);
    query = `
      WITH b AS (
        SELECT ts, totalUsd, totalXlm,
          ROW_NUMBER() OVER (
            PARTITION BY DATEDIFF(minute, '2000-01-01', ts) / @bucket
            ORDER BY ts DESC) AS rn
        FROM dbo.PortfolioSnapshots
        WHERE network = @net AND userId = @userId AND (@since IS NULL OR ts >= @since)
      )
      SELECT ts, totalUsd, totalXlm FROM b WHERE rn = 1 ORDER BY ts ASC;`;
  } else {
    query = `
      SELECT ts, totalUsd, totalXlm FROM dbo.PortfolioSnapshots
      WHERE network = @net AND userId = @userId AND (@since IS NULL OR ts >= @since)
      ORDER BY ts ASC;`;
  }
  const rs = await req.query(query);
  return (rs.recordset as Array<{ ts: Date | string; totalUsd: number | null; totalXlm: number }>).map(
    (r) => ({
      ts: (r.ts instanceof Date ? r.ts : new Date(r.ts)).toISOString(),
      totalUsd: r.totalUsd != null ? Number(r.totalUsd) : null,
      totalXlm: r.totalXlm != null ? Number(r.totalXlm) : 0,
    }),
  );
}

/** Today's submitted volume/count/last-time, to restore same-day caps on boot. */
export async function sumTodaySubmitted(): Promise<{
  volume: number;
  count: number;
  lastTradeAt: string | null;
}> {
  if (!dbReady()) return { volume: 0, count: 0, lastTradeAt: null };
  // Local-midnight boundary in config.timezone, as a UTC instant - matches the
  // in-memory store's dayKey/rollover so restored counters line up.
  const dayStart = dayStartUtc();
  const result = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("start", sql.DateTime2, dayStart)
    .query<{ volume: number | null; count: number; last: Date | string | null }>(
      // "Today" pivots on the SUBMIT time (createdAt fallback for legacy
      // rows). It previously used updatedAt, so a +24h outcome mark on an old
      // trade made it count as TODAY's trade after a restart.
      `SELECT COALESCE(SUM(COALESCE(filledAmount, amount)), 0) AS volume,
              COUNT(*)                                        AS count,
              MAX(COALESCE(submittedAt, createdAt))           AS last
         FROM dbo.Proposals
        WHERE network = @net AND userId = @userId AND status = 'submitted'
          AND COALESCE(submittedAt, createdAt) >= @start;`,
    );
  const row = result.recordset[0];
  return {
    volume: Number(row?.volume ?? 0),
    count: Number(row?.count ?? 0),
    lastTradeAt: row?.last ? toIso(row.last) : null,
  };
}

/** Raw log row shape as returned by SQL Server. */
interface LogRow {
  id: string;
  ts: Date | string;
  level: string;
  message: string;
  data: string | null;
}

const VALID_LOG_LEVELS = new Set<LogLevel>([
  "info",
  "warn",
  "error",
  "trade",
  "ai",
]);

function rowToLogEntry(r: LogRow): LogEntry {
  const entry: LogEntry = {
    ts: toIso(r.ts),
    level: r.level as LogLevel,
    message: r.message,
  };
  if (r.data != null) {
    try {
      entry.data = JSON.parse(r.data) as unknown;
    } catch {
      // Keep the raw string when it isn't valid JSON rather than dropping it.
      entry.data = r.data;
    }
  }
  return entry;
}

/** Insert a single log entry (idempotent on the app-generated id). */
export async function insertLog(entry: LogEntry, id: string): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("ts", sql.DateTime2, new Date(entry.ts))
    .input("level", sql.NVarChar(16), entry.level)
    .input("message", sql.NVarChar(sql.MAX), entry.message)
    .input(
      "data",
      sql.NVarChar(sql.MAX),
      entry.data !== undefined ? JSON.stringify(entry.data) : null,
    )
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.Logs WHERE id = @id)
       INSERT INTO dbo.Logs (id, ts, level, message, data, network, userId)
       VALUES (@id, @ts, @level, @message, @data, @network, @userId);`,
    );
}

/** Paginated, filterable log history for the browsable history view. */
export async function listLogs(opts: {
  limit: number;
  offset: number;
  level?: string;
  q?: string;
  since?: string;
}): Promise<LogsPage> {
  const limit = Math.min(Math.max(opts.limit, 1), 500);
  const offset = Math.max(opts.offset, 0);
  const level =
    opts.level && VALID_LOG_LEVELS.has(opts.level as LogLevel)
      ? opts.level
      : undefined;
  if (!dbReady()) return { rows: [], total: 0, limit, offset };

  const conditions = ["network = @net", "userId = @userId"];
  if (level) conditions.push("level = @level");
  // AUDIT-027 (accepted): the leading-wildcard LIKE can't use a B-tree index,
  // so the match scans the user's (already index-narrowed) rows. Correct and
  // parameterized; if log search ever gets slow at scale, add a SQL Server
  // full-text index on dbo.Logs.message or bound the default time window.
  if (opts.q) conditions.push("message LIKE @q");
  if (opts.since) conditions.push("ts >= @since");
  const where = `WHERE ${conditions.join(" AND ")}`;

  const rowsReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);
  if (level) rowsReq.input("level", sql.NVarChar(16), level);
  // Bind the search term PERCENT-WRAPPED as a parameter (never string-concatenated
  // into the SQL) so it stays an injection-safe LIKE pattern.
  if (opts.q) rowsReq.input("q", sql.NVarChar(sql.MAX), `%${opts.q}%`);
  if (opts.since) rowsReq.input("since", sql.DateTime2, new Date(opts.since));
  const rowsRes = await rowsReq.query<LogRow>(
    `SELECT id, ts, level, message, data
       FROM dbo.Logs
       ${where}
      ORDER BY ts DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`,
  );

  const countReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  if (level) countReq.input("level", sql.NVarChar(16), level);
  if (opts.q) countReq.input("q", sql.NVarChar(sql.MAX), `%${opts.q}%`);
  if (opts.since) countReq.input("since", sql.DateTime2, new Date(opts.since));
  const countRes = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.Logs ${where};`,
  );

  return {
    rows: rowsRes.recordset.map(rowToLogEntry),
    total: countRes.recordset[0]?.total ?? 0,
    limit,
    offset,
  };
}

/* ------------------------------------------------------------------ *
 * Liquidity-scanner snapshots (observe-only). Same dbReady-guard +
 * idempotent-insert + Raw*Row/rowTo* shape as the proposal/log helpers.
 * NOTE: the SQL column is `rankPos` (RANK is a reserved T-SQL keyword);
 * the domain field is `rank`.
 * ------------------------------------------------------------------ */

interface RawLiquidityRow {
  ts: Date | string;
  asset: string;
  assetCode: string;
  assetIssuer: string;
  quoteAsset: string;
  rankPos: number;
  baseVolume24h: number | null;
  numTrades24h: number | null;
  spreadBps: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

function rowToLiquidity(r: RawLiquidityRow): LiquiditySnapshotRow {
  return {
    ts: toIso(r.ts),
    asset: r.asset,
    assetCode: r.assetCode,
    assetIssuer: r.assetIssuer,
    quoteAsset: r.quoteAsset,
    rank: Number(r.rankPos) || 0,
    baseVolume24h: r.baseVolume24h != null ? Number(r.baseVolume24h) : null,
    numTrades24h: r.numTrades24h != null ? Number(r.numTrades24h) : null,
    spreadBps: r.spreadBps != null ? Number(r.spreadBps) : null,
    bestBid: r.bestBid != null ? Number(r.bestBid) : null,
    bestAsk: r.bestAsk != null ? Number(r.bestAsk) : null,
  };
}

/** Insert one hourly liquidity observation (idempotent on the app-generated id). */
export async function insertLiquiditySnapshot(
  row: LiquiditySnapshotRow,
  id: string,
): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("ts", sql.DateTime2, new Date(row.ts))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("asset", sql.NVarChar(120), row.asset)
    .input("assetCode", sql.NVarChar(32), row.assetCode)
    .input("assetIssuer", sql.NVarChar(64), row.assetIssuer)
    .input("quoteAsset", sql.NVarChar(120), row.quoteAsset)
    .input("rankPos", sql.Int, row.rank)
    .input("baseVolume24h", sql.Decimal(38, 7), row.baseVolume24h)
    .input("numTrades24h", sql.Int, row.numTrades24h)
    .input("spreadBps", sql.Float, row.spreadBps)
    .input("bestBid", sql.Decimal(38, 7), row.bestBid)
    .input("bestAsk", sql.Decimal(38, 7), row.bestAsk)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.LiquiditySnapshots WHERE id = @id)
       INSERT INTO dbo.LiquiditySnapshots
         (id, ts, network, userId, asset, assetCode, assetIssuer, quoteAsset, rankPos,
          baseVolume24h, numTrades24h, spreadBps, bestBid, bestAsk)
       VALUES
         (@id, @ts, @network, @userId, @asset, @assetCode, @assetIssuer, @quoteAsset, @rankPos,
          @baseVolume24h, @numTrades24h, @spreadBps, @bestBid, @bestAsk);`,
    );
}

/** Liquidity history for the analyzer / detail view. Windowed by `since`. */
export async function listLiquiditySnapshots(opts: {
  since?: string;
  asset?: string;
  limit?: number;
}): Promise<LiquiditySnapshotRow[]> {
  if (!dbReady()) return [];
  const limit = Math.min(Math.max(opts.limit ?? 10_000, 1), 50_000);
  const conditions = ["network = @net", "userId = @userId"];
  if (opts.asset) conditions.push("asset = @asset");
  if (opts.since) conditions.push("ts >= @since");
  const where = `WHERE ${conditions.join(" AND ")}`;
  const req = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, limit);
  if (opts.asset) req.input("asset", sql.NVarChar(120), opts.asset);
  if (opts.since) req.input("since", sql.DateTime2, new Date(opts.since));
  const res = await req.query<RawLiquidityRow>(
    `SELECT TOP (@limit) ts, asset, assetCode, assetIssuer, quoteAsset, rankPos,
            baseVolume24h, numTrades24h, spreadBps, bestBid, bestAsk
       FROM dbo.LiquiditySnapshots
       ${where}
      ORDER BY ts DESC;`,
  );
  return res.recordset.map(rowToLiquidity);
}

/* ------------------------------------------------------------------ *
 * Stop-loss orders + audit trail. Rows are NEVER deleted (status-only
 * transitions), so the upsert-on-0-rows fallback can never resurrect a
 * cancelled stop as active: the re-insert carries the object's CURRENT
 * status, and hydration loads only status='active'.
 * ------------------------------------------------------------------ */

interface RawStopLossRow {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  baseAsset: string;
  quoteAsset: string;
  triggerPrice: number;
  sellAll: boolean;
  quantityToSell: number | null;
  setBy: string;
  status: string;
  notes: string | null;
  triggeredAt: Date | string | null;
  triggerProposalId: string | null;
  attemptCount: number;
  lastError: string | null;
  isTrailing: boolean | null;
  trailAmount: number | null;
  trailPercent: number | null;
  highWaterMark: number | null;
  currentTrailPrice: number | null;
}

function rowToStopLoss(r: RawStopLossRow): StopLoss {
  return {
    id: r.id,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    triggerPrice: String(r.triggerPrice),
    sellAll: Boolean(r.sellAll),
    setBy: r.setBy as StopLossSetBy,
    status: r.status as StopLossStatus,
    attemptCount: Number(r.attemptCount) || 0,
    ...(r.quantityToSell != null ? { quantityToSell: String(r.quantityToSell) } : {}),
    ...(r.notes ? { notes: r.notes } : {}),
    ...(r.triggeredAt ? { triggeredAt: toIso(r.triggeredAt) } : {}),
    ...(r.triggerProposalId ? { triggerProposalId: r.triggerProposalId } : {}),
    ...(r.lastError ? { lastError: r.lastError } : {}),
    ...(r.isTrailing ? { isTrailing: true } : {}),
    ...(r.trailAmount != null ? { trailAmount: String(r.trailAmount) } : {}),
    ...(r.trailPercent != null ? { trailPercent: Number(r.trailPercent) } : {}),
    ...(r.highWaterMark != null ? { highWaterMark: String(r.highWaterMark) } : {}),
    ...(r.currentTrailPrice != null ? { currentTrailPrice: String(r.currentTrailPrice) } : {}),
  };
}

const STOPLOSS_COLS = `id, createdAt, updatedAt, baseAsset, quoteAsset, triggerPrice,
  sellAll, quantityToSell, setBy, status, notes, triggeredAt, triggerProposalId,
  attemptCount, lastError, isTrailing, trailAmount, trailPercent, highWaterMark,
  currentTrailPrice`;

function bindStopLoss(req: sql.Request, s: StopLoss): sql.Request {
  return req
    .input("id", sql.NVarChar(64), s.id)
    .input("createdAt", sql.DateTime2, new Date(s.createdAt))
    .input("updatedAt", sql.DateTime2, new Date(s.updatedAt))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("baseAsset", sql.NVarChar(120), s.baseAsset)
    .input("quoteAsset", sql.NVarChar(120), s.quoteAsset)
    .input("triggerPrice", sql.Decimal(38, 7), Number(s.triggerPrice))
    .input("sellAll", sql.Bit, s.sellAll)
    .input(
      "quantityToSell",
      sql.Decimal(38, 7),
      s.quantityToSell != null ? Number(s.quantityToSell) : null,
    )
    .input("setBy", sql.NVarChar(8), s.setBy)
    .input("status", sql.NVarChar(16), s.status)
    .input("notes", sql.NVarChar(sql.MAX), s.notes ?? null)
    .input("triggeredAt", sql.DateTime2, s.triggeredAt ? new Date(s.triggeredAt) : null)
    .input("triggerProposalId", sql.NVarChar(64), s.triggerProposalId ?? null)
    .input("attemptCount", sql.Int, s.attemptCount)
    .input("lastError", sql.NVarChar(sql.MAX), s.lastError ?? null)
    .input("isTrailing", sql.Bit, s.isTrailing ?? null)
    .input("trailAmount", sql.Decimal(38, 7), s.trailAmount != null ? Number(s.trailAmount) : null)
    .input("trailPercent", sql.Float, s.trailPercent ?? null)
    .input("highWaterMark", sql.Decimal(38, 7), s.highWaterMark != null ? Number(s.highWaterMark) : null)
    .input(
      "currentTrailPrice",
      sql.Decimal(38, 7),
      s.currentTrailPrice != null ? Number(s.currentTrailPrice) : null,
    );
}

/** Insert a brand-new stop loss (idempotent on id). */
export async function insertStopLoss(s: StopLoss): Promise<void> {
  if (!dbReady()) return;
  await bindStopLoss(getPool().request(), s).query(
    `IF NOT EXISTS (SELECT 1 FROM dbo.StopLosses WHERE id = @id)
     INSERT INTO dbo.StopLosses
       (id, createdAt, updatedAt, network, userId, baseAsset, quoteAsset, triggerPrice,
        sellAll, quantityToSell, setBy, status, notes, triggeredAt,
        triggerProposalId, attemptCount, lastError, isTrailing, trailAmount,
        trailPercent, highWaterMark, currentTrailPrice)
     VALUES
       (@id, @createdAt, @updatedAt, @network, @userId, @baseAsset, @quoteAsset, @triggerPrice,
        @sellAll, @quantityToSell, @setBy, @status, @notes, @triggeredAt,
        @triggerProposalId, @attemptCount, @lastError, @isTrailing, @trailAmount,
        @trailPercent, @highWaterMark, @currentTrailPrice);`,
  );
}

/** Persist mutable fields. Upsert fallback re-inserts the CURRENT object (its
 *  real status) if the row is missing - so a lost insert is recovered without
 *  ever resurrecting a terminal stop as active. */
export async function updateStopLoss(s: StopLoss): Promise<void> {
  if (!dbReady()) return;
  const result = await bindStopLoss(getPool().request(), s).query(
    `UPDATE dbo.StopLosses
        SET updatedAt = @updatedAt,
            triggerPrice = @triggerPrice,
            sellAll = @sellAll,
            quantityToSell = @quantityToSell,
            status = @status,
            notes = @notes,
            triggeredAt = @triggeredAt,
            triggerProposalId = @triggerProposalId,
            attemptCount = @attemptCount,
            lastError = @lastError,
            isTrailing = @isTrailing,
            trailAmount = @trailAmount,
            trailPercent = @trailPercent,
            highWaterMark = @highWaterMark,
            currentTrailPrice = @currentTrailPrice
      WHERE id = @id AND userId = @userId;`,
  );
  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    await insertStopLoss(s);
  }
}

/** Active stop losses for the current network (loaded on boot for the monitor). */
export async function listActiveStopLosses(): Promise<StopLoss[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<RawStopLossRow>(
      `SELECT ${STOPLOSS_COLS}
         FROM dbo.StopLosses
        WHERE network = @net AND userId = @userId AND status = 'active'
        ORDER BY createdAt DESC;`,
    );
  return res.recordset.map(rowToStopLoss);
}

/** Raw audit row shape as returned by SQL Server. */
interface RawAuditRow {
  id: string;
  ts: Date | string;
  stopLossId: string;
  baseAsset: string;
  quoteAsset: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  initiator: string;
  note: string | null;
}

function rowToAudit(r: RawAuditRow): StopLossAuditRow {
  return {
    id: r.id,
    ts: toIso(r.ts),
    stopLossId: r.stopLossId,
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    action: r.action as StopLossAuditRow["action"],
    initiator: r.initiator as StopLossAuditRow["initiator"],
    ...(r.field ? { field: r.field } : {}),
    ...(r.oldValue != null ? { oldValue: r.oldValue } : {}),
    ...(r.newValue != null ? { newValue: r.newValue } : {}),
    ...(r.note ? { note: r.note } : {}),
  };
}

/** Append an immutable audit row (idempotent on id). */
export async function insertStopLossAudit(a: StopLossAuditRow): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), a.id)
    .input("ts", sql.DateTime2, new Date(a.ts))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("stopLossId", sql.NVarChar(64), a.stopLossId)
    .input("baseAsset", sql.NVarChar(120), a.baseAsset)
    .input("quoteAsset", sql.NVarChar(120), a.quoteAsset)
    .input("action", sql.NVarChar(16), a.action)
    .input("field", sql.NVarChar(40), a.field ?? null)
    .input("oldValue", sql.NVarChar(200), a.oldValue ?? null)
    .input("newValue", sql.NVarChar(200), a.newValue ?? null)
    .input("initiator", sql.NVarChar(16), a.initiator)
    .input("note", sql.NVarChar(sql.MAX), a.note ?? null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.StopLossAudit WHERE id = @id)
       INSERT INTO dbo.StopLossAudit
         (id, ts, network, userId, stopLossId, baseAsset, quoteAsset, action, field,
          oldValue, newValue, initiator, note)
       VALUES
         (@id, @ts, @network, @userId, @stopLossId, @baseAsset, @quoteAsset, @action, @field,
          @oldValue, @newValue, @initiator, @note);`,
    );
}

/* ------------------------------------------------------------------ *
 * Price alerts. Same dbReady-guard + idempotent-insert + upsert-fallback
 * shape as the stop-loss helpers. Rows are never deleted (status only).
 * ------------------------------------------------------------------ */

interface RawAlertRow {
  id: string;
  createdAt: Date | string;
  baseAsset: string;
  quoteAsset: string;
  direction: string;
  price: number;
  status: string;
  note: string | null;
  triggeredAt: Date | string | null;
  triggerPrice: number | null;
}

/* ---- key/value Settings (per network) ------------------------------- */

/** Read a persisted setting's JSON string, or null when absent / no DB. */
export async function getSetting(key: string): Promise<string | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("k", sql.NVarChar(64), key)
    .query<{ value: string }>(
      `SELECT value FROM dbo.Settings
        WHERE network = @net AND userId = @userId AND keyName = @k;`,
    );
  return res.recordset[0]?.value ?? null;
}

/**
 * AUDIT-026: batch read of many settings in ONE round trip. Boot hydration
 * used to issue a sequential query per catalog key (~30 round trips).
 */
export async function getSettings(keys: string[]): Promise<Map<string, string>> {
  if (!dbReady() || keys.length === 0) return new Map();
  const req = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  const params = keys.map((k, i) => {
    req.input(`k${i}`, sql.NVarChar(64), k);
    return `@k${i}`;
  });
  const res = await req.query<{ keyName: string; value: string }>(
    `SELECT keyName, value FROM dbo.Settings
      WHERE network = @net AND userId = @userId AND keyName IN (${params.join(", ")});`,
  );
  return new Map(res.recordset.map((r) => [r.keyName, r.value]));
}

/** Upsert a setting (in-place; the only non-append-only store). No-op without a DB. */
export async function upsertSetting(key: string, value: string): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("k", sql.NVarChar(64), key)
    .input("v", sql.NVarChar(sql.MAX), value)
    .input("ts", sql.DateTime2, new Date())
    .query(
      `MERGE dbo.Settings AS t
       USING (SELECT @userId AS userId, @net AS network, @k AS keyName) AS s
         ON t.userId = s.userId AND t.network = s.network AND t.keyName = s.keyName
       WHEN MATCHED THEN UPDATE SET value = @v, updatedAt = @ts
       WHEN NOT MATCHED THEN INSERT (userId, network, keyName, value, updatedAt)
         VALUES (@userId, @net, @k, @v, @ts);`,
    );
}

/* ---- structured TRADE + AI logs (append-only) ----------------------- */

export interface TradeLogQuery {
  limit: number;
  offset: number;
  initiator?: string; // MANUAL | AI
  action?: string; // BUY | SELL | SWAP | CANCEL | REJECTED
  token?: string; // baseAsset spec
  from?: string; // ISO
  to?: string; // ISO
}

export async function insertTradeLog(e: TradeLogEntry): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), e.id)
    .input("ts", sql.DateTime2, new Date(e.ts))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("baseAsset", sql.NVarChar(120), e.baseAsset)
    .input("quoteAsset", sql.NVarChar(120), e.quoteAsset)
    .input("action", sql.NVarChar(12), e.action)
    .input("amount", sql.Decimal(38, 7), e.amount != null ? Number(e.amount) : null)
    .input("price", sql.Decimal(38, 7), e.price != null ? Number(e.price) : null)
    .input("totalValue", sql.Decimal(38, 7), e.totalValue != null ? Number(e.totalValue) : null)
    .input("initiator", sql.NVarChar(8), e.initiator)
    .input("status", sql.NVarChar(12), e.status)
    .input("txHash", sql.NVarChar(80), e.txHash ?? null)
    .input("orderId", sql.NVarChar(64), e.orderId ?? null)
    .input("source", sql.NVarChar(24), e.source ?? null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.TradeLog WHERE id = @id)
       INSERT INTO dbo.TradeLog
         (id, ts, network, userId, baseAsset, quoteAsset, action, amount, price,
          totalValue, initiator, status, txHash, orderId, source)
       VALUES
         (@id, @ts, @network, @userId, @baseAsset, @quoteAsset, @action, @amount, @price,
          @totalValue, @initiator, @status, @txHash, @orderId, @source);`,
    );
}

interface RawTradeLogRow {
  id: string; ts: Date | string; baseAsset: string; quoteAsset: string;
  action: string; amount: number | null; price: number | null;
  totalValue: number | null; initiator: string; status: string;
  txHash: string | null; orderId: string | null; source: string | null;
}
function rowToTradeLog(r: RawTradeLogRow): TradeLogEntry {
  return {
    id: r.id, ts: toIso(r.ts), baseAsset: r.baseAsset, quoteAsset: r.quoteAsset,
    action: r.action as TradeLogEntry["action"],
    amount: String(r.amount ?? 0), price: String(r.price ?? 0),
    totalValue: String(r.totalValue ?? 0),
    initiator: r.initiator as TradeLogEntry["initiator"],
    status: r.status as TradeLogEntry["status"],
    ...(r.txHash ? { txHash: r.txHash } : {}),
    ...(r.orderId ? { orderId: r.orderId } : {}),
    ...(r.source ? { source: r.source } : {}),
  };
}

export async function listTradeLog(q: TradeLogQuery): Promise<TradeLogPage> {
  if (!dbReady()) return { rows: [], total: 0, limit: q.limit, offset: q.offset };
  const req = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  const where: string[] = ["network = @net", "userId = @userId"];
  if (q.initiator) { req.input("initiator", sql.NVarChar(8), q.initiator); where.push("initiator = @initiator"); }
  if (q.action) { req.input("action", sql.NVarChar(12), q.action); where.push("action = @action"); }
  if (q.token) { req.input("token", sql.NVarChar(120), q.token); where.push("baseAsset = @token"); }
  if (q.from) { req.input("from", sql.DateTime2, new Date(q.from)); where.push("ts >= @from"); }
  if (q.to) { req.input("to", sql.DateTime2, new Date(q.to)); where.push("ts <= @to"); }
  const clause = where.join(" AND ");
  const totalRes = await req.query<{ n: number }>(`SELECT COUNT(*) AS n FROM dbo.TradeLog WHERE ${clause};`);
  const total = totalRes.recordset[0]?.n ?? 0;
  req.input("limit", sql.Int, q.limit).input("offset", sql.Int, q.offset);
  const res = await req.query<RawTradeLogRow>(
    `SELECT id, ts, baseAsset, quoteAsset, action, amount, price, totalValue,
            initiator, status, txHash, orderId, source
       FROM dbo.TradeLog WHERE ${clause}
      ORDER BY ts DESC, id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`,
  );
  return { rows: res.recordset.map(rowToTradeLog), total, limit: q.limit, offset: q.offset };
}

export interface AiLogQuery {
  limit: number;
  offset: number;
  eventType?: string;
  token?: string;
  from?: string;
  to?: string;
}

export async function insertAiLog(e: AiLogEntry): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), e.id)
    .input("ts", sql.DateTime2, new Date(e.ts))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("eventType", sql.NVarChar(24), e.eventType)
    .input("baseAsset", sql.NVarChar(120), e.baseAsset ?? null)
    .input("quoteAsset", sql.NVarChar(120), e.quoteAsset ?? null)
    .input("reasoning", sql.NVarChar(sql.MAX), e.reasoning)
    .input("riskProfile", sql.NVarChar(sql.MAX), e.riskProfile ? JSON.stringify(e.riskProfile) : null)
    .input("confidence", sql.NVarChar(8), e.confidence ?? null)
    .input("direction", sql.NVarChar(8), e.direction ?? null)
    .input("price", sql.Decimal(38, 7), e.price != null ? Number(e.price) : null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.AiLog WHERE id = @id)
       INSERT INTO dbo.AiLog
         (id, ts, network, userId, eventType, baseAsset, quoteAsset, reasoning,
          riskProfile, confidence, direction, price)
       VALUES
         (@id, @ts, @network, @userId, @eventType, @baseAsset, @quoteAsset, @reasoning,
          @riskProfile, @confidence, @direction, @price);`,
    );
}

interface RawAiLogRow {
  id: string; ts: Date | string; eventType: string;
  baseAsset: string | null; quoteAsset: string | null; reasoning: string;
  riskProfile: string | null; confidence: string | null;
  direction: string | null; price: number | null;
}
function rowToAiLog(r: RawAiLogRow): AiLogEntry {
  let rp: AiLogEntry["riskProfile"];
  if (r.riskProfile) {
    try { rp = JSON.parse(r.riskProfile); } catch { rp = undefined; }
  }
  return {
    id: r.id, ts: toIso(r.ts), eventType: r.eventType as AiLogEntry["eventType"],
    reasoning: r.reasoning,
    ...(r.baseAsset ? { baseAsset: r.baseAsset } : {}),
    ...(r.quoteAsset ? { quoteAsset: r.quoteAsset } : {}),
    ...(rp ? { riskProfile: rp } : {}),
    ...(r.confidence ? { confidence: r.confidence } : {}),
    ...(r.direction ? { direction: r.direction } : {}),
    ...(r.price != null ? { price: String(r.price) } : {}),
  };
}

export async function listAiLog(q: AiLogQuery): Promise<AiLogPage> {
  if (!dbReady()) return { rows: [], total: 0, limit: q.limit, offset: q.offset };
  const req = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  const where: string[] = ["network = @net", "userId = @userId"];
  if (q.eventType) { req.input("eventType", sql.NVarChar(24), q.eventType); where.push("eventType = @eventType"); }
  if (q.token) { req.input("token", sql.NVarChar(120), q.token); where.push("baseAsset = @token"); }
  if (q.from) { req.input("from", sql.DateTime2, new Date(q.from)); where.push("ts >= @from"); }
  if (q.to) { req.input("to", sql.DateTime2, new Date(q.to)); where.push("ts <= @to"); }
  const clause = where.join(" AND ");
  const totalRes = await req.query<{ n: number }>(`SELECT COUNT(*) AS n FROM dbo.AiLog WHERE ${clause};`);
  const total = totalRes.recordset[0]?.n ?? 0;
  req.input("limit", sql.Int, q.limit).input("offset", sql.Int, q.offset);
  const res = await req.query<RawAiLogRow>(
    `SELECT id, ts, eventType, baseAsset, quoteAsset, reasoning, riskProfile,
            confidence, direction, price
       FROM dbo.AiLog WHERE ${clause}
      ORDER BY ts DESC, id DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`,
  );
  return { rows: res.recordset.map(rowToAiLog), total, limit: q.limit, offset: q.offset };
}

function rowToAlert(r: RawAlertRow): PriceAlert {
  return {
    id: r.id,
    createdAt: toIso(r.createdAt),
    baseAsset: r.baseAsset,
    quoteAsset: r.quoteAsset,
    direction: r.direction as PriceAlert["direction"],
    price: String(r.price),
    status: r.status as PriceAlert["status"],
    ...(r.note ? { note: r.note } : {}),
    ...(r.triggeredAt ? { triggeredAt: toIso(r.triggeredAt) } : {}),
    ...(r.triggerPrice != null ? { triggerPrice: String(r.triggerPrice) } : {}),
  };
}

const ALERT_COLS = `id, createdAt, baseAsset, quoteAsset, direction, price,
  status, note, triggeredAt, triggerPrice`;

function bindAlert(req: sql.Request, a: PriceAlert): sql.Request {
  return req
    .input("id", sql.NVarChar(64), a.id)
    .input("createdAt", sql.DateTime2, new Date(a.createdAt))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("baseAsset", sql.NVarChar(120), a.baseAsset)
    .input("quoteAsset", sql.NVarChar(120), a.quoteAsset)
    .input("direction", sql.NVarChar(8), a.direction)
    .input("price", sql.Decimal(38, 7), Number(a.price))
    .input("status", sql.NVarChar(16), a.status)
    .input("note", sql.NVarChar(sql.MAX), a.note ?? null)
    .input("triggeredAt", sql.DateTime2, a.triggeredAt ? new Date(a.triggeredAt) : null)
    .input(
      "triggerPrice",
      sql.Decimal(38, 7),
      a.triggerPrice != null ? Number(a.triggerPrice) : null,
    );
}

export async function insertPriceAlert(a: PriceAlert): Promise<void> {
  if (!dbReady()) return;
  await bindAlert(getPool().request(), a).query(
    `IF NOT EXISTS (SELECT 1 FROM dbo.PriceAlerts WHERE id = @id)
     INSERT INTO dbo.PriceAlerts
       (id, createdAt, network, userId, baseAsset, quoteAsset, direction, price, status,
        note, triggeredAt, triggerPrice)
     VALUES
       (@id, @createdAt, @network, @userId, @baseAsset, @quoteAsset, @direction, @price, @status,
        @note, @triggeredAt, @triggerPrice);`,
  );
}

export async function updatePriceAlert(a: PriceAlert): Promise<void> {
  if (!dbReady()) return;
  const result = await bindAlert(getPool().request(), a).query(
    `UPDATE dbo.PriceAlerts
        SET status = @status, triggeredAt = @triggeredAt, triggerPrice = @triggerPrice,
            note = @note
      WHERE id = @id AND userId = @userId;`,
  );
  if ((result.rowsAffected?.[0] ?? 0) === 0) {
    await insertPriceAlert(a);
  }
}

export async function listActivePriceAlerts(): Promise<PriceAlert[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<RawAlertRow>(
      `SELECT ${ALERT_COLS}
         FROM dbo.PriceAlerts
        WHERE network = @net AND userId = @userId AND status = 'active'
        ORDER BY createdAt DESC;`,
    );
  return res.recordset.map(rowToAlert);
}

/** Paginated audit history for a pair (collapsible section on the detail page). */
export async function listStopLossAudit(opts: {
  base?: string;
  quote?: string;
  limit: number;
  offset: number;
}): Promise<StopLossAuditPage> {
  const limit = Math.min(Math.max(opts.limit, 1), 500);
  const offset = Math.max(opts.offset, 0);
  if (!dbReady()) return { rows: [], total: 0, limit, offset };

  const conditions = ["network = @net", "userId = @userId"];
  if (opts.base) conditions.push("baseAsset = @base");
  if (opts.quote) conditions.push("quoteAsset = @quote");
  const where = `WHERE ${conditions.join(" AND ")}`;

  const rowsReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, limit)
    .input("offset", sql.Int, offset);
  if (opts.base) rowsReq.input("base", sql.NVarChar(120), opts.base);
  if (opts.quote) rowsReq.input("quote", sql.NVarChar(120), opts.quote);
  const rowsRes = await rowsReq.query<RawAuditRow>(
    `SELECT id, ts, stopLossId, baseAsset, quoteAsset, action, field,
            oldValue, newValue, initiator, note
       FROM dbo.StopLossAudit
       ${where}
      ORDER BY ts DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;`,
  );

  const countReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId());
  if (opts.base) countReq.input("base", sql.NVarChar(120), opts.base);
  if (opts.quote) countReq.input("quote", sql.NVarChar(120), opts.quote);
  const countRes = await countReq.query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM dbo.StopLossAudit ${where};`,
  );

  return {
    rows: rowsRes.recordset.map(rowToAudit),
    total: countRes.recordset[0]?.total ?? 0,
    limit,
    offset,
  };
}

/* ------------------------------------------------------------------ *
 * Wallets (Feature 3). The signing key lives encrypted at rest; this
 * layer only ever stores/returns the CIPHERTEXT (encryptedSecret) and the
 * public key. Decryption happens solely in src/stellar/keyProvider.ts at
 * signing time. Every query is scoped to currentUserId() + network (IDOR
 * defence) and rows are never deleted - status transitions only.
 * ------------------------------------------------------------------ */

export type WalletStatus = "pending" | "active" | "replaced";

/** Internal wallet row. `encryptedSecret` is the at-rest blob - NEVER expose it. */
export interface WalletRecord {
  id: string;
  publicKey: string;
  encryptedSecret: string | null;
  status: WalletStatus;
  createdAt: string;
  updatedAt: string;
}

interface RawWalletRow {
  id: string;
  publicKey: string;
  encryptedSecret: string | null;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function rowToWallet(r: RawWalletRow): WalletRecord {
  return {
    id: r.id,
    publicKey: r.publicKey,
    encryptedSecret: r.encryptedSecret,
    status: r.status as WalletStatus,
    createdAt: toIso(r.createdAt),
    updatedAt: toIso(r.updatedAt),
  };
}

const WALLET_COLS = "id, publicKey, encryptedSecret, status, createdAt, updatedAt";

/** The current user's ACTIVE wallet for this network, or null. (<=1 by index.) */
export async function getActiveWallet(): Promise<WalletRecord | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<RawWalletRow>(
      `SELECT TOP 1 ${WALLET_COLS}
         FROM dbo.Wallets
        WHERE network = @net AND userId = @userId AND status = 'active';`,
    );
  const row = res.recordset[0];
  return row ? rowToWallet(row) : null;
}

/** The current user's most-recent PENDING (created-but-unconfirmed) wallet, or null. */
export async function getLatestPendingWallet(): Promise<WalletRecord | null> {
  if (!dbReady()) return null;
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .query<RawWalletRow>(
      `SELECT TOP 1 ${WALLET_COLS}
         FROM dbo.Wallets
        WHERE network = @net AND userId = @userId AND status = 'pending'
        ORDER BY createdAt DESC;`,
    );
  const row = res.recordset[0];
  return row ? rowToWallet(row) : null;
}

/** Insert a wallet row (idempotent on id), scoped to the current user + network. */
export async function insertWallet(w: {
  id: string;
  publicKey: string;
  encryptedSecret: string | null;
  status: WalletStatus;
}): Promise<void> {
  if (!dbReady()) return;
  const now = new Date();
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), w.id)
    .input("createdAt", sql.DateTime2, now)
    .input("updatedAt", sql.DateTime2, now)
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("publicKey", sql.NVarChar(64), w.publicKey)
    .input("encryptedSecret", sql.NVarChar(sql.MAX), w.encryptedSecret)
    .input("status", sql.NVarChar(16), w.status)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.Wallets WHERE id = @id)
       INSERT INTO dbo.Wallets
         (id, createdAt, updatedAt, network, userId, publicKey, encryptedSecret, status)
       VALUES
         (@id, @createdAt, @updatedAt, @network, @userId, @publicKey, @encryptedSecret, @status);`,
    );
}

/**
 * Transition a wallet's status (pending->active, active->replaced, ...). Scoped
 * to the current user so one user can never flip another user's wallet (IDOR).
 * Returns the number of rows changed so callers can detect a no-op.
 */
export async function setWalletStatus(id: string, status: WalletStatus): Promise<number> {
  if (!dbReady()) return 0;
  const res = await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("status", sql.NVarChar(16), status)
    .input("updatedAt", sql.DateTime2, new Date())
    .query(
      `UPDATE dbo.Wallets
          SET status = @status, updatedAt = @updatedAt
        WHERE id = @id AND userId = @userId;`,
    );
  return res.rowsAffected?.[0] ?? 0;
}

/* ------------------------------------------------------------------ *
 * Feature 4 — weekly trustline-scan snapshots + dismissals.
 *
 * Same dbReady-guard + idempotent-insert + userId/network-scoped shape as the
 * rest of the layer. Scan rows are append-only (one row per token per scan,
 * all rows of a scan stamped with the SAME scanDate); the scanner prunes rows
 * older than the retention window. Dismissals are a small per-user mutable set
 * (DELETE allowed - this table does not use the upsert-fallback pattern).
 * ------------------------------------------------------------------ */

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

interface RawTrustlineScanRow {
  scanDate: Date | string;
  asset: string;
  assetCode: string;
  assetIssuer: string;
  liquidityScore: number;
  legitimacyScore: number;
  trendScore: number;
  riskScore: number;
  overallScore: number;
  summary: string | null;
  redFlags: string | null;
  rawData: string | null;
  held: boolean;
}

const EMPTY_RAW: TokenRawData = {
  volume24h: null,
  volume7d: null,
  activeTraders: null,
  orderBookDepth: null,
  spreadPct: null,
  priceTrend7d: null,
  trustlineCount: null,
  homeDomain: null,
  tomlMissing: true,
};

function rowToTrustlineScan(r: RawTrustlineScanRow): TokenScanResult {
  return {
    scanDate: toIso(r.scanDate),
    asset: r.asset,
    assetCode: r.assetCode,
    assetIssuer: r.assetIssuer,
    liquidityScore: Number(r.liquidityScore) || 0,
    legitimacyScore: Number(r.legitimacyScore) || 0,
    trendScore: Number(r.trendScore) || 0,
    riskScore: Number(r.riskScore) || 0,
    overallScore: Number(r.overallScore) || 0,
    summary: r.summary ?? "",
    redFlags: parseJson<string[]>(r.redFlags, []),
    rawData: parseJson<TokenRawData>(r.rawData, EMPTY_RAW),
    held: Boolean(r.held),
  };
}

const TRUSTLINE_SCAN_COLS = `scanDate, asset, assetCode, assetIssuer,
  liquidityScore, legitimacyScore, trendScore, riskScore, overallScore,
  summary, redFlags, rawData, held`;

/** Insert one token's weekly scan result (idempotent on id). */
export async function insertTrustlineScan(id: string, r: TokenScanResult): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), id)
    .input("scanDate", sql.DateTime2, new Date(r.scanDate))
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("asset", sql.NVarChar(120), r.asset)
    .input("assetCode", sql.NVarChar(32), r.assetCode)
    .input("assetIssuer", sql.NVarChar(64), r.assetIssuer)
    .input("liquidityScore", sql.Int, Math.round(r.liquidityScore))
    .input("legitimacyScore", sql.Int, Math.round(r.legitimacyScore))
    .input("trendScore", sql.Int, Math.round(r.trendScore))
    .input("riskScore", sql.Int, Math.round(r.riskScore))
    .input("overallScore", sql.Int, Math.round(r.overallScore))
    .input("summary", sql.NVarChar(sql.MAX), r.summary ?? null)
    .input("redFlags", sql.NVarChar(sql.MAX), JSON.stringify(r.redFlags ?? []))
    .input("rawData", sql.NVarChar(sql.MAX), JSON.stringify(r.rawData ?? {}))
    .input("held", sql.Bit, r.held)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.TrustlineScans WHERE id = @id)
       INSERT INTO dbo.TrustlineScans
         (id, scanDate, network, userId, asset, assetCode, assetIssuer,
          liquidityScore, legitimacyScore, trendScore, riskScore, overallScore,
          summary, redFlags, rawData, held)
       VALUES
         (@id, @scanDate, @network, @userId, @asset, @assetCode, @assetIssuer,
          @liquidityScore, @legitimacyScore, @trendScore, @riskScore, @overallScore,
          @summary, @redFlags, @rawData, @held);`,
    );
}

/** The most recent N distinct scan dates (ISO, newest first) for this user. */
export async function distinctTrustlineScanDates(limit = 12): Promise<string[]> {
  if (!dbReady()) return [];
  const n = Math.min(Math.max(limit, 1), 100);
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("limit", sql.Int, n)
    .query<{ scanDate: Date | string }>(
      `SELECT DISTINCT TOP (@limit) scanDate FROM dbo.TrustlineScans
        WHERE network = @net AND userId = @userId
        ORDER BY scanDate DESC;`,
    );
  return res.recordset.map((r) => toIso(r.scanDate));
}

/** All token rows for one exact scanDate. */
export async function listTrustlineScansForDate(scanDate: string): Promise<TokenScanResult[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("scanDate", sql.DateTime2, new Date(scanDate))
    .query<RawTrustlineScanRow>(
      `SELECT ${TRUSTLINE_SCAN_COLS} FROM dbo.TrustlineScans
        WHERE network = @net AND userId = @userId AND scanDate = @scanDate
        ORDER BY overallScore DESC;`,
    );
  return res.recordset.map(rowToTrustlineScan);
}

/** Per-token scan history (newest first), windowed by count. For the 12-week view. */
export async function listTrustlineScansForAsset(
  asset: string,
  limit = 12,
): Promise<TokenScanResult[]> {
  if (!dbReady()) return [];
  const n = Math.min(Math.max(limit, 1), 200);
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("asset", sql.NVarChar(120), asset)
    .input("limit", sql.Int, n)
    .query<RawTrustlineScanRow>(
      `SELECT TOP (@limit) ${TRUSTLINE_SCAN_COLS} FROM dbo.TrustlineScans
        WHERE network = @net AND userId = @userId AND asset = @asset
        ORDER BY scanDate DESC;`,
    );
  return res.recordset.map(rowToTrustlineScan);
}

/** Delete scan rows older than `beforeIso` (retention prune). */
export async function pruneTrustlineScans(beforeIso: string): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("before", sql.DateTime2, new Date(beforeIso))
    .query(
      `DELETE FROM dbo.TrustlineScans
        WHERE network = @net AND userId = @userId AND scanDate < @before;`,
    );
}

export interface TrustlineDismissal {
  asset: string;
  kind: "suggestion" | "warning";
  createdAt: string;
  expiresAt: string | null;
}

interface RawDismissalRow {
  asset: string;
  kind: string;
  createdAt: Date | string;
  expiresAt: Date | string | null;
}

/** Record a dismissed suggestion / snoozed warning (idempotent on id). */
export async function insertTrustlineDismissal(d: {
  id: string;
  asset: string;
  kind: "suggestion" | "warning";
  expiresAt?: string | null;
}): Promise<void> {
  if (!dbReady()) return;
  await getPool()
    .request()
    .input("id", sql.NVarChar(64), d.id)
    .input("createdAt", sql.DateTime2, new Date())
    .input("network", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("asset", sql.NVarChar(120), d.asset)
    .input("kind", sql.NVarChar(16), d.kind)
    .input("expiresAt", sql.DateTime2, d.expiresAt ? new Date(d.expiresAt) : null)
    .query(
      `IF NOT EXISTS (SELECT 1 FROM dbo.TrustlineDismissals WHERE id = @id)
       INSERT INTO dbo.TrustlineDismissals
         (id, createdAt, network, userId, asset, kind, expiresAt)
       VALUES
         (@id, @createdAt, @network, @userId, @asset, @kind, @expiresAt);`,
    );
}

/** Active (non-expired) dismissals for this user: a suggestion row is active
 *  until the next scan clears it; a warning row until its expiresAt. */
export async function listActiveTrustlineDismissals(): Promise<TrustlineDismissal[]> {
  if (!dbReady()) return [];
  const res = await getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
    .input("userId", sql.NVarChar(64), currentUserId())
    .input("now", sql.DateTime2, new Date())
    .query<RawDismissalRow>(
      `SELECT asset, kind, createdAt, expiresAt FROM dbo.TrustlineDismissals
        WHERE network = @net AND userId = @userId
          AND (expiresAt IS NULL OR expiresAt > @now);`,
    );
  return res.recordset.map((r) => ({
    asset: r.asset,
    kind: r.kind === "warning" ? "warning" : "suggestion",
    createdAt: toIso(r.createdAt),
    expiresAt: r.expiresAt ? toIso(r.expiresAt) : null,
  }));
}

// AUDIT-033: clearTrustlineDismissals() was removed - suggestion dismissals
// already auto-reset per scan by DATE FILTERING (computeUserViews only honours
// dismissals created after the latest scan's date), so the delete-at-scan-start
// helper it was written for never got wired and had zero callers.
