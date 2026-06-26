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

export type TradeConfidence = "low" | "medium" | "high";

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
  /** WHO initiated this trade — drives the Manual vs Bot history split. */
  initiator?: "manual" | "ai" | "system";
  /** AI conviction (auto-trade holds anything below medium). */
  confidence?: TradeConfidence;
  /** Numeric AI conviction 0-100 (Expert-Mode threshold gate). */
  confidenceScore?: number;
  /** Attribution: "manual" for user orders, else the AI provider id. */
  provider?: string;
  /** Model name for AI proposals. */
  model?: string;
}

/** A resting offer on the DEX (the user's "open orders"). */
export interface OpenOffer {
  id: string;
  selling: string;
  buying: string;
  amount: string;
  price: string;
  lastModified?: string;
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

// --- Structured trade + AI log streams (mirror of backend) ---------------
export type TradeLogAction = "BUY" | "SELL" | "SWAP" | "CANCEL" | "REJECTED";
export type TradeLogStatus =
  | "FILLED"
  | "PARTIAL"
  | "CANCELLED"
  | "REJECTED"
  | "ABORTED";
export type TradeLogInitiator = "MANUAL" | "AI";

export interface TradeLogEntry {
  id: string;
  ts: string;
  baseAsset: string;
  quoteAsset: string;
  action: TradeLogAction;
  amount: string;
  price: string;
  totalValue: string;
  initiator: TradeLogInitiator;
  status: TradeLogStatus;
  txHash?: string;
  orderId?: string;
}

export type AiLogEventType =
  | "proposal"
  | "accepted"
  | "rejected"
  | "risk_constraint"
  | "stop_loss"
  | "trail_update"
  | "cooldown"
  | "risk_profile";

export interface AiLogEntry {
  id: string;
  ts: string;
  eventType: AiLogEventType;
  baseAsset?: string;
  quoteAsset?: string;
  reasoning: string;
  riskProfile?: RiskProfile;
  confidence?: string;
  confidenceScore?: number;
  direction?: string;
  price?: string;
}

export interface TradeLogPage {
  rows: TradeLogEntry[];
  total: number;
  limit: number;
  offset: number;
}
export interface AiLogPage {
  rows: AiLogEntry[];
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
  /** Active AI risk profile (per-factor LOW/MEDIUM/HIGH). */
  riskProfile: RiskProfile;
  /** Feature 1: AI trading master switch. false = AI loop paused. */
  aiEnabled: boolean;
  /** Feature 2: live value of every UI-editable operational setting (key ->
   *  current value). Metadata/bounds come from GET /api/settings. */
  settings: Record<string, number | boolean>;
}

/** Feature 2: one operational setting's metadata + current value (GET /api/settings). */
export interface SettingMeta {
  key: string;
  group: "ai" | "risk" | "automation" | "swap";
  label: string;
  description: string;
  type: "number" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: number | boolean;
  value: number | boolean;
  loop?: "autopilot" | "monitor" | "liquidity" | "wallet";
}

export type RiskLevel = "low" | "medium" | "high";

// Mirror of the backend RiskProfile (src/types.ts). Kept hand-synced.
export interface RiskProfile {
  positionSize: RiskLevel;
  stopLossDistance: RiskLevel;
  tradeFrequency: RiskLevel;
  volatilityTolerance: RiskLevel;
  drawdownTolerance: RiskLevel;
  slippageTolerance: RiskLevel;
  /** Expert Mode: numeric `expert` thresholds override the labels when true. */
  expertMode?: boolean;
  expert?: ExpertRiskProfile;
}

/** Exact numeric Expert-Mode thresholds (mirror of backend ExpertRiskProfile). */
export interface ExpertRiskProfile {
  positionSizePct: number;
  stopLossMode: "pct" | "amount";
  stopLossPct: number;
  stopLossAmount: number;
  minConfidence: number;
  maxVolatilityPct: number;
  drawdownPausePct: number;
  drawdownNeverPause: boolean;
  maxSlippagePct: number;
}

export const RISK_FACTORS = [
  "positionSize",
  "stopLossDistance",
  "tradeFrequency",
  "volatilityTolerance",
  "drawdownTolerance",
  "slippageTolerance",
] as const satisfies ReadonlyArray<keyof RiskProfile>;

export type RiskPreset = "conservative" | "balanced" | "aggressive";

/** Min/max/step per numeric Expert field (mirror of backend EXPERT_RANGES). */
export const EXPERT_RANGES = {
  positionSizePct: { min: 1, max: 100, step: 1 },
  stopLossPct: { min: 0.5, max: 20, step: 0.5 },
  stopLossAmount: { min: 0.0000001, max: 1_000_000_000, step: 0.1 },
  minConfidence: { min: 50, max: 99, step: 1 },
  maxVolatilityPct: { min: 1, max: 50, step: 1 },
  drawdownPausePct: { min: 1, max: 50, step: 1 },
  maxSlippagePct: { min: 0.1, max: 10, step: 0.1 },
} as const;

export const EXPERT_PRESETS: Record<RiskPreset, ExpertRiskProfile> = {
  conservative: { positionSizePct: 5, stopLossMode: "pct", stopLossPct: 2, stopLossAmount: 1, minConfidence: 85, maxVolatilityPct: 5, drawdownPausePct: 5, drawdownNeverPause: false, maxSlippagePct: 0.5 },
  balanced: { positionSizePct: 15, stopLossMode: "pct", stopLossPct: 5, stopLossAmount: 1, minConfidence: 70, maxVolatilityPct: 15, drawdownPausePct: 10, drawdownNeverPause: false, maxSlippagePct: 1.5 },
  aggressive: { positionSizePct: 30, stopLossMode: "pct", stopLossPct: 10, stopLossAmount: 1, minConfidence: 55, maxVolatilityPct: 30, drawdownPausePct: 25, drawdownNeverPause: true, maxSlippagePct: 3 },
};

export function defaultExpertProfile(): ExpertRiskProfile {
  return { ...EXPERT_PRESETS.conservative };
}

/** Which preset (if any) the numeric Expert values currently match. */
export function matchExpertPreset(e: ExpertRiskProfile): RiskPreset | "custom" {
  const presets: RiskPreset[] = ["conservative", "balanced", "aggressive"];
  for (const key of presets) {
    const p = EXPERT_PRESETS[key];
    const same = (Object.keys(p) as (keyof ExpertRiskProfile)[]).every((k) => p[k] === e[k]);
    if (same) return key;
  }
  return "custom";
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
  /** Feature 5: locally rejected (hidden by default). */
  rejected?: boolean;
  rejectedReason?: string;
}

/** Feature 3/4: read-only assessment of swapping a pending payment to XLM. */
export interface SwapAssessment {
  asset: string;
  amount: string;
  /** XLM you would receive, or null when no path exists. */
  estXlm: string | null;
  /** The token's direct USDC value, or null. */
  tokenUsdc: string | null;
  /** USDC value of the XLM you'd receive, or null. */
  xlmUsdc: string | null;
  /** Positive = value lost vs. holding; null when not computable. */
  valueLossPct: number | null;
  /** Configured threshold + whether this swap is within it (from the server). */
  threshold?: number;
  withinThreshold?: boolean;
}

/** One row of the "Swap All to XLM" summary (Feature 4). */
export interface SwapAllItem extends SwapAssessment {
  id: string;
  withinThreshold: boolean;
}

/** Result summary of a "Swap All to XLM" batch (Feature 4). */
export interface SwapAllResult {
  swapped: { asset: string; amount: string; estXlm: string; hash: string }[];
  skipped: { id: string; asset: string; reason: string }[];
  failed: { id: string; asset: string; error: string }[];
}

export interface PortfolioHolding {
  asset: string;
  balance: string;
  /** XLM-equivalent value, or null when the asset can't be priced. */
  xlmValue: number | null;
  /** USDC value of the whole holding, or null when no USD route exists. */
  usdValue: number | null;
  /** Price of ONE unit in USDC, or null. */
  priceUsd: number | null;
  /** Price of ONE unit in XLM, or null. */
  priceXlm: number | null;
}

export interface PortfolioResponse {
  holdings: PortfolioHolding[];
  totalXlm: number;
  /** Total value in USDC, or null when nothing could be priced in USD. */
  totalUsd: number | null;
  /** USDC per 1 XLM, or null when unavailable (e.g. testnet). */
  xlmPriceUsd: number | null;
  /** ISO timestamp the snapshot was priced. */
  updatedAt: string;
}

/** A tradeable token with friendly labels — drives the asset dropdowns. */
export interface UniverseToken {
  /** "XLM" or "CODE:ISSUER". */
  spec: string;
  code: string;
  issuer: string | null;
  /** Friendly name, e.g. "USD Coin" / "Aquarius"; "" when unknown. */
  name: string;
  /** Issuer home domain, e.g. "circle.com"; null when unknown. */
  domain: string | null;
  tier: "high" | "low" | null;
}

export interface UniverseResponse {
  tokens: UniverseToken[];
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
  /** Trailing-stop fields (undefined/false for regular stops). */
  isTrailing?: boolean;
  trailAmount?: string;
  trailPercent?: number;
  highWaterMark?: string;
  currentTrailPrice?: string;
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
