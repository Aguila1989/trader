import type {
  Balance,
  Candle,
  ClaimableBalanceInfo,
  EvolutionPoint,
  LogsPage,
  ManualOrderInput,
  MarketSnapshot,
  OpenOffer,
  OrderbookSnapshot,
  AiLogEntry,
  AiLogPage,
  PortfolioResponse,
  PriceAlert,
  RiskProfile,
  SettingMeta,
  SwapAllItem,
  SwapAllResult,
  SwapAssessment,
  TradeLogEntry,
  TradeLogPage,
  Snapshot,
  StopLoss,
  StopLossAuditPage,
  SwapQuote,
  TradeProposal,
  TradesPage,
  TrustlineInfo,
  UniverseResponse,
} from "./types";

// All requests are same-origin: in dev Vite proxies /api -> :3000, in prod
// Express serves both the SPA and the API from one origin.

// --- Session auth (Feature 2) -----------------------------------------------
// Authentication is now a login-issued JWT in an httpOnly cookie (see
// src/auth/*). The browser sends it automatically on every same-origin request,
// so there is no token to read, store, or attach - and because it is httpOnly,
// no script (including a hypothetical XSS payload) can exfiltrate it. We send
// `credentials: "same-origin"` explicitly for clarity. Every request also routes
// through a single 401 handler so an expired/invalid session bounces the SPA to
// the login screen from one place.
const CREDENTIALS: RequestCredentials = "same-origin";

let onUnauthorized: (() => void) | null = null;
/** Register the app-wide handler invoked whenever the API returns 401. */
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}
function handleStatus(res: Response): void {
  if (res.status === 401) {
    try {
      onUnauthorized?.();
    } catch {
      /* ignore */
    }
  }
}

/** Download a file (CSV) via the session cookie + blob (no token in the URL). */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(path, { credentials: CREDENTIALS });
  if (!res.ok) {
    handleStatus(res);
    throw new Error(`${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: CREDENTIALS });
  if (!res.ok) {
    handleStatus(res);
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: CREDENTIALS,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  handleStatus(res);
  return (await res.json().catch(() => ({}))) as T;
}

// --- auth API ---------------------------------------------------------------
// Returns the parsed body plus ok/status so the auth screens can show the
// server's (deliberately generic) messages. These never throw on 4xx.
export interface AuthApiResult<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  data: T & { error?: string; message?: string };
}

async function authRequest<T = Record<string, unknown>>(
  path: string,
  body: unknown,
): Promise<AuthApiResult<T>> {
  try {
    const res = await fetch(path, {
      method: "POST",
      credentials: CREDENTIALS,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string; message?: string };
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Network error - please try again." } as T & { error?: string } };
  }
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
}

export const authApi = {
  login: (email: string, password: string, rememberMe: boolean) =>
    authRequest<{ user?: SessionUser }>("/api/auth/login", { email, password, rememberMe }),
  register: (email: string, password: string, confirmPassword: string) =>
    authRequest<{ verificationRequired?: boolean }>("/api/auth/register", { email, password, confirmPassword }),
  logout: () => authRequest("/api/auth/logout", {}),
  forgotPassword: (email: string) => authRequest("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string, confirmPassword: string) =>
    authRequest("/api/auth/reset-password", { token, password, confirmPassword }),
  verifyEmail: (token: string) => authRequest("/api/auth/verify-email", { token }),
  me: () => getJSON<{ user: SessionUser }>("/api/auth/me"),
};

export const api = {
  state: () => getJSON<Snapshot>("/api/state"),
  balances: () => getJSON<Balance[]>("/api/balances"),
  evolution: () => getJSON<EvolutionPoint[]>("/api/evolution"),
  trades: (opts: { limit: number; offset: number; status?: string }) => {
    const q = new URLSearchParams({
      limit: String(opts.limit),
      offset: String(opts.offset),
    });
    if (opts.status) q.set("status", opts.status);
    return getJSON<TradesPage>(`/api/trades?${q.toString()}`);
  },
  logs: (opts: {
    limit: number;
    offset: number;
    level?: string;
    q?: string;
    since?: string;
  }) => {
    const q = new URLSearchParams({
      limit: String(opts.limit),
      offset: String(opts.offset),
    });
    if (opts.level) q.set("level", opts.level);
    if (opts.q) q.set("q", opts.q);
    if (opts.since) q.set("since", opts.since);
    return getJSON<LogsPage>(`/api/logs?${q.toString()}`);
  },
  tradeLog: (opts: {
    limit: number;
    offset: number;
    initiator?: string;
    action?: string;
    token?: string;
    from?: string;
    to?: string;
  }) => {
    const q = new URLSearchParams({ limit: String(opts.limit), offset: String(opts.offset) });
    if (opts.initiator) q.set("initiator", opts.initiator);
    if (opts.action) q.set("action", opts.action);
    if (opts.token) q.set("token", opts.token);
    if (opts.from) q.set("from", opts.from);
    if (opts.to) q.set("to", opts.to);
    return getJSON<TradeLogPage>(`/api/tradelog?${q.toString()}`);
  },
  aiLog: (opts: {
    limit: number;
    offset: number;
    eventType?: string;
    token?: string;
    from?: string;
    to?: string;
  }) => {
    const q = new URLSearchParams({ limit: String(opts.limit), offset: String(opts.offset) });
    if (opts.eventType) q.set("eventType", opts.eventType);
    if (opts.token) q.set("token", opts.token);
    if (opts.from) q.set("from", opts.from);
    if (opts.to) q.set("to", opts.to);
    return getJSON<AiLogPage>(`/api/ailog?${q.toString()}`);
  },
  logLive: (n = 20) =>
    getJSON<{ trades: TradeLogEntry[]; ai: AiLogEntry[] }>(`/api/loglive?n=${n}`),
  market: (base: string, quote: string) =>
    getJSON<MarketSnapshot & { error?: string }>(
      `/api/market?base=${encodeURIComponent(base)}&quote=${encodeURIComponent(quote)}`,
    ),
  // Token detail page. `quote` omitted => backend auto-resolves the best market.
  orderbook: (base: string, quote?: string) => {
    const q = new URLSearchParams({ base });
    if (quote) q.set("quote", quote);
    return getJSON<OrderbookSnapshot & { error?: string }>(
      `/api/orderbook?${q.toString()}`,
    );
  },
  candles: (base: string, quote: string, resolution: number, limit: number) => {
    const q = new URLSearchParams({
      base,
      quote,
      resolution: String(resolution),
      limit: String(limit),
    });
    return getJSON<Candle[]>(`/api/candles?${q.toString()}`);
  },
  analyze: (base: string, quote: string) =>
    postJSON<{ reasoning?: string; error?: string }>("/api/analyze", {
      base,
      quote,
    }),
  scan: () =>
    postJSON<{
      reasoning?: string;
      scanned?: number;
      proposals?: TradeProposal[];
      error?: string;
    }>("/api/scan"),
  placeOrder: (input: ManualOrderInput) =>
    postJSON<TradeProposal & { error?: string }>("/api/order", input),
  approve: (id: string) =>
    postJSON<TradeProposal>(`/api/approve/${encodeURIComponent(id)}`),
  reject: (id: string) =>
    postJSON<TradeProposal>(`/api/reject/${encodeURIComponent(id)}`),
  setKill: (active: boolean) =>
    postJSON<{ killSwitch: boolean }>("/api/kill", { active }),
  setAutoApprove: (enabled: boolean) =>
    postJSON<{ autoApprove: boolean }>("/api/auto-approve", { enabled }),
  setLiveTrading: (enabled: boolean) =>
    postJSON<{ liveTrading: boolean }>("/api/live-trading", { enabled }),
  setPaperTrading: (enabled: boolean) =>
    postJSON<{ paperTrading: boolean; liveTrading: boolean }>(
      "/api/paper-trading",
      { enabled },
    ),
  setRiskProfile: (profile: RiskProfile) =>
    postJSON<{ riskProfile: RiskProfile }>("/api/risk-profile", profile),
  setAiEnabled: (enabled: boolean) =>
    postJSON<{ aiEnabled: boolean }>("/api/ai-enabled", { enabled }),
  // Feature 2: operational settings catalog + per-setting change/reset.
  getSettings: () => getJSON<{ settings: SettingMeta[] }>("/api/settings"),
  setSetting: (key: string, value: number | boolean) =>
    postJSON<{ key: string; value: number | boolean }>("/api/settings", {
      key,
      value,
    }),
  resetSetting: (key: string) =>
    postJSON<{ key: string; value: number | boolean }>("/api/settings/reset", {
      key,
    }),
  setProvider: (id: string) =>
    postJSON<{ aiProvider?: string; model?: string; error?: string }>(
      "/api/provider",
      { id },
    ),
  setStopLoss: (body: {
    base: string;
    quote: string;
    triggerPrice?: string;
    sellAll?: boolean;
    quantityToSell?: string;
    notes?: string;
    // Trailing stop: stopType "trailing" + trailBy/trailValue (or omit for regular).
    stopType?: "regular" | "trailing";
    trailBy?: "amount" | "pct";
    trailValue?: string;
  }) => postJSON<StopLoss & { error?: string }>("/api/stoploss", body),
  cancelStopLoss: (id: string) =>
    postJSON<StopLoss & { error?: string }>(
      `/api/stoploss/${encodeURIComponent(id)}/cancel`,
    ),
  stopLossAudit: (base: string, quote: string, limit = 50, offset = 0) => {
    const q = new URLSearchParams({
      base,
      quote,
      limit: String(limit),
      offset: String(offset),
    });
    return getJSON<StopLossAuditPage>(`/api/stoploss/audit?${q.toString()}`);
  },
  pay: (body: { destination: string; asset: string; amount: string; memo?: string }) =>
    postJSON<{ hash?: string; error?: string }>("/api/pay", body),
  swapQuote: (send: string, dest: string, amount: string) => {
    const q = new URLSearchParams({ send, dest, amount });
    return getJSON<SwapQuote>(`/api/swap/quote?${q.toString()}`);
  },
  swap: (body: {
    sendAsset: string;
    sendAmount: string;
    destAsset: string;
    slippageBps?: number;
  }) =>
    postJSON<{ hash?: string; destMin?: string; quoted?: string; error?: string }>(
      "/api/swap",
      body,
    ),
  claimables: (includeRejected = false) =>
    getJSON<ClaimableBalanceInfo[]>(
      `/api/claimable${includeRejected ? "?includeRejected=true" : ""}`,
    ),
  claimBalance: (id: string) =>
    postJSON<{ hash?: string; error?: string }>(
      `/api/claimable/${encodeURIComponent(id)}/claim`,
    ),
  // Features 3/4/5 — pending-payment swap-to-XLM, batch, reject.
  claimableSwapQuote: (id: string) =>
    getJSON<SwapAssessment>(`/api/claimable/${encodeURIComponent(id)}/swap-quote`),
  swapClaimable: (id: string, force = false) =>
    postJSON<{ hash?: string; estXlm?: string; error?: string; assessment?: SwapAssessment }>(
      `/api/claimable/${encodeURIComponent(id)}/swap`,
      { force },
    ),
  swapAllQuote: () =>
    getJSON<{ items: SwapAllItem[]; threshold: number }>("/api/claimable/swap-all/quote"),
  swapAll: (force = false) =>
    postJSON<SwapAllResult & { error?: string }>("/api/claimable/swap-all", { force }),
  rejectClaimable: (id: string, reason: string) =>
    postJSON<{ id: string; rejected: boolean; error?: string }>(
      `/api/claimable/${encodeURIComponent(id)}/reject`,
      { reason },
    ),
  unrejectClaimable: (id: string) =>
    postJSON<{ id: string; rejected: boolean; error?: string }>(
      `/api/claimable/${encodeURIComponent(id)}/unreject`,
    ),
  portfolio: () => getJSON<PortfolioResponse>("/api/portfolio"),
  universe: () => getJSON<UniverseResponse>("/api/universe"),
  offers: () => getJSON<OpenOffer[]>("/api/offers"),
  cancelOffer: (id: string) =>
    postJSON<{ hash?: string; error?: string }>(
      `/api/offers/${encodeURIComponent(id)}/cancel`,
    ),
  setAlert: (body: {
    base: string;
    quote: string;
    direction: "above" | "below";
    price: string;
    note?: string;
  }) => postJSON<PriceAlert & { error?: string }>("/api/alerts", body),
  cancelAlert: (id: string) =>
    postJSON<PriceAlert & { error?: string }>(
      `/api/alerts/${encodeURIComponent(id)}/cancel`,
    ),
  trustlines: () => getJSON<TrustlineInfo[]>("/api/trustlines"),
  addTrustline: (body: {
    asset?: string;
    code?: string;
    issuer?: string;
    homeDomain?: string;
  }) => postJSON<{ hash?: string; asset?: string; error?: string }>("/api/trustlines", body),
  removeTrustline: (body: { asset?: string; code?: string; issuer?: string }) =>
    postJSON<{ hash?: string; asset?: string; error?: string }>(
      "/api/trustlines/remove",
      body,
    ),
};
