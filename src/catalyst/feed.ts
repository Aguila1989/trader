/**
 * Catalyst source registry + polling coordinator + the LOOK-AHEAD-BIAS gate.
 *
 * Design:
 *  - Sources are pluggable (`CatalystSource`, see types.ts) and ALL disabled
 *    until something calls `registerSource()` — constructing this module's
 *    singleton, or a `CatalystFeed` instance, does no I/O and starts no
 *    timers. Importing this file is a no-op.
 *  - A generic, config-driven RSS/JSON source (`createGenericFeedSource`)
 *    covers the common "poll an endpoint, map fields, keyword-classify" case
 *    WITHOUT hardcoding any vendor. Anything more bespoke (Atom, GraphQL, a
 *    chain indexer, an authenticated vendor SDK) is just a hand-written
 *    `CatalystSource` — the interface is the only contract.
 *  - `pollOnce()` dedupes by content hash into an in-memory ring buffer
 *    (bounded, oldest-evicted-first) and offers an `onIngest` hook for
 *    optional persistence — this module has NO database dependency of its
 *    own, by design (it is not in this agent's owned-files set, and a
 *    persistence layer shouldn't force every consumer of catalyst data
 *    through a DB round-trip anyway).
 *
 *  ────────────────────────────────────────────────────────────────────
 *  LOOK-AHEAD-BIAS DISCIPLINE — READ THIS BEFORE CALLING ANYTHING ELSE:
 *
 *  `eventsAsOf(decisionTimeIso, opts)` is the ONLY supported read path and is
 *  the look-ahead-bias gate: it NEVER returns an event whose `publishedAt` is
 *  after `decisionTimeIso`. There is deliberately no "give me the raw buffer"
 *  export.
 *
 *  Phase 4's paper evaluator (and anything else that backtests or replays
 *  against historical catalysts) MUST call
 *  `eventsAsOf(simulatedDecisionTime, ...)` using the SIMULATED point in time
 *  it is evaluating, and MUST NOT read events any other way. Scoring a paper
 *  trade with a catalyst that, in the real timeline, hadn't been published
 *  yet at that simulated moment silently invents an edge that will not exist
 *  live — this is exactly the mistake this file exists to make structurally
 *  hard to commit. See README.md.
 *  ────────────────────────────────────────────────────────────────────
 *
 *  - Polling itself is OPT-IN: `startCatalystPolling(intervalSeconds)` takes
 *    the interval as a PARAMETER — this module does not read `config`/env
 *    itself (kept decoupled from src/config.ts, a shared file this agent
 *    does not own) — and is a no-op at <= 0 seconds, mirroring
 *    src/trading/autopilot.ts's start/stop shape so the call site is
 *    familiar. Nothing here starts a timer at import time.
 */
import { createHash } from "node:crypto";
import type { AssetRef, CatalystEvent, CatalystKind, CatalystSource } from "./types";

export type { CatalystSource } from "./types";

const DEFAULT_SOURCE_WEIGHT = 0.7;
const DEFAULT_CAPACITY = 2000;
/** How far back a newly-registered source's FIRST poll looks; every poll
 *  after that uses the source's own advancing cursor. */
const DEFAULT_INITIAL_LOOKBACK_HOURS = 24;

export type CatalystLogger = (level: "info" | "warn" | "error", message: string) => void;
const noopLogger: CatalystLogger = () => {};

/**
 * Normalized (source, kind, headline, assets, url[, externalId]) -> a stable
 * short hex hash — the dedupe key. The headline is lowercased/trimmed so a
 * feed re-serving the same story with trivial formatting drift doesn't
 * double up; `externalId` (an RSS guid, a vendor's record id) further
 * disambiguates when a feed reuses similar headlines for distinct stories.
 */
export function contentHashOf(input: {
  source: string;
  kind: CatalystKind;
  headline: string;
  assets: AssetRef[];
  url: string;
  externalId?: string;
}): string {
  const normalized = [
    input.source,
    input.kind,
    input.headline.trim().toLowerCase(),
    [...input.assets].sort().join(","),
    input.url.trim().toLowerCase(),
    (input.externalId ?? "").trim().toLowerCase(),
  ].join("|");
  return createHash("sha256").update(normalized).digest("hex").slice(0, 24);
}

interface RegisteredSource {
  source: CatalystSource;
  weight: number;
  /** ISO cursor passed as `sinceIso` on the NEXT poll. */
  cursor: string;
}

export interface EventsAsOfOptions {
  /** Restrict to these assets (an event with an empty `assets` list is
   *  market-wide and always matches). Omitted = every asset. */
  assets?: AssetRef[];
  kinds?: CatalystKind[];
  /** Only events published at or after this ISO timestamp. */
  sinceIso?: string;
  /** Cap on returned events (applied after sorting most-recent-first). */
  limit?: number;
}

/**
 * Registry + in-memory ring buffer + the look-ahead-bias-safe read API.
 * Constructing an instance does no I/O — safe to instantiate at module scope
 * (see the `catalystFeed` singleton below).
 */
export class CatalystFeed {
  private sources = new Map<string, RegisteredSource>();
  private buffer: CatalystEvent[] = [];
  private seenHashes = new Set<string>();
  private readonly capacity: number;
  private readonly onIngest?: (events: CatalystEvent[]) => void | Promise<void>;
  private readonly logger: CatalystLogger;

  constructor(opts: {
    capacity?: number;
    onIngest?: (events: CatalystEvent[]) => void | Promise<void>;
    logger?: CatalystLogger;
  } = {}) {
    this.capacity = opts.capacity ?? DEFAULT_CAPACITY;
    this.onIngest = opts.onIngest;
    this.logger = opts.logger ?? noopLogger;
  }

  /** Register (or replace) a source. All sources are OFF until this is
   *  called — nothing here runs automatically at import time. */
  registerSource(source: CatalystSource, weight?: number): void {
    const w = weight ?? source.weight ?? DEFAULT_SOURCE_WEIGHT;
    this.sources.set(source.id, {
      source,
      weight: Math.min(1, Math.max(0, w)),
      cursor: new Date(Date.now() - DEFAULT_INITIAL_LOOKBACK_HOURS * 3_600_000).toISOString(),
    });
  }

  unregisterSource(id: string): void {
    this.sources.delete(id);
  }

  listSourceIds(): string[] {
    return Array.from(this.sources.keys());
  }

  /** The effective weight a registered source is polling under, or undefined
   *  if it isn't registered. Handy for threading into score.ts's
   *  `sourceWeights` without re-deriving the registry's own defaulting. */
  sourceWeight(id: string): number | undefined {
    return this.sources.get(id)?.weight;
  }

  /** Poll every registered source once. One source's failure is logged and
   *  skipped — it never aborts the others or throws out of this call. */
  async pollOnce(): Promise<{ fetched: number; ingested: number }> {
    const nowIso = new Date().toISOString();
    let fetched = 0;
    const newlyIngested: CatalystEvent[] = [];

    for (const [id, entry] of this.sources) {
      let events: CatalystEvent[];
      try {
        events = await entry.source.fetch(entry.cursor);
      } catch (err) {
        this.logger("warn", `Catalyst source "${id}" fetch failed: ${(err as Error).message}`);
        continue;
      }
      fetched += events.length;
      for (const event of events) {
        if (this.seenHashes.has(event.contentHash)) continue;
        this.seenHashes.add(event.contentHash);
        this.buffer.push(event);
        newlyIngested.push(event);
      }
      entry.cursor = nowIso;
    }

    if (newlyIngested.length > 0) {
      this.buffer.sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
      if (this.buffer.length > this.capacity) {
        const evicted = this.buffer.splice(0, this.buffer.length - this.capacity);
        for (const e of evicted) this.seenHashes.delete(e.contentHash);
      }
      this.logger(
        "info",
        `Catalyst feed: ${newlyIngested.length} new event(s) ingested (${fetched} fetched this tick, buffer holds ${this.buffer.length}).`,
      );
      if (this.onIngest) await this.onIngest(newlyIngested);
    }

    return { fetched, ingested: newlyIngested.length };
  }

  /**
   * THE LOOK-AHEAD-BIAS GATE. Returns admissible events — `publishedAt <=
   * decisionTimeIso` — most-recent-first, optionally narrowed by asset/kind/
   * lower bound. This is the ONLY read path other modules should use.
   */
  eventsAsOf(decisionTimeIso: string, opts: EventsAsOfOptions = {}): CatalystEvent[] {
    const decisionTime = Date.parse(decisionTimeIso);
    const since = opts.sinceIso ? Date.parse(opts.sinceIso) : -Infinity;
    const assetSet = opts.assets ? new Set(opts.assets) : null;
    const kindSet = opts.kinds ? new Set(opts.kinds) : null;

    const out = this.buffer.filter((e) => {
      const t = Date.parse(e.publishedAt);
      if (!Number.isFinite(t) || t > decisionTime || t < since) return false;
      if (kindSet && !kindSet.has(e.kind)) return false;
      if (assetSet && !(e.assets.length === 0 || e.assets.some((a) => assetSet.has(a)))) return false;
      return true;
    });
    out.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
    return opts.limit !== undefined ? out.slice(0, opts.limit) : out;
  }

  /** Current buffer size (post-dedupe, post-eviction). */
  size(): number {
    return this.buffer.length;
  }

  /** Test/reset helper: clears the buffer + dedupe set and rewinds every
   *  registered source's cursor. Sources stay registered. */
  clear(): void {
    this.buffer = [];
    this.seenHashes.clear();
    const rewound = new Date(Date.now() - DEFAULT_INITIAL_LOOKBACK_HOURS * 3_600_000).toISOString();
    for (const entry of this.sources.values()) entry.cursor = rewound;
  }
}

/** Module-singleton registry + buffer for the app's own wiring (server.ts).
 *  Constructing it is side-effect-free — importing this module never starts
 *  a timer or touches the network on its own. */
export const catalystFeed = new CatalystFeed();

/* ------------------------------------------------------------------ *
 * Poll loop — shaped like src/trading/autopilot.ts's start/stop so the
 * call site is familiar. The interval is a PARAMETER (the caller reads its
 * own flag-gated config value); 0/negative never starts anything.
 * ------------------------------------------------------------------ */

let timer: ReturnType<typeof setTimeout> | null = null;
let gen = 0;

/** Start polling `feed` (default the module singleton) every
 *  `intervalSeconds`. A re-call supersedes any previously-scheduled loop
 *  (bumps `gen`), so changing the interval live never leaves a zombie timer
 *  running alongside the new one. `intervalSeconds <= 0` stops/never starts —
 *  this is the opt-in gate; nothing polls until a caller passes a positive
 *  value it read from its own flag-gated config. */
export function startCatalystPolling(intervalSeconds: number, feed: CatalystFeed = catalystFeed): void {
  const myGen = ++gen;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!(intervalSeconds > 0)) return;

  const loop = (): void => {
    if (myGen !== gen) return; // a newer start (or stop) superseded us
    void feed.pollOnce().finally(() => {
      if (myGen === gen) timer = setTimeout(loop, Math.max(intervalSeconds, 30) * 1000);
    });
  };
  timer = setTimeout(loop, 3_000); // let boot settle before the first poll
}

/** Stop the loop (shutdown), or invalidate it ahead of a fresh
 *  `startCatalystPolling` call with a new interval. */
export function stopCatalystPolling(): void {
  gen++;
  if (timer) clearTimeout(timer);
  timer = null;
}

/* ------------------------------------------------------------------ *
 * Generic RSS / JSON source — config-driven, no vendor hardcoded.
 * ------------------------------------------------------------------ */

export interface GenericFeedMapping {
  /** JSON only: dot-path to the array of records within the parsed body
   *  (e.g. "data.items"). Omitted = the parsed body itself must be the
   *  array. */
  itemsPath?: string;
  /** JSON: dot-path within each record. RSS: XML tag name. Defaults cover
   *  vanilla RSS 2.0 (title/link/pubDate/description) and a generic JSON
   *  shape (headline/url/publishedAt/summary) — override per-feed as
   *  needed. */
  headlineField?: string;
  urlField?: string;
  publishedAtField?: string;
  summaryField?: string;
  /** Stable per-record id field (JSON) — folded into the dedupe hash.
   *  RSS always uses `<guid>` for this automatically. */
  idField?: string;
}

const RSS_DEFAULT_MAPPING: Required<
  Pick<GenericFeedMapping, "headlineField" | "urlField" | "publishedAtField" | "summaryField">
> = { headlineField: "title", urlField: "link", publishedAtField: "pubDate", summaryField: "description" };
const JSON_DEFAULT_MAPPING: Required<
  Pick<GenericFeedMapping, "headlineField" | "urlField" | "publishedAtField" | "summaryField">
> = { headlineField: "headline", urlField: "url", publishedAtField: "publishedAt", summaryField: "summary" };

export interface AssetKeywordRule {
  asset: AssetRef;
  /** Case-insensitive substrings matched against `headline + " " + summary`;
   *  any match tags this asset. An item may match several assets. */
  keywords: string[];
}

export interface KindKeywordRule {
  kind: CatalystKind;
  keywords: string[];
}

export interface GenericFeedSourceConfig {
  id: string;
  url: string;
  format: "rss" | "json";
  weight?: number;
  mapping?: GenericFeedMapping;
  /** Every matching rule tags its asset (first-match-per-rule, not
   *  first-rule-wins) — an item can legitimately concern several assets.
   *  Omitted/no match = market-wide (`assets: []`). */
  assetRules?: AssetKeywordRule[];
  /** FIRST matching rule wins the `kind`. No match = "other". */
  kindRules?: KindKeywordRule[];
  /** Injectable HTTP fetcher — REQUIRED for hermetic tests (pass a mock, not
   *  the real network). Defaults to the global `fetch`. */
  fetchImpl?: typeof fetch;
}

function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(block);
  return m?.[1] ? decodeEntities(m[1]) : "";
}

/**
 * Minimal, dependency-free RSS 2.0 `<item>` extractor (no XML parser
 * dependency is added for this). It is NOT a general XML parser — it does
 * not understand Atom `<entry>` feeds, namespaced tags, or deeply nested
 * CDATA. Anything beyond vanilla RSS 2.0 should be a hand-written
 * `CatalystSource` instead of forced through this generic path.
 */
export function parseRssItems(
  xml: string,
): Array<{ id: string; headline: string; url: string; publishedAt: string; summary: string }> {
  const items = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ?? [];
  return items.map((block) => {
    const headline = extractTag(block, "title");
    const url = extractTag(block, "link");
    const publishedAt = extractTag(block, "pubDate");
    const summary = extractTag(block, "description");
    const guid = extractTag(block, "guid");
    return { id: guid || url || headline, headline, url, publishedAt, summary };
  });
}

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/** Normalize any parseable date value (RFC-822 string, ISO string, epoch ms)
 *  to ISO; falls back to `fallbackIso` (the ingestion moment) when
 *  unparseable, so a malformed date can never silently drop the event — it
 *  only loses recency-decay accuracy for that one item. */
function toIso(raw: unknown, fallbackIso: string): string {
  if (typeof raw === "number") {
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d.toISOString() : fallbackIso;
  }
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  return fallbackIso;
}

function classify(
  headline: string,
  summary: string,
  assetRules: AssetKeywordRule[] | undefined,
  kindRules: KindKeywordRule[] | undefined,
): { kind: CatalystKind; assets: AssetRef[] } {
  const haystack = `${headline} ${summary}`.toLowerCase();
  const assets = (assetRules ?? [])
    .filter((r) => r.keywords.some((k) => haystack.includes(k.toLowerCase())))
    .map((r) => r.asset);
  const kind = (kindRules ?? []).find((r) => r.keywords.some((k) => haystack.includes(k.toLowerCase())))?.kind ?? "other";
  return { kind, assets: Array.from(new Set(assets)) };
}

/**
 * A config-driven CatalystSource polling one RSS or JSON endpoint. No vendor
 * is hardcoded — point it at any feed via `url` + `mapping`, and classify
 * assets/kind via keyword rules (or omit them for a market-wide, kind:"other"
 * feed you'll classify some other way downstream).
 */
export function createGenericFeedSource(cfg: GenericFeedSourceConfig): CatalystSource {
  const defaults = cfg.format === "rss" ? RSS_DEFAULT_MAPPING : JSON_DEFAULT_MAPPING;
  const mapping = { ...defaults, ...cfg.mapping };
  const fetchImpl = cfg.fetchImpl ?? fetch;

  return {
    id: cfg.id,
    weight: cfg.weight,
    async fetch(sinceIso: string): Promise<CatalystEvent[]> {
      const res = await fetchImpl(cfg.url);
      if (!res.ok) throw new Error(`${cfg.id}: HTTP ${res.status} fetching ${cfg.url}`);
      const nowIso = new Date().toISOString();

      let raw: Array<{ id: string; headline: string; url: string; publishedAt: string; summary: string }>;
      if (cfg.format === "rss") {
        raw = parseRssItems(await res.text()).map((item) => ({ ...item, publishedAt: toIso(item.publishedAt, nowIso) }));
      } else {
        const body: unknown = await res.json();
        const list = mapping.itemsPath ? getPath(body, mapping.itemsPath) : body;
        const records = Array.isArray(list) ? list : [];
        raw = records.map((rec) => {
          const headline = String(getPath(rec, mapping.headlineField) ?? "");
          const url = String(getPath(rec, mapping.urlField) ?? "");
          const publishedAt = toIso(getPath(rec, mapping.publishedAtField), nowIso);
          const summary = String(getPath(rec, mapping.summaryField) ?? "");
          const id = mapping.idField ? String(getPath(rec, mapping.idField) ?? "") : "";
          return { id: id || url || headline, headline, url, publishedAt, summary };
        });
      }

      const since = Date.parse(sinceIso);
      const out: CatalystEvent[] = [];
      for (const item of raw) {
        if (!item.headline) continue;
        const t = Date.parse(item.publishedAt);
        if (Number.isFinite(since) && Number.isFinite(t) && t < since) continue;
        const { kind, assets } = classify(item.headline, item.summary, cfg.assetRules, cfg.kindRules);
        const contentHash = contentHashOf({
          source: cfg.id,
          kind,
          headline: item.headline,
          assets,
          url: item.url,
          externalId: item.id,
        });
        out.push({
          id: `${cfg.id}:${contentHash}`,
          source: cfg.id,
          kind,
          assets,
          headline: item.headline,
          url: item.url,
          publishedAt: item.publishedAt,
          ingestedAt: nowIso,
          rawSummary: item.summary,
          contentHash,
        });
      }
      return out;
    },
  };
}
