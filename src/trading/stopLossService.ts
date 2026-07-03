import { randomUUID } from "node:crypto";
import { canonicalAsset, pairLabel } from "../stellar/assets";
import { getOrderbook } from "../stellar/market";
import { store } from "./store";
import { config } from "../config";
import type {
  AiLogEntry,
  PositionSummary,
  StopLoss,
  StopLossAuditAction,
  StopLossAuditRow,
  StopLossInitiator,
  StopLossSetBy,
} from "../types";

const EPS = 1e-7;

/**
 * The store surface the service needs. Declaring it as an interface lets tests
 * inject a stub instead of the real singleton (constructor injection).
 */
export interface StopLossStore {
  killSwitch: boolean;
  getPositions(): PositionSummary[];
  getActiveStopLosses(base?: string, quote?: string): StopLoss[];
  getStopLoss(id: string): StopLoss | undefined;
  recordStopLoss(s: StopLoss): void;
  saveStopLoss(s: StopLoss): void;
  recordStopLossAudit(a: StopLossAuditRow): void;
  log(level: "info" | "warn" | "error" | "trade" | "ai", message: string): void;
  /** Structured AI-log emit (optional so test stubs needn't implement it). */
  logAi?(e: Omit<AiLogEntry, "id" | "ts">): void;
}

export interface StopLossDeps {
  store: StopLossStore;
  /** Current mid price (quote per base), or null when no book. */
  getMid: (base: string, quote: string) => Promise<number | null>;
  /** Injected clock (epoch ms) so the service stays deterministic in tests. */
  now: () => number;
  /** Failed-sell retries before an alert is raised (defaults to config). */
  maxRetries?: number;
}

export interface SetStopLossInput {
  baseAsset: string;
  quoteAsset: string;
  triggerPrice: string;
  /** Base units to close; ignored when sellAll is true. */
  quantityToSell?: string;
  sellAll?: boolean;
  setBy: StopLossSetBy;
  notes?: string;
}

export interface UpdateStopLossInput {
  triggerPrice?: string;
  quantityToSell?: string;
  sellAll?: boolean;
  notes?: string;
  initiator?: StopLossInitiator;
}

export interface SetTrailingStopLossInput {
  baseAsset: string;
  quoteAsset: string;
  /** Percent distance to trail by (e.g. 5 = 5%). Exactly one of this / trailAmount. */
  trailPercent?: number;
  /** Fixed price distance to trail by (quote per base). Exactly one of this / trailPercent. */
  trailAmount?: string | number;
  quantityToSell?: string;
  sellAll?: boolean;
  setBy: StopLossSetBy;
  notes?: string;
}

export class StopLossError extends Error {}

export interface IStopLossService {
  setStopLoss(input: SetStopLossInput): Promise<StopLoss>;
  setTrailingStopLoss(input: SetTrailingStopLossInput): Promise<StopLoss>;
  setTrailingStopLossByAmount(input: SetTrailingStopLossInput): Promise<StopLoss>;
  updateStopLoss(id: string, patch: UpdateStopLossInput): Promise<StopLoss>;
  cancelStopLoss(id: string, initiator: StopLossInitiator, reason?: string): StopLoss;
  getActiveStopLosses(base?: string, quote?: string): StopLoss[];
  /** The live effective trigger: currentTrailPrice for a trailing stop, else triggerPrice. */
  triggerLevel(stop: StopLoss): number;
  /** Ratchet a trailing stop on a fresh mark (monitor-facing). Persists+audits on movement. */
  updateTrail(stop: StopLoss, mark: number, side: "long" | "short"): void;
}

function canon(spec: string): string {
  try {
    return canonicalAsset(spec);
  } catch {
    return spec.trim();
  }
}

export class StopLossService implements IStopLossService {
  /** Conflict sets already logged (so a multi-stop pair isn't logged every tick). */
  private loggedConflicts = new Set<string>();

  constructor(private deps: StopLossDeps) {}

  private nowIso(): string {
    return new Date(this.deps.now()).toISOString();
  }

  private maxRetries(): number {
    return this.deps.maxRetries ?? config.stopLossMaxRetries;
  }

  /** Position side for a pair: long (net>0), short (net<0), or flat. */
  private side(base: string, quote: string): "long" | "short" | "flat" {
    const b = canon(base);
    const q = canon(quote);
    const pos = this.deps.store
      .getPositions()
      .find((p) => canon(p.base) === b && canon(p.quote) === q);
    if (!pos || Math.abs(pos.netQty) < EPS) return "flat";
    return pos.netQty > 0 ? "long" : "short";
  }

  /**
   * Is trigger `a` MORE protective than `b` for the given side? For a LONG, a
   * sell-stop that fires sooner as price falls is the HIGHER trigger; for a
   * SHORT (a buy-stop that fires as price rises) it is the LOWER trigger.
   */
  private moreProtective(side: "long" | "short", a: number, b: number): boolean {
    return side === "short" ? a < b : a > b;
  }

  private audit(
    stop: Pick<StopLoss, "id" | "baseAsset" | "quoteAsset">,
    action: StopLossAuditAction,
    initiator: StopLossInitiator,
    opts: { field?: string; oldValue?: string; newValue?: string; note?: string } = {},
  ): void {
    this.deps.store.recordStopLossAudit({
      id: randomUUID(),
      ts: this.nowIso(),
      stopLossId: stop.id,
      baseAsset: stop.baseAsset,
      quoteAsset: stop.quoteAsset,
      action,
      initiator,
      ...(opts.field ? { field: opts.field } : {}),
      ...(opts.oldValue != null ? { oldValue: opts.oldValue } : {}),
      ...(opts.newValue != null ? { newValue: opts.newValue } : {}),
      ...(opts.note ? { note: opts.note } : {}),
    });
  }

  /** Emit a structured AI-log event for a stop (no-op if the store lacks logAi). */
  private aiLog(
    stop: Pick<StopLoss, "baseAsset" | "quoteAsset">,
    eventType: AiLogEntry["eventType"],
    reasoning: string,
  ): void {
    this.deps.store.logAi?.({
      eventType,
      baseAsset: stop.baseAsset,
      quoteAsset: stop.quoteAsset,
      reasoning,
    });
  }

  getActiveStopLosses(base?: string, quote?: string): StopLoss[] {
    return this.deps.store.getActiveStopLosses(
      base ? canon(base) : undefined,
      quote ? canon(quote) : undefined,
    );
  }

  async setStopLoss(input: SetStopLossInput): Promise<StopLoss> {
    const baseAsset = canon(input.baseAsset);
    const quoteAsset = canon(input.quoteAsset);
    const trigger = Number(input.triggerPrice);
    if (!(trigger > 0)) {
      throw new StopLossError("Trigger price must be a positive number.");
    }
    const sellAll = input.sellAll === true;
    if (!sellAll) {
      const qty = Number(input.quantityToSell);
      if (!(qty > 0)) {
        throw new StopLossError(
          "quantityToSell must be a positive number (or set sellAll).",
        );
      }
    }

    // Direction-aware validation against the live market: a LONG stop must sit
    // BELOW the market (a falling-price sell-stop); a SHORT stop ABOVE it. Flat
    // positions default to long semantics (the common manual case). When the
    // book can't be priced right now we skip the check rather than block.
    const side = this.side(baseAsset, quoteAsset);
    const effectiveSide = side === "short" ? "short" : "long";
    const mid = await this.deps.getMid(baseAsset, quoteAsset);
    if (mid != null && mid > 0) {
      if (effectiveSide === "long" && trigger >= mid) {
        throw new StopLossError(
          `Trigger ${trigger} must be BELOW the current price ${mid} for a long stop.`,
        );
      }
      if (effectiveSide === "short" && trigger <= mid) {
        throw new StopLossError(
          `Trigger ${trigger} must be ABOVE the current price ${mid} for a short stop.`,
        );
      }
    }

    const now = this.nowIso();
    const stop: StopLoss = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      baseAsset,
      quoteAsset,
      triggerPrice: String(trigger),
      sellAll,
      ...(sellAll ? {} : { quantityToSell: String(Number(input.quantityToSell)) }),
      setBy: input.setBy,
      status: "active",
      ...(input.notes ? { notes: input.notes } : {}),
      attemptCount: 0,
    };
    this.deps.store.recordStopLoss(stop);
    this.audit(stop, "create", input.setBy, {
      field: "triggerPrice",
      newValue: stop.triggerPrice,
      note: input.notes,
    });
    this.deps.store.log(
      "trade",
      `Stop-loss set (${input.setBy}) on ${pairLabel(baseAsset, quoteAsset)} @ ${stop.triggerPrice}` +
        `${sellAll ? " (sell all)" : ` (${stop.quantityToSell})`}.`,
    );
    if (input.setBy === "ai") {
      this.aiLog(stop, "stop_loss", `AI set stop @ ${stop.triggerPrice}${input.notes ? ` — ${input.notes}` : ""}.`);
    }
    return stop;
  }

  /** Set a trailing stop that trails by a PERCENT (e.g. 5 = 5%). */
  setTrailingStopLoss(input: SetTrailingStopLossInput): Promise<StopLoss> {
    return this.createTrailing({ ...input, trailAmount: undefined });
  }

  /** Set a trailing stop that trails by a fixed price AMOUNT (quote per base). */
  setTrailingStopLossByAmount(input: SetTrailingStopLossInput): Promise<StopLoss> {
    return this.createTrailing({ ...input, trailPercent: undefined });
  }

  /** Enforce: exactly one of trailPercent / trailAmount, and it must be > 0. */
  private validateTrail(trailPercent: number | undefined, trailAmount: number | undefined): void {
    const hasPct = trailPercent != null && Number.isFinite(trailPercent);
    const hasAmt = trailAmount != null && Number.isFinite(trailAmount);
    if (hasPct === hasAmt) {
      throw new StopLossError("Provide exactly one of trailPercent or trailAmount.");
    }
    if (hasPct && !(trailPercent! > 0)) throw new StopLossError("trailPercent must be > 0.");
    if (hasPct && !(trailPercent! < 100)) throw new StopLossError("trailPercent must be < 100.");
    if (hasAmt && !(trailAmount! > 0)) throw new StopLossError("trailAmount must be > 0.");
  }

  private async createTrailing(input: SetTrailingStopLossInput): Promise<StopLoss> {
    const baseAsset = canon(input.baseAsset);
    const quoteAsset = canon(input.quoteAsset);
    const trailPercent = input.trailPercent;
    const trailAmount = input.trailAmount != null ? Number(input.trailAmount) : undefined;
    this.validateTrail(trailPercent, trailAmount);

    const sellAll = input.sellAll === true;
    if (!sellAll && !(Number(input.quantityToSell) > 0)) {
      throw new StopLossError("quantityToSell must be a positive number (or set sellAll).");
    }

    // Seed the trail from the live mid. A trailing stop NEEDS a price to anchor
    // the high-water mark + initial trigger, so an unpriceable book is fatal here.
    const mid = await this.deps.getMid(baseAsset, quoteAsset);
    if (mid == null || !(mid > 0)) {
      throw new StopLossError("No market price available to seed the trailing stop.");
    }
    const side = this.side(baseAsset, quoteAsset);
    const effectiveSide = side === "short" ? "short" : "long";
    // Long trails BELOW (sell-stop under a rising HWM); short trails ABOVE.
    const trailFrom = (m: number): number =>
      trailPercent != null
        ? effectiveSide === "long"
          ? m * (1 - trailPercent / 100)
          : m * (1 + trailPercent / 100)
        : effectiveSide === "long"
          ? m - trailAmount!
          : m + trailAmount!;
    const initial = Number(trailFrom(mid).toFixed(7));
    // Fail closed on a trail so large it puts the initial stop at/below zero:
    // such a stop can never fire (the monitor requires a positive trigger), so
    // it would be silent dead protection. Mirrors setStopLoss's trigger>0 guard.
    if (!(initial > 0)) {
      throw new StopLossError(
        `Trail distance is too large: it would place the initial stop at or below zero (${initial}).`,
      );
    }
    if (effectiveSide === "long" && !(initial < mid)) {
      throw new StopLossError(`Initial trailing stop ${initial} must be below the current price ${mid}.`);
    }
    if (effectiveSide === "short" && !(initial > mid)) {
      throw new StopLossError(`Initial trailing stop ${initial} must be above the current price ${mid}.`);
    }

    const now = this.nowIso();
    const stop: StopLoss = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      baseAsset,
      quoteAsset,
      triggerPrice: String(initial),
      sellAll,
      ...(sellAll ? {} : { quantityToSell: String(Number(input.quantityToSell)) }),
      setBy: input.setBy,
      status: "active",
      ...(input.notes ? { notes: input.notes } : {}),
      attemptCount: 0,
      isTrailing: true,
      ...(trailPercent != null ? { trailPercent } : {}),
      ...(trailAmount != null ? { trailAmount: String(trailAmount) } : {}),
      highWaterMark: String(Number(mid.toFixed(7))),
      currentTrailPrice: String(initial),
    };
    this.deps.store.recordStopLoss(stop);
    const trailDesc = trailPercent != null ? `${trailPercent}%` : `${trailAmount}`;
    this.audit(stop, "create", input.setBy, {
      field: "currentTrailPrice",
      newValue: stop.currentTrailPrice,
      note: `trailing by ${trailDesc}${input.notes ? ` - ${input.notes}` : ""}`,
    });
    this.deps.store.log(
      "trade",
      `Trailing stop set (${input.setBy}) on ${pairLabel(baseAsset, quoteAsset)}: ` +
        `trail ${trailDesc}, initial @ ${stop.currentTrailPrice} (mark ${mid})` +
        `${sellAll ? " (sell all)" : ` (${stop.quantityToSell})`}.`,
    );
    if (input.setBy === "ai") {
      this.aiLog(stop, "stop_loss", `AI set TRAILING stop (trail ${trailDesc}), initial @ ${stop.currentTrailPrice}${input.notes ? ` — ${input.notes}` : ""}.`);
    }
    return stop;
  }

  async updateStopLoss(id: string, patch: UpdateStopLossInput): Promise<StopLoss> {
    const stop = this.deps.store.getStopLoss(id);
    if (!stop) throw new StopLossError(`Stop loss ${id} not found.`);
    if (stop.status !== "active") {
      throw new StopLossError(`Cannot update a ${stop.status} stop loss.`);
    }
    const initiator = patch.initiator ?? "manual";

    if (patch.triggerPrice != null) {
      const next = Number(patch.triggerPrice);
      const prev = Number(stop.triggerPrice);
      if (!(next > 0)) throw new StopLossError("Trigger price must be positive.");
      // TRAIL-ONLY (never loosen protection): a long stop may only ratchet UP,
      // a short stop only DOWN. Equal is a no-op, allowed.
      const side = this.side(stop.baseAsset, stop.quoteAsset);
      const effectiveSide = side === "short" ? "short" : "long";
      if (next !== prev && !this.moreProtective(effectiveSide, next, prev)) {
        throw new StopLossError(
          effectiveSide === "long"
            ? `Trail-only: a long stop can only move UP (>= ${prev}), not down to ${next}.`
            : `Trail-only: a short stop can only move DOWN (<= ${prev}), not up to ${next}.`,
        );
      }
      this.audit(stop, "update", initiator, {
        field: "triggerPrice",
        oldValue: String(prev),
        newValue: String(next),
        ...(patch.notes ? { note: patch.notes } : {}),
      });
      stop.triggerPrice = String(next);
    }

    if (patch.sellAll != null) stop.sellAll = patch.sellAll === true;
    if (patch.quantityToSell != null) {
      const qty = Number(patch.quantityToSell);
      if (qty > 0) stop.quantityToSell = String(qty);
    }
    if (stop.sellAll) delete stop.quantityToSell;
    if (patch.notes != null) stop.notes = patch.notes;
    stop.updatedAt = this.nowIso();
    this.deps.store.saveStopLoss(stop);
    return stop;
  }

  cancelStopLoss(id: string, initiator: StopLossInitiator, reason?: string): StopLoss {
    const stop = this.deps.store.getStopLoss(id);
    if (!stop) throw new StopLossError(`Stop loss ${id} not found.`);
    if (stop.status !== "active") return stop; // idempotent
    stop.status = "cancelled";
    stop.updatedAt = this.nowIso();
    this.audit(stop, "cancel", initiator, reason ? { note: reason } : {});
    this.deps.store.saveStopLoss(stop);
    this.deps.store.log(
      "trade",
      `Stop-loss cancelled (${initiator}) on ${pairLabel(stop.baseAsset, stop.quoteAsset)}${reason ? ` - ${reason}` : ""}.`,
    );
    if (stop.setBy === "ai" || initiator === "ai") {
      this.aiLog(stop, "stop_loss", `AI stop cancelled${reason ? ` — ${reason}` : ""}.`);
    }
    return stop;
  }

  /* ---- monitor-facing helpers (trigger resolution + lifecycle) ---- */

  /**
   * The active stop the monitor should enforce for a position: the MOST
   * PROTECTIVE among the pair's active stops (direction-aware), with a conflict
   * logged once when more than one exists. Returns null when there are none.
   */
  /** The live effective trigger: currentTrailPrice for a trailing stop, else triggerPrice. */
  triggerLevel(stop: StopLoss): number {
    if (stop.isTrailing && stop.currentTrailPrice != null) return Number(stop.currentTrailPrice);
    return Number(stop.triggerPrice);
  }

  /**
   * Ratchet a trailing stop on a fresh mark. Direction-aware: a LONG trails UP
   * under a rising high-water mark (trigger sits below); a SHORT trails DOWN
   * under a falling low-water mark (trigger sits above). currentTrailPrice never
   * moves toward a loss. Persists + writes a trail_updated audit row ONLY when
   * the trail actually moves, so a flat market is silent.
   */
  updateTrail(stop: StopLoss, mark: number, side: "long" | "short"): void {
    if (stop.status !== "active" || !stop.isTrailing || !(mark > 0)) return;
    const trailPct = stop.trailPercent;
    const trailAmt = stop.trailAmount != null ? Number(stop.trailAmount) : undefined;
    const hwm = stop.highWaterMark != null ? Number(stop.highWaterMark) : undefined;
    const curTrail =
      stop.currentTrailPrice != null ? Number(stop.currentTrailPrice) : Number(stop.triggerPrice);
    const trailFrom = (m: number): number =>
      trailPct != null
        ? side === "long"
          ? m * (1 - trailPct / 100)
          : m * (1 + trailPct / 100)
        : side === "long"
          ? m - (trailAmt ?? 0)
          : m + (trailAmt ?? 0);

    // RE-SEED when the trail sits on the WRONG side of the high-water mark for
    // the live position side — e.g. a trail seeded long while flat, then a SHORT
    // opens. Left as-is the stale-direction trigger would fire the instant the
    // opposite-side position opens; instead anchor a fresh trail to this mark.
    if (hwm != null && (side === "long" ? curTrail > hwm + EPS : curTrail < hwm - EPS)) {
      const reseeded = Number(trailFrom(mark).toFixed(7));
      if (reseeded > 0) {
        stop.highWaterMark = String(Number(mark.toFixed(7)));
        stop.currentTrailPrice = String(reseeded);
        stop.updatedAt = this.nowIso();
        this.audit(stop, "trail_updated", "monitor", {
          field: "currentTrailPrice",
          oldValue: String(curTrail),
          newValue: String(reseeded),
          note: `re-seeded for ${side} @ mark ${Number(mark.toFixed(7))}`,
        });
        this.deps.store.saveStopLoss(stop);
      }
      return;
    }

    const improved = hwm == null || (side === "long" ? mark > hwm : mark < hwm);
    if (!improved) return;
    const candidate = Number(trailFrom(mark).toFixed(7));
    // Only ratchet toward profit: up for a long, down for a short.
    const newTrail = side === "long" ? Math.max(curTrail, candidate) : Math.min(curTrail, candidate);
    const newHwm = Number(mark.toFixed(7));
    if (newTrail === curTrail && newHwm === hwm) return; // no effective movement

    stop.highWaterMark = String(newHwm);
    stop.currentTrailPrice = String(newTrail);
    stop.updatedAt = this.nowIso();
    // Audit ONLY a real trail move; a pure high-water advance (trail unchanged)
    // is persisted silently rather than logged as an old==new "change".
    if (newTrail !== curTrail) {
      this.audit(stop, "trail_updated", "monitor", {
        field: "currentTrailPrice",
        oldValue: String(curTrail),
        newValue: String(newTrail),
        note: `HWM ${newHwm} @ mark ${Number(mark.toFixed(7))}`,
      });
      this.aiLog(
        stop,
        "trail_update",
        `Trail ratcheted ${curTrail} → ${newTrail} (HWM ${newHwm}, mark ${Number(mark.toFixed(7))}).`,
      );
    }
    this.deps.store.saveStopLoss(stop);
  }

  resolveActiveStop(pos: PositionSummary): StopLoss | null {
    const stops = this.deps.store.getActiveStopLosses(canon(pos.base), canon(pos.quote));
    if (stops.length === 0) return null;
    const side = pos.netQty < 0 ? "short" : "long";
    let chosen = stops[0]!;
    for (const s of stops) {
      if (this.moreProtective(side, this.triggerLevel(s), this.triggerLevel(chosen))) {
        chosen = s;
      }
    }
    if (stops.length > 1) {
      const key = stops.map((s) => s.id).sort().join(",") + ":" + chosen.id;
      if (!this.loggedConflicts.has(key)) {
        this.loggedConflicts.add(key);
        this.deps.store.log(
          "warn",
          `Stop-loss conflict on ${pos.pair}: ${stops.length} active stops; ` +
            `using the most-protective ${chosen.setBy} stop @ ${chosen.triggerPrice} (${side}). ` +
            `The others are shadowed; cancel them from the dashboard if unwanted.`,
        );
      }
    }
    return chosen;
  }

  /** Record that a close was submitted for this stop (link for confirmation). */
  linkTrigger(stop: StopLoss, proposalId: string): void {
    if (stop.triggerProposalId === proposalId) return;
    stop.triggerProposalId = proposalId;
    stop.updatedAt = this.nowIso();
    this.deps.store.saveStopLoss(stop);
  }

  /** Confirm a stop fired: its close fully executed and the position is flat. */
  markTriggered(stop: StopLoss, proposalId: string): void {
    if (stop.status !== "active") return;
    stop.status = "triggered";
    stop.triggeredAt = this.nowIso();
    stop.triggerProposalId = proposalId;
    stop.updatedAt = stop.triggeredAt;
    this.audit(stop, "trigger", "monitor", {
      field: "status",
      newValue: "triggered",
      note: `closed via proposal ${proposalId.slice(0, 8)}`,
    });
    this.deps.store.log(
      "trade",
      `Stop-loss TRIGGERED on ${pairLabel(stop.baseAsset, stop.quoteAsset)} @ ${stop.triggerPrice}.`,
    );
    this.deps.store.saveStopLoss(stop);
  }

  /** Position closed by another path: the stop is moot. */
  markExpired(stop: StopLoss, note: string): void {
    if (stop.status !== "active") return;
    stop.status = "expired";
    stop.updatedAt = this.nowIso();
    this.audit(stop, "expire", "monitor", { field: "status", newValue: "expired", note });
    this.deps.store.saveStopLoss(stop);
  }

  /**
   * A close attempt failed while the position is still open. Counts the failure,
   * clears the link so the next breach retries, and raises a single alert once
   * the retry budget is exhausted. Status stays ACTIVE (never "triggered" until
   * a sell confirms).
   */
  noteFailedAttempt(stop: StopLoss, error: string): void {
    if (stop.status !== "active") return;
    stop.attemptCount += 1;
    stop.lastError = error;
    stop.triggerProposalId = undefined; // allow a fresh close next breach
    stop.updatedAt = this.nowIso();
    const max = this.maxRetries();
    if (stop.attemptCount >= max) {
      this.audit(stop, "trigger_failed", "monitor", {
        note: `${stop.attemptCount} failed attempts: ${error}`,
      });
      this.deps.store.log(
        "error",
        `Stop-loss on ${pairLabel(stop.baseAsset, stop.quoteAsset)} has FAILED to execute ${stop.attemptCount}x (last: ${error}). It stays active and keeps retrying - intervene if needed.`,
      );
    }
    this.deps.store.saveStopLoss(stop);
  }
}

/** Real-deps singleton used by the app (server routes, AI tools, monitor). */
export const stopLossService = new StopLossService({
  store,
  now: () => Date.now(),
  getMid: async (base, quote) => {
    try {
      const ob = await getOrderbook(base, quote, 1);
      if (ob.bestBid != null && ob.bestAsk != null) return (ob.bestBid + ob.bestAsk) / 2;
      return ob.bestBid ?? ob.bestAsk ?? null;
    } catch {
      return null;
    }
  },
});
