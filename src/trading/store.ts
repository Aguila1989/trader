import type { Response } from "express";
import { config, isReadOnly } from "../config";
import { dayKey, dayStartUtc } from "../time";
import { aiReady, aiModel, aiProviderId, availableProviders, setActiveProvider } from "../ai";
import { signerPublicKey } from "../stellar/signer";
import { dbReady } from "../db/pool";
import * as repo from "../db/repo";
import {
  ledger,
  computeEvolution,
  isXlmSpec,
  setXlmRate,
  xlmNotional,
  type Fill,
} from "./positions";
import { getMarketSnapshot } from "../stellar/market";
import type {
  DailyState,
  EvolutionPoint,
  LogEntry,
  LogLevel,
  PositionSummary,
  Snapshot,
  TradeProposal,
  TradesPage,
} from "../types";

const MAX_LOGS = 200;
const MAX_PROPOSALS = 100;

function freshDaily(): DailyState {
  return {
    dayKey: dayKey(),
    volume: 0,
    tradeCount: 0,
    realizedPnl: 0,
    lastTradeAt: null,
  };
}

/** Treat a submitted proposal as a fill, preferring the ACTUAL on-chain fill
 *  (filledAmount/filledPrice, reconciled from Horizon's offerResults) and
 *  falling back to the requested amount at limit price when reconciliation is
 *  unavailable (e.g. the submit timed out and we polled the bare tx record).
 *  The fill timestamp is the SUBMIT time (createdAt fallback for old rows) -
 *  NOT updatedAt, which later outcome marks / offer reconciliation bump. */
function proposalToFill(p: TradeProposal): Fill {
  return {
    side: p.side,
    base: p.baseAsset,
    quote: p.quoteAsset,
    amount: Number(p.filledAmount ?? p.amount) || 0,
    price: Number(p.filledPrice ?? p.limitPrice) || 0,
    ts: p.submittedAt ?? p.createdAt,
  };
}

function round7(n: number): number {
  return Number(n.toFixed(7));
}

/**
 * Prime the XLM rate map for every asset that appears on a CROSS-pair fill,
 * BEFORE the boot replay runs. The map is empty at boot (it is normally fed by
 * the chain scan / monitor, which start later), and replaying cross-pair fills
 * without rates would restore the daily loss/volume counters at raw 1:1 values
 * - under-counting them by the asset's real XLM rate.
 */
async function primeXlmRates(fills: Fill[]): Promise<void> {
  const need = new Set<string>();
  for (const f of fills) {
    if (!isXlmSpec(f.base) && !isXlmSpec(f.quote)) {
      need.add(f.base);
      need.add(f.quote);
    }
  }
  for (const asset of need) {
    try {
      const snap = await getMarketSnapshot("XLM", asset, 1);
      const mid =
        snap.bestBid != null && snap.bestAsk != null
          ? (snap.bestBid + snap.bestAsk) / 2
          : (snap.stats.lastPrice ?? snap.bestBid ?? snap.bestAsk);
      if (mid != null && mid > 0) setXlmRate(asset, 1 / mid);
    } catch {
      // No XLM book reachable right now: conversions for this asset fall back
      // to raw values until the first scan refreshes the rate.
    }
  }
}

/** Single in-memory source of truth + a Server-Sent-Events fan-out. */
class Store {
  private proposals: TradeProposal[] = [];
  private logs: LogEntry[] = [];
  private subscribers = new Set<Response>();

  killSwitch = false;
  autoApprove = config.autoApproveEnabled;
  /**
   * Runtime arm switch. false = behave read-only (proposals are generated but
   * NEVER submitted), even when a STELLAR_SECRET is configured. Defaults OFF on
   * every boot so the operator must deliberately go live from the dashboard.
   * Cannot be turned on without a signing key (see setLiveTrading).
   */
  liveTrading = false;
  /**
   * Paper-trading arm switch. true = policy-passing proposals fill in SIMULATION
   * against the live order book (no keys, no on-chain submit), for a zero-risk
   * forward test. Mutually exclusive with liveTrading. Defaults OFF on boot.
   */
  paperTrading = false;
  daily: DailyState = freshDaily();
  /**
   * Mark-to-market PnL of open positions in XLM, refreshed by the position
   * monitor. Its LOSS side feeds the policy engine's daily-loss halt and the
   * size taper, so a book of open losers can't bleed past MAX_DAILY_LOSS
   * unnoticed just because nothing is realized yet.
   */
  unrealizedPnl = 0;

  /** Serializes DB writes so an insert always lands before its updates. */
  private writeChain: Promise<void> = Promise.resolve();

  private persist(op: () => Promise<void>): void {
    if (!dbReady()) return;
    this.writeChain = this.writeChain.then(op).catch((err) => {
      this.log("error", `SQL Server write failed: ${(err as Error).message}`);
    });
  }

  /** Load persisted proposals + today's counters from SQL Server on boot. */
  async hydrateFromDb(): Promise<void> {
    if (!dbReady()) return;
    try {
      const recent = await repo.listRecentProposals(MAX_PROPOSALS);
      this.proposals = recent;
      // Merge rows with PENDING post-trade work that fell outside the recent
      // window (tracked resting offers, crash-stranded submits, late-landing
      // rechecks) - the monitor iterates the in-memory list, so dropping them
      // here would orphan their fills/cancels even though the DB has them.
      const actionable = await repo.listActionableProposals();
      const have = new Set(this.proposals.map((r) => r.id));
      for (const a of actionable) {
        if (!have.has(a.id)) this.proposals.push(a);
      }
      const today = await repo.sumTodaySubmitted();
      this.rolloverDay();
      this.daily.tradeCount = today.count;
      this.daily.lastTradeAt = today.lastTradeAt;
      // Rebuild the FIFO PnL ledger from the FULL submitted-fill history so open
      // positions and avg cost are exact, and recover TODAY's realized PnL so
      // the MAX_DAILY_LOSS guard survives a restart. Same day boundary (local
      // midnight in config.timezone) as repo.sumTodaySubmitted().
      const fills = await repo.listSubmittedFills();
      // Cross-pair fills need live XLM rates to restore the SAME numbers the
      // live path booked; prime them before replaying.
      await primeXlmRates(fills);
      const sinceIso = dayStartUtc().toISOString();
      this.daily.realizedPnl = ledger.replay(fills, sinceIso);
      // Restore today's volume in the same XLM-normalized unit the live
      // counter uses (recordSubmittedTrade), not raw mixed base units.
      this.daily.volume = round7(
        fills
          .filter((f) => f.ts && f.ts >= sinceIso)
          .reduce((s, f) => s + xlmNotional(f.base, f.quote, f.amount, f.price), 0),
      );
      this.log(
        "info",
        `Hydrated ${recent.length} proposals from SQL Server (today: ${today.count} trades, vol ${today.volume}, realized PnL ${this.daily.realizedPnl}; replayed ${fills.length} fills).`,
      );
      this.emit("state", this.snapshot());
    } catch (err) {
      this.log("error", `Hydration from SQL Server failed: ${(err as Error).message}`);
    }
  }

  private rolloverDay(): void {
    const k = dayKey();
    if (k !== this.daily.dayKey) {
      this.daily = freshDaily();
      this.log("info", `New trading day ${k}: daily counters reset.`);
    }
  }

  log(level: LogLevel, message: string, data?: unknown): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      message,
      data,
    };
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) this.logs.length = MAX_LOGS;
    this.emit("log", entry);
  }

  addProposal(p: TradeProposal): void {
    this.proposals.unshift(p);
    if (this.proposals.length > MAX_PROPOSALS) {
      // Trim oldest-first, but never drop a row the monitor still has work on
      // (a tracked resting offer, or an unresolved submit) - losing those
      // silently orphans later fills and stale-offer cancels.
      for (
        let i = this.proposals.length - 1;
        i >= 0 && this.proposals.length > MAX_PROPOSALS;
        i--
      ) {
        const q = this.proposals[i];
        const busy = q && (q.offerId || q.status === "submitting");
        if (!busy) this.proposals.splice(i, 1);
      }
      // Hard ceiling even if everything is busy (pathological case).
      if (this.proposals.length > MAX_PROPOSALS + 50) {
        this.proposals.length = MAX_PROPOSALS + 50;
      }
    }
    this.emit("proposal", p);
    // Paper proposals are NEVER persisted: a simulated fill must not land in the
    // trade DB, where the boot replay would book it into the real FIFO ledger.
    if (!p.paper) this.persist(() => repo.insertProposal(p));
  }

  /** True when proposals can execute (live on-chain OR simulated in paper). */
  get armed(): boolean {
    return this.liveTrading || this.paperTrading;
  }

  getProposal(id: string): TradeProposal | undefined {
    return this.proposals.find((p) => p.id === id);
  }

  updateProposal(
    id: string,
    patch: Partial<TradeProposal>,
  ): TradeProposal | undefined {
    const p = this.getProposal(id);
    if (!p) return undefined;
    Object.assign(p, patch, { updatedAt: new Date().toISOString() });
    this.emit("proposal", p);
    if (!p.paper) this.persist(() => repo.updateProposal(p));
    return p;
  }

  recordSubmittedTrade(p: TradeProposal): void {
    this.rolloverDay();
    this.daily.tradeCount += 1;
    // Use the reconciled fill (actual filled base + avg price when known) so
    // daily volume and the PnL ledger reflect what really traded, not the
    // optimistic limit order.
    const fill = proposalToFill(p);
    // Volume accrues XLM-NORMALIZED so the daily cap sums one unit across
    // pairs (XLM-base scan trades are unchanged: base units == XLM).
    if (fill.amount > 0 && fill.price > 0) {
      this.daily.volume = round7(
        this.daily.volume + xlmNotional(fill.base, fill.quote, fill.amount, fill.price),
      );
    }
    // Match this fill against open lots; the returned delta is the realized
    // PnL it locks in, normalized to XLM (could close lots opened on earlier
    // days). It accrues to TODAY's realizedPnl in XLM, which is what the
    // XLM-denominated MAX_DAILY_LOSS guard reads.
    const realized = ledger.recordFill(fill);
    this.daily.realizedPnl = round7(this.daily.realizedPnl + realized);
    this.daily.lastTradeAt = new Date().toISOString();
    this.emit("daily", this.daily);
  }

  /**
   * Book a LATER fill of a resting offer (detected by the position monitor):
   * the proposal was already counted as a trade at submit time, so this only
   * accrues volume + realized PnL and advances the proposal's cumulative
   * filledAmount / volume-weighted filledPrice. Closes the "resting remainders
   * are never reconciled" gap.
   */
  recordIncrementalFill(id: string, deltaBase: number, price: number): void {
    const p = this.getProposal(id);
    if (!p || !(deltaBase > 0) || !(price > 0)) return;
    this.rolloverDay();

    const realized = ledger.recordFill({
      side: p.side,
      base: p.baseAsset,
      quote: p.quoteAsset,
      amount: deltaBase,
      price,
    });
    this.daily.volume = round7(
      this.daily.volume + xlmNotional(p.baseAsset, p.quoteAsset, deltaBase, price),
    );
    this.daily.realizedPnl = round7(this.daily.realizedPnl + realized);

    const prevFilled = Number(p.filledAmount ?? 0) || 0;
    const prevPrice = Number(p.filledPrice ?? price) || price;
    const newFilled = prevFilled + deltaBase;
    const newAvg =
      newFilled > 0 ? (prevFilled * prevPrice + deltaBase * price) / newFilled : price;
    this.updateProposal(id, {
      filledAmount: String(round7(newFilled)),
      filledPrice: String(round7(newAvg)),
    });
    this.emit("daily", this.daily);
    this.log(
      "trade",
      `Late fill booked for ${id.slice(0, 8)}: +${round7(deltaBase)} ${p.baseAsset} @ ${round7(price)} (total ${round7(newFilled)}).`,
    );
  }

  /** Update the mark-to-market PnL of open positions (called by the monitor). */
  setUnrealizedPnl(v: number): void {
    const next = round7(v);
    if (Math.abs(next - this.unrealizedPnl) < 1e-7) return;
    this.unrealizedPnl = next;
    this.emit("state", this.snapshot());
  }

  /** Read-only view of the live proposal list (newest first). */
  listProposals(): TradeProposal[] {
    return [...this.proposals];
  }

  getDaily(): DailyState {
    this.rolloverDay();
    return this.daily;
  }

  /** Open positions from this system's own trading (signed-FIFO net). */
  getPositions(): PositionSummary[] {
    return ledger.positions();
  }

  /** Paginated trade history. Uses SQL Server when connected, else memory. */
  async getTradesPage(opts: {
    limit: number;
    offset: number;
    status?: string;
  }): Promise<TradesPage> {
    if (dbReady()) return repo.listTrades(opts);
    const limit = Math.min(Math.max(opts.limit, 1), 500);
    const offset = Math.max(opts.offset, 0);
    const filtered = opts.status
      ? this.proposals.filter((p) => p.status === opts.status)
      : this.proposals;
    return {
      rows: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    };
  }

  /** Cumulative volume/trades/PnL series. SQL Server when connected, else memory. */
  async getEvolution(): Promise<EvolutionPoint[]> {
    if (dbReady()) return repo.getEvolution();
    const fills: Fill[] = this.proposals
      .filter((p) => p.status === "submitted")
      .slice()
      .sort((a, b) =>
        (a.submittedAt ?? a.createdAt).localeCompare(b.submittedAt ?? b.createdAt),
      )
      .map(proposalToFill);
    return computeEvolution(fills);
  }

  setKill(active: boolean): void {
    this.killSwitch = active;
    this.log(
      "warn",
      active ? "KILL SWITCH ON - trading halted." : "Kill switch released.",
    );
    this.emit("state", this.snapshot());
  }

  setAutoApprove(enabled: boolean): void {
    this.autoApprove = enabled;
    this.log(
      "warn",
      enabled
        ? "AUTO-APPROVE ENABLED - proposals will execute without a manual click."
        : "Auto-approve disabled - proposals wait for manual approval.",
    );
    this.emit("state", this.snapshot());
  }

  /**
   * Arm/disarm live trading at runtime. Refuses to arm when there is no signing
   * key (isReadOnly): you cannot trade without a secret, and the toggle must not
   * pretend otherwise. Returns the resulting state.
   */
  setLiveTrading(enabled: boolean): boolean {
    if (enabled && isReadOnly) {
      this.log(
        "error",
        "Cannot enable live trading: no STELLAR_SECRET configured (read-only).",
      );
      this.liveTrading = false;
      this.emit("state", this.snapshot());
      return false;
    }
    // Refuse to arm live trading with the position monitor disabled: there would
    // be NO stop-losses, no resting-offer reconciliation and no mark-to-market
    // feeding the loss halt. A single boot-time warning is not enough of a guard
    // for real money.
    if (enabled && config.monitorIntervalSeconds <= 0) {
      this.log(
        "error",
        "Cannot enable live trading: the position monitor is OFF (POSITION_MONITOR_INTERVAL_SECONDS=0) - no stop-losses or exit management. Set it > 0 and restart first.",
      );
      this.liveTrading = false;
      this.emit("state", this.snapshot());
      return false;
    }
    this.liveTrading = enabled;
    // Live and paper are mutually exclusive: arming real submission turns off
    // the simulator so there is never ambiguity about whether a fill is real.
    if (enabled && this.paperTrading) {
      this.paperTrading = false;
      this.log("warn", "Paper trading disabled (live trading was armed).");
    }
    this.log(
      "warn",
      enabled
        ? "LIVE TRADING ENABLED - policy-passing trades can now be submitted on-chain."
        : "Live trading disabled - READ-ONLY (proposals are generated but never submitted).",
    );
    this.emit("state", this.snapshot());
    return this.liveTrading;
  }

  /**
   * Arm/disarm PAPER trading. Unlike live trading this needs no signing key -
   * it never touches the chain. Enabling it disarms live trading (mutually
   * exclusive) so a simulated session can never accidentally submit real orders.
   */
  setPaperTrading(enabled: boolean): boolean {
    this.paperTrading = enabled;
    if (enabled && this.liveTrading) {
      this.liveTrading = false;
      this.log("warn", "Live trading disabled (paper trading was armed).");
    }
    this.log(
      "warn",
      enabled
        ? "PAPER TRADING ENABLED - policy-passing trades fill in SIMULATION only (no on-chain submit, zero risk)."
        : "Paper trading disabled.",
    );
    this.emit("state", this.snapshot());
    return this.paperTrading;
  }

  /**
   * Switch the active AI provider at runtime. Only providers with a configured
   * API key can be selected (the dashboard only offers those). Returns false if
   * the id is unknown or has no key; true on success.
   */
  setAiProvider(id: string): boolean {
    const ok = setActiveProvider(id);
    if (!ok) {
      this.log("error", `Cannot switch AI provider to "${id}": unknown or no API key configured.`);
      return false;
    }
    this.log("ai", `AI provider switched to ${aiProviderId()} (${aiModel()}).`);
    this.emit("state", this.snapshot());
    return true;
  }

  subscribe(res: Response): void {
    this.subscribers.add(res);
    res.on("close", () => this.subscribers.delete(res));
  }

  private emit(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of this.subscribers) {
      try {
        res.write(payload);
      } catch {
        this.subscribers.delete(res);
      }
    }
  }

  snapshot(): Snapshot {
    this.rolloverDay();
    return {
      network: config.network,
      horizonUrl: config.horizonUrl,
      account: signerPublicKey(),
      // "readOnly" is the EFFECTIVE state: no signing key OR live trading off.
      readOnly: isReadOnly || !this.liveTrading,
      // Whether a signing key exists at all (gates whether Live can be armed).
      secretConfigured: !isReadOnly,
      liveTrading: this.liveTrading,
      paperTrading: this.paperTrading,
      autoApprove: this.autoApprove,
      killSwitch: this.killSwitch,
      dbConnected: dbReady(),
      model: aiModel(),
      aiProvider: aiProviderId(),
      aiReady: aiReady(),
      aiProviders: availableProviders(),
      limits: {
        ...config.limits,
        assetWhitelist: [...config.limits.assetWhitelist],
      },
      daily: this.daily,
      unrealizedPnl: this.unrealizedPnl,
      positions: ledger.positions(),
      proposals: this.proposals,
      logs: this.logs,
    };
  }
}

export const store = new Store();
