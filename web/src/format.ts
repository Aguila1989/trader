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
