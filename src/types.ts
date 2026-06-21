export type TradeSide = "buy" | "sell";

/** The analyst's stated conviction; "low" is held for manual review in auto-trade. */
export type TradeConfidence = "low" | "medium" | "high";

/** One numeric orderbook level with the amount normalized to BASE units. */
export interface BookLevel {
  price: number;
  amount: number;
}

export type TradeStatus =
  | "proposed"
  | "blocked"
  | "pending_approval"
  | "rejected"
  | "submitting"
  | "submitted"
  | "failed";

/** A trade the AI wants to make. The AI only *proposes* this - it never signs. */
export interface TradeProposal {
  id: string;
  createdAt: string;
  updatedAt: string;
  side: TradeSide;
  /** "XLM" (native) or "CODE:ISSUER" */
  baseAsset: string;
  quoteAsset: string;
  /** Amount of the base asset to trade. */
  amount: string;
  /** Limit price expressed as quote units per 1 base unit. */
  limitPrice: string;
  /**
   * Maker intent. When true the order is priced to REST at the touch (capture
   * the spread) and never cross, and `limitPrice` is the worst-acceptable
   * bound (a ceiling for a buy, a floor for a sell). When false/undefined the
   * order may cross and fill as taker.
   */
  postOnly?: boolean;
  maxSlippageBps: number;
  reason: string;
  status: TradeStatus;
  policyViolations: string[];
  txHash?: string;
  error?: string;
  /**
   * When the trade was actually SUBMITTED on-chain. Daily counters and the
   * fill replay key on this (falling back to createdAt for older rows) -
   * never on updatedAt, which the monitor bumps later for outcome marks and
   * offer reconciliation and therefore says nothing about WHEN it traded.
   */
  submittedAt?: string;
  /**
   * Base units that ACTUALLY filled on-chain, reconciled from Horizon's
   * offerResults. Absent until a trade is submitted; less than `amount` when
   * the order only partially filled (the remainder rests on the book). The
   * ledger and daily counters prefer this over the requested `amount`.
   */
  filledAmount?: string;
  /**
   * Volume-weighted average fill price actually achieved (quote per base).
   * Absent until filled; the ledger prefers this over `limitPrice`.
   */
  filledPrice?: string;
  /**
   * True when this proposal was produced/filled in PAPER-TRADING mode: a
   * simulated forward-test fill, never submitted on-chain. Paper proposals are
   * kept OUT of the persistent trade DB so they can never corrupt the real FIFO
   * PnL ledger on replay. In-memory only.
   */
  paper?: boolean;
  /**
   * WHO initiated this order (the SetBy-style initiator flag the policy engine
   * splits enforcement on):
   *  - "manual": placed by the user from the dashboard - EXEMPT from the
   *    per-trade SIZE cap (the user chooses their own size). All other gates
   *    (kill switch, whitelist, slippage, daily/exposure/loss caps, preflight)
   *    still apply.
   *  - "ai": an AI-proposed trade - the per-trade size cap is enforced.
   *  - "system": a backend-generated order (e.g. a monitor stop-loss close) -
   *    treated like AI for the size cap (risk-reducing closes are exempt anyway).
   * Runtime field: it gates a LIVE policy decision and is not persisted (a
   * historical row replayed on boot is never re-checked for the size cap).
   */
  initiator?: "manual" | "ai" | "system";
  /** AI provider id that produced this proposal ("anthropic", "openai",
   *  "monitor" for system-generated stop-loss closes, ...). */
  provider?: string;
  /** Model name that produced this proposal (for per-model attribution). */
  model?: string;
  /** The analyst's stated conviction. Auto-trade holds "low" for manual review. */
  confidence?: TradeConfidence;
  /** Price target supporting the thesis (quote per base). Used with
   *  invalidationPrice to enforce a minimum reward/risk ratio. */
  targetPrice?: string;
  /** Price that invalidates the thesis - the analyst's stop level. */
  invalidationPrice?: string;
  /** Expected holding period hint ("hours" | "days" | "weeks"). */
  horizon?: string;
  /**
   * On-chain offer id when (part of) the order is RESTING on the book after
   * submit. The position monitor polls it to book later fills and to cancel
   * the offer once it goes stale. Cleared when the offer closes.
   */
  offerId?: string;
  /** Market mid 1h after the trade, captured by the monitor (outcome tracking). */
  mark1hPrice?: string;
  /** Side-adjusted % move of the mid vs the fill price at +1h (positive = the
   *  call was right so far). */
  mark1hPnlPct?: number;
  /** Market mid 24h after the trade. */
  mark24hPrice?: string;
  /** Side-adjusted % move at +24h. */
  mark24hPnlPct?: number;
}

export interface PolicyResult {
  allowed: boolean;
  violations: string[];
}

/**
 * Live market context handed to the policy engine. bestBid/bestAsk drive the
 * price-deviation check; the rest power the liquidity gates and the size-aware
 * (book-walking) slippage check. All optional: checks that lack their data are
 * skipped - except under autoExecution, which fails CLOSED on missing data.
 */
export interface PolicyContext {
  bestBid?: number;
  bestAsk?: number;
  /** Live top-of-book spread in bps (entry-quality gate). */
  spreadBps?: number;
  /** 24h traded base-asset volume from candles (liquidity gate). */
  baseVolume24h?: number;
  /** Orderbook bids, best-first, amounts in BASE units (for sells). */
  bids?: BookLevel[];
  /** Orderbook asks, best-first, amounts in BASE units (for buys). */
  asks?: BookLevel[];
}

export type LogLevel = "info" | "warn" | "error" | "trade" | "ai";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

export interface DailyState {
  dayKey: string;
  volume: number;
  tradeCount: number;
  realizedPnl: number;
  lastTradeAt: string | null;
}

/** One point on the "evolution" charts, accumulated per submitted trade. */
export interface EvolutionPoint {
  ts: string;
  cumulativeVolume: number;
  cumulativeTrades: number;
  cumulativePnl: number;
}

/** An open position from this system's own trading (signed-FIFO net). */
export interface PositionSummary {
  pair: string;
  base: string;
  quote: string;
  /** Signed net base units held from trading (+ long, - short). */
  netQty: number;
  /** Weighted-average entry price of the open lots (quote per base). */
  avgPrice: number;
}

/* ------------------------------------------------------------------ *
 * Stop-loss management (manual + AI-controlled). The EXIT engine lives
 * in trading/monitor.ts; these are the first-class, persisted records the
 * monitor consults for a position's trigger. Decimal-ish fields are STRINGS
 * (same convention as TradeProposal.amount/limitPrice), DECIMAL(38,7) in SQL.
 * ------------------------------------------------------------------ */

export type StopLossSetBy = "manual" | "ai";
/** active = armed; triggered = its close fully executed; cancelled = withdrawn;
 *  expired = its position closed by another path so the stop is moot. */
export type StopLossStatus = "active" | "triggered" | "cancelled" | "expired";

export interface StopLoss {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** "XLM" (native) or "CODE:ISSUER" - matches PositionSummary.base/.quote. */
  baseAsset: string;
  quoteAsset: string;
  /**
   * Trigger price as quote units per 1 base unit. DIRECTION-AWARE: for a LONG
   * (netQty > 0) the close fires when mark <= triggerPrice; for a SHORT
   * (netQty < 0) it fires when mark >= triggerPrice (mirrors monitor.ts).
   */
  triggerPrice: string;
  /** true = close the entire UNCOVERED net position at trigger time. */
  sellAll: boolean;
  /** Base units to close when sellAll is false (clamped to uncovered net). */
  quantityToSell?: string;
  setBy: StopLossSetBy;
  status: StopLossStatus;
  /** AI: entry price + reasoning; manual: optional user annotation. */
  notes?: string;
  triggeredAt?: string;
  /** Proposal id of the [stop-loss] close that fired this stop. */
  triggerProposalId?: string;
  /** Consecutive sell-failure count for the bounded-retry/backoff rule. */
  attemptCount: number;
  /** Last sell-failure message (for the UI "cannot fire" surfacing). */
  lastError?: string;
}

export type StopLossAuditAction =
  | "create"
  | "update"
  | "trigger"
  | "cancel"
  | "expire"
  | "trigger_failed";

export type StopLossInitiator = "manual" | "ai" | "monitor";

/** One immutable audit row: who changed what on a stop loss, and when. */
export interface StopLossAuditRow {
  id: string;
  ts: string;
  stopLossId: string;
  baseAsset: string;
  quoteAsset: string;
  action: StopLossAuditAction;
  /** The field that changed (e.g. "triggerPrice", "status"), when applicable. */
  field?: string;
  oldValue?: string;
  newValue?: string;
  initiator: StopLossInitiator;
  note?: string;
}

export interface StopLossAuditPage {
  rows: StopLossAuditRow[];
  total: number;
  limit: number;
  offset: number;
}

/* ------------------------------------------------------------------ *
 * Liquidity scanner (observe-only). Hourly top-N liquid Stellar assets
 * ranked by XLM-pair SDEX volume, with trend analysis. NEVER trades.
 * ------------------------------------------------------------------ */

export type RankTrend = "improving" | "declining" | "stable";
export type VolumeTrend = "growing" | "shrinking" | "stable";

/** One persisted hourly observation: one asset within a tick's top-N. */
export interface LiquiditySnapshotRow {
  ts: string;
  /** Canonical "CODE:ISSUER". */
  asset: string;
  assetCode: string;
  assetIssuer: string;
  /** The ranking quote leg (XLM). */
  quoteAsset: string;
  /** 1..N position within this tick's top-N. */
  rank: number;
  /** 24h base-asset volume from Horizon trade aggregations (the liquidity signal). */
  baseVolume24h: number | null;
  numTrades24h: number | null;
  spreadBps: number | null;
  bestBid: number | null;
  bestAsk: number | null;
}

/** Current top-N entry + trend analysis for the dashboard / GetLiquidityRecommendations. */
export interface LiquidityRec {
  asset: string;
  assetCode: string;
  assetIssuer: string;
  rank: number;
  baseVolume24h: number | null;
  numTrades24h: number | null;
  spreadBps: number | null;
  /** Trend fields are present only once >= MIN_SNAPSHOTS history exists. */
  avgRank?: number;
  rankTrend?: RankTrend;
  /** % of hourly checks over the trailing 7d in which the asset appeared in top-N. */
  consistencyPct?: number;
  volumeTrend?: VolumeTrend;
  /** worth-watching: >=70% appearance over 7d AND volume not shrinking AND not whitelisted. */
  recommended: boolean;
}

/** A page of persisted trades for the history table. */
export interface TradesPage {
  rows: TradeProposal[];
  total: number;
  limit: number;
  offset: number;
}

/** A page of persisted log entries for the browsable history view. */
export interface LogsPage {
  rows: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface Snapshot {
  network: string;
  horizonUrl: string;
  account: string | null;
  /** Effective read-only: no signing key OR live trading switched off. */
  readOnly: boolean;
  /** Whether a STELLAR_SECRET signing key is configured at all. */
  secretConfigured: boolean;
  /** Runtime arm switch: true = policy-passing trades may submit on-chain. */
  liveTrading: boolean;
  /**
   * Paper-trading mode: policy-passing trades fill against the LIVE order book
   * in simulation (no keys, no on-chain submit). Mutually exclusive with
   * liveTrading. Lets the strategy be forward-tested with zero financial risk.
   */
  paperTrading: boolean;
  autoApprove: boolean;
  killSwitch: boolean;
  /** Whether SQL Server persistence is connected (false = in-memory only). */
  dbConnected: boolean;
  /** The model name driving the analyst, e.g. "claude-sonnet-4-6", "gpt-4o". */
  model: string;
  /** The AI provider id: "anthropic" | "openai" | "deepseek" | ... */
  aiProvider: string;
  /** Whether an API key is configured so the analyst can run. */
  aiReady: boolean;
  /**
   * Providers the operator can switch between on the dashboard: every provider
   * that has an API key configured (ones without a key are omitted).
   */
  aiProviders: { id: string; label: string; model: string; active: boolean }[];
  limits: {
    assetWhitelist: string[];
    maxAmountPerTrade: number;
    /** Larger per-trade cap for high-tier (blue-chip stablecoin) pairs. */
    maxAmountPerTradeHigh: number;
    maxDailyVolume: number;
    maxTradesPerDay: number;
    maxDailyLoss: number;
    maxSlippageBps: number;
    cooldownSeconds: number;
    maxEntrySpreadBps: number;
    minVolume24h: number;
    maxOpenExposure: number;
    pairExposureMultiplier: number;
    stopLossPct: number;
    maxOfferAgeMinutes: number;
    maxProposalAgeSeconds: number;
    minRiskReward: number;
  };
  daily: DailyState;
  /** Mark-to-market PnL of open positions in XLM (updated by the monitor). */
  unrealizedPnl: number;
  /** Open positions from this system's own trading (signed-FIFO net). */
  positions: PositionSummary[];
  proposals: TradeProposal[];
  logs: LogEntry[];
  /** Active stop-loss orders (manual + AI). Small list, replaced on each push. */
  stopLosses: StopLoss[];
  /** Current top-N liquid assets + trend (observe-only scanner). Top-N only -
   *  the long history is served by GET /api/liquidity, never on the SSE wire. */
  liquidityRecs: LiquidityRec[];
}
