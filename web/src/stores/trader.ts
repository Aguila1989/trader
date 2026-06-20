import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { api, withToken } from "../api";
import type {
  Balance,
  DailyState,
  EvolutionPoint,
  LogEntry,
  LogsPage,
  ManualOrderInput,
  MarketSnapshot,
  Snapshot,
  TradeProposal,
  TradesPage,
} from "../types";

const MAX_LOGS = 200;

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
  const logs = computed(() => snapshot.value?.logs ?? []);
  const daily = computed(() => snapshot.value?.daily ?? null);
  const limits = computed(() => snapshot.value?.limits ?? null);
  const isAutoTrade = computed(() => snapshot.value?.autoApprove ?? false);
  /** Live trading armed (trades may submit on-chain). */
  const isLive = computed(() => snapshot.value?.liveTrading ?? false);
  /** Paper trading armed (simulated fills, no on-chain submit). */
  const isPaper = computed(() => snapshot.value?.paperTrading ?? false);
  /** A signing key exists, so Live trading CAN be armed. */
  const canGoLive = computed(() => snapshot.value?.secretConfigured ?? false);
  /** Effective read-only: no key OR not armed. Gates the approve buttons. */
  const isReadOnly = computed(() => snapshot.value?.readOnly ?? true);

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
    void loadBalances();
    void loadEvolution();
    void loadTrades();
    void loadLogs();
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

  // --- data loads ---
  async function loadBalances(): Promise<void> {
    try {
      balances.value = await api.balances();
    } catch {
      balances.value = [];
    }
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
    proposals,
    positions,
    logs,
    daily,
    limits,
    isAutoTrade,
    isLive,
    canGoLive,
    isReadOnly,
    modeLabel,
    isPaper,
    init,
    setAutoApprove,
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
