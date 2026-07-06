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

  // The env-based hot wallet. Since Feature 3 (per-user wallets) this is the
  // SEED/FALLBACK wallet of the DEFAULT account only: it keeps the single-
  // operator deployment and the background autopilot/monitor loops (which run
  // outside any request scope, i.e. as DEFAULT_USER_ID) signing exactly as
  // before. Logged-in users sign with their OWN encrypted wallet (dbo.Wallets);
  // they NEVER fall back to this key (see src/stellar/keyProvider.ts).
  stellarPublic: env("STELLAR_PUBLIC"),
  stellarSecret: env("STELLAR_SECRET"),

  /**
   * REQUIRED (Feature 3 - wallet creation/import). Master secret from which a
   * per-user key is derived (HKDF-SHA256, salted per wallet, userId bound in)
   * to AES-256-GCM-encrypt each user's Stellar secret AT REST in dbo.Wallets.
   * The server REFUSES TO START when this is empty or shorter than 32 chars
   * (see start() in src/server.ts). Generate one with `openssl rand -hex 32`.
   * NEVER commit it, NEVER log it. Rotating it makes every stored wallet
   * undecryptable until re-encrypted (the blob carries a version byte so a
   * future dual-key migration is possible).
   */
  walletEncryptionKey: env("WALLET_ENCRYPTION_KEY"),

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
      // Feature 3 (2026-07): Gemini via Google's OpenAI-compatible endpoint, so
      // the shared OpenAI dialect provider drives it - no separate SDK.
      { id: "google", label: "Google (Gemini)", prefix: "GOOGLE", defaultModel: "gemini-2.5-pro", defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta/openai" },
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
   * DEPRECATED (Bug 3 — user-only trading mode). The trading access mode
   * (read-only / paper / live) now PERSISTS in dbo.Settings and is restored at
   * boot exactly as the user last set it on the dashboard, so an auto-arm
   * override is no longer needed — and would violate the "the mode never
   * changes automatically" contract. The value is still read so an old .env
   * doesn't error; when set, the boot log warns that it is ignored.
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
   * How often (seconds) the dashboard re-pulls wallet balances + portfolio
   * valuation. Purely a UI refresh cadence (the PortfolioPanel poll); it never
   * trades. Floored at 5s on the client. Default 60s.
   */
  walletRefreshSeconds: num("WALLET_REFRESH_SECONDS", 60),

  /**
   * Pending-payment -> XLM conversion (Features 3/4). `allowToXlm` is the master
   * enable for the one-click "Swap to XLM" / "Swap All to XLM" buttons on the
   * claimable-balances list. `valueLossThresholdPct` is the max acceptable value
   * loss (vs. holding the token, priced through Horizon) before a swap is
   * blocked - the user can still force it per-swap with an explicit confirm.
   */
  swap: {
    allowToXlm: bool("SWAP_TO_XLM_ENABLED", true),
    valueLossThresholdPct: num("SWAP_VALUE_LOSS_THRESHOLD_PCT", 2),
  },

  /**
   * Feature 4 — weekly AI TRUSTLINE SCAN. A decoupled, observe-only background
   * job that ranks the top Stellar tokens (+ the tokens the user already holds),
   * scores each as a trustline candidate via the AI, persists a weekly snapshot,
   * and derives add-SUGGESTIONS + deterioration WARNINGS. Like the liquidity
   * scanner it NEVER trades, and it NEVER adds or removes a trustline - it only
   * informs. Scheduled at a fixed weekday + local time in config.timezone (so a
   * restart never re-runs a fresh scan immediately, and the cadence is exactly
   * "every 7 days from the configured slot"). enabled=false turns it off.
   */
  trustlineScan: {
    enabled: bool("TRUSTLINE_SCAN_ENABLED", true),
    /** 0 = Sunday … 6 = Saturday, interpreted in config.timezone. Default Monday. */
    dayOfWeek: Math.min(6, Math.max(0, Math.round(num("TRUSTLINE_SCAN_DAY_OF_WEEK", 1)))),
    /** Minutes after local midnight (0–1439) the scan fires. Default 180 = 03:00. */
    minuteOfDay: Math.min(1439, Math.max(0, Math.round(num("TRUSTLINE_SCAN_MINUTE_OF_DAY", 180)))),
    /** How many top tokens (by measured 24h XLM volume) to analyse. Default 10. */
    topN: Math.min(25, Math.max(1, Math.round(num("TRUSTLINE_SCAN_TOP_N", 10)))),
    /**
     * Minimum overall score (1–10) a token must reach to appear as a trustline
     * SUGGESTION. Scored tokens below it are hidden from the suggestion list
     * entirely; tokens whose AI evaluation was unavailable are never suggested
     * (they surface in a separate "unscored — evaluate manually" bucket).
     * 0 shows every scored token. Runtime-editable in the settings panel.
     */
    minScore: Math.min(10, Math.max(0, num("TRUSTLINE_SCAN_MIN_SCORE", 6))),
    /** Weeks of per-token scan history to retain (spec: ≥12). Default 16. */
    retentionWeeks: Math.max(12, Math.round(num("TRUSTLINE_SCAN_RETENTION_WEEKS", 16))),
  },

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
   * DEPRECATED (Feature 2 - authentication). The single shared `DASHBOARD_TOKEN`
   * Bearer secret has been REPLACED by the per-user login flow (email + password
   * -> signed JWT in an httpOnly cookie; see config.auth + src/auth/*). It is no
   * longer consulted by the API auth gate. The value is still read so an old
   * `.env` doesn't error, and so the boot banner can warn that it is now ignored.
   */
  dashboardToken: env("DASHBOARD_TOKEN"),

  // --- Authentication (Feature 2: login / JWT sessions) -----------------
  /**
   * REQUIRED secret used to sign session JWTs (HS256). The server REFUSES TO
   * START when this is empty (see start() in src/server.ts) and when it is
   * shorter than 32 chars. Generate one with `openssl rand -hex 32`. Rotating it
   * invalidates every existing session (all users must log in again).
   */
  jwtSecret: env("JWT_SECRET"),
  auth: {
    /** Default access-token lifetime (hours) for a normal login. Spec: 24h. */
    sessionHours: num("AUTH_SESSION_HOURS", 24),
    /** Extended lifetime (days) when the user ticks "Remember me". Spec: 30d. */
    rememberMeDays: num("AUTH_REMEMBER_ME_DAYS", 30),
    /** Consecutive failed logins before the account locks. Spec: 5. */
    maxFailedLogins: num("AUTH_MAX_FAILED_LOGINS", 5),
    /** How long (minutes) an account stays locked after too many fails. Spec: 15. */
    lockoutMinutes: num("AUTH_LOCKOUT_MINUTES", 15),
    /** Per-IP request cap on the /api/auth/* endpoints, per minute. Spec: 10. */
    rateLimitPerMinute: num("AUTH_RATE_LIMIT_PER_MINUTE", 10),
    /** Password-reset link lifetime (minutes). Spec: 60 (1 hour). */
    resetTokenMinutes: num("AUTH_RESET_TOKEN_MINUTES", 60),
    /** Email-verification link lifetime (hours). */
    verifyTokenHours: num("AUTH_VERIFY_TOKEN_HOURS", 24),
    /**
     * AUDIT-10: opt-in to printing raw password-reset links to stdout when
     * SMTP is off. Always on for testnet (dev convenience); on MAINNET the raw
     * link is a full account-takeover credential and is only printed when this
     * is explicitly true.
     */
    devResetLinks: bool("AUTH_DEV_RESET_LINKS", false),
    /**
     * Set the Secure flag on the auth cookies. Auto (default): ON for a
     * non-loopback bind (TLS is mandatory there, enforced by the boot guard),
     * OFF on the loopback http default so the cookie is actually sent over plain
     * http. Force either way with AUTH_COOKIE_SECURE=true|false.
     */
    cookieSecure: (() => {
      const v = env("AUTH_COOKIE_SECURE").toLowerCase();
      if (v !== "") return v === "true" || v === "1" || v === "yes";
      return !/^(127\.0\.0\.1|localhost|::1)$/i.test(env("BIND_HOST", "127.0.0.1"));
    })(),
  },
  /**
   * Public base URL used to build absolute links in emails (verification +
   * password reset). Defaults to http://<bindHost>:<port> (127.0.0.1 for a
   * wildcard bind). Set this to your real https origin in production.
   */
  publicBaseUrl: env("PUBLIC_BASE_URL"),
  /**
   * SMTP for transactional email (verification + password-reset links). When
   * SMTP_HOST is empty, email is DISABLED: registration auto-verifies the
   * account and a warning is logged (per the feature spec). nodemailer is loaded
   * lazily and is an OPTIONAL dependency - email is simply skipped if absent.
   */
  smtp: {
    host: env("SMTP_HOST"),
    port: num("SMTP_PORT", 587),
    user: env("SMTP_USER"),
    password: env("SMTP_PASSWORD"),
    from: env("SMTP_FROM"),
    /** Use a TLS socket from the start (port 465). false = STARTTLS (587). */
    secure: bool("SMTP_SECURE", false),
  },
  /**
   * Billing + platform fees (Feature 2, 2026-07). Stripe is hand-rolled REST
   * (fetch + webhook HMAC) - no SDK dependency. When STRIPE_SECRET_KEY is empty
   * the billing endpoints answer 503 and the UI shows billing as unavailable.
   * The platform fee WALLET lives in dbo.PlatformSettings (admin-editable,
   * never hardcoded); PLATFORM_FEE_WALLET only SEEDS that setting on first boot.
   * Fees are entirely disabled while no fee wallet is configured.
   */
  /**
   * Admin backoffice (Feature 4, 2026-07). Credentials live ONLY in env - never
   * in user tables, never enrollable from the app. All three must be set for
   * /admin to accept logins (adminConfigured()). Generate with:
   *   npm run admin:hash-password   (bcrypt hash for ADMIN_PASSWORD_HASH)
   *   npm run admin:totp-setup      (base32 secret + otpauth:// enrollment URI)
   */
  admin: {
    email: env("ADMIN_EMAIL"),
    passwordHash: env("ADMIN_PASSWORD_HASH"),
    totpSecret: env("ADMIN_TOTP_SECRET"),
  },
  billing: {
    stripeSecretKey: env("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: env("STRIPE_WEBHOOK_SECRET"),
    /** Initial seed for the PlatformSettings feeWalletAddress row (optional). */
    feeWalletSeed: env("PLATFORM_FEE_WALLET"),
    /** Defaults for the PlatformSettings price rows (EUR). Kevin 2026-07-04:
     *  €10/month, €96/year (≈20% off) - editable in the admin panel later. */
    priceMonthlyEurDefault: num("PREMIUM_PRICE_MONTHLY_EUR", 10),
    priceAnnualEurDefault: num("PREMIUM_PRICE_ANNUAL_EUR", 96),
    /** Local time (minutes after midnight, config.timezone) for the daily
     *  volume-tier recalculation job. Default 00:10. */
    tierRecalcMinuteOfDay: num("TIER_RECALC_MINUTE_OF_DAY", 10),
  },
  /**
   * Extra browser origins allowed to make state-changing /api calls (the CSRF
   * allowlist). Comma-separated, e.g. "https://trader.example.com". Loopback
   * origins pass on a loopback bind; on an exposed bind, list the exact host:port
   * you serve from here. A reverse proxy's X-Forwarded-Host is honored ONLY when
   * TRUST_PROXY=true (SEC-22). Only the host part is matched.
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
  /**
   * SEC-12: opt out of the mainnet "insecure DB TLS" boot guard. The guard only
   * fires for a REMOTE DB (a loopback/local docker DB has no wire to MITM, so it
   * is always exempt). Set true only if you knowingly accept an unencrypted /
   * unverified-cert link to a non-loopback DB.
   */
  allowInsecureDb: bool("ALLOW_INSECURE_DB", false),
  /**
   * SEC-01: allow RAW external transfers (`POST /api/pay` sends to an arbitrary
   * destination). The bot's trading function never needs to send funds OUT to a
   * third party, so this is OFF by default - a compromised dashboard/CSRF/XSS
   * then cannot drain the hot wallet to an attacker address. Turn it on only for
   * a deliberate manual payout. Swaps (to self) and claims (inbound) are
   * unaffected. Whitelist + MAX_DAILY_EGRESS still apply on top when enabled.
   */
  allowRawTransfers: bool("ALLOW_RAW_TRANSFERS", false),
  /**
   * DEPRECATED (Feature 2). Previously opted out of the "exposed bind with empty
   * DASHBOARD_TOKEN" boot guard. Auth is now mandatory (JWT_SECRET required +
   * login on every API route), so that guard is gone and this flag is unused.
   * Kept so an old .env doesn't error; the TLS guard (allowInsecureExposed) still
   * applies to a non-loopback bind.
   */
  allowExposedWithoutToken: bool("ALLOW_EXPOSED_WITHOUT_TOKEN", false),
  /**
   * SEC-14: acknowledge that TLS is terminated upstream for a NON-loopback bind.
   * Without it (and without loopback), the server refuses to start, so the
   * dashboard token can't be sent cleartext over the wire by accident. Set true
   * only when a TLS-terminating proxy sits in front.
   */
  allowInsecureExposed: bool("ALLOW_INSECURE_EXPOSED", false),
  /**
   * SEC-22: trust reverse-proxy forwarding headers (X-Forwarded-Host /
   * X-Forwarded-Proto). OFF by default so a client cannot smuggle a forged
   * X-Forwarded-Host past the CSRF host allow-list. Turn on only behind a proxy
   * you control that sets these headers.
   */
  trustProxy: bool("TRUST_PROXY", false),

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
    /**
     * Hard ceiling (bps) on the client-supplied slippage for a wallet SWAP
     * (/api/swap path payment). Decoupled from the tight trade-slippage cap
     * above so disposing an illiquid token to XLM can tolerate a wider spread,
     * while still bounding destMin away from 0 (SEC-07: an unbounded value would
     * accept any fill). Default 1000 bps = 10%.
     */
    maxSwapSlippageBps: num("MAX_SWAP_SLIPPAGE_BPS", 1000),
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
    /**
     * SEC-09: hard ceiling on a SINGLE pay/swap, at face value (XLM exactly,
     * other assets at their nominal sent amount - same convention as
     * MAX_DAILY_EGRESS). Bounds the blast radius of one money-movement call on
     * top of the daily budget. 0 (default) disables the per-call ceiling.
     */
    maxTransferAmount: num("MAX_TRANSFER_AMOUNT", 0),
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
    // SEC-12: default to VERIFYING the server certificate (no blind trust), so a
    // MITM can't impersonate the DB. Local dev against the self-signed docker
    // container sets SQLSERVER_TRUST_CERT=true explicitly (see .env.example).
    trustServerCertificate: bool("SQLSERVER_TRUST_CERT", false),
    // AUDIT-039: pool sizing/timeouts, env-tunable like every other
    // operational parameter. Discrete-config path only (a full connection
    // string keeps the driver defaults).
    poolMax: Math.max(1, Math.round(num("SQLSERVER_POOL_MAX", 5))),
    poolIdleMs: Math.max(1_000, Math.round(num("SQLSERVER_POOL_IDLE_MS", 30_000))),
    connectTimeoutMs: Math.max(1_000, Math.round(num("SQLSERVER_CONNECT_TIMEOUT_MS", 15_000))),
    requestTimeoutMs: Math.max(1_000, Math.round(num("SQLSERVER_REQUEST_TIMEOUT_MS", 30_000))),
  },
};

/** No secret key = the backend physically cannot sign or submit anything. */
export const isReadOnly = config.stellarSecret === "";

/** True when a SQL Server target is configured (string or discrete host). */
export const dbConfigured =
  config.db.connectionString !== "" || config.db.server !== "";

/** True when SMTP is configured, i.e. verification + reset emails can be sent. */
export const smtpConfigured = config.smtp.host !== "";

/**
 * Absolute base URL for links the backend puts in emails. Falls back to the
 * bound host:port (a wildcard bind resolves to loopback for the link). Never
 * trusts a request Host header (those links must be server-controlled).
 */
export const publicBaseUrl: string =
  config.publicBaseUrl ||
  `http://${
    config.bindHost === "0.0.0.0" || config.bindHost === "::" || config.bindHost === ""
      ? "127.0.0.1"
      : config.bindHost
  }:${config.port}`;
