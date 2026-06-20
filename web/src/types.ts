// Frontend mirror of the backend's shared types (src/types.ts) plus the
// market shapes the dashboard renders. Kept hand-synced and intentionally
// small — only what the UI actually consumes.

export type TradeSide = "buy" | "sell";

export type TradeStatus =
  | "proposed"
  | "blocked"
  | "pending_approval"
  | "rejected"
  | "submitting"
  | "submitted"
  | "failed";

export interface TradeProposal {
  id: string;
  createdAt: string;
  updatedAt: string;
  side: TradeSide;
  baseAsset: string;
  quoteAsset: string;
  amount: string;
  limitPrice: string;
  maxSlippageBps: number;
  reason: string;
  status: TradeStatus;
  policyViolations: string[];
  txHash?: string;
  error?: string;
  /** Base units actually filled on-chain (≤ amount; remainder rests). */
  filledAmount?: string;
  /** Average fill price actually achieved (quote per base). */
  filledPrice?: string;
}

/** A manual limit order placed from the dashboard (POST /api/order). The
 * resulting proposal goes through the same risk gates as AI-proposed trades. */
export interface ManualOrderInput {
  base: string;
  quote: string;
  side: TradeSide;
  amount: string;
  limitPrice: string;
  maxSlippageBps?: number;
  targetPrice?: string;
  invalidationPrice?: string;
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

export interface EvolutionPoint {
  ts: string;
  cumulativeVolume: number;
  cumulativeTrades: number;
  cumulativePnl: number;
}

export interface PositionSummary {
  pair: string;
  base: string;
  quote: string;
  netQty: number;
  avgPrice: number;
}

export interface TradesPage {
  rows: TradeProposal[];
  total: number;
  limit: number;
  offset: number;
}

export interface LogsPage {
  rows: LogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface Limits {
  assetWhitelist: string[];
  maxAmountPerTrade: number;
  /** Larger per-trade cap for high-tier (blue-chip stablecoin) pairs. */
  maxAmountPerTradeHigh: number;
  maxDailyVolume: number;
  maxTradesPerDay: number;
  maxDailyLoss: number;
  maxSlippageBps: number;
  cooldownSeconds: number;
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
  /** Paper trading: simulated fills against the live book, no on-chain submit. */
  paperTrading: boolean;
  autoApprove: boolean;
  killSwitch: boolean;
  dbConnected: boolean;
  model: string;
  /** The AI provider id: "anthropic" | "openai" | "deepseek" | ... */
  aiProvider: string;
  /** Whether an API key is configured so the analyst can run. */
  aiReady: boolean;
  /** Providers with a configured key — the dashboard dropdown's options. */
  aiProviders: { id: string; label: string; model: string; active: boolean }[];
  limits: Limits;
  daily: DailyState;
  positions: PositionSummary[];
  proposals: TradeProposal[];
  logs: LogEntry[];
}

export interface OrderbookLevel {
  price: string;
  amount: string;
}

export interface RecentTrade {
  id: string;
  price: string;
  baseAmount: string;
  counterAmount: string;
  ledgerCloseTime: string;
}

export interface MarketStats {
  lastPrice: number | null;
  change24hPct: number | null;
  high24h: number | null;
  low24h: number | null;
  baseVolume24h: number | null;
  tradeCount24h: number | null;
}

export interface MarketSnapshot {
  base: string;
  quote: string;
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  stats: MarketStats;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  recentTrades: RecentTrade[];
}

export interface Balance {
  asset: string;
  balance: string;
}
