import sql from "mssql";
import { config } from "../config";
import { dayStartUtc } from "../time";
import { dbReady, getPool } from "./pool";
import { computeEvolution, type Fill } from "../trading/positions";
import type {
  EvolutionPoint,
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
          txHash, errorMsg, submittedAt, filledAmount, filledPrice, network,
          provider, model, confidence, targetPrice, invalidationPrice,
          timeHorizon, offerId)
       VALUES
         (@id, @createdAt, @updatedAt, @side, @baseAsset, @quoteAsset, @amount,
          @limitPrice, @maxSlippageBps, @reason, @status, @policyViolations,
          @txHash, @errorMsg, @submittedAt, @filledAmount, @filledPrice, @network,
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
       WHERE id = @id;`,
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
    .query<ProposalRow>(
      `SELECT ${SELECT_COLS}
         FROM dbo.Proposals
        WHERE network = @net
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
    .input("limit", sql.Int, limit)
    .query<ProposalRow>(
      `SELECT TOP (@limit) ${SELECT_COLS}
         FROM dbo.Proposals
        WHERE network = @net
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

  const where = status ? "WHERE network = @net AND status = @status" : "WHERE network = @net";

  const rowsReq = getPool()
    .request()
    .input("net", sql.NVarChar(16), config.network)
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

  const countReq = getPool().request().input("net", sql.NVarChar(16), config.network);
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
        WHERE network = @net AND status = 'submitted'
        ORDER BY COALESCE(submittedAt, createdAt) ASC;`,
    );
  return result.recordset.map(rowToFill);
}

/** Cumulative volume / trade-count / realized-PnL over time from submitted trades. */
export async function getEvolution(): Promise<EvolutionPoint[]> {
  return computeEvolution(await listSubmittedFills());
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
    .input("start", sql.DateTime2, dayStart)
    .query<{ volume: number | null; count: number; last: Date | string | null }>(
      // "Today" pivots on the SUBMIT time (createdAt fallback for legacy
      // rows). It previously used updatedAt, so a +24h outcome mark on an old
      // trade made it count as TODAY's trade after a restart.
      `SELECT COALESCE(SUM(COALESCE(filledAmount, amount)), 0) AS volume,
              COUNT(*)                                        AS count,
              MAX(COALESCE(submittedAt, createdAt))           AS last
         FROM dbo.Proposals
        WHERE network = @net AND status = 'submitted'
          AND COALESCE(submittedAt, createdAt) >= @start;`,
    );
  const row = result.recordset[0];
  return {
    volume: Number(row?.volume ?? 0),
    count: Number(row?.count ?? 0),
    lastTradeAt: row?.last ? toIso(row.last) : null,
  };
}
