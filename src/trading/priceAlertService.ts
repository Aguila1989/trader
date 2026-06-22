import { randomUUID } from "node:crypto";
import { canonicalAsset } from "../stellar/assets";
import { store } from "./store";
import type { AlertDirection, PriceAlert } from "../types";

/**
 * Price alerts: observe-only notifications when a pair's mid crosses a level.
 * The position monitor evaluates active alerts each tick and calls fire(),
 * which marks them triggered and emits a one-off 'alert' SSE event the
 * dashboard turns into a browser notification. No on-chain effect.
 */

export interface PriceAlertStore {
  getActivePriceAlerts(base?: string, quote?: string): PriceAlert[];
  getPriceAlert(id: string): PriceAlert | undefined;
  recordPriceAlert(a: PriceAlert): void;
  savePriceAlert(a: PriceAlert): void;
  emitAlert(payload: unknown): void;
  log(level: "info" | "warn" | "error" | "trade" | "ai", message: string): void;
}

export interface PriceAlertDeps {
  store: PriceAlertStore;
  now: () => number;
}

export class PriceAlertError extends Error {}

function canon(spec: string): string {
  try {
    return canonicalAsset(spec);
  } catch {
    return spec.trim();
  }
}

/** Pure: has `mid` crossed the alert threshold? */
export function alertCrossed(
  direction: AlertDirection,
  price: number,
  mid: number,
): boolean {
  return direction === "above" ? mid >= price : mid <= price;
}

export interface SetAlertInput {
  baseAsset: string;
  quoteAsset: string;
  direction: AlertDirection;
  price: string;
  note?: string;
}

export class PriceAlertService {
  constructor(private deps: PriceAlertDeps) {}

  private nowIso(): string {
    return new Date(this.deps.now()).toISOString();
  }

  getActiveAlerts(base?: string, quote?: string): PriceAlert[] {
    return this.deps.store.getActivePriceAlerts(
      base ? canon(base) : undefined,
      quote ? canon(quote) : undefined,
    );
  }

  setAlert(input: SetAlertInput): PriceAlert {
    const price = Number(input.price);
    if (!(price > 0)) throw new PriceAlertError("Alert price must be a positive number.");
    if (input.direction !== "above" && input.direction !== "below") {
      throw new PriceAlertError("direction must be 'above' or 'below'.");
    }
    const alert: PriceAlert = {
      id: randomUUID(),
      createdAt: this.nowIso(),
      baseAsset: canon(input.baseAsset),
      quoteAsset: canon(input.quoteAsset),
      direction: input.direction,
      price: String(price),
      status: "active",
      ...(input.note ? { note: input.note } : {}),
    };
    this.deps.store.recordPriceAlert(alert);
    return alert;
  }

  cancelAlert(id: string): PriceAlert {
    const alert = this.deps.store.getPriceAlert(id);
    if (!alert) throw new PriceAlertError(`Alert ${id} not found.`);
    if (alert.status !== "active") return alert; // idempotent
    alert.status = "cancelled";
    this.deps.store.savePriceAlert(alert);
    return alert;
  }

  /** Mark an alert triggered and emit the notification event. */
  fire(alert: PriceAlert, mid: number): void {
    if (alert.status !== "active") return;
    alert.status = "triggered";
    alert.triggeredAt = this.nowIso();
    alert.triggerPrice = String(Number(mid.toFixed(7)));
    this.deps.store.savePriceAlert(alert);
    const pair = `${alert.baseAsset.split(":")[0]}/${alert.quoteAsset.split(":")[0]}`;
    this.deps.store.log(
      "info",
      `Price alert: ${pair} crossed ${alert.direction} ${alert.price} (mid ${alert.triggerPrice}).`,
    );
    this.deps.store.emitAlert({
      id: alert.id,
      pair,
      direction: alert.direction,
      price: alert.price,
      mid: alert.triggerPrice,
      ts: alert.triggeredAt,
    });
  }
}

export const priceAlertService = new PriceAlertService({
  store,
  now: () => Date.now(),
});
