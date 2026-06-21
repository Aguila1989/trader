import type {
  Balance,
  Candle,
  EvolutionPoint,
  LogsPage,
  ManualOrderInput,
  MarketSnapshot,
  OrderbookSnapshot,
  Snapshot,
  StopLoss,
  StopLossAuditPage,
  TradeProposal,
  TradesPage,
  TrustlineInfo,
} from "./types";

// All requests are same-origin: in dev Vite proxies /api -> :3000, in prod
// Express serves both the SPA and the API from one origin.

// --- API auth token ---------------------------------------------------------
// When the backend sets DASHBOARD_TOKEN, the SPA must present it. We accept it
// once via `?token=...` in the URL, persist it to localStorage, then strip it
// from the visible URL. Requests attach it as a Bearer header; the SSE stream
// gets it as a query param (EventSource cannot send custom headers).
const TOKEN_KEY = "trader_token";

function loadToken(): string {
  try {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("token");
    if (fromUrl) {
      localStorage.setItem(TOKEN_KEY, fromUrl);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
      return fromUrl;
    }
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

const token = loadToken();

/** Append the auth token to a URL as a query param (for EventSource). */
export function withToken(url: string): string {
  if (!token) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
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
  setProvider: (id: string) =>
    postJSON<{ aiProvider?: string; model?: string; error?: string }>(
      "/api/provider",
      { id },
    ),
  stopLosses: (base?: string, quote?: string) => {
    const q = new URLSearchParams();
    if (base) q.set("base", base);
    if (quote) q.set("quote", quote);
    const qs = q.toString();
    return getJSON<StopLoss[]>(`/api/stoploss${qs ? `?${qs}` : ""}`);
  },
  setStopLoss: (body: {
    base: string;
    quote: string;
    triggerPrice: string;
    sellAll?: boolean;
    quantityToSell?: string;
    notes?: string;
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
