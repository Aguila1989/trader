import { describe, it, expect, beforeEach } from "vitest";
import { isReadOnly } from "../config";
import { store } from "./store";

/**
 * Access-mode semantics for paper trading. These are pure in-memory flag
 * transitions (no Horizon, no DB), so they run deterministically anywhere.
 */
describe("store paper/live access modes", () => {
  beforeEach(() => {
    // Reset to the boot default (both off) before each case.
    store.setPaperTrading(false);
    store.setLiveTrading(false);
  });

  it("defaults to neither armed (read-only)", () => {
    expect(store.paperTrading).toBe(false);
    expect(store.liveTrading).toBe(false);
    expect(store.armed).toBe(false);
  });

  it("arming paper sets armed and needs no signing key", () => {
    expect(store.setPaperTrading(true)).toBe(true);
    expect(store.paperTrading).toBe(true);
    expect(store.armed).toBe(true);
  });

  it("disarming paper clears armed", () => {
    store.setPaperTrading(true);
    store.setPaperTrading(false);
    expect(store.paperTrading).toBe(false);
    expect(store.armed).toBe(false);
  });

  it("arming live turns paper OFF (mutually exclusive)", () => {
    store.setPaperTrading(true);
    // setLiveTrading only succeeds when a signing key is configured; when it
    // does succeed, paper must be forced off.
    const live = store.setLiveTrading(true);
    if (live) {
      expect(store.paperTrading).toBe(false);
      expect(store.liveTrading).toBe(true);
    } else {
      // No key in this environment: live refused, paper untouched.
      expect(isReadOnly).toBe(true);
      expect(store.paperTrading).toBe(true);
    }
  });

  it("the snapshot exposes paperTrading", () => {
    store.setPaperTrading(true);
    expect(store.snapshot().paperTrading).toBe(true);
  });
});

/**
 * In-memory log paging/filtering. No DB is configured in the test env, so
 * getLogsPage falls through to the in-memory branch (filter + slice over
 * store.logs, which is newest-first). We seed entries via store.log() with
 * controlled timestamps so the since-cutoff is deterministic.
 */
describe("store.getLogsPage (in-memory)", () => {
  const TS_OLD = "2026-06-18T00:00:00.000Z";
  const TS_MID = "2026-06-18T12:00:00.000Z";
  const TS_NEW = "2026-06-18T18:00:00.000Z";

  beforeEach(() => {
    // store is a singleton; clear out any logs left by earlier suites so totals
    // and slices are exact for this block.
    (store as unknown as { logs: unknown[] }).logs = [];
    // Seeded via the public log() API. ts is normally Date.now()-stamped, so we
    // override each entry's ts afterwards to make the since-cutoff deterministic.
    const logs = (store as unknown as { logs: { ts: string }[] }).logs;
    store.log("info", "alpha start");
    store.log("error", "Beta FAILURE occurred");
    store.log("trade", "gamma filled");
    // store.logs is newest-first: index 0 = gamma, 1 = beta, 2 = alpha.
    logs[2].ts = TS_OLD; // alpha
    logs[1].ts = TS_MID; // beta
    logs[0].ts = TS_NEW; // gamma
  });

  it("returns all seeded entries newest-first with no filters", async () => {
    const page = await store.getLogsPage({ limit: 50, offset: 0 });
    expect(page.total).toBe(3);
    expect(page.rows.map((r) => r.message)).toEqual([
      "gamma filled",
      "Beta FAILURE occurred",
      "alpha start",
    ]);
  });

  it("applies an exact level filter", async () => {
    const page = await store.getLogsPage({ limit: 50, offset: 0, level: "error" });
    expect(page.total).toBe(1);
    expect(page.rows[0]?.message).toBe("Beta FAILURE occurred");
  });

  it("matches q case-insensitively on the message", async () => {
    const page = await store.getLogsPage({ limit: 50, offset: 0, q: "failure" });
    expect(page.total).toBe(1);
    expect(page.rows[0]?.message).toBe("Beta FAILURE occurred");
  });

  it("applies the since cutoff (>= comparison, keeps newer)", async () => {
    const page = await store.getLogsPage({ limit: 50, offset: 0, since: TS_MID });
    // beta (== cutoff) and gamma (after) survive; alpha (before) is dropped.
    expect(page.total).toBe(2);
    expect(page.rows.map((r) => r.message)).toEqual([
      "gamma filled",
      "Beta FAILURE occurred",
    ]);
  });

  it("slices by offset/limit while reporting the full total", async () => {
    const page = await store.getLogsPage({ limit: 1, offset: 1 });
    expect(page.total).toBe(3);
    expect(page.limit).toBe(1);
    expect(page.offset).toBe(1);
    expect(page.rows.map((r) => r.message)).toEqual(["Beta FAILURE occurred"]);
  });
});
