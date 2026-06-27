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
import { randomUUID } from "node:crypto";
import {
  coerceSetting,
  currentSettingsMap,
  applySettingToConfig,
  settingDefault,
  settingKeys,
  settingStorageKey,
  serializeSetting,
  type SettingValue,
} from "./settings";
import { defaultRiskProfile, coerceRiskProfile } from "../types";
import type {
  AiLogEntry,
  AiLogPage,
  TradeLogEntry,
  TradeLogPage,
  DailyState,
  EvolutionPoint,
  LiquidityRec,
  LiquiditySnapshotRow,
  LogEntry,
  LogLevel,
  LogsPage,
  PositionSummary,
  PriceAlert,
  RiskProfile,
  Snapshot,
  StopLoss,
  StopLossAuditPage,
  StopLossAuditRow,
  TradeProposal,
  TradesPage,
} from "../types";

const MAX_LOGS = 200;
const MAX_PROPOSALS = 100;
/** In-memory fallbacks when no DB is configured (history is otherwise DB-only). */
const MAX_LIQUIDITY_MEM = 5000;
const MAX_AUDIT_MEM = 500;
/** In-memory rings for the structured trade/AI logs (DB is the durable store). */
const MAX_TRADELOG_MEM = 500;
const MAX_AILOG_MEM = 500;
/** How many combined trade+AI events the live log shows. */
const LIVE_LOG_N = 20;

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
  // Structured, separate trade + AI log rings (the DB is the durable source;
  // these serve reads when no DB is configured and seed the live log).
  private tradeLog: TradeLogEntry[] = [];
  private aiLog: AiLogEntry[] = [];
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
  // SEC-01: daily wallet OUTFLOW (XLM-equiv) for the MAX_DAILY_EGRESS cap.
  // In-memory by design (resets on restart, like the live-trading arm switch).
  private egressXlm = 0;
  /** Active AI risk profile (per-factor LOW/MEDIUM/HIGH). Persisted in
   *  dbo.Settings; read LIVE by the policy/orchestrator at proposal time. */
  riskProfile: RiskProfile = defaultRiskProfile();
  /**
   * AI trading master switch (Feature 1). When false the AI loop is PAUSED: no
   * proposals, no AI-initiated orders, no AI-set/updated stop losses. The
   * liquidity scanner, the stop-loss monitor's protective closes, wallet
   * overview and manual trading all keep running. Persisted in dbo.Settings, so
   * it survives a restart (unlike the live-trading arm, which always re-disarms).
   */
  aiEnabled = true;
  /**
   * Feature 5: locally rejected pending payments (claimable balances). Keyed by
   * balance id -> {reason, at}. A rejected balance is hidden from the pending
   * list by default and never auto-claimed; it remains UNCLAIMED on-chain (we
   * can't decline a claimable balance, only ignore it). Persisted in
   * dbo.Settings so a rejection survives a restart.
   */
  private rejectedClaimables = new Map<string, { reason: string; at: string }>();
  /**
   * Mark-to-market PnL of open positions in XLM, refreshed by the position
   * monitor. Its LOSS side feeds the policy engine's daily-loss halt and the
   * size taper, so a book of open losers can't bleed past MAX_DAILY_LOSS
   * unnoticed just because nothing is realized yet.
   */
  unrealizedPnl = 0;

  /** Active stop-loss orders (manual + AI). The monitor consults these; the
   *  array holds only ACTIVE stops (terminal ones are pruned after persisting). */
  private stopLosses: StopLoss[] = [];
  /** Bounded recent audit ring for the no-DB fallback (DB is authoritative). */
  private stopLossAudit: StopLossAuditRow[] = [];
  /** Current top-N liquidity recommendations (observe-only scanner). */
  private liquidityRecs: LiquidityRec[] = [];
  /** Bounded in-memory liquidity history for the no-DB fallback. */
  private liquidityMem: LiquiditySnapshotRow[] = [];
  /** Active price alerts (observe-only). */
  private priceAlerts: PriceAlert[] = [];

  /** Serializes DB writes so an insert always lands before its updates. */
  private writeChain: Promise<void> = Promise.resolve();
  /**
   * Re-entrancy guard for log persistence. A failed log-insert reports through
   * store.log("error", ...) (via persist's catch), and log() in turn tries to
   * persist THAT error log - so a DB that is failing every write would amplify
   * one bad log into an unbounded queue of failing inserts. While set, log()
   * skips persistence: the persistence-failure log is emitted live but never
   * itself written to the DB.
   */
  private persistingLog = false;

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
      // Active stop losses must survive a restart so the independent monitor
      // keeps enforcing them even after a crash/redeploy.
      this.stopLosses = await repo.listActiveStopLosses();
      this.priceAlerts = await repo.listActivePriceAlerts();
      // Risk profile survives restart (unlike the safety toggles, which reset).
      const rp = await repo.getSetting("riskProfile");
      if (rp) {
        try {
          this.riskProfile = coerceRiskProfile(JSON.parse(rp));
        } catch {
          /* malformed row: keep the default LOW profile */
        }
      }
      // AI master switch survives restart (Feature 1). Default ON when absent.
      const ai = await repo.getSetting("aiEnabled");
      if (ai != null) this.aiEnabled = ai !== "false";
      // Operational settings overrides (Feature 2) survive restart. Applied into
      // `config` before the loops start so cadences pick up the stored values.
      await this.hydrateSettings();
      // Rejected pending payments (Feature 5) survive restart.
      const rej = await repo.getSetting("rejectedClaimables");
      if (rej) {
        try {
          const obj = JSON.parse(rej) as Record<string, { reason: string; at: string }>;
          this.rejectedClaimables = new Map(Object.entries(obj));
        } catch {
          /* malformed row: start with an empty reject set */
        }
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
      this.egressXlm = 0; // SEC-01: outflow budget resets with the trading day
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
    // Persist best-effort so logs survive a restart. CRITICAL re-entrancy guard:
    // persist's shared catch reports a write failure THROUGH this.log("error",...),
    // and that error log would itself try to persist - so a DB failing every
    // write would amplify one bad insert into an unbounded queue of failing
    // inserts. We therefore handle a log-insert failure HERE (console.error,
    // never rethrown) so it never reaches persist's catch and never routes back
    // through store.log. The persistingLog flag additionally drops any log
    // emitted while we are mid-handling, as belt-and-suspenders.
    if (!this.persistingLog) {
      const id = randomUUID();
      this.persist(async () => {
        try {
          await repo.insertLog(entry, id);
        } catch (err) {
          this.persistingLog = true;
          console.error(`Log persistence failed: ${(err as Error).message}`);
          this.persistingLog = false;
        }
      });
    }
  }

  /** Append a structured TRADE-log entry (append-only): ring + persist + SSE. */
  logTrade(e: Omit<TradeLogEntry, "id" | "ts"> & { id?: string; ts?: string }): TradeLogEntry {
    const entry: TradeLogEntry = {
      ...e,
      id: e.id ?? randomUUID(),
      ts: e.ts ?? new Date().toISOString(),
    };
    this.tradeLog.unshift(entry);
    if (this.tradeLog.length > MAX_TRADELOG_MEM) this.tradeLog.length = MAX_TRADELOG_MEM;
    this.emit("tradelog", entry);
    this.persist(() => repo.insertTradeLog(entry));
    return entry;
  }

  /** Append a structured AI-log entry (append-only): ring + persist + SSE. */
  logAi(e: Omit<AiLogEntry, "id" | "ts"> & { id?: string; ts?: string }): AiLogEntry {
    const entry: AiLogEntry = {
      ...e,
      id: e.id ?? randomUUID(),
      ts: e.ts ?? new Date().toISOString(),
    };
    this.aiLog.unshift(entry);
    if (this.aiLog.length > MAX_AILOG_MEM) this.aiLog.length = MAX_AILOG_MEM;
    this.emit("ailog", entry);
    this.persist(() => repo.insertAiLog(entry));
    return entry;
  }

  /** Paginated trade-log page (DB when available, else the in-memory ring). */
  async getTradeLogPage(q: repo.TradeLogQuery): Promise<TradeLogPage> {
    if (dbReady()) return repo.listTradeLog(q);
    const f = this.tradeLog.filter(
      (r) =>
        (!q.initiator || r.initiator === q.initiator) &&
        (!q.action || r.action === q.action) &&
        (!q.token || r.baseAsset === q.token) &&
        (!q.from || r.ts >= q.from) &&
        (!q.to || r.ts <= q.to),
    );
    return { rows: f.slice(q.offset, q.offset + q.limit), total: f.length, limit: q.limit, offset: q.offset };
  }

  /** Paginated AI-log page (DB when available, else the in-memory ring). */
  async getAiLogPage(q: repo.AiLogQuery): Promise<AiLogPage> {
    if (dbReady()) return repo.listAiLog(q);
    const f = this.aiLog.filter(
      (r) =>
        (!q.eventType || r.eventType === q.eventType) &&
        (!q.token || r.baseAsset === q.token) &&
        (!q.from || r.ts >= q.from) &&
        (!q.to || r.ts <= q.to),
    );
    return { rows: f.slice(q.offset, q.offset + q.limit), total: f.length, limit: q.limit, offset: q.offset };
  }

  /** Last N combined trade+AI events (newest first) for the live log on mount. */
  async recentLogEvents(
    n = LIVE_LOG_N,
  ): Promise<{ trades: TradeLogEntry[]; ai: AiLogEntry[] }> {
    const [t, a] = await Promise.all([
      this.getTradeLogPage({ limit: n, offset: 0 }),
      this.getAiLogPage({ limit: n, offset: 0 }),
    ]);
    return { trades: t.rows, ai: a.rows };
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

  /** SEC-01: XLM-equiv sent out of the wallet so far today (MAX_DAILY_EGRESS). */
  getEgressTodayXlm(): number {
    this.rolloverDay();
    return this.egressXlm;
  }

  /** SEC-01: record a successful wallet outflow against today's egress budget. */
  recordEgress(xlm: number): void {
    this.rolloverDay();
    if (Number.isFinite(xlm) && xlm > 0) this.egressXlm = round7(this.egressXlm + xlm);
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

  /**
   * SEC-10: false until the position monitor marks open positions at least once
   * THIS process. The daily-loss breaker's unrealized term is 0 until then, so
   * an unattended AI entry at boot could slip past a loss limit a marked book
   * would have tripped. The orchestrator fails closed on auto-entries while this
   * is false and positions exist. Set on every monitor mark (below).
   */
  marksFresh = false;

  /** Update the mark-to-market PnL of open positions (called by the monitor). */
  setUnrealizedPnl(v: number): void {
    // Mark freshness regardless of whether the value changed - a mark of 0 (no
    // positions, or break-even) still proves the monitor has run this process.
    this.marksFresh = true;
    const next = round7(v);
    if (Math.abs(next - this.unrealizedPnl) < 1e-7) return;
    this.unrealizedPnl = next;
    this.emit("state", this.snapshot());
  }

  /** Read-only view of the live proposal list (newest first). */
  listProposals(): TradeProposal[] {
    return [...this.proposals];
  }

  /* ---------------------------------------------------------------- *
   * Stop-loss records. The StopLossService owns the business rules
   * (trail direction, conflict resolution, validation); the store only
   * holds the in-memory active set, persists (skipping paper), and emits.
   * ---------------------------------------------------------------- */

  /** Active stop losses, optionally filtered to a pair. */
  getActiveStopLosses(base?: string, quote?: string): StopLoss[] {
    return this.stopLosses.filter(
      (s) =>
        s.status === "active" &&
        (!base || s.baseAsset === base) &&
        (!quote || s.quoteAsset === quote),
    );
  }

  getStopLoss(id: string): StopLoss | undefined {
    return this.stopLosses.find((s) => s.id === id);
  }

  /** Add a NEW active stop loss to the live set and persist it. */
  recordStopLoss(s: StopLoss): void {
    this.stopLosses.unshift(s);
    if (!this.paperTrading) this.persist(() => repo.insertStopLoss(s));
    this.emit("state", this.snapshot());
  }

  /** Persist mutations to an existing stop loss (already mutated in place by the
   *  service). Terminal stops are pruned from the live active set after saving. */
  saveStopLoss(s: StopLoss): void {
    if (!this.paperTrading) this.persist(() => repo.updateStopLoss(s));
    if (s.status !== "active") {
      this.stopLosses = this.stopLosses.filter((x) => x.id !== s.id);
    }
    this.emit("state", this.snapshot());
  }

  /** Append an immutable audit row (best-effort persist + small in-memory ring). */
  recordStopLossAudit(a: StopLossAuditRow): void {
    this.stopLossAudit.unshift(a);
    if (this.stopLossAudit.length > MAX_AUDIT_MEM) {
      this.stopLossAudit.length = MAX_AUDIT_MEM;
    }
    if (!this.paperTrading) this.persist(() => repo.insertStopLossAudit(a));
  }

  /** Paginated audit history. SQL Server when connected, else the memory ring. */
  async getStopLossAuditPage(opts: {
    base?: string;
    quote?: string;
    limit: number;
    offset: number;
  }): Promise<StopLossAuditPage> {
    if (dbReady()) return repo.listStopLossAudit(opts);
    const limit = Math.min(Math.max(opts.limit, 1), 500);
    const offset = Math.max(opts.offset, 0);
    const filtered = this.stopLossAudit.filter(
      (a) =>
        (!opts.base || a.baseAsset === opts.base) &&
        (!opts.quote || a.quoteAsset === opts.quote),
    );
    return { rows: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset };
  }

  /* ---------------------------------------------------------------- *
   * Price alerts (observe-only). The position monitor checks active alerts
   * each tick and fires a one-off 'alert' SSE event (browser notifications).
   * ---------------------------------------------------------------- */

  getActivePriceAlerts(base?: string, quote?: string): PriceAlert[] {
    return this.priceAlerts.filter(
      (a) =>
        a.status === "active" &&
        (!base || a.baseAsset === base) &&
        (!quote || a.quoteAsset === quote),
    );
  }

  getPriceAlert(id: string): PriceAlert | undefined {
    return this.priceAlerts.find((a) => a.id === id);
  }

  recordPriceAlert(a: PriceAlert): void {
    this.priceAlerts.unshift(a);
    this.persist(() => repo.insertPriceAlert(a));
    this.emit("state", this.snapshot());
  }

  /** Persist a mutated alert; prune terminal ones from the live set. */
  savePriceAlert(a: PriceAlert): void {
    this.persist(() => repo.updatePriceAlert(a));
    if (a.status !== "active") {
      this.priceAlerts = this.priceAlerts.filter((x) => x.id !== a.id);
    }
    this.emit("state", this.snapshot());
  }

  /** Emit a one-off 'alert' SSE event (drives browser notifications). */
  emitAlert(payload: unknown): void {
    this.emit("alert", payload);
  }

  /* ---------------------------------------------------------------- *
   * Liquidity scanner (observe-only). Only the small top-N rec list
   * rides the SSE 'state' event; the long history is DB-backed and served
   * via GET /api/liquidity, never broadcast.
   * ---------------------------------------------------------------- */

  /** Persist one hourly observation (no emit; the scanner emits once via setLiquidityRecs). */
  recordLiquiditySnapshot(row: LiquiditySnapshotRow): void {
    this.liquidityMem.push(row);
    if (this.liquidityMem.length > MAX_LIQUIDITY_MEM) {
      this.liquidityMem.splice(0, this.liquidityMem.length - MAX_LIQUIDITY_MEM);
    }
    this.persist(() => repo.insertLiquiditySnapshot(row, randomUUID()));
  }

  /** Publish the current top-N recommendations to the dashboard (single emit). */
  setLiquidityRecs(recs: LiquidityRec[]): void {
    this.liquidityRecs = recs;
    this.emit("state", this.snapshot());
  }

  getLiquidityRecs(): LiquidityRec[] {
    return this.liquidityRecs;
  }

  /** Liquidity history (for the analyzer + GET /api/liquidity). DB or memory. */
  async getLiquidityHistory(opts: {
    since?: string;
    asset?: string;
  }): Promise<LiquiditySnapshotRow[]> {
    if (dbReady()) return repo.listLiquiditySnapshots(opts);
    return this.liquidityMem.filter(
      (r) =>
        (!opts.asset || r.asset === opts.asset) && (!opts.since || r.ts >= opts.since),
    );
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

  /** Paginated, filterable log history. SQL Server when connected, else memory. */
  async getLogsPage(opts: {
    limit: number;
    offset: number;
    level?: string;
    q?: string;
    since?: string;
  }): Promise<LogsPage> {
    if (dbReady()) return repo.listLogs(opts);
    const limit = Math.min(Math.max(opts.limit, 1), 500);
    const offset = Math.max(opts.offset, 0);
    const q = opts.q ? opts.q.toLowerCase() : undefined;
    // this.logs is already newest-first, matching the DB's ORDER BY ts DESC.
    const filtered = this.logs.filter((l) => {
      if (opts.level && l.level !== opts.level) return false;
      if (q && !l.message.toLowerCase().includes(q)) return false;
      if (opts.since && l.ts < opts.since) return false;
      return true;
    });
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

  /** Set the AI risk profile (validated/coerced), persist it, take effect on
   *  the NEXT proposal (the policy/orchestrator read it live). */
  setRiskProfile(profile: unknown): RiskProfile {
    this.riskProfile = coerceRiskProfile(profile);
    this.persist(() => repo.upsertSetting("riskProfile", JSON.stringify(this.riskProfile)));
    const highs = Object.entries(this.riskProfile)
      .filter(([, v]) => v === "high")
      .map(([k]) => k);
    this.log(
      "ai",
      `Risk profile updated: ${JSON.stringify(this.riskProfile)}` +
        (highs.length ? ` (HIGH: ${highs.join(", ")})` : ""),
    );
    this.emit("state", this.snapshot());
    return this.riskProfile;
  }

  // --- Feature 5: rejected pending payments ---
  /** Ids of locally-rejected pending payments (for filtering the list). */
  rejectedClaimableIds(): Set<string> {
    return new Set(this.rejectedClaimables.keys());
  }
  /** The reason a pending payment was rejected, if any. */
  rejectedClaimableReason(id: string): string | undefined {
    return this.rejectedClaimables.get(id)?.reason;
  }
  /** Reject (locally hide) a pending payment. Persisted; logged with provenance. */
  rejectClaimable(id: string, info: { asset: string; amount: string }, reason: string): void {
    this.rejectedClaimables.set(id, { reason, at: new Date().toISOString() });
    this.persistRejectedClaimables();
    this.log(
      "trade",
      `Pending payment rejected: ${info.amount} ${info.asset.split(":")[0]} ` +
        `(${id.slice(0, 12)}) - ${reason}. It stays unclaimed.`,
    );
    this.emit("state", this.snapshot());
  }
  /** Un-reject a pending payment (it reappears in the default list). */
  unrejectClaimable(id: string): void {
    if (!this.rejectedClaimables.delete(id)) return;
    this.persistRejectedClaimables();
    this.log("info", `Pending payment ${id.slice(0, 12)} un-rejected.`);
    this.emit("state", this.snapshot());
  }
  private persistRejectedClaimables(): void {
    const obj: Record<string, { reason: string; at: string }> = {};
    for (const [k, v] of this.rejectedClaimables) obj[k] = v;
    this.persist(() => repo.upsertSetting("rejectedClaimables", JSON.stringify(obj)));
  }

  /**
   * Feature 2 — change one operational setting at runtime. Validated + clamped
   * by the catalog, written into the live `config` (every consumer reads config
   * at call time, so it applies on the next read), persisted to dbo.Settings and
   * broadcast. Returns the coerced value. Throws on an unknown key / bad type so
   * the endpoint can answer 400. The caller restarts the affected loop (if any).
   */
  applySetting(key: string, raw: unknown): SettingValue {
    const r = coerceSetting(key, raw);
    if (!r.ok) throw new Error(r.error);
    applySettingToConfig(key, r.value);
    this.persist(() =>
      repo.upsertSetting(settingStorageKey(key), serializeSetting(r.value)),
    );
    this.log("info", `Setting "${key}" changed to ${r.value}.`);
    this.emit("state", this.snapshot());
    return r.value;
  }

  /** Feature 2 — restore one setting to the value the process booted with. */
  resetSetting(key: string): SettingValue {
    const def = settingDefault(key);
    if (def === undefined) throw new Error(`Unknown setting "${key}".`);
    return this.applySetting(key, def);
  }

  /**
   * Feature 2 — hydrate persisted setting overrides into `config` at boot. Runs
   * BEFORE the loops start so they pick up overridden intervals. Bad rows are
   * skipped (the boot-time default stands). No persist/emit (this IS the load).
   */
  private async hydrateSettings(): Promise<void> {
    let applied = 0;
    for (const key of settingKeys()) {
      try {
        const stored = await repo.getSetting(settingStorageKey(key));
        if (stored == null) continue;
        const r = coerceSetting(key, stored);
        if (r.ok) {
          applySettingToConfig(key, r.value);
          applied++;
        }
      } catch {
        /* skip a malformed/unreadable row; keep the boot default */
      }
    }
    if (applied > 0) this.log("info", `Applied ${applied} persisted setting override(s).`);
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

  /** Feature 1: pause/resume the AI trading loop. Persisted; survives restart. */
  setAiEnabled(enabled: boolean): boolean {
    if (this.aiEnabled === enabled) return this.aiEnabled;
    this.aiEnabled = enabled;
    this.persist(() => repo.upsertSetting("aiEnabled", enabled ? "true" : "false"));
    this.log(
      "warn",
      enabled
        ? "AI trading ENABLED - the analyst will generate proposals again."
        : "AI trading PAUSED - no AI proposals, orders or AI stop losses (scanner, stop-loss monitor and manual trading continue).",
    );
    this.emit("state", this.snapshot());
    return this.aiEnabled;
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

  /** SEC-26: current live SSE subscriber count (for the connection cap). */
  subscriberCount(): number {
    return this.subscribers.size;
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
      stopLosses: this.stopLosses,
      liquidityRecs: this.liquidityRecs,
      priceAlerts: this.priceAlerts.filter((a) => a.status === "active"),
      riskProfile: this.riskProfile,
      aiEnabled: this.aiEnabled,
      // Feature 2: live values of every UI-editable operational setting, so the
      // Settings panel + dependent components (e.g. wallet refresh) react.
      settings: currentSettingsMap(),
    };
  }
}

export const store = new Store();
