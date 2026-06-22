import { describe, it, expect, beforeEach } from "vitest";
import {
  StopLossService,
  StopLossError,
  type StopLossStore,
} from "./stopLossService";
import type { PositionSummary, StopLoss, StopLossAuditRow } from "../types";

/** In-memory stub of the store surface (no DB, no SSE). */
class StubStore implements StopLossStore {
  killSwitch = false;
  positions: PositionSummary[] = [];
  stops: StopLoss[] = [];
  audits: StopLossAuditRow[] = [];
  logs: string[] = [];

  getPositions(): PositionSummary[] {
    return this.positions;
  }
  getActiveStopLosses(base?: string, quote?: string): StopLoss[] {
    return this.stops.filter(
      (s) =>
        s.status === "active" &&
        (!base || s.baseAsset === base) &&
        (!quote || s.quoteAsset === quote),
    );
  }
  getStopLoss(id: string): StopLoss | undefined {
    return this.stops.find((s) => s.id === id);
  }
  recordStopLoss(s: StopLoss): void {
    this.stops.unshift(s);
  }
  saveStopLoss(_s: StopLoss): void {
    /* objects are mutated in place; nothing to do for the stub */
  }
  recordStopLossAudit(a: StopLossAuditRow): void {
    this.audits.push(a);
  }
  log(_level: string, message: string): void {
    this.logs.push(message);
  }
}

const BASE = "AAA:ISS";
const QUOTE = "XLM";

function pos(netQty: number): PositionSummary {
  return { pair: `${BASE}/${QUOTE}`, base: BASE, quote: QUOTE, netQty, avgPrice: 1 };
}

function make(store: StubStore, mid: number | null): StopLossService {
  return new StopLossService({
    store,
    getMid: async () => mid,
    now: () => 0,
    maxRetries: 3,
  });
}

describe("StopLossService", () => {
  let store: StubStore;
  beforeEach(() => {
    store = new StubStore();
  });

  it("sets a long stop below market and rejects one at/above market", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({
      baseAsset: BASE,
      quoteAsset: QUOTE,
      triggerPrice: "0.9",
      sellAll: true,
      setBy: "manual",
    });
    expect(s.status).toBe("active");
    expect(s.sellAll).toBe(true);
    expect(store.audits.some((a) => a.action === "create")).toBe(true);
    await expect(
      svc.setStopLoss({
        baseAsset: BASE,
        quoteAsset: QUOTE,
        triggerPrice: "1.1",
        sellAll: true,
        setBy: "manual",
      }),
    ).rejects.toBeInstanceOf(StopLossError);
  });

  it("sets a short stop above market and rejects one at/below market", async () => {
    store.positions = [pos(-5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({
      baseAsset: BASE,
      quoteAsset: QUOTE,
      triggerPrice: "1.1",
      sellAll: true,
      setBy: "ai",
    });
    expect(s.status).toBe("active");
    await expect(
      svc.setStopLoss({
        baseAsset: BASE,
        quoteAsset: QUOTE,
        triggerPrice: "0.9",
        sellAll: true,
        setBy: "ai",
      }),
    ).rejects.toBeInstanceOf(StopLossError);
  });

  it("requires a positive quantity when not selling all", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    await expect(
      svc.setStopLoss({
        baseAsset: BASE,
        quoteAsset: QUOTE,
        triggerPrice: "0.9",
        setBy: "manual",
      }),
    ).rejects.toBeInstanceOf(StopLossError);
    const s = await svc.setStopLoss({
      baseAsset: BASE,
      quoteAsset: QUOTE,
      triggerPrice: "0.9",
      quantityToSell: "3",
      setBy: "manual",
    });
    expect(s.quantityToSell).toBe("3");
    expect(s.sellAll).toBe(false);
  });

  it("trails a long stop UP only (rejects lowering)", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({
      baseAsset: BASE,
      quoteAsset: QUOTE,
      triggerPrice: "0.9",
      sellAll: true,
      setBy: "ai",
    });
    const up = await svc.updateStopLoss(s.id, { triggerPrice: "0.95" });
    expect(up.triggerPrice).toBe("0.95");
    await expect(
      svc.updateStopLoss(s.id, { triggerPrice: "0.8" }),
    ).rejects.toBeInstanceOf(StopLossError);
  });

  it("trails a short stop DOWN only (rejects raising)", async () => {
    store.positions = [pos(-5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({
      baseAsset: BASE,
      quoteAsset: QUOTE,
      triggerPrice: "1.1",
      sellAll: true,
      setBy: "ai",
    });
    const down = await svc.updateStopLoss(s.id, { triggerPrice: "1.05" });
    expect(down.triggerPrice).toBe("1.05");
    await expect(
      svc.updateStopLoss(s.id, { triggerPrice: "1.2" }),
    ).rejects.toBeInstanceOf(StopLossError);
  });

  it("resolves the most-protective stop per side (higher for long, lower for short)", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    await svc.setStopLoss({ baseAsset: BASE, quoteAsset: QUOTE, triggerPrice: "0.90", sellAll: true, setBy: "manual" });
    await svc.setStopLoss({ baseAsset: BASE, quoteAsset: QUOTE, triggerPrice: "0.95", sellAll: true, setBy: "ai" });
    expect(svc.resolveActiveStop(pos(5))?.triggerPrice).toBe("0.95"); // long: higher
    // Same stops, evaluated as a short position: the lower trigger is protective.
    expect(svc.resolveActiveStop(pos(-5))?.triggerPrice).toBe("0.9");
    expect(store.logs.some((l) => l.includes("conflict"))).toBe(true);
  });

  it("cancels a stop and records an audit row", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({ baseAsset: BASE, quoteAsset: QUOTE, triggerPrice: "0.9", sellAll: true, setBy: "manual" });
    const c = svc.cancelStopLoss(s.id, "manual", "changed my mind");
    expect(c.status).toBe("cancelled");
    expect(store.audits.some((a) => a.action === "cancel")).toBe(true);
    // Idempotent: cancelling again is a no-op that returns the cancelled stop.
    expect(svc.cancelStopLoss(s.id, "manual").status).toBe("cancelled");
  });

  it("raises an alert only after the retry budget is exhausted", async () => {
    store.positions = [pos(5)];
    const svc = make(store, 1.0);
    const s = await svc.setStopLoss({ baseAsset: BASE, quoteAsset: QUOTE, triggerPrice: "0.9", sellAll: true, setBy: "manual" });
    svc.noteFailedAttempt(s, "insufficient balance");
    svc.noteFailedAttempt(s, "insufficient balance");
    expect(store.audits.some((a) => a.action === "trigger_failed")).toBe(false);
    expect(s.status).toBe("active");
    svc.noteFailedAttempt(s, "insufficient balance"); // 3rd -> alert
    expect(store.audits.some((a) => a.action === "trigger_failed")).toBe(true);
    expect(s.status).toBe("active"); // never auto-"triggered" on failure
  });
});
