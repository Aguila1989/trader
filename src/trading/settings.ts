// Feature 2 — runtime-editable operational settings.
//
// A single catalog describing every operational knob that the dashboard can
// change live (without editing files or restarting). Each entry knows how to
// READ its current value from `config` and how to WRITE a new one back, plus
// the metadata the UI needs (group, label, bounds, unit, default).
//
// Design notes:
//  - `config` is a singleton imported everywhere and read at CALL TIME by the
//    policy engine, the loops and the order path, so mutating a field here takes
//    effect immediately for the next read - no restart needed for the value
//    itself. Interval changes additionally need the affected loop re-scheduled;
//    the `loop` tag tells the caller (server.ts) which loop to restart.
//  - DEFAULTS are snapshotted at module load (before any persisted override is
//    applied during hydration), so "Reset to default" restores the env/file
//    value the process booted with.
//  - Validation CLAMPS to range (and rounds integer fields) rather than
//    rejecting, matching the risk-profile panel's "the backend clamps every
//    value" contract. Only a non-finite number / non-boolean is refused.

import { config } from "../config";

/** Which background loop (if any) must be re-scheduled when this value changes. */
export type SettingLoop = "autopilot" | "monitor" | "liquidity" | "wallet";

/** UI grouping (Feature 2 spec): AI / Risk & Safety / Automation / Swap. */
export type SettingGroup = "ai" | "risk" | "automation" | "swap";

export type SettingValue = number | boolean;

interface SettingDef {
  key: string;
  group: SettingGroup;
  label: string;
  description: string;
  type: "number" | "boolean";
  /** Numeric fields only. */
  min?: number;
  max?: number;
  step?: number;
  /** Round to an integer on write (intervals, counts, bps, stroops, ...). */
  int?: boolean;
  /** Display unit suffix (XLM, %, s, bps, ...). */
  unit?: string;
  get: () => SettingValue;
  set: (v: SettingValue) => void;
  /** Loop to restart after a change (interval/cadence settings). */
  loop?: SettingLoop;
}

/** Serializable view of a setting (no functions) for the API + UI. */
export interface SettingMeta {
  key: string;
  group: SettingGroup;
  label: string;
  description: string;
  type: "number" | "boolean";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: SettingValue;
  value: SettingValue;
  loop?: SettingLoop;
}

// --- helpers to build catalog entries -------------------------------------

function numLimit(
  key: keyof typeof config.limits,
  group: SettingGroup,
  label: string,
  description: string,
  opts: { min?: number; max?: number; step?: number; int?: boolean; unit?: string } = {},
): SettingDef {
  return {
    key,
    group,
    label,
    description,
    type: "number",
    ...opts,
    get: () => config.limits[key] as number,
    set: (v) => {
      (config.limits as Record<string, unknown>)[key] = v as number;
    },
  };
}

const CATALOG: SettingDef[] = [
  // ===== Group 1 — AI Trading ============================================
  numLimit("maxAmountPerTrade", "ai", "Per-trade cap (standard assets)",
    "Maximum size of a single trade for standard (non-deep-stable) assets.",
    { min: 0, max: 1_000_000, step: 1, unit: "XLM" }),
  numLimit("maxAmountPerTradeHigh", "ai", "Per-trade cap (deep stable assets)",
    "Larger per-trade cap applied only when every non-XLM leg is a curated deep stablecoin (USDC, EURC). Floored at the standard cap.",
    { min: 0, max: 1_000_000, step: 1, unit: "XLM" }),
  numLimit("cooldownSeconds", "ai", "Trade cooldown",
    "Minimum seconds between trades on the same pair (the AI cooldown). Risk profile may shorten this.",
    { min: 0, max: 86_400, step: 1, int: true, unit: "s" }),
  {
    key: "autoScanIntervalSeconds",
    group: "ai",
    label: "Auto-scan interval",
    description:
      "Hands-free chain-scan cadence. 0 = off; floored at 30s when on. Proposals still require auto-trade ON + live ARMED + passing policy to submit.",
    type: "number",
    min: 0,
    max: 86_400,
    step: 1,
    int: true,
    unit: "s",
    loop: "autopilot",
    get: () => config.autoScanIntervalSeconds,
    set: (v) => {
      config.autoScanIntervalSeconds = v as number;
    },
  },
  numLimit("maxTradesPerDay", "ai", "Max trades per day",
    "Hard cap on the number of trades submitted per trading day.",
    { min: 0, max: 100_000, step: 1, int: true }),
  numLimit("maxDailyVolume", "ai", "Max daily volume",
    "Hard cap on total traded volume per trading day (XLM-equivalent).",
    { min: 0, max: 10_000_000, step: 1, unit: "XLM" }),
  numLimit("maxProposalAgeSeconds", "ai", "Max proposal age",
    "Refuse to execute a proposal older than this - its limit price was set against a market that has moved on. 0 disables.",
    { min: 0, max: 86_400, step: 1, int: true, unit: "s" }),
  numLimit("minRiskReward", "ai", "Min reward/risk ratio",
    "Minimum reward/risk enforced when a proposal states both a target and an invalidation price. 0 disables.",
    { min: 0, max: 100, step: 0.1, unit: "x" }),

  // ===== Group 2 — Risk & Safety =========================================
  numLimit("maxDailyLoss", "risk", "Max daily loss",
    "Realized-loss halt: once today's realized PnL falls below -this, new entries stop until the next trading day.",
    { min: 0, max: 1_000_000, step: 1, unit: "XLM" }),
  numLimit("maxDailyEgress", "risk", "Max daily egress",
    "Daily wallet OUTFLOW cap for the wallet endpoints (sends/swaps), on top of the whitelist + kill switch. 0 disables the velocity cap.",
    { min: 0, max: 10_000_000, step: 1, unit: "XLM" }),
  numLimit("maxSlippageBps", "risk", "Default slippage (trades)",
    "Default maximum slippage for DEX trades. The risk profile may loosen this; expert mode sets it exactly.",
    { min: 0, max: 10_000, step: 1, int: true, unit: "bps" }),
  numLimit("maxSwapSlippageBps", "risk", "Max slippage (wallet swaps)",
    "Hard ceiling on client-supplied slippage for a wallet swap (path payment). Wider than the trade cap so an illiquid token can still be disposed, while bounding destMin away from zero.",
    { min: 0, max: 10_000, step: 1, int: true, unit: "bps" }),
  numLimit("maxOpenExposure", "risk", "Max open exposure",
    "Cap on TOTAL open exposure across all pairs (XLM-equivalent). 0 disables.",
    { min: 0, max: 10_000_000, step: 1, unit: "XLM" }),
  numLimit("pairExposureMultiplier", "risk", "Per-pair exposure multiple",
    "A pair's net exposure can never exceed this multiple of its per-trade cap.",
    { min: 1, max: 100, step: 1, int: true, unit: "x" }),
  numLimit("minVolume24h", "risk", "Min 24h volume to open",
    "Liquidity gate: minimum 24h traded volume (base units) required to OPEN a position. 0 disables.",
    { min: 0, max: 10_000_000, step: 1, unit: "XLM" }),
  numLimit("maxEntrySpreadBps", "risk", "Max entry spread",
    "Refuse to OPEN risk when the live top-of-book spread exceeds this. 0 disables.",
    { min: 0, max: 10_000, step: 1, int: true, unit: "bps" }),
  numLimit("stopLossPct", "risk", "Default stop distance",
    "Default stop-loss distance: when a position is this far under water vs. entry, the monitor proposes a close. 0 disables monitor stops.",
    { min: 0, max: 100, step: 0.1, unit: "%" }),
  numLimit("maxFeeStroops", "risk", "Max fee per op",
    "Hard ceiling (stroops) on the per-operation fee when bumping during congestion. 100000 stroops = 0.01 XLM.",
    { min: 100, max: 10_000_000, step: 100, int: true, unit: "stroops" }),

  // ===== Group 3 — Automation ============================================
  {
    key: "monitorIntervalSeconds",
    group: "automation",
    label: "Stop-loss monitor interval",
    description:
      "Position-monitor cadence: marks positions to market, proposes stop-loss closes, books fills, cancels stale offers. 0 disables (not recommended); floored at 15s.",
    type: "number",
    min: 0,
    max: 86_400,
    step: 1,
    int: true,
    unit: "s",
    loop: "monitor",
    get: () => config.monitorIntervalSeconds,
    set: (v) => {
      config.monitorIntervalSeconds = v as number;
    },
  },
  {
    key: "liquidityScanIntervalSeconds",
    group: "automation",
    label: "Liquidity scanner interval",
    description:
      "Observe-only liquidity scanner cadence (ranks the top XLM-liquid assets; never trades). 0 = off; floored at 300s when on.",
    type: "number",
    min: 0,
    max: 604_800,
    step: 1,
    int: true,
    unit: "s",
    loop: "liquidity",
    get: () => config.liquidityScanIntervalSeconds,
    set: (v) => {
      config.liquidityScanIntervalSeconds = v as number;
    },
  },
  {
    key: "walletRefreshSeconds",
    group: "automation",
    label: "Wallet refresh interval",
    description: "How often the dashboard re-pulls wallet balances + portfolio valuation. UI only; floored at 5s.",
    type: "number",
    min: 5,
    max: 3_600,
    step: 1,
    int: true,
    unit: "s",
    loop: "wallet",
    get: () => config.walletRefreshSeconds,
    set: (v) => {
      config.walletRefreshSeconds = v as number;
    },
  },
  numLimit("maxOfferAgeMinutes", "automation", "Resting-offer max age",
    "Cancel a resting offer after this many minutes unfilled. 0 disables auto-cancel.",
    { min: 0, max: 10_080, step: 1, int: true, unit: "min" }),
  {
    key: "stopLossMaxRetries",
    group: "automation",
    label: "Stop-loss retries before alert",
    description: "Failed stop-loss SELL attempts before the monitor raises an alert (the stop keeps retrying regardless).",
    type: "number",
    min: 0,
    max: 100,
    step: 1,
    int: true,
    get: () => config.stopLossMaxRetries,
    set: (v) => {
      config.stopLossMaxRetries = v as number;
    },
  },
  {
    key: "liquidityRetentionDays",
    group: "automation",
    label: "Liquidity history window",
    description: "How many days of liquidity snapshots the analyzer looks back over (and the history API window).",
    type: "number",
    min: 1,
    max: 365,
    step: 1,
    int: true,
    unit: "days",
    get: () => config.liquidityRetentionDays,
    set: (v) => {
      config.liquidityRetentionDays = v as number;
    },
  },
  {
    key: "liquidityDiscoveryPages",
    group: "automation",
    label: "Liquidity discovery depth",
    description: "Pages of Horizon's /assets endpoint the scanner sweeps to find new candidate assets. 0 = curated + whitelist only.",
    type: "number",
    min: 0,
    max: 50,
    step: 1,
    int: true,
    unit: "pages",
    get: () => config.liquidityDiscoveryPages,
    set: (v) => {
      config.liquidityDiscoveryPages = v as number;
    },
  },

  // ===== Group 4 — Swap & Transfer =======================================
  {
    key: "swapAllowToXlm",
    group: "swap",
    label: "Enable swap-to-XLM",
    description: "Master switch for the one-click \"Swap to XLM\" / \"Swap All to XLM\" buttons on pending payments. Off = those buttons refuse.",
    type: "boolean",
    get: () => config.swap.allowToXlm,
    set: (v) => {
      config.swap.allowToXlm = v as boolean;
    },
  },
  {
    key: "swapValueLossThresholdPct",
    group: "swap",
    label: "Swap value-loss threshold",
    description:
      "Block a swap-to-XLM when the estimated value loss (vs. holding the token, priced through Horizon) exceeds this. The user can still force a single swap with an explicit confirm.",
    type: "number",
    min: 0,
    max: 100,
    step: 0.1,
    unit: "%",
    get: () => config.swap.valueLossThresholdPct,
    set: (v) => {
      config.swap.valueLossThresholdPct = v as number;
    },
  },
];

// Snapshot the boot-time defaults BEFORE any persisted override is applied.
const DEFAULTS: Record<string, SettingValue> = {};
for (const d of CATALOG) DEFAULTS[d.key] = d.get();

const BY_KEY = new Map<string, SettingDef>(CATALOG.map((d) => [d.key, d]));

/** All catalog keys in declaration order. */
export function settingKeys(): string[] {
  return CATALOG.map((d) => d.key);
}

/** key -> current value, for the snapshot (live, reactive in the UI). */
export function currentSettingsMap(): Record<string, SettingValue> {
  const out: Record<string, SettingValue> = {};
  for (const d of CATALOG) out[d.key] = d.get();
  return out;
}

/** Full serializable catalog (meta + current value + boot default) for the API. */
export function settingsCatalog(): SettingMeta[] {
  return CATALOG.map((d) => ({
    key: d.key,
    group: d.group,
    label: d.label,
    description: d.description,
    type: d.type,
    min: d.min,
    max: d.max,
    step: d.step,
    unit: d.unit,
    default: DEFAULTS[d.key]!,
    value: d.get(),
    loop: d.loop,
  }));
}

/** The loop (if any) that must be restarted after `key` changes. */
export function settingLoop(key: string): SettingLoop | undefined {
  return BY_KEY.get(key)?.loop;
}

/**
 * Validate + clamp `raw` for `key`. Returns the coerced value, or an error
 * string for an unknown key / non-finite number / non-boolean.
 */
export function coerceSetting(
  key: string,
  raw: unknown,
): { ok: true; value: SettingValue } | { ok: false; error: string } {
  const def = BY_KEY.get(key);
  if (!def) return { ok: false, error: `Unknown setting "${key}".` };
  if (def.type === "boolean") {
    if (typeof raw === "boolean") return { ok: true, value: raw };
    if (raw === "true" || raw === "false") return { ok: true, value: raw === "true" };
    return { ok: false, error: `"${key}" expects a boolean.` };
  }
  let n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return { ok: false, error: `"${key}" expects a number.` };
  if (def.min != null) n = Math.max(def.min, n);
  if (def.max != null) n = Math.min(def.max, n);
  if (def.int) n = Math.round(n);
  else n = Number(n.toFixed(7));
  return { ok: true, value: n };
}

/** The boot-time default for `key` (for "Reset to default"). */
export function settingDefault(key: string): SettingValue | undefined {
  return DEFAULTS[key];
}

/** Apply a (already-coerced) value into `config`. No-op for an unknown key. */
export function applySettingToConfig(key: string, value: SettingValue): void {
  BY_KEY.get(key)?.set(value);
}

/** Storage key for dbo.Settings (namespaced so it never collides with others). */
export function settingStorageKey(key: string): string {
  return `setting:${key}`;
}

/** Serialize a value for dbo.Settings (string store). */
export function serializeSetting(value: SettingValue): string {
  return typeof value === "boolean" ? (value ? "true" : "false") : String(value);
}
