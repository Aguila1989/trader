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
  maxEntrySpreadBps: number;
  minVolume24h: number;
  maxOpenExposure: number;
  pairExposureMultiplier: number;
  stopLossPct: number;
  maxOfferAgeMinutes: number;
  maxProposalAgeSeconds: number;
  minRiskReward: number;
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
  /** Mark-to-market PnL of open positions in XLM (from the monitor). */
  unrealizedPnl: number;
  positions: PositionSummary[];
  proposals: TradeProposal[];
  logs: LogEntry[];
  /** Current top-N liquidity recommendations (observe-only scanner). */
  liquidityRecs: LiquidityRec[];
  /** Active stop-loss orders (manual + AI). */
  stopLosses: StopLoss[];
  /** Active price alerts. */
  priceAlerts: PriceAlert[];
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

/** Lean order book for the token detail page (one Horizon call). The `quote`
 *  field echoes the AUTO-RESOLVED market when the request omitted one. */
export interface OrderbookSnapshot {
  base: string;
  quote: string;
  bestBid: number | null;
  bestAsk: number | null;
  spreadBps: number | null;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
}

/** One OHLC candle from the /api/candles endpoint (Horizon trade aggregations). */
export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  baseVolume: number;
  tradeCount: number;
}

export interface Balance {
  asset: string;
  balance: string;
}

export interface TrustlineInfo {
  asset: string;
  code: string;
  issuer: string;
  balance: string;
  limit: string;
}

export interface ClaimableBalanceInfo {
  id: string;
  asset: string;
  amount: string;
  sponsor?: string;
}

export interface PortfolioHolding {
  asset: string;
  balance: string;
  /** XLM-equivalent value, or null when the asset can't be priced. */
  xlmValue: number | null;
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[];
  totalXlm: number;
}

export interface SwapQuote {
  sendAsset: string;
  sendAmount: string;
  destAsset: string;
  destAmount: string;
  path: string[];
  error?: string;
}

export type StopLossSetBy = "manual" | "ai";
export type StopLossStatus = "active" | "triggered" | "cancelled" | "expired";

export interface StopLoss {
  id: string;
  createdAt: string;
  updatedAt: string;
  baseAsset: string;
  quoteAsset: string;
  triggerPrice: string;
  sellAll: boolean;
  quantityToSell?: string;
  setBy: StopLossSetBy;
  status: StopLossStatus;
  notes?: string;
  triggeredAt?: string;
  triggerProposalId?: string;
  attemptCount: number;
  lastError?: string;
}

export interface StopLossAuditRow {
  id: string;
  ts: string;
  stopLossId: string;
  baseAsset: string;
  quoteAsset: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  initiator: string;
  note?: string;
}

export interface StopLossAuditPage {
  rows: StopLossAuditRow[];
  total: number;
  limit: number;
  offset: number;
}

export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "triggered" | "cancelled";

export interface PriceAlert {
  id: string;
  createdAt: string;
  baseAsset: string;
  quoteAsset: string;
  direction: AlertDirection;
  price: string;
  status: AlertStatus;
  note?: string;
  triggeredAt?: string;
  triggerPrice?: string;
}

export type RankTrend = "improving" | "declining" | "stable";
export type VolumeTrend = "growing" | "shrinking" | "stable";

/** One liquidity-scanner recommendation (mirror of backend src/types.ts). */
export interface LiquidityRec {
  asset: string;
  assetCode: string;
  assetIssuer: string;
  rank: number;
  baseVolume24h: number | null;
  numTrades24h: number | null;
  spreadBps: number | null;
  avgRank?: number;
  rankTrend?: RankTrend;
  consistencyPct?: number;
  volumeTrend?: VolumeTrend;
  recommended: boolean;
}
