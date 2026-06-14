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
