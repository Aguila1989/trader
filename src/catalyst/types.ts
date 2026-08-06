/**
 * Catalyst ingestion types (Phase 3.2 — NEWS / EVENT / ON-CHAIN CATALYST
 * ingestion + reaction scoring). This is the "an AI genuinely adds value"
 * lever: numeric indicators (src/stellar/indicators.ts) can't read a
 * governance post or an exploit disclosure — a catalyst feed can.
 *
 * Two layers:
 *   - CatalystSource / CatalystEvent (this file) — the pluggable ingestion
 *     shape. A source just promises "events since this ISO timestamp"; where
 *     they come from (RSS, a vendor API, a chain indexer) is its own concern.
 *   - feed.ts — the registry + polling coordinator + the LOOK-AHEAD-BIAS gate
 *     (`eventsAsOf`). READ THAT FILE'S HEADER before consuming events from
 *     anywhere near backtesting/paper-eval code.
 *   - score.ts — pure functions turning a set of events into a bounded
 *     per-asset signal for the AI prompt/log.
 *
 * See README.md for the full design + the honest "unproven until Phase 4
 * measures it" caveat.
 */
import type { AssetRef } from "../chains/types";

export type { AssetRef };

/**
 * The taxonomy of catalyst events this system recognizes. "other" is the
 * catch-all for anything a source can't map cleanly onto the rest — it still
 * carries a headline/summary so it's visible even though it scores near-zero
 * (see score.ts KIND_DEFAULTS).
 */
export type CatalystKind =
  | "listing"
  | "delisting"
  | "exploit"
  | "governance"
  | "funding-spike"
  | "large-flow"
  | "partnership"
  | "depeg"
  | "other";

/**
 * Net directional lean an event carries. "mixed" means genuinely two-sided
 * (or simply unknown without reading the content) — score.ts treats "mixed"
 * as magnitude-only: it feeds confidence/attention but does not push the
 * score toward bullish or bearish.
 */
export type CatalystDirection = "positive" | "negative" | "mixed";

/**
 * One ingested catalyst event. Treat it as IMMUTABLE once created — a source
 * republishing an updated version of the same story is a NEW event with a new
 * `contentHash` (dedupe is by content, never by mutating a row in place).
 */
export interface CatalystEvent {
  /** Stable id: `${source}:${contentHash}`. */
  id: string;
  /** The CatalystSource.id that produced this event. */
  source: string;
  kind: CatalystKind;
  /** Assets this event concerns, as canonical AssetRef strings. An EMPTY
   *  array means market-wide (applies to every asset) — e.g. a broad
   *  regulatory headline with no single named token. */
  assets: AssetRef[];
  headline: string;
  url: string;
  /**
   * ISO timestamp the SOURCE attributes to the event (an RSS `<pubDate>`, a
   * vendor's `publishedAt`, an on-chain block timestamp). This — never
   * `ingestedAt` — is what feed.ts's `eventsAsOf` look-ahead gate compares
   * against a decision time. See the "LOOK-AHEAD-BIAS DISCIPLINE" section in
   * README.md: a consumer may only ever see events with
   * `publishedAt <= decisionTime`.
   */
  publishedAt: string;
  /** ISO timestamp this process first ingested the event. Audit-only — NEVER
   *  used for the as-of gate, since ingestion can lag true publication (a
   *  slow poll cadence, a backfilled source) and gating on it would be
   *  optimistic, not conservative. */
  ingestedAt: string;
  /** The source's own raw text/summary, unmodified. The AI prompt and the
   *  score rationale both quote from this — never invent detail beyond it. */
  rawSummary: string;
  /** SHA-256 (hex, truncated) of the normalized (source, kind, headline,
   *  assets, url[, externalId]) tuple — the dedupe key feed.ts uses to drop
   *  repeats of the same content across polls. */
  contentHash: string;

  /* --- derived scoring inputs (optional). score.ts falls back to a
   * kind-level default (KIND_DEFAULTS) when these are absent. Set them at
   * ingestion time ONLY when the source genuinely knows better than the kind
   * default — e.g. an exploit disclosure that states funds were fully
   * recovered (severity 0.2, not the kind default 0.9), or a large-flow
   * classifier that can tell an exchange inflow (negative) from an outflow
   * (positive). See score.ts's KIND_DEFAULTS comments for which kinds are
   * deliberately ambiguous without this. --- */
  /** Event magnitude, 0 (trivial) .. 1 (maximal impact). */
  severity?: number;
  /** Directional lean override for this specific event. */
  direction?: CatalystDirection;
}

/**
 * A pluggable event feed. One implementation per venue/vendor/mechanism; ALL
 * sources are inert until something calls `feed.ts`'s `registerSource` — a
 * source object existing in memory does nothing on its own.
 */
export interface CatalystSource {
  /** Stable id, used as `CatalystEvent.source` and in logs (e.g.
   *  "theblock-rss", "certik-exploits-json"). */
  id: string;
  /** Relative trust weight, 0..1 (feed.ts defaults to 0.7 when omitted) —
   *  scales how much this source's events move the per-asset score. */
  weight?: number;
  /**
   * Fetch events published at or after `sinceIso` (inclusive is fine; a
   * source may return some overlap before it — feed.ts's dedupe absorbs
   * that). Prefer returning `[]` and logging over throwing for a transient
   * fetch hiccup the next poll tick will simply retry; feed.ts's poller
   * isolates one source's failure from the others regardless.
   */
  fetch(sinceIso: string): Promise<CatalystEvent[]>;
}
