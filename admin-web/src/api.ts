// Thin fetch wrapper for /api/admin/*. Cookie-based session (httpOnly JWT,
// 4h expiry, separate from the main app's user auth). Every call uses
// credentials: "same-origin" so the browser sends/receives the admin cookie;
// a 401 from ANY call means the session is gone and the caller should fall
// back to the login view.

export class UnauthorizedError extends Error {
  constructor() {
    super("unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    credentials: "same-origin",
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  if (res.status === 401) throw new UnauthorizedError();
  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    const msg =
      (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return body as T;
}

const get = <T>(path: string): Promise<T> => request<T>(path);
const post = <T>(path: string, data?: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

// ---- types matching the /api/admin/* contract ------------------------------

export interface Overview {
  network: string;
  dbReady: boolean;
  feeWallet: string | null;
  feeWalletBalanceXlm: string | null;
  subscriptions: {
    activePremium: number;
    newThisMonth: number;
    cancelledThisMonth: number;
    mrrEurApprox: number;
  };
}

export interface FeeRow {
  id: string;
  ts: string;
  userId: string;
  tradeType: "MANUAL" | "AI";
  tier: string;
  isPremium: boolean;
  feeRate: number;
  tradeVolumeXlm: number;
  feeXlm: number;
  status: string;
  tradeTxHash: string | null;
  collectedTxHash: string | null;
  collectedAt: string | null;
  xlmEurRate: number | null;
  feeEur: number | null;
  rateSource: string | null;
}

export interface FeesPage {
  rows: FeeRow[];
  total: number;
}

export interface FeesSummary {
  year: number;
  months: Array<{
    month: string;
    feeXlm: number;
    feeEur: number;
    txCount: number;
    avgFeeXlm: number;
    missingRateCount: number;
  }>;
  tierBreakdown: Record<string, number>;
  yearTotal: { feeXlm: number; feeEur: number; txCount: number };
  previousYearTotal: { year: number; feeXlm: number; feeEur: number; txCount: number };
}

export interface AdminUser {
  id: string;
  createdAt: string;
  lastLoginAt: string | null;
  volumeTier: string;
  tierOverride: string | null;
  isPremium: boolean;
  subscriptionStatus: string | null;
  flaggedForReview: boolean;
  disabledByAdmin: boolean;
  totalVolumeXlm: number;
}

export interface Settings {
  feeWalletAddress: string | null;
  premiumPriceMonthlyEur: number;
  premiumPriceAnnualEur: number;
  trustlineScanMinScore: number;
}

export interface AuditEntry {
  ts: string;
  admin: string;
  action: string;
  target: string | null;
  detail: string | null;
}

export const api = {
  login: (email: string, password: string, totp: string) =>
    post<{ ok: true; expiresInSec: number }>("/login", { email, password, totp }),
  logout: () => post<{ ok: true }>("/logout"),

  overview: () => get<Overview>("/overview"),

  fees: (params: { from: string; to: string; limit: number; offset: number }) =>
    get<FeesPage>(
      `/fees?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(params.to)}&limit=${params.limit}&offset=${params.offset}`,
    ),
  feesSummary: (year: number) => get<FeesSummary>(`/fees/summary?year=${year}`),

  users: () => get<{ users: AdminUser[] }>("/users"),
  setUserTier: (id: string, tier: string) => post<{ ok: true }>(`/users/${id}/tier`, { tier }),
  setUserDisabled: (id: string, disabled: boolean) =>
    post<{ ok: true }>(`/users/${id}/disable`, { disabled }),
  setUserFlagged: (id: string, flagged: boolean) =>
    post<{ ok: true }>(`/users/${id}/flag`, { flagged }),

  settings: () => get<Settings>("/settings"),
  setSetting: (key: string, value: unknown) => post<Record<string, unknown>>("/settings", { key, value }),

  audit: (limit = 100) => get<{ entries: AuditEntry[] }>(`/audit?limit=${limit}`),

  tierRecalc: () => post<{ started: true }>("/tier-recalc"),
};

export function feesExportCsvUrl(from: string, to: string): string {
  return `/api/admin/fees/export.csv?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
}

export function feesSummaryCsvUrl(year: number): string {
  return `/api/admin/fees/summary.csv?year=${year}`;
}
