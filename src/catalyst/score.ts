/**
 * PURE scoring: turn ingested CatalystEvents into a bounded, per-asset trading
 * signal — score in [-1, 1] (negative = bearish, positive = bullish) plus a
 * confidence in [0, 1] and a plain-English rationale for the AI prompt/log.
 *
 * No I/O and no clock reads in the scoring math itself — every function here
 * takes `asOfIso` explicitly. This matters beyond style: Phase 4's paper
 * evaluator MUST pass its SIMULATED decision time, never `Date.now()`, or a
 * backtest silently leaks the wall clock into "how recent was this catalyst"
 * and invents an edge that can't exist live. Pair this with feed.ts's
 * `eventsAsOf` look-ahead gate, which is what keeps the EVENT SET itself
 * honest — this file only assumes the events it's given are already
 * admissible as of `asOfIso` (and defensively re-checks that assumption; see
 * `decayWeight`).
 *
 * HONEST CAVEAT (see README.md): this is a heuristic reaction model, not a
 * fitted one. The KIND_DEFAULTS table below is a starting judgement call, not
 * a calibrated result — it has not been backtested. Whether reacting to
 * catalysts this way adds any edge at all is exactly what Phase 4's paper
 * evaluator is for. Until that measurement exists, treat every score and
 * confidence produced here as a hypothesis for the AI to weigh, not a fact.
 */
import type { AssetRef, CatalystDirection, CatalystEvent, CatalystKind } from "./types";

export type { AssetRef };

/**
 * Base magnitude (0..1) and directional lean for a kind, used only when an
 * event doesn't set its own `severity`/`direction`. Several of these are
 * DELIBERATE SIMPLIFICATIONS, called out below, because the kind alone can't
 * disambiguate direction — a source that CAN tell should set the event's own
 * fields rather than relying on the default.
 */
export const KIND_DEFAULTS: Record<CatalystKind, { severity: number; direction: CatalystDirection }> = {
  listing: { severity: 0.6, direction: "positive" },
  delisting: { severity: 0.7, direction: "negative" },
  exploit: { severity: 0.9, direction: "negative" },
  // Governance outcomes cut both ways depending on WHAT passed (a mint-cap
  // raise reads differently than a fee-switch activation) — genuinely
  // two-sided without reading the proposal, so magnitude-only by default.
  governance: { severity: 0.3, direction: "mixed" },
  // AMBIGUOUS BY DESIGN (unverified assumption): a perp funding-rate spike
  // usually signals crowded positioning (a contrarian caution, i.e. bearish
  // for a crowded long), but "funding-spike" could equally mean a funding
  // ROUND (bullish). Left mixed/low-severity until a source disambiguates via
  // its own `direction` override — do not treat this default as tuned.
  "funding-spike": { severity: 0.4, direction: "mixed" },
  // AMBIGUOUS BY DESIGN: a large flow TO an exchange reads bearish (selling
  // pressure incoming); FROM an exchange reads bullish (accumulation/cold
  // storage). The kind alone can't tell which — mixed until a source sets
  // `direction` itself (e.g. by comparing counterparties to known CEX tags).
  "large-flow": { severity: 0.5, direction: "mixed" },
  partnership: { severity: 0.5, direction: "positive" },
  // AMBIGUOUS BY DESIGN: "depeg = mean-reversion candidate" is a TRADING
  // OPINION, not a fact, and needs to know which side of the peg the asset
  // is on to have a direction at all (below peg -> reversion-up/bullish;
  // above peg -> reversion-down/bearish). Left mixed until a source states
  // which side occurred.
  depeg: { severity: 0.6, direction: "mixed" },
  other: { severity: 0.3, direction: "mixed" },
};

/** Signed multiplier for a direction; "mixed" contributes 0 to the signed
 *  score (pure magnitude/uncertainty — it still counts toward confidence). */
function directionSign(direction: CatalystDirection): number {
  if (direction === "positive") return 1;
  if (direction === "negative") return -1;
  return 0;
}

/** Effective (severity, direction) for an event: its own override when
 *  present, else the kind default. Severity is clamped to [0,1] defensively
 *  against a malformed/untrusted source. */
function effective(event: CatalystEvent): { severity: number; direction: CatalystDirection } {
  const d = KIND_DEFAULTS[event.kind] ?? KIND_DEFAULTS.other;
  const severity = event.severity !== undefined ? Math.min(1, Math.max(0, event.severity)) : d.severity;
  const direction = event.direction ?? d.direction;
  return { severity, direction };
}

/**
 * Exponential recency decay: weight 1.0 at age 0, halving every
 * `halfLifeHours`. Returns 0 (never negative, never throws on a bad date) for
 * an event whose `publishedAt` is AFTER `asOfIso` — a defense-in-depth mirror
 * of feed.ts's `eventsAsOf` gate, in case a caller hands this raw, unfiltered
 * events by mistake.
 */
export function decayWeight(publishedAtIso: string, asOfIso: string, halfLifeHours: number): number {
  const published = Date.parse(publishedAtIso);
  const asOf = Date.parse(asOfIso);
  if (!Number.isFinite(published) || !Number.isFinite(asOf) || !(halfLifeHours > 0)) return 0;
  const ageHours = (asOf - published) / 3_600_000;
  if (ageHours < 0) return 0; // look-ahead guard: never let a future event score
  return Math.pow(0.5, ageHours / halfLifeHours);
}

export interface ScoreOptions {
  /** Recency half-life in hours — how fast an event's pull fades. Default 24:
   *  a catalyst is at half its initial weight one day later. */
  halfLifeHours?: number;
  /** Per-source trust weight, 0..1 (default 0.7 for an unlisted source) —
   *  pass the registry's weights (see feed.ts `CatalystFeed.sourceWeight`)
   *  straight through rather than re-deriving them. */
  sourceWeights?: Record<string, number>;
  /** Max contributing events quoted in the rationale string. Default 3. */
  rationaleTopN?: number;
}

const DEFAULT_HALF_LIFE_HOURS = 24;
const DEFAULT_SOURCE_WEIGHT = 0.7;
const DEFAULT_RATIONALE_TOP_N = 3;

/** One event's contribution to an asset's aggregate — exposed so callers
 *  needing per-event detail (or a custom rationale) don't recompute it. */
export interface EventContribution {
  event: CatalystEvent;
  /** severity × sourceWeight × recencyWeight, always >= 0 — the event's
   *  "loudness" independent of direction. */
  weight: number;
  /** weight × directionSign(direction), in [-weight, +weight]. */
  signed: number;
}

function sourceWeightFor(sourceId: string, weights: Record<string, number> | undefined): number {
  const w = weights?.[sourceId];
  return w !== undefined ? Math.min(1, Math.max(0, w)) : DEFAULT_SOURCE_WEIGHT;
}

/** Contribution of one event, as of `asOfIso`. */
export function eventContribution(event: CatalystEvent, asOfIso: string, opts: ScoreOptions = {}): EventContribution {
  const { severity, direction } = effective(event);
  const recency = decayWeight(event.publishedAt, asOfIso, opts.halfLifeHours ?? DEFAULT_HALF_LIFE_HOURS);
  const weight = severity * sourceWeightFor(event.source, opts.sourceWeights) * recency;
  return { event, weight, signed: weight * directionSign(direction) };
}

export interface AssetCatalystSignal {
  asset: AssetRef;
  /** Bounded [-1, 1]; negative = bearish, positive = bullish, 0 = no signal
   *  (no admissible events, or fully offsetting/uncertain ones). */
  score: number;
  /** Bounded [0, 1] — how much total (decayed, source-weighted) evidence
   *  backs the score. NOT a statement of predictive accuracy — see the
   *  module-level caveat; this is unproven until Phase 4 measures it. */
  confidence: number;
  /** Number of events that contributed non-zero weight to this signal. */
  eventCount: number;
  /** Plain-English summary for the AI prompt / AI log, citing the top
   *  contributing events (kind, source, age, direction). */
  rationale: string;
}

/** Events relevant to `asset`: those naming it, plus market-wide events
 *  (`assets: []`), which apply to every asset. */
function relevantEvents(events: CatalystEvent[], asset: AssetRef): CatalystEvent[] {
  return events.filter((e) => e.assets.length === 0 || e.assets.includes(asset));
}

/** Confidence saturates as evidence accumulates rather than growing
 *  unbounded: with the default weights, a single fully-current, full-severity,
 *  full-trust event (weight 1) reaches confidence 0.5; three such events reach
 *  0.75. A thin, stale, or low-trust event set stays near 0 — as it should. */
function confidenceFromWeight(totalWeight: number): number {
  return Math.min(1, totalWeight / (totalWeight + 1));
}

function hoursAgo(publishedAtIso: string, asOfIso: string): number {
  const ms = Date.parse(asOfIso) - Date.parse(publishedAtIso);
  return Math.max(0, ms / 3_600_000);
}

function directionWord(direction: CatalystDirection): string {
  return direction === "positive" ? "bullish" : direction === "negative" ? "bearish" : "mixed/uncertain";
}

function buildRationale(
  asset: AssetRef,
  score: number,
  confidence: number,
  contributions: EventContribution[],
  asOfIso: string,
  topN: number,
): string {
  const lean = score > 0.05 ? "bullish" : score < -0.05 ? "bearish" : "neutral";
  const lead = `${asset} catalyst score ${score.toFixed(2)} (${lean}), confidence ${confidence.toFixed(2)}, from ${contributions.length} event(s):`;
  const lines = contributions.slice(0, topN).map((c) => {
    const { severity, direction } = effective(c.event);
    const age = hoursAgo(c.event.publishedAt, asOfIso);
    const ageLabel = age < 1 ? "<1h ago" : `${Math.round(age)}h ago`;
    return `  - [${c.event.kind}] "${c.event.headline}" (${c.event.source}, ${ageLabel}, severity ${severity.toFixed(1)}) -> ${directionWord(direction)}`;
  });
  return [lead, ...lines].join("\n");
}

/**
 * Score one asset's catalyst exposure as of `asOfIso`. Pass ONLY events that
 * already satisfy `publishedAt <= asOfIso` — feed.ts's `eventsAsOf` enforces
 * that for you; this function ALSO defensively zeroes out any that don't
 * (see `decayWeight`), but do not rely on that as your only guard.
 */
export function scoreAsset(events: CatalystEvent[], asset: AssetRef, asOfIso: string, opts: ScoreOptions = {}): AssetCatalystSignal {
  const relevant = relevantEvents(events, asset);
  const contributions = relevant
    .map((e) => eventContribution(e, asOfIso, opts))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight);

  if (contributions.length === 0) {
    return { asset, score: 0, confidence: 0, eventCount: 0, rationale: `${asset}: no recent catalysts.` };
  }

  const totalWeight = contributions.reduce((s, c) => s + c.weight, 0);
  const totalSigned = contributions.reduce((s, c) => s + c.signed, 0);
  const score = Math.min(1, Math.max(-1, totalWeight > 0 ? totalSigned / totalWeight : 0));
  const confidence = confidenceFromWeight(totalWeight);

  return {
    asset,
    score,
    confidence,
    eventCount: contributions.length,
    rationale: buildRationale(asset, score, confidence, contributions, asOfIso, opts.rationaleTopN ?? DEFAULT_RATIONALE_TOP_N),
  };
}

/**
 * Score every asset explicitly named across `events`. Market-wide-only
 * events (`assets: []`) contribute to every named asset's signal but produce
 * no signal of their own — there is no single asset to attach a market-wide
 * event to. A caller wanting a market-wide read can score a synthetic asset
 * id (e.g. "MARKET") by calling `scoreAsset(events, "MARKET", asOfIso)`
 * against a list of market-wide events specifically.
 */
export function scoreAllAssets(events: CatalystEvent[], asOfIso: string, opts: ScoreOptions = {}): AssetCatalystSignal[] {
  const assets = new Set<AssetRef>();
  for (const e of events) for (const a of e.assets) assets.add(a);
  return Array.from(assets)
    .sort()
    .map((asset) => scoreAsset(events, asset, asOfIso, opts));
}
