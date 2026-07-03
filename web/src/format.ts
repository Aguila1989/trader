// Pure display helpers shared across components.

export function fmtNum(x: unknown, dp = 4): string {
  if (x === null || x === undefined || x === "") return "-";
  const n = Number(x);
  return Number.isFinite(n)
    ? n.toLocaleString(undefined, { maximumFractionDigits: dp })
    : String(x);
}

export function shortKey(k: string | null | undefined): string {
  if (!k) return "(none)";
  return k.length > 14 ? `${k.slice(0, 6)}...${k.slice(-6)}` : k;
}

/** Asset code from a "CODE:ISSUER" spec (or the spec itself for XLM/native). */
export function assetCode(spec: string): string {
  return spec.split(":")[0] || spec;
}

export function timeStr(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleTimeString();
}

export function dateTimeStr(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

export function explorerTx(hash: string, network: string): string {
  const net = network === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${net}/tx/${hash}`;
}

/**
 * AUDIT-017/042: i18n label for an AI-log eventType ("risk_constraint" →
 * t("aiLog.events.riskConstraint")). Falls back to the underscore-stripped raw
 * value for event types without a translation. Pass vue-i18n's `t`.
 */
export function aiEventLabel(t: (key: string) => string, eventType: string): string {
  const suffix = eventType.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  const key = `aiLog.events.${suffix}`;
  const label = t(key);
  return label === key ? eventType.replace(/_/g, " ") : label;
}
