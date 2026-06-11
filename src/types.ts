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

/** A page of persisted trades for the history table. */
export interface TradesPage {
  rows: TradeProposal[];
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
}
