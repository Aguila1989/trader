# Catalyst ingestion + reaction scoring (Phase 3.2)

Numeric technical indicators (`src/stellar/indicators.ts`) cannot read a
governance post, an exploit disclosure, or a listing announcement. This
module gives the AI (and, later, a dedicated `news-reaction` strategy arm) a
structured read on qualitative catalysts, so it can react to what a chart
alone can't show.

**Status: unproven.** This is a heuristic reaction model — a starting
judgement call about which kinds of news matter and how much, not a
calibrated result. Whether reacting to catalysts this way adds any edge over
the deterministic rulebook is exactly what Phase 4's paper evaluator exists to
measure. Until that measurement exists, every score and confidence produced
here is a hypothesis for the AI to weigh alongside everything else — not a
fact, and not (yet) a green light to size up on.

## The three files

- **`types.ts`** — `CatalystEvent` (one ingested item) and `CatalystSource`
  (the pluggable fetch contract). Read this first.
- **`feed.ts`** — the source registry, the polling coordinator
  (`startCatalystPolling` / `stopCatalystPolling`, shaped like
  `src/trading/autopilot.ts`), a generic config-driven RSS/JSON source
  (`createGenericFeedSource`), and — most importantly — `eventsAsOf`, the
  look-ahead-bias gate.
- **`score.ts`** — pure functions turning a set of `CatalystEvent`s into a
  bounded per-asset signal: `scoreAsset` / `scoreAllAssets`.

Nothing in this module does I/O or starts a timer at import time. A source
sitting in memory, unregistered, does nothing; `catalystFeed` (the module
singleton registry+buffer) is safe to import anywhere. Polling only starts
when a caller (server.ts) explicitly calls `startCatalystPolling(n)` with
`n > 0` — the flag-gated, off-by-default opt-in the rest of this codebase
uses for every background loop.

## LOOK-AHEAD-BIAS DISCIPLINE — the one rule that matters most

Every `CatalystEvent` carries `publishedAt` (what the SOURCE claims, e.g. an
RSS `<pubDate>`) and `ingestedAt` (when THIS process first saw it, audit-only).
A consumer may only ever see events with `publishedAt <= decisionTime`.

`feed.ts`'s `CatalystFeed.eventsAsOf(decisionTimeIso, opts)` is the **only**
supported read path, and it enforces exactly that filter. There is
deliberately no "give me the raw buffer" export.

Why this matters more than it looks like it does: a paper/backtest evaluator
(Phase 4) replays historical decisions at a *simulated* point in time. If it
could see a catalyst that, on the real calendar, hadn't been published yet at
that simulated moment, it would score trades using information the live
system never actually had — silently inventing an edge that evaporates the
moment the strategy runs for real. This is a classic, easy-to-miss backtesting
bug, and it's the reason `eventsAsOf` exists as a hard gate rather than a
convention callers are trusted to follow:

```ts
// CORRECT — Phase 4 (or any replay) passes its SIMULATED decision time:
const events = catalystFeed.eventsAsOf(ctx.decisionTime, { assets: [ctx.market.base] });
const signal = scoreAsset(events, ctx.market.base, ctx.decisionTime);

// WRONG — never do this in a backtest/paper context:
const events = catalystFeed.eventsAsOf(new Date().toISOString()); // leaks the wall clock
```

`score.ts` also defensively re-checks `publishedAt <= asOfIso` in its own
decay math (`decayWeight` returns 0 for a "future" event) — belt-and-suspenders
in case a caller ever hands it unfiltered events by mistake — but that is a
backstop, not a substitute for calling `eventsAsOf` correctly in the first
place.

## Adding a source

Two ways, depending on how much the vendor deviates from "poll a URL, map some
fields":

### 1. The generic config-driven source (no vendor hardcoded)

```ts
import { createGenericFeedSource, catalystFeed } from "./feed";

const theBlockRss = createGenericFeedSource({
  id: "theblock-rss",
  url: "https://www.theblock.co/rss.xml",
  format: "rss",
  weight: 0.8, // this source's relative trust, 0..1
  assetRules: [
    { asset: "XLM", keywords: ["stellar", "xlm"] },
    { asset: "USDC:GA5Z...", keywords: ["usdc", "circle"] },
  ],
  kindRules: [
    { kind: "exploit", keywords: ["exploit", "hack", "drained"] },
    { kind: "listing", keywords: ["lists", "listing"] },
  ],
});

catalystFeed.registerSource(theBlockRss);
```

`format: "json"` works the same way against a JSON API, with `mapping` giving
dot-paths into each record (`itemsPath`, `headlineField`, `urlField`,
`publishedAtField`, `summaryField`, `idField`) instead of RSS tag names. The
RSS parser is a small, dependency-free regex-based extractor for vanilla
RSS 2.0 `<item>` blocks — it does not understand Atom `<entry>` feeds or
namespaced/nested XML; anything beyond that belongs in a hand-written source
(below).

`assetRules`/`kindRules` are plain keyword substring matches — deliberately
simple. A feed whose classification needs more than "does this string appear"
(NLP, an LLM call, a vendor's own taxonomy) should classify upstream of this
module or be a hand-written source that returns already-classified events.

### 2. A hand-written `CatalystSource`

Implement the interface directly for anything bespoke — Atom feeds, GraphQL,
a chain indexer watching a specific contract, an authenticated vendor SDK:

```ts
import type { CatalystSource, CatalystEvent } from "./types";
import { contentHashOf } from "./feed";

export const myExploitFeed: CatalystSource = {
  id: "my-exploit-feed",
  weight: 0.9,
  async fetch(sinceIso) {
    const rows = await myVendorClient.listDisclosures({ since: sinceIso });
    return rows.map((r): CatalystEvent => {
      const kind = "exploit" as const;
      const assets = [r.affectedAsset];
      const contentHash = contentHashOf({ source: "my-exploit-feed", kind, headline: r.title, assets, url: r.url });
      return {
        id: `my-exploit-feed:${contentHash}`,
        source: "my-exploit-feed",
        kind,
        assets,
        headline: r.title,
        url: r.url,
        publishedAt: r.disclosedAt,
        ingestedAt: new Date().toISOString(),
        rawSummary: r.summary,
        contentHash,
        severity: r.fundsRecovered ? 0.3 : 0.9, // the source KNOWS better than the kind default here
      };
    });
  },
};
```

Setting `severity`/`direction` on the event itself (rather than relying on
`score.ts`'s kind-level default) is exactly for cases like this — a source
with real information should use it.

## Scoring

```ts
import { catalystFeed } from "./feed";
import { scoreAsset } from "./score";

const decisionTime = new Date().toISOString(); // or ctx.decisionTime in a backtest
const events = catalystFeed.eventsAsOf(decisionTime, { assets: ["XLM"] });
const signal = scoreAsset(events, "XLM", decisionTime, {
  sourceWeights: Object.fromEntries(catalystFeed.listSourceIds().map((id) => [id, catalystFeed.sourceWeight(id) ?? 0.7])),
});

// signal.score       -1..1   (bearish .. bullish)
// signal.confidence   0..1   (how much recent, weighted evidence backs it — NOT accuracy)
// signal.rationale    plain-English, ready to paste into the AI prompt / AI log
```

Design of the aggregate (see `score.ts` for the exact math):

- **Recency decay** — exponential half-life (default 24h): a catalyst is at
  half its initial pull one day later.
- **Source weight** — each registered source has a trust weight (0..1,
  default 0.7); a single low-trust source moves the needle less than a
  corroborating high-trust one.
- **Kind severity/direction** — `KIND_DEFAULTS` in `score.ts` gives every
  `CatalystKind` a starting magnitude and directional lean. `exploit` is
  strongly negative; `listing`/`partnership` are positive. **Several kinds are
  deliberately ambiguous and default to `"mixed"` (magnitude-only, no
  directional pull)**: `governance` (depends what passed), `funding-spike`
  (crowded-positioning caution vs. a funding round — can't tell from the kind
  alone), `large-flow` (an inflow vs. outflow to an exchange read oppositely),
  and `depeg` (a mean-reversion trade needs to know which side of the peg —
  itself a trading opinion, not a fact). A source that CAN disambiguate these
  should set the event's own `severity`/`direction` rather than relying on the
  default — see `score.ts`'s per-kind comments for the exact reasoning, and
  treat every one of those defaults as an unverified assumption, not a tuned
  constant.
- **Aggregation** — a weighted average of each event's signed contribution,
  bounded to `[-1, 1]`; `"mixed"`-direction events dilute toward neutral
  (they add to the confidence denominator without pushing the sign either
  way), which is the intended behavior for genuine uncertainty.
- **Confidence** — saturates with total evidence weight rather than growing
  unbounded (`totalWeight / (totalWeight + 1)`): one full-strength, fully
  current, fully-trusted event alone reaches 0.5; three such events reach
  0.75. A thin, stale, or low-trust event set stays low, as it should.

## Known limitations / honest gaps

- The generic RSS parser handles vanilla RSS 2.0 only (no Atom, no
  namespaced tags).
- Keyword-based `assetRules`/`kindRules` classification is a blunt instrument
  — false positives/negatives are expected on ambiguous headlines. It's a
  starting point, not a claim of accurate classification.
- `KIND_DEFAULTS` severities/directions are unvalidated judgement calls (see
  above) — several kinds are structurally ambiguous and default to
  `"mixed"` on purpose.
- `confidence` measures *evidence quantity/recency/trust*, not predictive
  accuracy. A high-confidence score can still be wrong; Phase 4's paper
  evaluator is what will eventually tell us whether it's wrong *more or less
  often than chance*.
- Persistence is opt-in via `CatalystFeed`'s `onIngest` hook (constructor
  option) — this module has no database dependency of its own. Without a
  host wiring that hook to storage, the ring buffer (default capacity 2000
  events) is the only history that exists, and it resets on process restart.
