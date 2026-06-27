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

// --- API auth token ---------------------------------------------------------
// SEC-04: when the backend sets DASHBOARD_TOKEN the SPA must present it, but the
// token must NEVER ride in a request URL (it would land in access logs, browser
// history and the Referer header). So:
//  - Bootstrap from the URL #fragment (#token=...) - the fragment is never sent
//    to the server. We persist it to localStorage and strip it immediately. A
//    legacy ?token= query is still accepted for one bootstrap, then stripped.
//  - Normal requests authenticate with an `Authorization: Bearer` header.
//  - The SSE stream (EventSource can't set headers) uses a one-time ticket.
//  - The CSV export is fetched with the Bearer header and downloaded as a blob.
const TOKEN_KEY = "trader_token";

function loadToken(): string {
  try {
    let found = "";
    // Preferred: the URL #fragment, e.g. http://127.0.0.1:3000/#token=XYZ
    const hash = window.location.hash || "";
    const hashMatch = hash.match(/(?:^#|&)token=([^&]+)/);
    if (hashMatch) {
      found = decodeURIComponent(hashMatch[1] as string);
      const cleaned = hash.replace(/(^#|&)token=[^&]+/, "$1");
      const u = new URL(window.location.href);
      u.hash = cleaned === "#" || cleaned === "" ? "" : cleaned;
      window.history.replaceState({}, "", u.toString());
    }
    // Legacy fallback: ?token= query (read once, then stripped). The server no
    // longer accepts it for auth - this is bootstrap convenience only.
    if (!found) {
      const u = new URL(window.location.href);
      const q = u.searchParams.get("token");
      if (q) {
        found = q;
        u.searchParams.delete("token");
        window.history.replaceState({}, "", u.toString());
      }
    }
    if (found) {
      localStorage.setItem(TOKEN_KEY, found);
      return found;
    }
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

const token = loadToken();

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

/**
 * SEC-04: fetch a one-time SSE ticket so the stream URL never carries the token.
 * Returns "" when no token is configured (the stream is then open on loopback).
 */
export async function sseTicket(): Promise<string> {
  if (!token) return "";
  try {
    const r = await fetch("/api/sse-ticket", { method: "POST", headers: authHeaders() });
    if (!r.ok) return "";
    const j = (await r.json()) as { ticket?: string };
    return j.ticket ?? "";
  } catch {
    return "";
  }
}

/** SEC-04: download an authenticated file (CSV) via Bearer fetch + blob, so the
 *  token never appears in the download URL. */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
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
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function postJSON<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body ?? {}),
  });
  return (await res.json().catch(() => ({}))) as T;
}

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
