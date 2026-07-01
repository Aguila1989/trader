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
  /** Numeric AI conviction 0-100 (Expert-Mode threshold gate compares against
   *  this). The `confidence` label is derived from it when present. */
  confidenceScore?: number;
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

/* --- Structured, separate, append-only TRADE + AI log streams ---------- *
 * Distinct from the generic message LogEntry above (which stays for the raw
 * diagnostics feed). These are the source of truth for the Logs tab + live log. */

export type TradeLogAction = "BUY" | "SELL" | "SWAP" | "CANCEL" | "REJECTED";
export type TradeLogStatus =
  | "FILLED"
  | "PARTIAL"
  | "CANCELLED"
  | "REJECTED"
  | "ABORTED";
/** Who placed the trade — stored, never derived (mirrors the SetBy pattern). */
export type TradeLogInitiator = "MANUAL" | "AI";

export interface TradeLogEntry {
  id: string;
  ts: string;
  /** Token traded (base leg), as "XLM" or "CODE:ISSUER". */
  baseAsset: string;
  quoteAsset: string;
  action: TradeLogAction;
  amount: string;
  /** Execution / limit price (quote per base). */
  price: string;
  /** amount × price. */
  totalValue: string;
  initiator: TradeLogInitiator;
  status: TradeLogStatus;
  txHash?: string;
  orderId?: string;
  /** Provenance of a MANUAL action, e.g. "PENDING_PAYMENT" for a pending-payment
   *  swap-to-XLM (Features 3/4). Omitted for ordinary trades. */
  source?: string;
}

export type AiLogEventType =
  | "proposal"
  | "accepted"
  | "rejected"
  | "risk_constraint"
  | "stop_loss"
  | "trail_update"
  | "cooldown"
  | "risk_profile"
  /** Feature 4: weekly trustline scan lifecycle + deterioration warnings. */
  | "trustline";

export interface AiLogEntry {
  id: string;
  ts: string;
  eventType: AiLogEventType;
  baseAsset?: string;
  quoteAsset?: string;
  /** Full reasoning / description text. */
  reasoning: string;
  /** Active risk profile at the moment of the event. */
  riskProfile?: RiskProfile;
  confidence?: string;
  /** Numeric AI conviction 0-100 when present (Expert-Mode). */
  confidenceScore?: number;
  /** "buy" / "sell" for a proposal. */
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

/** A persisted snapshot of the total portfolio value at a moment in time.
 *  Powers the "Portfolio Value Over Time" chart. Scoped per user. */
export interface PortfolioSnapshot {
  ts: string;
  totalUsd: number | null;
  totalXlm: number;
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
  /** True for a TRAILING stop. Fixed stops (false/undefined) are unchanged.
   *  For a trailing stop, `triggerPrice` is the INITIAL seed and
   *  `currentTrailPrice` is the live trigger the monitor enforces. */
  isTrailing?: boolean;
  /** Fixed price distance to trail by (quote per base). Mutually exclusive with trailPercent. */
  trailAmount?: string;
  /** Percent distance to trail by (e.g. 5 = 5%). Mutually exclusive with trailAmount. */
  trailPercent?: number;
  /** Best price seen since activation (high-water for long, low-water for short). */
  highWaterMark?: string;
  /** The live effective trigger after trailing; starts = triggerPrice, only ratchets toward profit. */
  currentTrailPrice?: string;
}

export type StopLossAuditAction =
  | "create"
  | "update"
  | "trigger"
  | "cancel"
  | "expire"
  | "trigger_failed"
  | "trail_updated";

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

/* ------------------------------------------------------------------ *
 * Price alerts (observe-only): notify when a pair crosses a price.
 * ------------------------------------------------------------------ */

export type AlertDirection = "above" | "below";
export type AlertStatus = "active" | "triggered" | "cancelled";

export interface PriceAlert {
  id: string;
  createdAt: string;
  baseAsset: string;
  quoteAsset: string;
  /** Fire when the mid moves ABOVE / BELOW `price`. */
  direction: AlertDirection;
  price: string;
  status: AlertStatus;
  note?: string;
  triggeredAt?: string;
  /** The mid price at the moment it fired. */
  triggerPrice?: string;
}

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

/* ------------------------------------------------------------------ *
 * Feature 4 — AI trustline suggestions (bidirectional).
 *
 * A weekly background scan analyses the top Stellar tokens (+ the tokens the
 * user already trusts), scores each as a trustline candidate via the AI, and
 * persists a snapshot per token (>=12 weeks history). From those snapshots it
 * derives SUGGESTIONS (good tokens the user does not yet hold) and WARNINGS
 * (held tokens whose metrics are deteriorating). It NEVER adds or removes a
 * trustline - it only informs; the user decides.
 * ------------------------------------------------------------------ */

/** 7-day price direction derived from daily candles. */
export type PriceTrend = "up" | "stable" | "down";

/** Best-effort project metadata pulled from the issuer's stellar.toml. */
export interface TokenTomlMeta {
  projectName?: string;
  description?: string;
  website?: string;
  /** The issuer's stated trustline conditions, if published. */
  conditions?: string;
  image?: string;
  /** Documentation / social links discovered in the TOML (deduped). */
  links?: string[];
}

/**
 * Raw, pre-AI market + chain data collected for one token in a weekly scan.
 * All metric fields are nullable: Horizon / TOML lookups are best-effort and a
 * missing value is itself a signal (e.g. tomlMissing is a red-flag input).
 */
export interface TokenRawData {
  /** 24h base-asset volume on the XLM pair (Horizon trade aggregations). */
  volume24h: number | null;
  /** 7d base-asset volume on the XLM pair. */
  volume7d: number | null;
  /** Distinct trader accounts seen in recent XLM-pair trades (approximation). */
  activeTraders: number | null;
  /** Sum of the top-10 bid + ask amounts (base units) - real book depth. */
  orderBookDepth: number | null;
  /** Top-of-book spread as a percentage. */
  spreadPct: number | null;
  priceTrend7d: PriceTrend | null;
  /** Accounts holding a trustline (Horizon /assets num_accounts). */
  trustlineCount: number | null;
  /** The issuer account's home_domain (Horizon /accounts), if any. */
  homeDomain: string | null;
  /** Resolved project metadata, when a stellar.toml was reachable. */
  toml?: TokenTomlMeta;
  /** True when no stellar.toml could be resolved (anonymous / undocumented). */
  tomlMissing: boolean;
}

/**
 * The AI's structured evaluation of a token as a trustline candidate. Every
 * score is 1-10. For riskScore, HIGHER = SAFER (10 = lowest risk), so all four
 * scores and the overall are monotonic "higher is better" for the UI.
 */
export interface TokenScores {
  liquidityScore: number;
  legitimacyScore: number;
  trendScore: number;
  /** 1 = very risky, 10 = very safe. */
  riskScore: number;
  overallScore: number;
  /** 2-3 sentence plain-language summary explaining the score. */
  summary: string;
  /** Red flags detected (no TOML, anonymous issuer, volume spike, ...). */
  redFlags: string[];
}

/** One persisted weekly scan result for a token (a row in dbo.TrustlineScans). */
export interface TokenScanResult extends TokenScores {
  /** ISO timestamp of the scan that produced this row. */
  scanDate: string;
  /** Canonical "CODE:ISSUER". */
  asset: string;
  assetCode: string;
  assetIssuer: string;
  /** The full raw data snapshot the AI scored (persisted for audit + history). */
  rawData: TokenRawData;
  /** True when the user held a trustline for this token at scan time. */
  held: boolean;
}

/** A suggestion card: a top token the user does NOT yet have a trustline for. */
export interface TrustlineSuggestion {
  asset: string;
  assetCode: string;
  assetIssuer: string;
  scanDate: string;
  scores: TokenScores;
  homeDomain: string | null;
  toml?: TokenTomlMeta;
}

/** Which deterioration rule fired for a held token (spec 4C triggers). */
export type WarningTrigger =
  | "score_drop"
  | "liquidity_low"
  | "volume_drop"
  | "new_red_flags"
  | "trustline_count_drop"
  | "toml_lost"
  | "trend_down";

/** A warning card: a held token whose metrics are deteriorating week-over-week. */
export interface TrustlineWarning {
  asset: string;
  assetCode: string;
  assetIssuer: string;
  scanDate: string;
  triggers: WarningTrigger[];
  /** Human-readable lines naming the metric(s) that crossed a threshold. */
  changed: string[];
  previousOverall: number | null;
  currentOverall: number;
  /** The AI summary for the current scan (why it's flagged). */
  explanation: string;
  /** User's current held balance of this token (decimal string). */
  balance: string;
  /** Estimated value of the holding in XLM, when priceable. */
  estimatedValueXlm: number | null;
  redFlags: string[];
}

/** Weekly-scan schedule + status surfaced to the dashboard. */
export interface WeeklyScanStatus {
  enabled: boolean;
  /** ISO of the last completed scan, or null if it has never run. */
  lastScanAt: string | null;
  /** ISO of the next scheduled scan (next day-of-week/time occurrence). */
  nextScanAt: string | null;
  /** True while a scan is currently running. */
  scanning: boolean;
  /** Tokens analysed in the last scan. */
  lastScanTokenCount: number | null;
  /** Last scan error message, if the last run failed. */
  lastError: string | null;
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
  /** Active price alerts. */
  priceAlerts: PriceAlert[];
  /** Active AI risk profile (per-factor LOW/MEDIUM/HIGH). */
  riskProfile: RiskProfile;
  /** Feature 1: AI trading master switch. false = AI loop paused. */
  aiEnabled: boolean;
  /** Feature 2: live value of every UI-editable operational setting (key ->
   *  current value). Metadata/bounds come from GET /api/settings. */
  settings: Record<string, number | boolean>;
  /** Feature 4: weekly trustline-scan schedule + status only. The per-user
   *  suggestion + warning VIEWS are fetched on demand (GET
   *  /api/trustline-scan/views), never broadcast — a token is AI-scored once
   *  globally, then compared to each user's own trustlines without AI. */
  weeklyScanStatus: WeeklyScanStatus;
}

/** Per-factor risk level. LOW reproduces the current (most conservative)
 *  behavior; MEDIUM/HIGH scale risk up. */
export type RiskLevel = "low" | "medium" | "high";

/** The six independently-configurable AI risk factors. */
export interface RiskProfile {
  /** % of available balance the AI sizes per order (low = the fixed cap). */
  positionSize: RiskLevel;
  /** How far the stop sits from entry (low = tight). */
  stopLossDistance: RiskLevel;
  /** How readily the AI trades / how short the cooldown (low = high-conviction only). */
  tradeFrequency: RiskLevel;
  /** Which tokens the AI will consider (low = stable/high-liquidity only). */
  volatilityTolerance: RiskLevel;
  /** 24h portfolio drawdown that pauses AI entries (low = pause at 5%). */
  drawdownTolerance: RiskLevel;
  /** Max slippage the AI accepts (low = 0.5%). */
  slippageTolerance: RiskLevel;
  /**
   * Expert Mode: when true, the numeric `expert` thresholds are authoritative
   * and override the LOW/MEDIUM/HIGH label mapping. When false/undefined the
   * system behaves EXACTLY as before (full backward compatibility).
   */
  expertMode?: boolean;
  /** Exact numeric thresholds, consulted only when `expertMode` is true. */
  expert?: ExpertRiskProfile;
}

/**
 * Exact numeric risk thresholds (Expert Mode). Every field maps 1:1 onto a
 * granular control in the Risk Settings panel. Ranges are enforced both in the
 * UI and server-side via coerceExpertProfile (see EXPERT_RANGES).
 */
export interface ExpertRiskProfile {
  /** Max position size as % of available balance (1-100). */
  positionSizePct: number;
  /** Stop-loss distance expressed as a % from entry, or a fixed XLM amount. */
  stopLossMode: "pct" | "amount";
  /** Stop distance % from entry (0.5-20); used when stopLossMode = "pct". */
  stopLossPct: number;
  /** Stop distance as a fixed amount (quote units) from entry; used when "amount". */
  stopLossAmount: number;
  /** Minimum AI confidence score (0-100) required to auto-execute (50-99). */
  minConfidence: number;
  /** Maximum accepted 24h price-swing % for a token before the AI skips it (1-50). */
  maxVolatilityPct: number;
  /** Pause AI entries if the portfolio drops this % in 24h (1-50). */
  drawdownPausePct: number;
  /** Never pause on drawdown (maps to HIGH in basic mode). */
  drawdownNeverPause: boolean;
  /** Maximum accepted slippage % (0.1-10). */
  maxSlippagePct: number;
}

/** Ordered list of the risk factors (for iteration in the UI + validation). */
export const RISK_FACTORS = [
  "positionSize",
  "stopLossDistance",
  "tradeFrequency",
  "volatilityTolerance",
  "drawdownTolerance",
  "slippageTolerance",
] as const satisfies ReadonlyArray<keyof RiskProfile>;

/** Named preset profiles. "custom" is reported when no preset matches. */
export type RiskPreset = "conservative" | "balanced" | "aggressive";

/** Min/max/step for each numeric Expert field — single source for UI + server. */
export const EXPERT_RANGES = {
  positionSizePct: { min: 1, max: 100, step: 1 },
  stopLossPct: { min: 0.5, max: 20, step: 0.5 },
  stopLossAmount: { min: 0.0000001, max: 1_000_000_000, step: 0.1 },
  minConfidence: { min: 50, max: 99, step: 1 },
  maxVolatilityPct: { min: 1, max: 50, step: 1 },
  drawdownPausePct: { min: 1, max: 50, step: 1 },
  maxSlippagePct: { min: 0.1, max: 10, step: 0.1 },
} as const;

/** The numeric values each preset loads into all factors at once. */
export const EXPERT_PRESETS: Record<RiskPreset, ExpertRiskProfile> = {
  conservative: {
    positionSizePct: 5,
    stopLossMode: "pct",
    stopLossPct: 2,
    stopLossAmount: 1,
    minConfidence: 85,
    maxVolatilityPct: 5,
    drawdownPausePct: 5,
    drawdownNeverPause: false,
    maxSlippagePct: 0.5,
  },
  balanced: {
    positionSizePct: 15,
    stopLossMode: "pct",
    stopLossPct: 5,
    stopLossAmount: 1,
    minConfidence: 70,
    maxVolatilityPct: 15,
    drawdownPausePct: 10,
    drawdownNeverPause: false,
    maxSlippagePct: 1.5,
  },
  aggressive: {
    positionSizePct: 30,
    stopLossMode: "pct",
    stopLossPct: 10,
    stopLossAmount: 1,
    minConfidence: 55,
    maxVolatilityPct: 30,
    drawdownPausePct: 25,
    // Matches basic-mode HIGH drawdownTolerance (= no pause).
    drawdownNeverPause: true,
    maxSlippagePct: 3,
  },
};

/** Clamp an untrusted numeric into [min,max], falling back when not finite. */
function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** The conservative preset is the Expert-Mode default (mirrors all-LOW). */
export function defaultExpertProfile(): ExpertRiskProfile {
  return { ...EXPERT_PRESETS.conservative };
}

/** Default profile: every factor LOW, Expert Mode off (current behavior). */
export function defaultRiskProfile(): RiskProfile {
  return {
    positionSize: "low",
    stopLossDistance: "low",
    tradeFrequency: "low",
    volatilityTolerance: "low",
    drawdownTolerance: "low",
    slippageTolerance: "low",
    expertMode: false,
    expert: defaultExpertProfile(),
  };
}

/** Validate + clamp an untrusted value into an ExpertRiskProfile. */
export function coerceExpertProfile(raw: unknown): ExpertRiskProfile {
  const o = (raw ?? {}) as Record<string, unknown>;
  const d = EXPERT_PRESETS.conservative;
  const r = EXPERT_RANGES;
  return {
    positionSizePct: clampNum(o.positionSizePct, r.positionSizePct.min, r.positionSizePct.max, d.positionSizePct),
    stopLossMode: o.stopLossMode === "amount" ? "amount" : "pct",
    stopLossPct: clampNum(o.stopLossPct, r.stopLossPct.min, r.stopLossPct.max, d.stopLossPct),
    stopLossAmount: clampNum(o.stopLossAmount, r.stopLossAmount.min, r.stopLossAmount.max, d.stopLossAmount),
    minConfidence: Math.round(clampNum(o.minConfidence, r.minConfidence.min, r.minConfidence.max, d.minConfidence)),
    maxVolatilityPct: clampNum(o.maxVolatilityPct, r.maxVolatilityPct.min, r.maxVolatilityPct.max, d.maxVolatilityPct),
    drawdownPausePct: clampNum(o.drawdownPausePct, r.drawdownPausePct.min, r.drawdownPausePct.max, d.drawdownPausePct),
    drawdownNeverPause: o.drawdownNeverPause === true,
    maxSlippagePct: clampNum(o.maxSlippagePct, r.maxSlippagePct.min, r.maxSlippagePct.max, d.maxSlippagePct),
  };
}

/** Validate + coerce an untrusted value into a RiskProfile (unknown -> low). */
export function coerceRiskProfile(raw: unknown): RiskProfile {
  const ok = (v: unknown): RiskLevel =>
    v === "medium" || v === "high" ? v : "low";
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    positionSize: ok(o.positionSize),
    stopLossDistance: ok(o.stopLossDistance),
    tradeFrequency: ok(o.tradeFrequency),
    volatilityTolerance: ok(o.volatilityTolerance),
    drawdownTolerance: ok(o.drawdownTolerance),
    slippageTolerance: ok(o.slippageTolerance),
    expertMode: o.expertMode === true,
    expert: coerceExpertProfile(o.expert),
  };
}

/** Which preset (if any) the numeric Expert values currently match. */
export function matchExpertPreset(e: ExpertRiskProfile): RiskPreset | "custom" {
  const presets: RiskPreset[] = ["conservative", "balanced", "aggressive"];
  for (const key of presets) {
    const p = EXPERT_PRESETS[key];
    const same = (Object.keys(p) as (keyof ExpertRiskProfile)[]).every(
      (k) => p[k] === e[k],
    );
    if (same) return key;
  }
  return "custom";
}
