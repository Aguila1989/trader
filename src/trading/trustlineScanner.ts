import { randomUUID } from "node:crypto";
import { config } from "../config";
import { store } from "./store";
import { collectTopLiquidity } from "../liquidity/scan";
import { collectTokenInsight } from "../stellar/tokenInsights";
import { scoreToken } from "./trustlineAnalyst";
import { getTrustlines, type TrustlineInfo } from "../stellar/trustlineOps";
import { resolveTradingAccountOrNull } from "../stellar/keyProvider";
import { getMidPrice } from "../stellar/market";
import { canonicalAsset } from "../stellar/assets";
import { nextWeeklyOccurrenceUtc } from "../time";
import { DEFAULT_USER_ID, runWithUserId } from "../users/context";
import { listUsers } from "../users/repo";
import * as repo from "../db/repo";
import type {
  TokenScanResult,
  TrustlineSuggestion,
  TrustlineWarning,
  WarningTrigger,
  WeeklyScanStatus,
} from "../types";

/**
 * Feature 4 — weekly AI trustline scanner.
 *
 * A decoupled, observe-only background job (same shape + safety posture as the
 * liquidity scanner): it builds nothing on-chain and NEVER adds or removes a
 * trustline. It only informs; the user decides.
 *
 * TWO-PHASE DESIGN (one AI pass, per-user compare without AI):
 *   1. SCAN (global, once/week, the only AI usage): rank the top XLM-liquid
 *      tokens, UNION them with the tokens EVERY user already holds, and ask the
 *      AI to score each token ONCE. A token's quality is a property of the token,
 *      not the user, so it is scored once and reused for everyone. The scored
 *      snapshots are persisted under DEFAULT_USER_ID (shared history, >=12 weeks).
 *   2. VIEWS (per-user, on demand, NO AI): for one user, diff the shared scored
 *      set against THAT user's own trustlines — suggest high tokens they lack,
 *      warn about held tokens that deteriorated. Pure set arithmetic + a price
 *      lookup; deterministic, instant, and free. Served by GET .../views in the
 *      requesting user's scope, so no user-specific data is ever broadcast.
 *
 * SCHEDULE: a fixed weekday + local time (config.trustlineScan.dayOfWeek /
 * minuteOfDay in config.timezone). A 15-minute tick checks whether the next
 * scheduled slot (relative to the last completed scan) has arrived. On a fresh
 * install it waits for the next future slot — use "Run Now" for an immediate one.
 */

const TICK_MS = 15 * 60_000;
const SCORE_CONCURRENCY = 3;
const HELD_FETCH_CONCURRENCY = 4;

let timer: ReturnType<typeof setTimeout> | null = null;
let gen = 0;
let running = false; // re-entrancy guard for a single scan
let hydrated = false;

let scanning = false;
let lastScanAtIso: string | null = null;
let lastScanTokenCount: number | null = null;
let lastError: string | null = null;

/** Bounded-concurrency map (mirrors liquidity/scan.ts mapLimit). */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const idx = next++;
      out[idx] = await fn(items[idx]!, idx);
    }
  };
  const n = Math.max(1, Math.min(limit, items.length || 1));
  await Promise.all(Array.from({ length: n }, worker));
  return out;
}

function canon(spec: string): string {
  try {
    return canonicalAsset(spec);
  } catch {
    return spec.trim();
  }
}

/** Current scan status for the dashboard (computed live; rides the snapshot). */
export function getWeeklyScanStatus(): WeeklyScanStatus {
  return {
    enabled: config.trustlineScan.enabled,
    lastScanAt: lastScanAtIso,
    nextScanAt: computeNextScanAt(),
    scanning,
    lastScanTokenCount,
    lastError,
  };
}

/**
 * ISO of the next scheduled scan. On a fresh install (no last scan) it is the
 * next FUTURE slot; once it has run, it is the next slot after the last run
 * (which may already be in the past = overdue/catch-up after downtime).
 */
export function computeNextScanAt(from: Date = new Date()): string | null {
  if (!config.trustlineScan.enabled) return null;
  const { dayOfWeek, minuteOfDay } = config.trustlineScan;
  const base = lastScanAtIso ? new Date(lastScanAtIso) : from;
  return nextWeeklyOccurrenceUtc(dayOfWeek, minuteOfDay, base).toISOString();
}

function publishStatus(): void {
  store.setWeeklyScanStatus(getWeeklyScanStatus());
}

/* ------------------------------------------------------------------ *
 * Deterioration evaluation (pure - unit-tested).
 * ------------------------------------------------------------------ */

/**
 * Decide which spec-4C deterioration rules fire for a held token, comparing the
 * current scan row against the previous one (undefined on the first scan). Pure:
 * no I/O, fully deterministic - the unit tests pin every trigger.
 */
export function evaluateDeterioration(
  current: TokenScanResult,
  previous: TokenScanResult | undefined,
): { triggers: WarningTrigger[]; changed: string[] } {
  const triggers: WarningTrigger[] = [];
  const changed: string[] = [];

  if (previous && current.overallScore <= previous.overallScore - 2) {
    triggers.push("score_drop");
    changed.push(`Overall score fell from ${previous.overallScore} to ${current.overallScore}.`);
  }

  if (current.liquidityScore < 3) {
    triggers.push("liquidity_low");
    changed.push(`Liquidity score is very low (${current.liquidityScore}/10).`);
  }

  const prevVol = previous?.rawData.volume7d;
  const curVol = current.rawData.volume7d;
  if (prevVol != null && prevVol > 0 && curVol != null && curVol < prevVol * 0.5) {
    triggers.push("volume_drop");
    const pct = Math.round((1 - curVol / prevVol) * 100);
    changed.push(`7-day volume dropped ${pct}% week over week.`);
  }

  if (previous) {
    const prevFlags = new Set(previous.redFlags.map((f) => f.toLowerCase()));
    const fresh = current.redFlags.filter((f) => !prevFlags.has(f.toLowerCase()));
    if (fresh.length > 0) {
      triggers.push("new_red_flags");
      changed.push(`New red flag(s): ${fresh.join("; ")}.`);
    }
  }

  const prevTl = previous?.rawData.trustlineCount;
  const curTl = current.rawData.trustlineCount;
  if (prevTl != null && prevTl > 0 && curTl != null && curTl < prevTl * 0.9) {
    triggers.push("trustline_count_drop");
    const pct = Math.round((1 - curTl / prevTl) * 100);
    changed.push(`Trustline holders dropped ${pct}% (${prevTl} → ${curTl}).`);
  }

  if (previous && !previous.rawData.tomlMissing && current.rawData.tomlMissing) {
    triggers.push("toml_lost");
    changed.push("The issuer's stellar.toml is no longer reachable.");
  }

  if (
    previous &&
    (previous.rawData.priceTrend7d === "up" || previous.rawData.priceTrend7d === "stable") &&
    current.rawData.priceTrend7d === "down"
  ) {
    triggers.push("trend_down");
    changed.push("7-day price trend turned downward.");
  }

  return { triggers, changed };
}

/* ------------------------------------------------------------------ *
 * Phase 2 — per-user views (NO AI). Runs in the CURRENT user's scope.
 * ------------------------------------------------------------------ */

export interface TrustlineViews {
  /** Positive suggestions only: AI-scored AND overall >= the configured minimum. */
  suggestions: TrustlineSuggestion[];
  /**
   * Tokens whose AI evaluation was UNAVAILABLE (fallback-scored). Never mixed
   * into `suggestions` — the UI lists them separately as "unscored, evaluate
   * manually" with an explicit warning. Scored tokens BELOW the minimum are
   * hidden entirely (not returned at all).
   */
  unscored: TrustlineSuggestion[];
  warnings: TrustlineWarning[];
  /** The active minimum-overall-score threshold (config.trustlineScan.minScore). */
  minScore: number;
}

/**
 * True when this scan row carries fallbackScores() instead of a real AI
 * evaluation (see trustlineAnalyst.fallbackScores — it always sets this red
 * flag). Such a row must never be presented as a positive suggestion.
 */
function isAiUnavailable(r: TokenScanResult): boolean {
  return r.redFlags.some((f) => f.toLowerCase().includes("ai evaluation unavailable"));
}

/** Read the shared (DEFAULT_USER_ID) scored set: latest scan rows + a per-asset
 *  map of the PREVIOUS scan for week-over-week comparison. */
async function loadScoredSet(): Promise<{
  current: TokenScanResult[];
  prevByAsset: Map<string, TokenScanResult>;
  scanDate: string | null;
}> {
  return runWithUserId(DEFAULT_USER_ID, async () => {
    const dates = await repo.distinctTrustlineScanDates(5);
    const latest = dates[0];
    if (!latest) return { current: [], prevByAsset: new Map(), scanDate: null };
    const current = await repo.listTrustlineScansForDate(latest);
    const prevDate = dates.find((d) => d !== latest);
    const prev = prevDate ? await repo.listTrustlineScansForDate(prevDate) : [];
    return {
      current,
      prevByAsset: new Map(prev.map((r) => [canon(r.asset), r])),
      scanDate: latest,
    };
  });
}

/**
 * Compute the suggestion + warning cards for the CURRENT user (call inside their
 * request scope). Diffs the shared scored set against this user's own trustlines
 * and this user's dismissals. Makes NO AI call. Suggestion dismissals auto-reset
 * each scan: one is active only if it was made after the latest scan's date.
 */
export async function computeUserViews(): Promise<TrustlineViews> {
  const minScore = config.trustlineScan.minScore;
  const { current, prevByAsset, scanDate } = await loadScoredSet();
  if (!scanDate || current.length === 0) {
    return { suggestions: [], unscored: [], warnings: [], minScore };
  }

  const pub = await resolveTradingAccountOrNull().catch(() => null);
  const held: TrustlineInfo[] = pub ? await getTrustlines(pub).catch(() => []) : [];
  const heldByAsset = new Map(held.map((t) => [canon(t.asset), t]));

  const dismissals = await repo.listActiveTrustlineDismissals().catch(() => []);
  const dismissedSuggestions = new Set(
    dismissals
      .filter((d) => d.kind === "suggestion" && d.createdAt >= scanDate)
      .map((d) => canon(d.asset)),
  );
  const snoozedWarnings = new Set(
    dismissals.filter((d) => d.kind === "warning").map((d) => canon(d.asset)),
  );

  // Candidates: tokens the user does NOT hold and has not dismissed. Split at
  // the DATA level (the frontend never receives filtered-out rows):
  //   - suggestions: real AI score AND overall >= minScore (highest first)
  //   - unscored:    AI evaluation unavailable — listed separately, never suggested
  //   - hidden:      real AI score BELOW minScore — not returned at all
  const toCard = (r: TokenScanResult): TrustlineSuggestion => ({
    asset: r.asset,
    assetCode: r.assetCode,
    assetIssuer: r.assetIssuer,
    scanDate: r.scanDate,
    scores: {
      liquidityScore: r.liquidityScore,
      legitimacyScore: r.legitimacyScore,
      trendScore: r.trendScore,
      riskScore: r.riskScore,
      overallScore: r.overallScore,
      summary: r.summary,
      redFlags: r.redFlags,
    },
    homeDomain: r.rawData.homeDomain,
    ...(r.rawData.toml ? { toml: r.rawData.toml } : {}),
  });
  const candidates = current
    .filter((r) => !heldByAsset.has(canon(r.asset)) && !dismissedSuggestions.has(canon(r.asset)))
    .sort((a, b) => b.overallScore - a.overallScore);
  const suggestions: TrustlineSuggestion[] = candidates
    .filter((r) => !isAiUnavailable(r) && r.overallScore >= minScore)
    .map(toCard);
  const unscored: TrustlineSuggestion[] = candidates.filter(isAiUnavailable).map(toCard);

  // Warnings: scored tokens the user HOLDS that tripped a deterioration rule.
  const warnings: TrustlineWarning[] = [];
  for (const r of current) {
    const key = canon(r.asset);
    const tl = heldByAsset.get(key);
    if (!tl || snoozedWarnings.has(key)) continue;
    const { triggers, changed } = evaluateDeterioration(r, prevByAsset.get(key));
    if (triggers.length === 0) continue;

    const balance = tl.balance ?? "0";
    let estimatedValueXlm: number | null = null;
    const bal = Number(balance);
    if (bal > 0) {
      const mid = await getMidPrice(r.asset, "XLM").catch(() => null);
      if (mid != null && mid > 0) estimatedValueXlm = Number((bal * mid).toFixed(7));
    }

    warnings.push({
      asset: r.asset,
      assetCode: r.assetCode,
      assetIssuer: r.assetIssuer,
      scanDate: r.scanDate,
      triggers,
      changed,
      previousOverall: prevByAsset.get(key) ? prevByAsset.get(key)!.overallScore : null,
      currentOverall: r.overallScore,
      explanation: r.summary,
      balance,
      estimatedValueXlm,
      redFlags: r.redFlags,
    });
  }

  return { suggestions, unscored, warnings, minScore };
}

/* ------------------------------------------------------------------ *
 * Phase 1 — the global scan (the one AI pass).
 * ------------------------------------------------------------------ */

/** Union of the tokens EVERY user currently holds (so a held-but-not-top-N token
 *  still gets scored and can be warned on). Reads each user's own wallet in that
 *  user's scope; trustlines are public on-chain data. Best-effort per user. */
async function allUsersHeldAssets(): Promise<string[]> {
  let users: { id: string }[] = [];
  try {
    users = await runWithUserId(DEFAULT_USER_ID, () => listUsers());
  } catch {
    return [];
  }
  const perUser = await mapLimit(users, HELD_FETCH_CONCURRENCY, async (u) => {
    const pub = await runWithUserId(u.id, () => resolveTradingAccountOrNull()).catch(() => null);
    if (!pub) return [] as string[];
    const tls = await getTrustlines(pub).catch(() => [] as TrustlineInfo[]);
    return tls.map((t) => t.asset);
  });
  const seen = new Set<string>();
  const out: string[] = [];
  for (const arr of perUser) {
    for (const a of arr) {
      const key = canon(a);
      if (key === "XLM" || seen.has(key)) continue;
      seen.add(key);
      out.push(a);
    }
  }
  return out;
}

/** The global scan, run inside the DEFAULT_USER_ID scope. Returns the token count. */
async function doScan(trigger: "scheduled" | "manual"): Promise<number> {
  const scanDate = new Date().toISOString();
  store.logAi({ eventType: "trustline", reasoning: `[TRUSTLINE] Weekly scan started (${trigger}).` });

  // Candidate set = top-N by measured XLM volume ∪ every user's held tokens.
  const top = await collectTopLiquidity({
    topN: config.trustlineScan.topN,
    discoveryPages: config.liquidityDiscoveryPages,
    concurrency: 4,
  });
  const heldAssets = await allUsersHeldAssets();

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const spec of [...top.map((t) => t.asset), ...heldAssets]) {
    const key = canon(spec);
    if (key === "XLM" || seen.has(key)) continue;
    seen.add(key);
    candidates.push(spec);
  }

  // Score each candidate ONCE (this is the only AI usage), persisting as we go.
  // `held` is per-user and is computed at view time, so it is stored false here.
  const results = await mapLimit(candidates, SCORE_CONCURRENCY, async (asset) => {
    const raw = await collectTokenInsight(asset);
    const scores = await scoreToken(asset, raw);
    const [code = asset, issuer = ""] = asset.split(":");
    const r: TokenScanResult = {
      scanDate,
      asset,
      assetCode: code,
      assetIssuer: issuer,
      ...scores,
      rawData: raw,
      held: false,
    };
    await repo.insertTrustlineScan(randomUUID(), r);
    return r;
  });

  // Retention: keep at least `retentionWeeks` of history; prune older rows.
  const cutoff = new Date(
    Date.now() - config.trustlineScan.retentionWeeks * 7 * 86_400_000,
  ).toISOString();
  await repo.pruneTrustlineScans(cutoff);

  lastScanAtIso = scanDate;
  lastScanTokenCount = results.length;
  lastError = null;
  await repo.upsertSetting("trustline:lastScanAt", scanDate);
  return results.length;
}

/**
 * Run one scan. Re-entrancy-guarded. Publishes status via the store (SSE). Logs
 * start/completion to the AI log, plus the OPERATOR account's deterioration
 * warnings as [TRUSTLINE] entries (per-user warnings surface in each user's own
 * UI). The manual path rethrows so the endpoint can report failure.
 */
async function runScan(trigger: "scheduled" | "manual"): Promise<{ tokenCount: number }> {
  if (running) return { tokenCount: lastScanTokenCount ?? 0 };
  running = true;
  scanning = true;
  publishStatus();
  try {
    const out = await runWithUserId(DEFAULT_USER_ID, async () => {
      const tokenCount = await doScan(trigger);
      // The operator (DEFAULT_USER_ID) view, only so its warnings reach the AI log.
      const views = await computeUserViews();
      return { tokenCount, warnings: views.warnings, suggestionCount: views.suggestions.length };
    });
    store.logAi({
      eventType: "trustline",
      reasoning:
        `[TRUSTLINE] Weekly scan complete: ${out.tokenCount} tokens analysed ` +
        `(operator account: ${out.suggestionCount} suggestion(s), ${out.warnings.length} warning(s)).`,
    });
    for (const w of out.warnings) {
      store.log("warn", `[TRUSTLINE] ${w.assetCode}: ${w.changed.join(" ")}`);
      store.logAi({
        eventType: "trustline",
        baseAsset: w.asset,
        reasoning: `[TRUSTLINE] Warning for ${w.assetCode}: ${w.changed.join(" ")} ${w.explanation}`,
      });
    }
    return { tokenCount: out.tokenCount };
  } catch (err) {
    lastError = (err as Error).message;
    store.log("error", `[TRUSTLINE] Weekly scan failed: ${lastError}`);
    store.logAi({ eventType: "trustline", reasoning: `[TRUSTLINE] Weekly scan failed: ${lastError}` });
    throw err;
  } finally {
    running = false;
    scanning = false;
    publishStatus();
  }
}

/** Manual "Run Now" trigger (endpoint-facing). Rethrows on failure. */
export function runTrustlineScanNow(): Promise<{ tokenCount: number }> {
  return runScan("manual");
}

/* ------------------------------------------------------------------ *
 * Loop scaffolding (generation token + self-rescheduling tick).
 * ------------------------------------------------------------------ */

async function loadState(): Promise<void> {
  try {
    lastScanAtIso = await runWithUserId(DEFAULT_USER_ID, () =>
      repo.getSetting("trustline:lastScanAt"),
    );
  } catch {
    /* no DB / read failed: treat as never-scanned */
  }
  hydrated = true;
}

async function tick(): Promise<void> {
  // Skip while a scan runs, the feature is off, the AI master switch is paused
  // (the scan makes AI calls), or the kill switch is engaged (Feature 6: "stop
  // all bot activity" includes this scanner). A skipped due-scan runs on a
  // later tick once unblocked (lastScanAt is unchanged, so it stays "due").
  if (running || !config.trustlineScan.enabled || !store.aiEnabled || store.killSwitch) return;
  if (!hydrated) await loadState();
  const nextIso = computeNextScanAt();
  if (nextIso && Date.now() >= new Date(nextIso).getTime()) {
    await runScan("scheduled").catch(() => {
      /* already logged in runScan; keep the loop alive */
    });
  }
}

export function startTrustlineScanner(): void {
  const myGen = ++gen; // supersede any previously-scheduled loop
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!config.trustlineScan.enabled) {
    store.log(
      "info",
      "Trustline scanner OFF (TRUSTLINE_SCAN_ENABLED=false). No weekly trustline suggestions/warnings.",
    );
    publishStatus();
    return;
  }
  store.log(
    "info",
    `Trustline scanner ON: weekly AI trustline analysis (day ${config.trustlineScan.dayOfWeek}, ` +
      `${String(Math.floor(config.trustlineScan.minuteOfDay / 60)).padStart(2, "0")}:` +
      `${String(config.trustlineScan.minuteOfDay % 60).padStart(2, "0")} ${config.timezone}). ` +
      "One AI pass scored per token; per-user compare is AI-free. Never adds/removes a trustline.",
  );

  const loop = (): void => {
    if (myGen !== gen) return; // superseded by a newer start/stop
    void tick().finally(() => {
      if (myGen === gen) timer = setTimeout(loop, TICK_MS);
    });
  };
  // First tick shortly after boot: hydrate last-scan time + publish status.
  timer = setTimeout(() => {
    if (myGen !== gen) return;
    void loadState().finally(() => {
      publishStatus();
      loop();
    });
  }, 12_000);
}

/** Stop the scanner (shutdown) or, via startTrustlineScanner(), restart it. */
export function stopTrustlineScanner(): void {
  gen++;
  if (timer) clearTimeout(timer);
  timer = null;
}
