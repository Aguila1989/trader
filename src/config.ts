import "dotenv/config";
import { Networks } from "@stellar/stellar-sdk";
import { resolveScanAssets, resolveScanPairs } from "./stellar/universe";

export type StellarNetwork = "testnet" | "public";

/** One configured AI provider in the catalog (see `config.ai.providers`). */
export interface ProviderSpec {
  /** Stable id: "anthropic" | "openai" | "deepseek" | ... */
  id: string;
  /** Human label for the dashboard dropdown, e.g. "Claude (Anthropic)". */
  label: string;
  /** API key for this provider ("" = not configured; hidden from the model). */
  apiKey: string;
  /** Model name, e.g. "claude-sonnet-4-6", "gpt-4o", "deepseek-chat". */
  model: string;
  /** Base URL ("" = provider default / native SDK for anthropic). */
  baseURL: string;
}

function env(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined ? fallback : v.trim();
}

function bool(name: string, fallback: boolean): boolean {
  const v = env(name).toLowerCase();
  if (v === "") return fallback;
  return v === "true" || v === "1" || v === "yes";
}

function num(name: string, fallback: number): number {
  const v = env(name);
  if (v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const network: StellarNetwork =
  env("NETWORK", "testnet").toLowerCase() === "public" ? "public" : "testnet";

const horizonDefaults: Record<StellarNetwork, string> = {
  testnet: "https://horizon-testnet.stellar.org",
  public: "https://horizon.stellar.org",
};

// Reputable credit tokens scanned against XLM by the chain scan (SHX, AQUA,
// USDC, ...). Overridable with SCAN_ASSETS; defaults to the curated universe.
const scanAssets = resolveScanAssets(env("SCAN_ASSETS"));

// CROSS pairs scanned alongside the XLM markets - fx/peg books like USDC/EURC
// and yUSDC/USDC whose liquidity an XLM-only scan can't see. Overridable with
// SCAN_PAIRS ("BASE/QUOTE" comma-separated, bare curated codes ok; "none"
// disables).
const scanPairs = resolveScanPairs(env("SCAN_PAIRS"));

// The policy engine requires BOTH legs of a trade to be whitelisted. Fold the
// scan universe (XLM markets + cross-pair legs) into the operator's whitelist
// so the chain scan can actually produce executable proposals out of the box.
const assetWhitelist = (() => {
  const configured = env("ASSET_WHITELIST", "XLM")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  const pairLegs = scanPairs.flatMap((p) => [p.base, p.quote]);
  for (const s of ["XLM", ...configured, ...scanAssets, ...pairLegs]) {
    const key = s.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
})();

export const config = {
  network,
  horizonUrl: env("HORIZON_URL") || horizonDefaults[network],
  networkPassphrase: network === "public" ? Networks.PUBLIC : Networks.TESTNET,

  stellarPublic: env("STELLAR_PUBLIC"),
  stellarSecret: env("STELLAR_SECRET"),

  /**
   * The AI provider catalog. Every provider reads its OWN {PREFIX}_API_KEY +
   * {PREFIX}_MODEL, so you can configure several at once and switch between
   * them live on the dashboard (any provider with a key shows up there).
   * "anthropic" uses the native Claude SDK (prompt caching + extended
   * thinking); every other id speaks the OpenAI chat-completions dialect via
   * its base URL.
   *
   * Backward compatible: AI_PROVIDER still picks the active provider, and the
   * generic AI_API_KEY / AI_MODEL / AI_BASE_URL still override the ACTIVE
   * provider (anthropic also keeps falling back to ANTHROPIC_API_KEY /
   * ANTHROPIC_MODEL), so the original single-provider setup is unchanged.
   */
  ai: (() => {
    const catalog: ReadonlyArray<{
      id: string;
      label: string;
      prefix: string;
      defaultModel: string;
      defaultBaseURL: string;
    }> = [
      { id: "anthropic", label: "Claude (Anthropic)", prefix: "ANTHROPIC", defaultModel: "claude-sonnet-4-6", defaultBaseURL: "" },
      { id: "openai", label: "OpenAI", prefix: "OPENAI", defaultModel: "gpt-4o", defaultBaseURL: "https://api.openai.com/v1" },
      { id: "deepseek", label: "DeepSeek", prefix: "DEEPSEEK", defaultModel: "deepseek-chat", defaultBaseURL: "https://api.deepseek.com/v1" },
      { id: "openrouter", label: "OpenRouter", prefix: "OPENROUTER", defaultModel: "anthropic/claude-sonnet-4.6", defaultBaseURL: "https://openrouter.ai/api/v1" },
      { id: "groq", label: "Groq", prefix: "GROQ", defaultModel: "llama-3.3-70b-versatile", defaultBaseURL: "https://api.groq.com/openai/v1" },
      { id: "mistral", label: "Mistral", prefix: "MISTRAL", defaultModel: "mistral-large-latest", defaultBaseURL: "https://api.mistral.ai/v1" },
      { id: "xai", label: "xAI (Grok)", prefix: "XAI", defaultModel: "grok-2-latest", defaultBaseURL: "https://api.x.ai/v1" },
      { id: "together", label: "Together", prefix: "TOGETHER", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo", defaultBaseURL: "https://api.together.xyz/v1" },
    ];

    const active = (env("AI_PROVIDER", "anthropic") || "anthropic").toLowerCase();

    const providers: Record<string, ProviderSpec> = {};
    for (const c of catalog) {
      const isActive = c.id === active;
      // {PREFIX}_* are the per-provider settings. The generic AI_* settings
      // override the ACTIVE provider only, so the legacy single-provider env
      // keeps working unchanged.
      const apiKey = (isActive ? env("AI_API_KEY") : "") || env(`${c.prefix}_API_KEY`);
      const model =
        (isActive ? env("AI_MODEL") : "") || env(`${c.prefix}_MODEL`) || c.defaultModel;
      const baseURL =
        (isActive ? env("AI_BASE_URL") : "") || env(`${c.prefix}_BASE_URL`) || c.defaultBaseURL;
      providers[c.id] = { id: c.id, label: c.label, apiKey, model, baseURL };
    }

    // A custom/unknown AI_PROVIDER (e.g. a local Ollama / LM Studio server)
    // isn't in the catalog. Synthesize an entry from the generic AI_* settings
    // so it still works exactly like before.
    if (!providers[active]) {
      providers[active] = {
        id: active,
        label: active,
        apiKey: env("AI_API_KEY"),
        model: env("AI_MODEL"),
        baseURL: env("AI_BASE_URL") || "https://api.openai.com/v1",
      };
    }

    return { providers, active };
  })(),
  /**
   * Extended-thinking budget in tokens (Claude/anthropic provider only).
   * 0 = disabled (cheapest, fastest). When > 0 the analyst reasons
   * step-by-step before proposing, improving decision quality at the cost of
   * more tokens. Clamped to >=1024 when enabled (the API minimum). Ignored by
   * OpenAI-compatible providers.
   */
  anthropicThinkingBudget: num("ANTHROPIC_THINKING_BUDGET", 0),

  /** When true, policy-passing proposals execute without a manual approve click. */
  autoApproveEnabled: bool("AUTO_APPROVE_ENABLED", false),

  /**
   * Arm LIVE trading automatically at startup instead of booting read-only.
   * Default false (the safe default: every boot starts read-only and you arm
   * live deliberately on the dashboard, so a crash/restart never silently
   * resumes on-chain trading). Set true ONLY for a deliberate, stable, attended
   * deployment - and NOT under `npm run dev` (tsx watch), which restarts on
   * every file save and would re-arm live each time. Still requires a signing
   * key and the position monitor on (the auto-arm goes through setLiveTrading,
   * which refuses otherwise). Arming live does NOT auto-execute: proposals still
   * wait for approval unless AUTO_APPROVE_ENABLED is also true.
   */
  autoArmLiveTrading: bool("AUTO_ARM_LIVE_TRADING", false),

  /**
   * Hands-free analysis loop. When > 0, the backend runs a chain scan of the
   * curated token universe every N seconds on its own - no manual "Scan chain"
   * click needed. Proposals it generates still flow through the SAME gates: they
   * only SUBMIT when auto-trade is ON and live trading is ARMED and policy
   * passes; otherwise they queue for manual approval. 0 = off (default). Floored
   * at 30s when enabled, to avoid hammering the LLM provider and Horizon.
   */
  autoScanIntervalSeconds: num("AUTO_SCAN_INTERVAL_SECONDS", 0),

  /**
   * Hourly LIQUIDITY SCANNER cadence (seconds). When > 0, a decoupled,
   * observe-only background job ranks the top-N most XLM-liquid Stellar assets,
   * persists snapshots, computes trend/consistency, and flags non-whitelisted
   * "worth watching" candidates. It NEVER trades. 0 = off (default). Floored at
   * 300s when enabled (3600 = hourly is the intended cadence).
   */
  liquidityScanIntervalSeconds: num("LIQUIDITY_SCAN_INTERVAL_SECONDS", 0),
  /**
   * How many days of liquidity snapshots the analyzer looks back over (and the
   * GET /api/liquidity history window). Default 30 (meets the >=30d requirement).
   */
  liquidityRetentionDays: num("LIQUIDITY_RETENTION_DAYS", 30),
  /**
   * Best-effort discovery depth: how many pages of Horizon's /assets endpoint
   * the scanner sweeps to find NEW (non-whitelisted) candidate assets. Horizon
   * cannot sort /assets by volume, so this is a bounded proxy sweep (ranked by
   * holders, then re-ranked by measured XLM volume). 0 = curated+whitelist only.
   */
  liquidityDiscoveryPages: num("LIQUIDITY_DISCOVERY_PAGES", 2),

  /**
   * Failed stop-loss SELL attempts before the monitor raises an alert. The stop
   * stays Active and keeps retrying (spaced by the monitor's per-pair stop
   * throttle); this only governs when an alert is logged + audited. Default 3.
   */
  stopLossMaxRetries: num("STOP_LOSS_MAX_RETRIES", 3),

  /**
   * Position-monitor cadence in seconds: marks open positions to market
   * (unrealized PnL -> loss gate + size taper), proposes stop-loss closes,
   * books later fills of resting offers, cancels stale offers and records
   * +1h/+24h outcome marks. Cheap (a few Horizon reads, no LLM calls).
   * Floored at 15s. 0 disables - NOT recommended once real trades exist.
   */
  monitorIntervalSeconds: num("POSITION_MONITOR_INTERVAL_SECONDS", 60),

  /**
   * IANA timezone whose LOCAL MIDNIGHT defines the trading-day boundary for the
   * daily caps (MAX_DAILY_LOSS / volume / trade count) and the dayKey. Defaults
   * to "UTC". E.g. "America/New_York", "Europe/Brussels", "Asia/Tokyo". An
   * unrecognised value falls back to "UTC" so the boundary is never undefined.
   */
  timezone: (() => {
    const tz = env("TIMEZONE", "UTC") || "UTC";
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      return "UTC";
    }
  })(),

  // --- Server / access hardening ---------------------------------------
  /**
   * Network interface the HTTP server binds to. Defaults to loopback so the
   * dashboard + API are NOT reachable from other machines. Only set this to
   * 0.0.0.0 if you put your own auth/reverse-proxy in front.
   */
  bindHost: env("BIND_HOST", "127.0.0.1"),
  /**
   * Optional shared secret. When non-empty, every /api/* request (except
   * /api/health) must present it as `Authorization: Bearer <token>` or
   * `?token=<token>`. Strongly recommended whenever BIND_HOST is not loopback.
   */
  dashboardToken: env("DASHBOARD_TOKEN"),
  /**
   * Extra browser origins allowed to make state-changing /api calls (the CSRF
   * allowlist). Comma-separated, e.g. "https://trader.example.com". Same-origin
   * requests and loopback always pass, and a reverse proxy's X-Forwarded-Host is
   * honored automatically; set this only when you serve the dashboard from
   * another origin behind a proxy that rewrites Host AND drops X-Forwarded-Host.
   * Only the host part is matched.
   */
  trustedOrigins: env("DASHBOARD_TRUSTED_ORIGINS")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((o) => {
      try {
        return new URL(o).host;
      } catch {
        return o;
      }
    }),
  /**
   * Refuse to start on mainnet ("public") without a database. Without one,
   * daily caps + realized-PnL reset on every restart, which disarms the
   * MAX_DAILY_LOSS guard. Set true only if you accept that risk.
   */
  allowMainnetWithoutDb: bool("ALLOW_MAINNET_WITHOUT_DB", false),

  /** Reputable credit tokens the chain scan checks against XLM. */
  scanAssets,
  /** Cross pairs (fx / peg books) the chain scan checks alongside them. */
  scanPairs,

  limits: {
    assetWhitelist,
    maxAmountPerTrade: num("MAX_AMOUNT_PER_TRADE", 10),
    /**
     * Larger per-trade cap applied ONLY when every non-XLM leg of the pair is a
     * curated HIGH-tier asset (deep, low-volatility fiat stablecoins like USDC
     * and EURC). Everything else - low-tier and custom/unknown assets - uses
     * the standard maxAmountPerTrade above. Floored at maxAmountPerTrade so a
     * misconfigured smaller value can never tighten the high tier below it.
     */
    maxAmountPerTradeHigh: num("MAX_AMOUNT_PER_TRADE_HIGH", 50),
    maxDailyVolume: num("MAX_DAILY_VOLUME", 500),
    maxTradesPerDay: num("MAX_TRADES_PER_DAY", 100),
    maxDailyLoss: num("MAX_DAILY_LOSS", 25),
    maxSlippageBps: num("MAX_SLIPPAGE_BPS", 50),
    cooldownSeconds: num("TRADE_COOLDOWN_SECONDS", 60),
    /**
     * Entry-quality gate: refuse to OPEN risk when the live top-of-book spread
     * exceeds this (bps). A wide spread means the round trip starts deep in
     * the red and the exit will be expensive. 0 disables.
     */
    maxEntrySpreadBps: num("MAX_ENTRY_SPREAD_BPS", 100),
    /**
     * Maker-first repricing step (bps). A post_only order is priced to REST at
     * the live touch; this is how far INSIDE the touch to step it. 0 (default)
     * joins the touch exactly (a buy at the bid, a sell at the ask); > 0 prices
     * that many bps inside, but never past the touch (so it still rests, never
     * crosses).
     */
    makerTickBps: num("MAKER_TICK_BPS", 0),
    /**
     * Liquidity gate: minimum 24h traded volume (base units - XLM for every
     * chain-scan pair) required to OPEN a position. Dead markets are where
     * fills are bad and exits are worse. 0 disables.
     */
    minVolume24h: num("MIN_VOLUME_24H", 500),
    /**
     * Cap on TOTAL open exposure across all pairs, in XLM-equivalent. Daily
     * volume caps activity, not accumulation - this is what stops the bot
     * building one big directional book within the volume cap. 0 disables.
     */
    maxOpenExposure: num("MAX_OPEN_EXPOSURE", 150),
    /**
     * Per-pair net-exposure cap as a multiple of that pair's per-trade cap
     * (e.g. 3 = a pair's position can never exceed 3 full-size trades).
     */
    pairExposureMultiplier: num("PAIR_EXPOSURE_MULTIPLIER", 3),
    /**
     * Default stop distance: when an open position is this many percent under
     * water (vs its avg entry), the position monitor proposes a close. The close
     * still passes the policy engine, but as a RISK-REDUCING exit it auto-submits
     * whenever live (or paper) trading is armed - even in manual-approval mode -
     * so a stop is never stranded waiting for a click. 0 disables monitor stops.
     */
    stopLossPct: num("STOP_LOSS_PCT", 5),
    /**
     * Cancel a RESTING offer after this many minutes unfilled. A stale resting
     * order fills exactly when the market moves against it (adverse selection)
     * and silently locks balance meanwhile. The default leaves PATIENT limit
     * entries (a resting buy at support, maker-side) enough time to get hit
     * while still bounding staleness. 0 disables auto-cancel.
     */
    maxOfferAgeMinutes: num("MAX_OFFER_AGE_MINUTES", 30),
    /**
     * Refuse to EXECUTE a proposal older than this many seconds: its limit
     * price was set against a market that has moved on. Re-analyze instead of
     * executing a stale price. 0 disables.
     */
    maxProposalAgeSeconds: num("MAX_PROPOSAL_AGE_SECONDS", 600),
    /**
     * Minimum reward/risk ratio enforced when a proposal states BOTH
     * target_price and invalidation_price. 0 disables the check.
     */
    minRiskReward: num("MIN_RISK_REWARD", 1.2),
    /**
     * Hard ceiling (in stroops) on the per-operation fee when we bump the fee
     * during network congestion. Floored at the network BASE_FEE. The default
     * 100000 stroops = 0.01 XLM keeps a stuck trade affordable to push through.
     */
    maxFeeStroops: num("MAX_FEE_STROOPS", 100_000),
    /**
     * Daily OUTFLOW cap for the wallet endpoints (/api/pay sends). Bounds how
     * much can leave the wallet per trading day on top of the kill switch +
     * whitelist gates (SEC-01). Counted at face value: XLM exactly, other
     * (whitelisted) assets at their nominal sent amount. 0 (default) disables
     * the velocity cap - the whitelist + kill-switch gates still apply.
     */
    maxDailyEgress: num("MAX_DAILY_EGRESS", 0),
  },

  port: num("PORT", 3000),

  // --- SQL Server persistence -------------------------------------------
  // Either give a full connection string, OR the discrete host/db/user/pass.
  // Leave all empty to run WITHOUT a database (in-memory only, no history).
  db: {
    connectionString: env("SQLSERVER_CONNECTION_STRING"),
    server: env("SQLSERVER_HOST"),
    port: num("SQLSERVER_PORT", 1433),
    database: env("SQLSERVER_DATABASE", "stellar_trader"),
    user: env("SQLSERVER_USER"),
    password: env("SQLSERVER_PASSWORD"),
    encrypt: bool("SQLSERVER_ENCRYPT", true),
    trustServerCertificate: bool("SQLSERVER_TRUST_CERT", true),
  },
};

/** No secret key = the backend physically cannot sign or submit anything. */
export const isReadOnly = config.stellarSecret === "";

/** True when a SQL Server target is configured (string or discrete host). */
export const dbConfigured =
  config.db.connectionString !== "" || config.db.server !== "";
