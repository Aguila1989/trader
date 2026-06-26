import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, withToken } from "../api";
import type {
  Balance,
  Candle,
  ClaimableBalanceInfo,
  DailyState,
  EvolutionPoint,
  LogEntry,
  LogsPage,
  ManualOrderInput,
  MarketSnapshot,
  AiLogEntry,
  OpenOffer,
  OrderbookSnapshot,
  PortfolioResponse,
  RiskProfile,
  SettingMeta,
  SwapAllItem,
  SwapAllResult,
  SwapAssessment,
  TradeLogEntry,
  Snapshot,
  StopLossAuditPage,
  SwapQuote,
  TradeProposal,
  TradesPage,
  TrustlineInfo,
  UniverseToken,
} from "../types";

type Timeframe = "hour" | "day" | "week" | "year";
const TIMEFRAMES: Record<Timeframe, { resolution: number; limit: number }> = {
  hour: { resolution: 3_600_000, limit: 24 },
  day: { resolution: 86_400_000, limit: 30 },
  week: { resolution: 604_800_000, limit: 52 },
  year: { resolution: 86_400_000, limit: 365 },
};

const MAX_LOGS = 200;

/** One combined live-log item, tagged by which structured stream it came from. */
export type LiveLogItem =
  | { stream: "trade"; entry: TradeLogEntry }
  | { stream: "ai"; entry: AiLogEntry };

export const useTraderStore = defineStore("trader", () => {
  // --- live state mirrored from the backend ---
  const snapshot = ref<Snapshot | null>(null);
  const connected = ref(false);

  // --- market + analysis (on demand) ---
  const market = ref<MarketSnapshot | null>(null);
  const marketError = ref("");
  const reasoning = ref("");
  const analyzing = ref(false);
  const scanning = ref(false);
  const balances = ref<Balance[]>([]);
  const trustlines = ref<TrustlineInfo[]>([]);
  const trustlineError = ref("");
  // --- wallet (send / swap / claimable) ---
  const claimables = ref<ClaimableBalanceInfo[]>([]);
  // Feature 5: when true, the pending list also includes locally-rejected ones.
  const showRejectedClaimables = ref(false);
  const walletError = ref("");
  const swapQuoteResult = ref<SwapQuote | null>(null);
  const portfolio = ref<PortfolioResponse | null>(null);
  const portfolioLoading = ref(false);
  const alertError = ref("");

  // --- Feature 2: operational settings catalog (metadata + bounds) ---
  // The catalog (labels/bounds/defaults) is static; current VALUES ride the
  // snapshot (snapshot.settings) so they stay live. Loaded once on init.
  const settingsCatalog = ref<SettingMeta[]>([]);
  const settingsError = ref("");

  // --- tradeable token universe (drives the asset dropdowns) ---
  const universe = ref<UniverseToken[]>([]);

  // --- open orders (resting offers) ---
  const openOffers = ref<OpenOffer[]>([]);

  // --- active dashboard tab (persisted) ---
  const TAB_KEY = "trader_active_tab";
  type MainTab = "manual" | "bot" | "logs";
  function readTab(): MainTab {
    try {
      const t = localStorage.getItem(TAB_KEY);
      return t === "bot" || t === "logs" ? t : "manual";
    } catch {
      return "manual";
    }
  }
  const activeTab = ref<MainTab>(readTab());
  function setActiveTab(tab: MainTab): void {
    activeTab.value = tab;
    try {
      localStorage.setItem(TAB_KEY, tab);
    } catch {
      /* private mode / storage disabled — tab still works for the session */
    }
  }
  // Deep-link target for "click a live-log entry -> open it in the Logs tab".
  const logsFocus = ref<{ sub: "trade" | "ai"; id: string } | null>(null);
  function focusLog(sub: "trade" | "ai", id: string): void {
    logsFocus.value = { sub, id };
    setActiveTab("logs");
  }

  // --- live log: last 20 combined trade+AI events (seeded from the persisted
  // store, then streamed; NOT a divergent buffer). ---
  const liveLog = ref<LiveLogItem[]>([]);
  const LIVE_CAP = 20;
  function pushLive(item: LiveLogItem): void {
    liveLog.value = [item, ...liveLog.value].slice(0, LIVE_CAP);
  }
  async function loadLiveLog(): Promise<void> {
    try {
      const { trades, ai } = await api.logLive(LIVE_CAP);
      const merged: LiveLogItem[] = [
        ...trades.map((entry) => ({ stream: "trade" as const, entry })),
        ...ai.map((entry) => ({ stream: "ai" as const, entry })),
      ].sort((a, b) => (a.entry.ts < b.entry.ts ? 1 : -1));
      liveLog.value = merged.slice(0, LIVE_CAP);
    } catch {
      /* leave previous */
    }
  }

  // --- manual order placement ---
  const lastOrder = ref<(TradeProposal & { error?: string }) | null>(null);
  const placingOrder = ref(false);

  // --- evolution charts + history table ---
  const evolution = ref<EvolutionPoint[]>([]);
  const tradesPage = ref<TradesPage | null>(null);
  const tradesLoading = ref(false);
  const pageLimit = ref(25);
  const pageOffset = ref(0);
  const statusFilter = ref("");

  // --- token detail view (Feature 2) ---
  // Kept in SEPARATE refs (NOT inside `snapshot`, which is clobbered wholesale
  // on every SSE 'state' push) so a state update never wipes the open view.
  const selectedToken = ref<string | null>(null);
  const selectedQuote = ref<string>("XLM");
  const tokenBook = ref<OrderbookSnapshot | null>(null);
  const tokenCandles = ref<Candle[]>([]);
  const tokenTimeframe = ref<Timeframe>("day");
  const tokenLoading = ref(false);
  const tokenError = ref("");
  // Stop-loss panel state for the detail view.
  const stopLossError = ref("");
  const stopLossAudit = ref<StopLossAuditPage | null>(null);

  // --- persisted, browsable log history ---
  const logsPage = ref<LogsPage | null>(null);
  const logsLoading = ref(false);
  const logPageLimit = ref(25);
  const logPageOffset = ref(0);
  const logLevelFilter = ref("");
  const logQuery = ref("");

  // --- derived view-model ---
  const proposals = computed(() => snapshot.value?.proposals ?? []);
  const positions = computed(() => snapshot.value?.positions ?? []);
  const liquidityRecs = computed(() => snapshot.value?.liquidityRecs ?? []);
  // Active stops live in the snapshot (replaced wholesale on each 'state' push).
  const stopLosses = computed(() => snapshot.value?.stopLosses ?? []);
  const priceAlerts = computed(() => snapshot.value?.priceAlerts ?? []);
  const riskProfile = computed<RiskProfile>(
    () =>
      snapshot.value?.riskProfile ?? {
        positionSize: "low",
        stopLossDistance: "low",
        tradeFrequency: "low",
        volatilityTolerance: "low",
        drawdownTolerance: "low",
        slippageTolerance: "low",
      },
  );
  const logs = computed(() => snapshot.value?.logs ?? []);
  const daily = computed(() => snapshot.value?.daily ?? null);
  const limits = computed(() => snapshot.value?.limits ?? null);
  const isAutoTrade = computed(() => snapshot.value?.autoApprove ?? false);
  /** Feature 1: AI trading master switch (defaults ON until the snapshot loads). */
  const aiEnabled = computed(() => snapshot.value?.aiEnabled ?? true);
  /** Feature 2: catalog merged with the live snapshot value for each setting. */
  const settings = computed<SettingMeta[]>(() => {
    const live = snapshot.value?.settings ?? {};
    return settingsCatalog.value.map((s) =>
      s.key in live ? { ...s, value: live[s.key] } : s,
    );
  });
  /** Feature 2: wallet/portfolio UI refresh cadence (seconds); floored at 5s. */
  const walletRefreshSeconds = computed(() => {
    const v = snapshot.value?.settings?.walletRefreshSeconds;
    return typeof v === "number" && v >= 5 ? v : 60;
  });
  /** Live trading armed (trades may submit on-chain). */
  const isLive = computed(() => snapshot.value?.liveTrading ?? false);
  /** Paper trading armed (simulated fills, no on-chain submit). */
  const isPaper = computed(() => snapshot.value?.paperTrading ?? false);
  /** A signing key exists, so Live trading CAN be armed. */
  const canGoLive = computed(() => snapshot.value?.secretConfigured ?? false);
  /** Effective read-only: no key OR not armed. Gates the approve buttons. */
  const isReadOnly = computed(() => snapshot.value?.readOnly ?? true);
  /** Kill switch engaged (blocks all trading, including stop-loss exits). */
  const killSwitch = computed(() => snapshot.value?.killSwitch ?? false);

  // --- token lookup helpers (shared by the asset dropdowns) ---
  const universeBySpec = computed(() => {
    const m = new Map<string, UniverseToken>();
    for (const t of universe.value) m.set(t.spec.toUpperCase(), t);
    return m;
  });
  /**
   * Describe an asset spec for display. Returns the curated universe entry when
   * known, else a bare {code, issuer} fallback (e.g. a held but unlisted asset).
   */
  function tokenFor(spec: string): UniverseToken {
    const up = (spec ?? "").toUpperCase();
    const found = universeBySpec.value.get(up);
    if (found) return found;
    if (up === "XLM" || up === "NATIVE") {
      return { spec: "XLM", code: "XLM", issuer: null, name: "Lumens", domain: "stellar.org", tier: "high" };
    }
    const [code, issuer] = (spec ?? "").split(":");
    return { spec, code: code || spec, issuer: issuer ?? null, name: "", domain: null, tier: null };
  }
  /** Funded holdings as token options (for "things you already hold" pickers). */
  const heldTokens = computed<UniverseToken[]>(() =>
    balances.value
      .filter((b) => Number(b.balance) > 0 && !b.asset.startsWith("LP:"))
      .map((b) => tokenFor(b.asset)),
  );
  /** Held balance for a spec as a number (0 when not held). Case-insensitive. */
  function heldBalance(spec: string): number {
    const up = (spec ?? "").toUpperCase();
    const b = balances.value.find((x) => x.asset.toUpperCase() === up);
    return b ? Number(b.balance) : 0;
  }

  const modeLabel = computed(() => {
    const s = snapshot.value;
    if (!s) return "...";
    return s.autoApprove ? "AUTO-TRADE" : "approve every trade";
  });

  // --- bootstrap ---
  async function init(): Promise<void> {
    try {
      snapshot.value = await api.state();
    } catch {
      /* backend may not be up yet; SSE will fill in */
    }
    void loadUniverse();
    void loadBalances();
    void loadOffers();
    void loadLiveLog();
    void loadTrustlines();
    void loadClaimables();
    void loadPortfolio();
    void loadEvolution();
    void loadTrades();
    void loadLogs();
    void loadSettings();
    connectStream();
  }

  // SSE connection + self-healing. Two failure modes to handle:
  //  1. EventSource gives up permanently if the FIRST handshake returns an HTTP
  //     error (backend still starting / restarting) - it won't retry on its own.
  //  2. Behind a dev proxy, a dead backend can leave the client socket
  //     HALF-OPEN: no `error` ever fires, the page looks "live" but receives
  //     nothing. EventSource also can't see SSE heartbeat *comments*.
  // So we drive reconnects ourselves (capped backoff) AND run a liveness
  // watchdog off a real `ping` event. Either way the feed recovers with no
  // manual refresh.
  const BEAT_TIMEOUT_MS = 12_000; // server pings every 5s; miss ~2 => reconnect
  let es: EventSource | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let watchdog: ReturnType<typeof setInterval> | null = null;
  let reconnectDelay = 1000;
  let lastBeat = 0;

  // Any traffic (event OR heartbeat) means the stream is alive.
  function markAlive(): void {
    lastBeat = Date.now();
    connected.value = true;
  }

  function scheduleReconnect(): void {
    if (reconnectTimer) return; // one pending attempt at a time
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectStream();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 10_000); // 1s,2s,4s,8s,10s...
  }

  function startWatchdog(): void {
    if (watchdog) return;
    watchdog = setInterval(() => {
      if (reconnectTimer) return; // already reconnecting
      if (lastBeat && Date.now() - lastBeat > BEAT_TIMEOUT_MS) {
        // Heartbeats stopped: treat the silent stream as dead and rebuild it.
        connected.value = false;
        es?.close();
        es = null;
        scheduleReconnect();
      }
    }, 4000);
  }

  function connectStream(): void {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    es?.close();

    es = new EventSource(withToken("/api/stream"));
    startWatchdog();
    es.addEventListener("open", () => {
      markAlive();
      reconnectDelay = 1000; // reset backoff once we have a healthy stream
    });
    es.addEventListener("ping", () => markAlive());
    es.addEventListener("state", (ev) => {
      // The server pushes a fresh state on every (re)connect, so this also
      // resyncs the whole snapshot after a reconnect - no refresh needed.
      snapshot.value = JSON.parse((ev as MessageEvent).data) as Snapshot;
      markAlive();
    });
    es.addEventListener("daily", (ev) => {
      markAlive();
      if (!snapshot.value) return;
      snapshot.value.daily = JSON.parse((ev as MessageEvent).data) as DailyState;
    });
    es.addEventListener("alert", (ev) => {
      markAlive();
      try {
        const a = JSON.parse((ev as MessageEvent).data) as {
          pair: string;
          direction: string;
          price: string;
          mid: string;
        };
        const body = `${a.pair} crossed ${a.direction} ${a.price} (now ${a.mid})`;
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("Price alert", { body });
        }
      } catch {
        /* ignore malformed alert payloads */
      }
    });
    es.addEventListener("log", (ev) => {
      markAlive();
      if (!snapshot.value) return;
      const entry = JSON.parse((ev as MessageEvent).data) as LogEntry;
      snapshot.value.logs.unshift(entry);
      if (snapshot.value.logs.length > MAX_LOGS) {
        snapshot.value.logs.length = MAX_LOGS;
      }
      // Keep the persisted history fresh, but only when the user is viewing
      // the unfiltered first page (otherwise we'd yank their view around).
      if (logPageOffset.value === 0 && !logLevelFilter.value && !logQuery.value) {
        void loadLogs();
      }
    });
    es.addEventListener("tradelog", (ev) => {
      markAlive();
      try {
        pushLive({ stream: "trade", entry: JSON.parse((ev as MessageEvent).data) as TradeLogEntry });
      } catch {
        /* ignore malformed payloads */
      }
    });
    es.addEventListener("ailog", (ev) => {
      markAlive();
      try {
        pushLive({ stream: "ai", entry: JSON.parse((ev as MessageEvent).data) as AiLogEntry });
      } catch {
        /* ignore malformed payloads */
      }
    });
    es.addEventListener("proposal", (ev) => {
      markAlive();
      if (!snapshot.value) return;
      const p = JSON.parse((ev as MessageEvent).data) as TradeProposal;
      const list = snapshot.value.proposals;
      const i = list.findIndex((x) => x.id === p.id);
      if (i >= 0) list[i] = p;
      else list.unshift(p);
      // Keep the persisted views fresh as proposals progress.
      void loadTrades();
      if (p.status === "submitted") void loadEvolution();
    });
    es.onerror = () => {
      connected.value = false;
      // Don't trust EventSource's built-in retry - drive it ourselves so a
      // backend restart or a slow first start always recovers.
      es?.close();
      es = null;
      scheduleReconnect();
    };
  }

  // --- toggles ---
  async function setAutoApprove(enabled: boolean): Promise<void> {
    await api.setAutoApprove(enabled);
  }
  /** Update the AI risk profile; the SSE 'state' push refreshes the snapshot. */
  async function setRiskProfile(profile: RiskProfile): Promise<void> {
    await api.setRiskProfile(profile);
  }
  /** Feature 1: pause/resume the AI trading loop. */
  async function setAiEnabled(enabled: boolean): Promise<void> {
    await api.setAiEnabled(enabled);
  }
  // --- Feature 2: operational settings ---
  /** Load the settings catalog (metadata + bounds). Current values stay live
   *  via the SSE snapshot, so this is a one-time fetch. */
  async function loadSettings(): Promise<void> {
    try {
      settingsError.value = "";
      settingsCatalog.value = (await api.getSettings()).settings;
    } catch (err) {
      settingsError.value = (err as Error).message;
    }
  }
  /** Change one setting; the SSE 'state' push refreshes the live value. */
  async function setSetting(key: string, value: number | boolean): Promise<void> {
    settingsError.value = "";
    try {
      await api.setSetting(key, value);
    } catch (err) {
      settingsError.value = (err as Error).message;
      throw err;
    }
  }
  /** Restore one setting to its boot-time default. */
  async function resetSetting(key: string): Promise<void> {
    settingsError.value = "";
    try {
      await api.resetSetting(key);
    } catch (err) {
      settingsError.value = (err as Error).message;
      throw err;
    }
  }
  async function setLiveTrading(enabled: boolean): Promise<void> {
    await api.setLiveTrading(enabled);
  }
  async function setPaperTrading(enabled: boolean): Promise<void> {
    await api.setPaperTrading(enabled);
  }
  async function setKill(active: boolean): Promise<void> {
    await api.setKill(active);
  }
  /** Switch the active AI provider (only ones with a configured key). */
  async function switchProvider(id: string): Promise<void> {
    await api.setProvider(id);
  }

  // --- proposal actions ---
  async function approve(id: string): Promise<void> {
    await api.approve(id);
  }
  async function reject(id: string): Promise<void> {
    await api.reject(id);
  }

  // Place a manual limit order. Goes through the SAME risk gates as
  // AI-proposed trades, so it can come back blocked/failed; the returned
  // proposal (or { error }) is stashed in lastOrder for the UI to surface.
  async function placeOrder(
    input: ManualOrderInput,
  ): Promise<TradeProposal & { error?: string }> {
    placingOrder.value = true;
    try {
      const proposal = await api.placeOrder(input);
      lastOrder.value = proposal;
      return proposal;
    } finally {
      placingOrder.value = false;
    }
  }

  // --- market + analysis ---
  async function refreshMarket(base: string, quote: string): Promise<void> {
    marketError.value = "";
    try {
      const m = await api.market(base || "XLM", quote);
      if (m.error) {
        marketError.value = m.error;
        return;
      }
      market.value = m;
    } catch (err) {
      marketError.value = (err as Error).message;
    }
  }

  async function analyze(base: string, quote: string): Promise<void> {
    analyzing.value = true;
    reasoning.value = `Analyzing ${base || "XLM"}/${quote}...`;
    try {
      const out = await api.analyze(base || "XLM", quote);
      reasoning.value = out.error
        ? `Error: ${out.error}`
        : out.reasoning || "(no commentary)";
    } catch (err) {
      reasoning.value = `Request failed: ${(err as Error).message}`;
    } finally {
      analyzing.value = false;
    }
  }

  // Scan the curated universe of reputable tokens against XLM in one shot.
  async function scanChain(): Promise<void> {
    scanning.value = true;
    reasoning.value = "Scanning the chain for opportunities...";
    try {
      const out = await api.scan();
      if (out.error) {
        reasoning.value = `Error: ${out.error}`;
        return;
      }
      const n = out.scanned ?? 0;
      const made = out.proposals?.length ?? 0;
      reasoning.value =
        (out.reasoning || "(no commentary)") +
        `\n\n— scanned ${n} market(s), ${made} proposal(s).`;
    } catch (err) {
      reasoning.value = `Scan failed: ${(err as Error).message}`;
    } finally {
      scanning.value = false;
    }
  }

  // --- token detail view ---
  // Navigate into a token's detail view. `asset` is the full "CODE:ISSUER".
  function openToken(asset: string): void {
    selectedToken.value = asset;
    selectedQuote.value = "XLM";
    tokenBook.value = null;
    tokenCandles.value = [];
    tokenError.value = "";
    void loadTokenBook();
  }

  // Back to the dashboard (backs the "← Back" button).
  function closeToken(): void {
    selectedToken.value = null;
  }

  // Load the order book. The FIRST load (no book yet) sends no quote so the
  // backend auto-resolves the best market; later 30s polls reuse the resolved
  // quote. When the resolved quote changes, (re)load the candles to match.
  async function loadTokenBook(): Promise<void> {
    const base = selectedToken.value;
    if (!base) return;
    tokenLoading.value = true;
    try {
      const useQuote = tokenBook.value ? selectedQuote.value : undefined;
      const ob = await api.orderbook(base, useQuote);
      if (ob.error) {
        tokenError.value = ob.error;
        return;
      }
      tokenBook.value = ob;
      tokenError.value = "";
      if (ob.quote && ob.quote !== selectedQuote.value) {
        selectedQuote.value = ob.quote;
        void loadTokenCandles();
      } else if (tokenCandles.value.length === 0) {
        void loadTokenCandles();
      }
    } catch (err) {
      tokenError.value = (err as Error).message;
    } finally {
      tokenLoading.value = false;
    }
  }

  async function loadTokenCandles(): Promise<void> {
    const base = selectedToken.value;
    if (!base) return;
    const tf = TIMEFRAMES[tokenTimeframe.value];
    try {
      tokenCandles.value = await api.candles(
        base,
        selectedQuote.value,
        tf.resolution,
        tf.limit,
      );
    } catch {
      tokenCandles.value = [];
    }
  }

  function setTokenTimeframe(tf: Timeframe): void {
    tokenTimeframe.value = tf;
    void loadTokenCandles();
  }

  // --- stop-loss management (token detail) ---
  // The active list updates via the SSE 'state' push; we just refresh the audit.
  async function setStopLoss(body: {
    base: string;
    quote: string;
    triggerPrice?: string;
    sellAll?: boolean;
    quantityToSell?: string;
    notes?: string;
    stopType?: "regular" | "trailing";
    trailBy?: "amount" | "pct";
    trailValue?: string;
  }): Promise<boolean> {
    stopLossError.value = "";
    const r = await api.setStopLoss(body);
    if (r.error) {
      stopLossError.value = r.error;
      return false;
    }
    void loadStopLossAudit(body.base, body.quote);
    return true;
  }

  async function cancelStopLoss(id: string): Promise<void> {
    const base = selectedToken.value;
    await api.cancelStopLoss(id);
    if (base) void loadStopLossAudit(base, selectedQuote.value);
  }

  async function loadStopLossAudit(base: string, quote: string): Promise<void> {
    try {
      stopLossAudit.value = await api.stopLossAudit(base, quote);
    } catch {
      /* leave previous audit data */
    }
  }

  // --- data loads ---
  async function loadBalances(): Promise<void> {
    try {
      balances.value = await api.balances();
    } catch {
      balances.value = [];
    }
  }

  // Re-priced on demand and on a 60s timer from PortfolioPanel. Leaves the
  // previous data in place on error so the UI never flashes empty mid-refresh.
  async function loadPortfolio(): Promise<void> {
    portfolioLoading.value = true;
    try {
      portfolio.value = await api.portfolio();
    } catch {
      /* leave previous data */
    } finally {
      portfolioLoading.value = false;
    }
  }

  async function loadUniverse(): Promise<void> {
    try {
      universe.value = (await api.universe()).tokens;
    } catch {
      /* leave previous data; dropdowns fall back to bare codes */
    }
  }

  async function loadOffers(): Promise<void> {
    try {
      openOffers.value = await api.offers();
    } catch {
      /* leave previous data */
    }
  }

  async function cancelOffer(id: string): Promise<boolean> {
    walletError.value = "";
    const r = await api.cancelOffer(id);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    await loadOffers();
    void loadBalances();
    return true;
  }

  // --- trustlines ---
  async function loadTrustlines(): Promise<void> {
    try {
      trustlines.value = await api.trustlines();
    } catch {
      /* leave previous data */
    }
  }

  async function addTrustline(body: {
    asset?: string;
    code?: string;
    issuer?: string;
    homeDomain?: string;
  }): Promise<boolean> {
    trustlineError.value = "";
    const r = await api.addTrustline(body);
    if (r.error) {
      trustlineError.value = r.error;
      return false;
    }
    await loadTrustlines();
    void loadBalances();
    return true;
  }

  async function removeTrustline(body: {
    asset?: string;
    code?: string;
    issuer?: string;
  }): Promise<boolean> {
    trustlineError.value = "";
    const r = await api.removeTrustline(body);
    if (r.error) {
      trustlineError.value = r.error;
      return false;
    }
    await loadTrustlines();
    void loadBalances();
    return true;
  }

  // --- wallet: send / swap / claimable ---
  async function loadClaimables(): Promise<void> {
    try {
      claimables.value = await api.claimables(showRejectedClaimables.value);
    } catch {
      /* leave previous data */
    }
  }
  /** Feature 5: toggle whether rejected pending payments are shown, then reload. */
  async function setShowRejectedClaimables(show: boolean): Promise<void> {
    showRejectedClaimables.value = show;
    await loadClaimables();
  }

  async function pay(body: {
    destination: string;
    asset: string;
    amount: string;
    memo?: string;
  }): Promise<boolean> {
    walletError.value = "";
    const r = await api.pay(body);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    void loadBalances();
    return true;
  }

  async function getSwapQuote(
    send: string,
    dest: string,
    amount: string,
  ): Promise<SwapQuote | null> {
    walletError.value = "";
    try {
      const q = await api.swapQuote(send, dest, amount);
      if (q.error) {
        walletError.value = q.error;
        swapQuoteResult.value = null;
      } else {
        swapQuoteResult.value = q;
      }
    } catch (err) {
      walletError.value = (err as Error).message;
      swapQuoteResult.value = null;
    }
    return swapQuoteResult.value;
  }

  async function executeSwap(body: {
    sendAsset: string;
    sendAmount: string;
    destAsset: string;
    slippageBps?: number;
  }): Promise<boolean> {
    walletError.value = "";
    const r = await api.swap(body);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    swapQuoteResult.value = null;
    void loadBalances();
    return true;
  }

  async function claim(id: string): Promise<boolean> {
    walletError.value = "";
    const r = await api.claimBalance(id);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    await loadClaimables();
    void loadBalances();
    return true;
  }

  // --- Features 3/4/5: pending-payment swap-to-XLM / batch / reject ---
  /** Read-only assessment for ONE pending payment (estimated XLM + value loss). */
  async function claimableSwapQuote(id: string): Promise<SwapAssessment | null> {
    walletError.value = "";
    try {
      return await api.claimableSwapQuote(id);
    } catch (err) {
      walletError.value = (err as Error).message;
      return null;
    }
  }
  /** Swap ONE pending payment to XLM. force = accept a value loss above threshold. */
  async function swapClaimable(id: string, force = false): Promise<boolean> {
    walletError.value = "";
    const r = await api.swapClaimable(id, force);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    await loadClaimables();
    void loadBalances();
    return true;
  }
  /** Batch assessment for the "Swap All to XLM" summary table. */
  async function swapAllQuote(): Promise<{ items: SwapAllItem[]; threshold: number } | null> {
    walletError.value = "";
    try {
      return await api.swapAllQuote();
    } catch (err) {
      walletError.value = (err as Error).message;
      return null;
    }
  }
  /** Swap ALL (non-rejected) pending payments to XLM. Returns the batch summary. */
  async function swapAll(force = false): Promise<SwapAllResult | null> {
    walletError.value = "";
    const r = await api.swapAll(force);
    if (r.error) {
      walletError.value = r.error;
      return null;
    }
    await loadClaimables();
    void loadBalances();
    return r;
  }
  /** Reject (locally hide) a pending payment; it stays unclaimed on-chain. */
  async function rejectClaimable(id: string, reason: string): Promise<boolean> {
    walletError.value = "";
    const r = await api.rejectClaimable(id, reason);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    await loadClaimables();
    return true;
  }
  /** Un-reject a pending payment (it returns to the default list). */
  async function unrejectClaimable(id: string): Promise<boolean> {
    walletError.value = "";
    const r = await api.unrejectClaimable(id);
    if (r.error) {
      walletError.value = r.error;
      return false;
    }
    await loadClaimables();
    return true;
  }

  // --- price alerts ---
  async function setAlert(body: {
    base: string;
    quote: string;
    direction: "above" | "below";
    price: string;
    note?: string;
  }): Promise<boolean> {
    alertError.value = "";
    // Ask for notification permission so a fired alert can pop a desktop toast.
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* permission optional; the alert still fires + logs server-side */
      }
    }
    const r = await api.setAlert(body);
    if (r.error) {
      alertError.value = r.error;
      return false;
    }
    return true; // the active list refreshes via the SSE 'state' push
  }

  async function cancelAlert(id: string): Promise<void> {
    await api.cancelAlert(id);
  }

  async function loadEvolution(): Promise<void> {
    try {
      evolution.value = await api.evolution();
    } catch {
      /* leave previous data */
    }
  }

  async function loadTrades(): Promise<void> {
    tradesLoading.value = true;
    try {
      tradesPage.value = await api.trades({
        limit: pageLimit.value,
        offset: pageOffset.value,
        status: statusFilter.value || undefined,
      });
    } catch {
      /* leave previous data */
    } finally {
      tradesLoading.value = false;
    }
  }

  function setStatusFilter(status: string): void {
    statusFilter.value = status;
    pageOffset.value = 0;
    void loadTrades();
  }

  function nextPage(): void {
    const page = tradesPage.value;
    if (!page) return;
    if (pageOffset.value + pageLimit.value < page.total) {
      pageOffset.value += pageLimit.value;
      void loadTrades();
    }
  }

  function prevPage(): void {
    if (pageOffset.value > 0) {
      pageOffset.value = Math.max(0, pageOffset.value - pageLimit.value);
      void loadTrades();
    }
  }

  async function loadLogs(): Promise<void> {
    logsLoading.value = true;
    try {
      logsPage.value = await api.logs({
        limit: logPageLimit.value,
        offset: logPageOffset.value,
        level: logLevelFilter.value || undefined,
        q: logQuery.value || undefined,
      });
    } catch {
      /* leave previous data */
    } finally {
      logsLoading.value = false;
    }
  }

  function setLogLevelFilter(level: string): void {
    logLevelFilter.value = level;
    logPageOffset.value = 0;
    void loadLogs();
  }

  function setLogQuery(q: string): void {
    logQuery.value = q;
    logPageOffset.value = 0;
    void loadLogs();
  }

  function logNextPage(): void {
    const page = logsPage.value;
    if (!page) return;
    if (logPageOffset.value + logPageLimit.value < page.total) {
      logPageOffset.value += logPageLimit.value;
      void loadLogs();
    }
  }

  function logPrevPage(): void {
    if (logPageOffset.value > 0) {
      logPageOffset.value = Math.max(0, logPageOffset.value - logPageLimit.value);
      void loadLogs();
    }
  }

  return {
    snapshot,
    connected,
    market,
    marketError,
    reasoning,
    analyzing,
    scanning,
    balances,
    lastOrder,
    placingOrder,
    evolution,
    tradesPage,
    tradesLoading,
    pageLimit,
    pageOffset,
    statusFilter,
    logsPage,
    logsLoading,
    logPageLimit,
    logPageOffset,
    logLevelFilter,
    logQuery,
    selectedToken,
    selectedQuote,
    tokenBook,
    tokenCandles,
    tokenTimeframe,
    tokenLoading,
    tokenError,
    stopLossError,
    stopLossAudit,
    proposals,
    positions,
    liquidityRecs,
    stopLosses,
    priceAlerts,
    alertError,
    setAlert,
    cancelAlert,
    logs,
    daily,
    limits,
    isAutoTrade,
    isLive,
    canGoLive,
    isReadOnly,
    killSwitch,
    modeLabel,
    isPaper,
    aiEnabled,
    settings,
    settingsError,
    walletRefreshSeconds,
    loadSettings,
    setSetting,
    resetSetting,
    init,
    setAutoApprove,
    setAiEnabled,
    riskProfile,
    setRiskProfile,
    setLiveTrading,
    setPaperTrading,
    setKill,
    switchProvider,
    approve,
    reject,
    placeOrder,
    refreshMarket,
    analyze,
    scanChain,
    openToken,
    closeToken,
    loadTokenBook,
    loadTokenCandles,
    setTokenTimeframe,
    setStopLoss,
    cancelStopLoss,
    loadStopLossAudit,
    trustlines,
    trustlineError,
    loadTrustlines,
    addTrustline,
    removeTrustline,
    claimables,
    walletError,
    swapQuoteResult,
    portfolio,
    portfolioLoading,
    loadPortfolio,
    universe,
    loadUniverse,
    tokenFor,
    heldTokens,
    heldBalance,
    openOffers,
    loadOffers,
    cancelOffer,
    activeTab,
    setActiveTab,
    liveLog,
    loadLiveLog,
    logsFocus,
    focusLog,
    loadClaimables,
    showRejectedClaimables,
    setShowRejectedClaimables,
    claimableSwapQuote,
    swapClaimable,
    swapAllQuote,
    swapAll,
    rejectClaimable,
    unrejectClaimable,
    pay,
    getSwapQuote,
    executeSwap,
    claim,
    loadBalances,
    loadEvolution,
    loadTrades,
    setStatusFilter,
    nextPage,
    prevPage,
    loadLogs,
    setLogLevelFilter,
    setLogQuery,
    logNextPage,
    logPrevPage,
  };
});
