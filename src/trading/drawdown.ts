// Rolling 24h portfolio-value samples for the DRAWDOWN-TOLERANCE risk factor.
// The position monitor records a (throttled) sample of total portfolio value;
// the orchestrator reads the current peak-to-trough drawdown % to pause new AI
// entries when it exceeds the profile threshold. In-memory + ephemeral by
// design: the persisted thing is the risk PROFILE; a fresh boot starts a fresh
// 24h window (a restart is itself a "reset", and a stale pre-restart peak should
// not strand the bot).

const WINDOW_MS = 24 * 60 * 60 * 1000;
// A genuine portfolio value can't jump this much between 5-min samples — a
// reading that does is almost certainly a transient Horizon mispricing (a thin
// or one-sided book skewing a mid). Reject it so a single spike can't set a
// bogus 24h peak that pauses trading for a whole day.
const MAX_DEVIATION = 0.4; // 40% vs the trailing median

interface Sample {
  ts: number;
  valueXlm: number;
}

const samples: Sample[] = [];

function trailingMedian(): number | null {
  if (samples.length === 0) return null;
  const recent = samples.slice(-5).map((s) => s.valueXlm).sort((a, b) => a - b);
  const mid = Math.floor(recent.length / 2);
  return recent.length % 2 ? recent[mid]! : (recent[mid - 1]! + recent[mid]!) / 2;
}

/**
 * Record a portfolio-value sample (XLM-equivalent), pruning the >24h tail.
 * Outlier guard: once a few samples exist, a value deviating >40% from the
 * trailing median is dropped as a likely mispricing (over-conservative: a real
 * crash that large would still register on the next in-range sample).
 */
export function recordPortfolioSample(valueXlm: number, nowMs: number): void {
  if (!(valueXlm > 0)) return;
  const med = trailingMedian();
  if (med != null && samples.length >= 3 && med > 0) {
    const dev = Math.abs(valueXlm - med) / med;
    if (dev > MAX_DEVIATION) return; // reject transient spike/dip
  }
  samples.push({ ts: nowMs, valueXlm });
  const cutoff = nowMs - WINDOW_MS;
  while (samples.length > 0 && samples[0]!.ts < cutoff) samples.shift();
}

/** The window's peak sample (highest value), for diagnostics / pause logging. */
export function drawdownPeak(nowMs: number): { valueXlm: number; ts: number } | null {
  const cutoff = nowMs - WINDOW_MS;
  const win = samples.filter((s) => s.ts >= cutoff);
  if (win.length === 0) return null;
  return win.reduce((hi, s) => (s.valueXlm > hi.valueXlm ? s : hi), win[0]!);
}

/**
 * Peak-to-trough drawdown % over the last 24h: how far the CURRENT value sits
 * below the highest value seen in the window. 0 when fewer than 2 samples, no
 * positive peak, or the current value is at/above the peak.
 */
export function currentDrawdownPct(nowMs: number): number {
  const cutoff = nowMs - WINDOW_MS;
  const win = samples.filter((s) => s.ts >= cutoff);
  if (win.length < 2) return 0;
  const peak = Math.max(...win.map((s) => s.valueXlm));
  const current = win[win.length - 1]!.valueXlm;
  if (!(peak > 0)) return 0;
  return Math.max(0, ((peak - current) / peak) * 100);
}

// AUDIT-034: drawdownSampleCount() was removed — the "diagnostics / tests"
// usage it was written for never materialized (zero callers incl. tests).
