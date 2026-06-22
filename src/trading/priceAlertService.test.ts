import { describe, it, expect, beforeEach } from "vitest";
import {
  PriceAlertService,
  PriceAlertError,
  alertCrossed,
  type PriceAlertStore,
} from "./priceAlertService";
import type { PriceAlert } from "../types";

class StubStore implements PriceAlertStore {
  alerts: PriceAlert[] = [];
  emitted: unknown[] = [];
  logs: string[] = [];
  getActivePriceAlerts(base?: string, quote?: string): PriceAlert[] {
    return this.alerts.filter(
      (a) =>
        a.status === "active" &&
        (!base || a.baseAsset === base) &&
        (!quote || a.quoteAsset === quote),
    );
  }
  getPriceAlert(id: string): PriceAlert | undefined {
    return this.alerts.find((a) => a.id === id);
  }
  recordPriceAlert(a: PriceAlert): void {
    this.alerts.unshift(a);
  }
  savePriceAlert(_a: PriceAlert): void {
    /* mutated in place */
  }
  emitAlert(payload: unknown): void {
    this.emitted.push(payload);
  }
  log(_level: string, message: string): void {
    this.logs.push(message);
  }
}

describe("alertCrossed", () => {
  it("fires an 'above' alert when mid reaches/exceeds the price", () => {
    expect(alertCrossed("above", 1, 1)).toBe(true);
    expect(alertCrossed("above", 1, 1.5)).toBe(true);
    expect(alertCrossed("above", 1, 0.9)).toBe(false);
  });
  it("fires a 'below' alert when mid reaches/drops under the price", () => {
    expect(alertCrossed("below", 1, 1)).toBe(true);
    expect(alertCrossed("below", 1, 0.5)).toBe(true);
    expect(alertCrossed("below", 1, 1.1)).toBe(false);
  });
});

describe("PriceAlertService", () => {
  let store: StubStore;
  let svc: PriceAlertService;
  beforeEach(() => {
    store = new StubStore();
    svc = new PriceAlertService({ store, now: () => 0 });
  });

  it("creates an active alert and rejects bad input", () => {
    const a = svc.setAlert({ baseAsset: "XLM", quoteAsset: "AAA:ISS", direction: "above", price: "0.5" });
    expect(a.status).toBe("active");
    expect(store.alerts).toHaveLength(1);
    expect(() =>
      svc.setAlert({ baseAsset: "XLM", quoteAsset: "AAA:ISS", direction: "above", price: "0" }),
    ).toThrow(PriceAlertError);
  });

  it("fires once: marks triggered and emits a notification", () => {
    const a = svc.setAlert({ baseAsset: "XLM", quoteAsset: "AAA:ISS", direction: "above", price: "0.5" });
    svc.fire(a, 0.6);
    expect(a.status).toBe("triggered");
    expect(a.triggerPrice).toBe("0.6");
    expect(store.emitted).toHaveLength(1);
    svc.fire(a, 0.7); // already triggered -> no-op
    expect(store.emitted).toHaveLength(1);
  });

  it("cancels an alert (idempotent)", () => {
    const a = svc.setAlert({ baseAsset: "XLM", quoteAsset: "AAA:ISS", direction: "below", price: "0.2" });
    expect(svc.cancelAlert(a.id).status).toBe("cancelled");
    expect(svc.cancelAlert(a.id).status).toBe("cancelled");
    expect(svc.getActiveAlerts()).toHaveLength(0);
  });
});
