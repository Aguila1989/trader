// Number/date formatting per the admin backoffice spec: XLM 7dp trimmed,
// EUR 2dp, timestamps as "YYYY-MM-DD HH:MM UTC".

export function xlm(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  // 7dp, trimmed of trailing zeros (but keep at least "0").
  let s = v.toFixed(7);
  if (s.includes(".")) {
    s = s.replace(/0+$/, "").replace(/\.$/, "");
  }
  return s === "" ? "0" : s;
}

export function eur(n: number | string | null | undefined): string {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (!Number.isFinite(v)) return "—";
  return v.toFixed(2);
}

export function utcStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function truncateMiddle(s: string | null | undefined, head = 6, tail = 6): string {
  if (!s) return "—";
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}
