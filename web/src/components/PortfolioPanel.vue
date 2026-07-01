<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import { fmtNum, timeStr } from "../format";
import type { PortfolioHolding } from "../types";
import PortfolioHistoryChart from "./PortfolioHistoryChart.vue";

ChartJS.register(ArcElement, Tooltip, Legend);

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

// Restore clickable token rows: open the token's detail page (order book + price
// graph). The TokenDetail overlay lives on the Trading route, so ensure we're
// there — this panel is in the persistent header, reachable from any page.
function openToken(asset: string): void {
  store.openToken(asset);
  void router.push("/");
}

const PALETTE = [
  "#5b8cff", "#2fbf71", "#ffb454", "#e0607e", "#9b6bff",
  "#3bc9db", "#f06595", "#94d82d", "#ff922b", "#748ffc",
];

const totalUsd = computed(() => store.portfolio?.totalUsd ?? null);
const totalXlm = computed(() => store.portfolio?.totalXlm ?? 0);
const updatedAt = computed(() => store.portfolio?.updatedAt ?? null);

// Sizing/sorting basis: USDC value when known, else the XLM-equivalent.
function val(h: PortfolioHolding): number | null {
  return h.usdValue ?? h.xlmValue ?? null;
}

const priced = computed(() =>
  (store.portfolio?.holdings ?? [])
    .filter((h) => (val(h) ?? 0) > 0)
    .sort((a, b) => (val(b) ?? 0) - (val(a) ?? 0)),
);
const unpriced = computed(() =>
  (store.portfolio?.holdings ?? []).filter((h) => val(h) == null),
);
// Priced first (largest value), then any token we couldn't price.
const rows = computed(() => [...priced.value, ...unpriced.value]);

const totalForPct = computed(() =>
  priced.value.reduce((s, h) => s + (val(h) ?? 0), 0),
);
function pct(h: PortfolioHolding): string {
  const v = val(h);
  if (v == null || totalForPct.value <= 0) return "-";
  return `${((v / totalForPct.value) * 100).toFixed(1)}%`;
}
// The Price/Value columns are USDC-denominated, so they show a USDC figure or
// the no-price fallback — never an XLM string under a "(USDC)" header. The
// XLM-equivalent still surfaces in the prominent total ("≈ … XLM").
function priceCell(h: PortfolioHolding): string {
  return h.priceUsd != null ? fmtNum(h.priceUsd, 6) : `— ${t("portfolio.noPriceData")}`;
}
function valueCell(h: PortfolioHolding): string {
  return h.usdValue != null ? fmtNum(h.usdValue, 2) : `— ${t("portfolio.noPriceData")}`;
}
function noPrice(h: PortfolioHolding): boolean {
  return h.usdValue == null;
}

// --- 5%-since-last-refresh highlight ---------------------------------------
// Track the per-unit price seen on the PREVIOUS refresh and diff against it.
const baseline = ref<Map<string, number>>(new Map());
const changePct = ref<Record<string, number>>({});
watch(
  () => store.portfolio?.updatedAt,
  () => {
    const cur = new Map<string, number>();
    const ch: Record<string, number> = {};
    for (const h of store.portfolio?.holdings ?? []) {
      const p = h.priceUsd ?? h.priceXlm;
      if (p == null) continue;
      cur.set(h.asset, p);
      const prev = baseline.value.get(h.asset);
      if (prev != null && prev > 0) ch[h.asset] = ((p - prev) / prev) * 100;
    }
    changePct.value = ch;
    baseline.value = cur;
  },
  { immediate: true },
);
function changeClass(h: PortfolioHolding): string {
  const c = changePct.value[h.asset];
  if (c == null) return "";
  if (c > 5) return "chg-up";
  if (c < -5) return "chg-down";
  return "";
}

// --- refresh (manual + 60s auto) -------------------------------------------
function refresh(): void {
  void store.loadPortfolio();
  void store.loadBalances();
}
// Feature 2: the refresh cadence is a live, UI-configurable setting. Re-arm the
// timer whenever it changes (and floor at 5s, matching the backend bound).
let timer: ReturnType<typeof setInterval> | null = null;
function arm(seconds: number): void {
  if (timer) clearInterval(timer);
  timer = setInterval(refresh, Math.max(5, seconds) * 1000);
}
onMounted(() => {
  arm(store.walletRefreshSeconds);
});
watch(
  () => store.walletRefreshSeconds,
  (s) => arm(s),
);
onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: priced.value.map((h) => store.tokenFor(h.asset).code),
  datasets: [
    {
      data: priced.value.map((h) => val(h) ?? 0),
      backgroundColor: priced.value.map((_, i) => PALETTE[i % PALETTE.length]),
      borderColor: "#0e1726",
      borderWidth: 2,
    },
  ],
}));

const options: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: "right", labels: { color: "#8595ab", boxWidth: 12 } },
  },
};
</script>

<template>
  <section class="panel">
    <h2>{{ t("portfolio.title") }}</h2>

    <div class="pf-total-head">
      <span class="pf-total-value">
        {{ totalUsd != null ? fmtNum(totalUsd, 2) + " USDC" : fmtNum(totalXlm) + " XLM" }}
      </span>
      <span class="pf-total-sub">
        {{ t("portfolio.totalValue") }}<template v-if="totalUsd != null"> · ≈ {{ fmtNum(totalXlm) }} XLM</template>
      </span>
    </div>
    <div class="pf-meta">
      <span class="muted">{{ t("portfolio.updated") }} {{ timeStr(updatedAt) }}</span>
      <span v-if="store.portfolioLoading" class="muted">{{ t("portfolio.refreshing") }}</span>
      <button class="btn pf-refresh" :disabled="store.portfolioLoading" @click="refresh">
        {{ t("portfolio.refresh") }}
      </button>
    </div>

    <p v-if="rows.length === 0" class="muted">
      {{ t("portfolio.empty") }}
    </p>

    <div v-else class="pf-body">
      <div v-if="priced.length" class="chart-box pf-chart">
        <Doughnut :data="chartData" :options="options" />
      </div>
      <div class="pf-table-wrap">
        <table class="pf-table">
          <thead>
            <tr>
              <th>{{ t("portfolio.col.token") }}</th>
              <th class="num">{{ t("portfolio.col.balance") }}</th>
              <th class="num">{{ t("portfolio.col.price") }} (USDC)</th>
              <th class="num">{{ t("portfolio.col.value") }} (USDC)</th>
              <th class="num">{{ t("portfolio.col.percent") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="h in rows"
              :key="h.asset"
              class="pf-row pf-row-click"
              :class="changeClass(h)"
              role="button"
              tabindex="0"
              :title="t('portfolio.openDetail', { code: store.tokenFor(h.asset).code })"
              @click="openToken(h.asset)"
              @keydown.enter="openToken(h.asset)"
            >
              <td :title="h.asset">{{ store.tokenFor(h.asset).code }}</td>
              <td class="num">{{ fmtNum(h.balance) }}</td>
              <td class="num" :class="{ 'pf-noprice': noPrice(h) }">{{ priceCell(h) }}</td>
              <td class="num pf-value" :class="{ 'pf-noprice': noPrice(h) }">{{ valueCell(h) }}</td>
              <td class="num">{{ pct(h) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- FIX 2: value-over-time graph, part of the same portfolio card. -->
    <PortfolioHistoryChart />
  </section>
</template>

<style scoped>
.pf-chart {
  flex: 1 1 220px;
  min-width: 220px;
  height: 220px;
}
.pf-body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
}
.pf-table-wrap {
  flex: 2 1 320px;
  overflow-x: auto;
}
.pf-refresh {
  padding: 3px 12px;
  font-size: 12px;
}
/* Clickable token rows → token detail page (order book + price graph). */
.pf-row-click {
  cursor: pointer;
}
.pf-row-click:hover td,
.pf-row-click:focus-visible td {
  background: rgba(91, 140, 255, 0.1);
}
.pf-row-click:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}
</style>
