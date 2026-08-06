import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  CatalystFeed,
  contentHashOf,
  createGenericFeedSource,
  parseRssItems,
  startCatalystPolling,
  stopCatalystPolling,
} from "./feed";
import type { CatalystEvent, CatalystSource } from "./types";

/**
 * Hermetic tests for the catalyst registry/poller. Every source is a mock —
 * nothing here makes a real network call. `fetchImpl` is always injected for
 * the generic RSS/JSON source, per the task's "no network calls in tests"
 * requirement.
 */

const T0 = "2026-08-01T12:00:00.000Z";

function mkEvent(overrides: Partial<CatalystEvent> = {}): CatalystEvent {
  return {
    id: "src:h1",
    source: "test-source",
    kind: "listing",
    assets: ["XLM"],
    headline: "Headline",
    url: "https://example.com/a",
    publishedAt: T0,
    ingestedAt: T0,
    rawSummary: "Summary",
    contentHash: "h1",
    ...overrides,
  };
}

function mkSource(id: string, events: CatalystEvent[], impl?: (sinceIso: string) => Promise<CatalystEvent[]>): CatalystSource {
  return { id, fetch: impl ?? (async () => events) };
}

describe("contentHashOf", () => {
  it("is deterministic for identical input", () => {
    const input = { source: "s", kind: "listing" as const, headline: "Hi", assets: ["XLM"], url: "https://x" };
    expect(contentHashOf(input)).toBe(contentHashOf(input));
  });

  it("differs when the headline differs", () => {
    const base = { source: "s", kind: "listing" as const, assets: ["XLM"], url: "https://x" };
    expect(contentHashOf({ ...base, headline: "A" })).not.toBe(contentHashOf({ ...base, headline: "B" }));
  });

  it("is case/whitespace-insensitive on the headline", () => {
    const base = { source: "s", kind: "listing" as const, assets: ["XLM"], url: "https://x" };
    expect(contentHashOf({ ...base, headline: "Hello World" })).toBe(contentHashOf({ ...base, headline: "  hello world  " }));
  });

  it("is order-insensitive on the assets list", () => {
    const base = { source: "s", kind: "listing" as const, headline: "H", url: "https://x" };
    expect(contentHashOf({ ...base, assets: ["XLM", "USDC"] })).toBe(contentHashOf({ ...base, assets: ["USDC", "XLM"] }));
  });

  it("differs when externalId differs (disambiguates similar headlines)", () => {
    const base = { source: "s", kind: "listing" as const, headline: "H", assets: ["XLM"], url: "https://x" };
    expect(contentHashOf({ ...base, externalId: "guid-1" })).not.toBe(contentHashOf({ ...base, externalId: "guid-2" }));
  });
});

describe("CatalystFeed registration + pollOnce", () => {
  let feed: CatalystFeed;

  beforeEach(() => {
    feed = new CatalystFeed();
  });

  it("starts empty and with no sources registered (import/construction is side-effect-free)", () => {
    expect(feed.size()).toBe(0);
    expect(feed.listSourceIds()).toEqual([]);
  });

  it("ingests events from a registered source", async () => {
    feed.registerSource(mkSource("a", [mkEvent({ contentHash: "h1", id: "a:h1" })]));
    const out = await feed.pollOnce();
    expect(out).toEqual({ fetched: 1, ingested: 1 });
    expect(feed.size()).toBe(1);
  });

  it("dedupes repeats of the same content hash across polls", async () => {
    feed.registerSource(mkSource("a", [mkEvent({ contentHash: "h1", id: "a:h1" })]));
    await feed.pollOnce();
    const second = await feed.pollOnce(); // same source, same fixed event again
    expect(second.ingested).toBe(0);
    expect(feed.size()).toBe(1);
  });

  it("isolates one source's failure from the others", async () => {
    const logger = vi.fn();
    feed = new CatalystFeed({ logger });
    feed.registerSource(mkSource("bad", [], async () => {
      throw new Error("boom");
    }));
    feed.registerSource(mkSource("good", [mkEvent({ source: "good", contentHash: "gh1", id: "good:gh1" })]));
    const out = await feed.pollOnce();
    expect(out.ingested).toBe(1);
    expect(logger).toHaveBeenCalledWith("warn", expect.stringContaining("bad"));
  });

  it("calls onIngest with only the newly-ingested batch", async () => {
    const onIngest = vi.fn();
    feed = new CatalystFeed({ onIngest });
    feed.registerSource(mkSource("a", [mkEvent({ contentHash: "h1", id: "a:h1" })]));
    await feed.pollOnce();
    expect(onIngest).toHaveBeenCalledTimes(1);
    expect(onIngest.mock.calls[0]?.[0]).toHaveLength(1);
    await feed.pollOnce(); // no new events this time
    expect(onIngest).toHaveBeenCalledTimes(1); // not called again
  });

  it("registers a source's declared weight, clamped to [0,1]", () => {
    feed.registerSource(mkSource("a", []), 2); // explicit weight overrides the source's own
    expect(feed.sourceWeight("a")).toBe(1);
    feed.registerSource({ id: "b", weight: -1, fetch: async () => [] });
    expect(feed.sourceWeight("b")).toBe(0);
  });

  it("evicts the oldest events once capacity is exceeded", async () => {
    feed = new CatalystFeed({ capacity: 2 });
    const events = [0, 1, 2].map((i) =>
      mkEvent({
        contentHash: `h${i}`,
        id: `a:h${i}`,
        publishedAt: new Date(Date.parse(T0) + i * 3_600_000).toISOString(),
      }),
    );
    feed.registerSource(mkSource("a", events));
    await feed.pollOnce();
    expect(feed.size()).toBe(2);
    // the oldest (h0) should have been evicted, not the newest
    const remaining = feed.eventsAsOf(new Date(Date.parse(T0) + 100 * 3_600_000).toISOString());
    expect(remaining.map((e) => e.contentHash).sort()).toEqual(["h1", "h2"]);
  });
});

describe("CatalystFeed.eventsAsOf — the look-ahead-bias gate", () => {
  let feed: CatalystFeed;

  beforeEach(async () => {
    feed = new CatalystFeed();
    feed.registerSource(
      mkSource("a", [
        mkEvent({ contentHash: "past", id: "a:past", publishedAt: "2026-08-01T00:00:00.000Z", assets: ["XLM"] }),
        mkEvent({ contentHash: "future", id: "a:future", publishedAt: "2026-08-03T00:00:00.000Z", assets: ["XLM"] }),
        mkEvent({
          contentHash: "usdc",
          id: "a:usdc",
          kind: "exploit",
          publishedAt: "2026-08-01T06:00:00.000Z",
          assets: ["USDC:GISSUER"],
        }),
      ]),
    );
    await feed.pollOnce();
  });

  it("NEVER returns an event published after the decision time", () => {
    const out = feed.eventsAsOf("2026-08-02T00:00:00.000Z");
    expect(out.some((e) => e.contentHash === "future")).toBe(false);
    expect(out.some((e) => e.contentHash === "past")).toBe(true);
  });

  it("returns nothing when decisionTime precedes every event", () => {
    const out = feed.eventsAsOf("2026-07-01T00:00:00.000Z");
    expect(out).toEqual([]);
  });

  it("filters by asset", () => {
    const out = feed.eventsAsOf("2026-08-02T00:00:00.000Z", { assets: ["USDC:GISSUER"] });
    expect(out.map((e) => e.contentHash)).toEqual(["usdc"]);
  });

  it("filters by kind", () => {
    const out = feed.eventsAsOf("2026-08-02T00:00:00.000Z", { kinds: ["exploit"] });
    expect(out.map((e) => e.contentHash)).toEqual(["usdc"]);
  });

  it("respects sinceIso as a lower bound", () => {
    const out = feed.eventsAsOf("2026-08-02T00:00:00.000Z", { sinceIso: "2026-08-01T03:00:00.000Z" });
    expect(out.map((e) => e.contentHash)).toEqual(["usdc"]);
  });

  it("sorts most-recent-first and honors limit", () => {
    const out = feed.eventsAsOf("2026-08-02T00:00:00.000Z", { limit: 1 });
    expect(out).toHaveLength(1);
    expect(out[0]?.contentHash).toBe("usdc"); // 06:00 is later than 00:00
  });
});

describe("startCatalystPolling / stopCatalystPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopCatalystPolling(); // never leave a timer running past the test
    vi.useRealTimers();
  });

  it("never schedules anything when intervalSeconds <= 0 (opt-in gate)", async () => {
    const feed = new CatalystFeed();
    const spy = vi.spyOn(feed, "pollOnce").mockResolvedValue({ fetched: 0, ingested: 0 });
    startCatalystPolling(0, feed);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(spy).not.toHaveBeenCalled();
  });

  it("polls after the initial settle delay, then on the given cadence", async () => {
    const feed = new CatalystFeed();
    const spy = vi.spyOn(feed, "pollOnce").mockResolvedValue({ fetched: 0, ingested: 0 });
    startCatalystPolling(60, feed);
    expect(spy).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(3_000);
    expect(spy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("floors a too-short interval at 30s", async () => {
    const feed = new CatalystFeed();
    const spy = vi.spyOn(feed, "pollOnce").mockResolvedValue({ fetched: 0, ingested: 0 });
    startCatalystPolling(1, feed);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(spy).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(29_000);
    expect(spy).toHaveBeenCalledTimes(1); // not yet at the 30s floor
    await vi.advanceTimersByTimeAsync(1_000);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("stopCatalystPolling cancels the pending timer", async () => {
    const feed = new CatalystFeed();
    const spy = vi.spyOn(feed, "pollOnce").mockResolvedValue({ fetched: 0, ingested: 0 });
    startCatalystPolling(60, feed);
    stopCatalystPolling();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(spy).not.toHaveBeenCalled();
  });

  it("a re-start supersedes the previous loop (no zombie timer)", async () => {
    const feed = new CatalystFeed();
    const spy = vi.spyOn(feed, "pollOnce").mockResolvedValue({ fetched: 0, ingested: 0 });
    startCatalystPolling(60, feed);
    startCatalystPolling(60, feed); // re-start before the first tick fires
    await vi.advanceTimersByTimeAsync(3_000);
    expect(spy).toHaveBeenCalledTimes(1); // not double-fired
  });
});

describe("parseRssItems", () => {
  it("extracts title/link/pubDate/description/guid from a vanilla RSS 2.0 item", () => {
    const xml = `
      <rss><channel>
        <item>
          <title>Big Exchange Lists Token</title>
          <link>https://news.example.com/1</link>
          <pubDate>Sat, 01 Aug 2026 12:00:00 GMT</pubDate>
          <description>Full story text.</description>
          <guid>guid-123</guid>
        </item>
      </channel></rss>`;
    const items = parseRssItems(xml);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "guid-123",
      headline: "Big Exchange Lists Token",
      url: "https://news.example.com/1",
      summary: "Full story text.",
    });
  });

  it("unwraps CDATA and decodes basic entities", () => {
    const xml = `<item><title><![CDATA[A &amp; B]]></title><link>https://x</link><pubDate>2026-08-01</pubDate><description>d</description></item>`;
    const items = parseRssItems(xml);
    expect(items[0]?.headline).toBe("A & B");
  });

  it("returns [] for a feed with no <item> blocks", () => {
    expect(parseRssItems("<rss><channel></channel></rss>")).toEqual([]);
  });
});

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, text: async () => JSON.stringify(body), json: async () => body } as Response;
}
function textResponse(body: string, ok = true, status = 200) {
  return { ok, status, text: async () => body, json: async () => JSON.parse(body) } as Response;
}

describe("createGenericFeedSource — RSS", () => {
  it("parses items, classifies kind/assets via keyword rules, and gates on sinceIso", async () => {
    const xml = `
      <item><title>Certik discloses exploit on Foo protocol</title><link>https://x/1</link><pubDate>2026-08-01T10:00:00.000Z</pubDate><description>d1</description><guid>g1</guid></item>
      <item><title>Nothing notable happens</title><link>https://x/2</link><pubDate>2026-07-01T10:00:00.000Z</pubDate><description>d2</description><guid>g2</guid></item>
    `;
    const fetchImpl = vi.fn(async () => textResponse(xml));
    const source = createGenericFeedSource({
      id: "rss-a",
      url: "https://example.com/feed.xml",
      format: "rss",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      assetRules: [{ asset: "FOO:GISSUER", keywords: ["foo protocol"] }],
      kindRules: [{ kind: "exploit", keywords: ["exploit"] }],
    });
    const out = await source.fetch("2026-07-15T00:00:00.000Z"); // excludes the July item
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ source: "rss-a", kind: "exploit", assets: ["FOO:GISSUER"] });
    expect(out[0]?.id).toMatch(/^rss-a:/);
    expect(fetchImpl).toHaveBeenCalledWith("https://example.com/feed.xml");
  });

  it("defaults unclassified items to kind 'other' and market-wide assets", async () => {
    const xml = `<item><title>Generic headline</title><link>https://x/3</link><pubDate>2026-08-01T10:00:00.000Z</pubDate><description>d</description></item>`;
    const source = createGenericFeedSource({
      id: "rss-b",
      url: "https://example.com/feed.xml",
      format: "rss",
      fetchImpl: (async () => textResponse(xml)) as unknown as typeof fetch,
    });
    const out = await source.fetch("2026-01-01T00:00:00.000Z");
    expect(out[0]).toMatchObject({ kind: "other", assets: [] });
  });

  it("throws with a descriptive message on a non-OK HTTP response", async () => {
    const source = createGenericFeedSource({
      id: "rss-c",
      url: "https://example.com/feed.xml",
      format: "rss",
      fetchImpl: (async () => textResponse("", false, 503)) as unknown as typeof fetch,
    });
    await expect(source.fetch("2026-01-01T00:00:00.000Z")).rejects.toThrow(/503/);
  });
});

describe("createGenericFeedSource — JSON", () => {
  it("maps records via itemsPath + field mapping, including epoch-ms dates", async () => {
    const body = {
      data: {
        items: [
          {
            id: "rec-1",
            hl: "Partnership announced between A and B",
            link: "https://x/4",
            ts: Date.parse("2026-08-01T09:00:00.000Z"),
            body: "summary text",
          },
        ],
      },
    };
    const source = createGenericFeedSource({
      id: "json-a",
      url: "https://example.com/api",
      format: "json",
      fetchImpl: (async () => jsonResponse(body)) as unknown as typeof fetch,
      mapping: {
        itemsPath: "data.items",
        idField: "id",
        headlineField: "hl",
        urlField: "link",
        publishedAtField: "ts",
        summaryField: "body",
      },
      kindRules: [{ kind: "partnership", keywords: ["partnership"] }],
    });
    const out = await source.fetch("2026-01-01T00:00:00.000Z");
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ kind: "partnership", headline: "Partnership announced between A and B" });
    expect(out[0]?.publishedAt).toBe("2026-08-01T09:00:00.000Z");
  });

  it("skips items with no headline", async () => {
    const body = [{ headline: "", url: "https://x", publishedAt: "2026-08-01T00:00:00.000Z", summary: "s" }];
    const source = createGenericFeedSource({
      id: "json-b",
      url: "https://example.com/api",
      format: "json",
      fetchImpl: (async () => jsonResponse(body)) as unknown as typeof fetch,
    });
    expect(await source.fetch("2026-01-01T00:00:00.000Z")).toEqual([]);
  });

  it("produces the SAME contentHash across two fetches of identical content (dedupe-friendly)", async () => {
    const body = [{ headline: "Same story", url: "https://x/5", publishedAt: "2026-08-01T00:00:00.000Z", summary: "s" }];
    const source = createGenericFeedSource({
      id: "json-c",
      url: "https://example.com/api",
      format: "json",
      fetchImpl: (async () => jsonResponse(body)) as unknown as typeof fetch,
    });
    const first = await source.fetch("2026-01-01T00:00:00.000Z");
    const second = await source.fetch("2026-01-01T00:00:00.000Z");
    expect(first[0]?.contentHash).toBe(second[0]?.contentHash);
  });
});
