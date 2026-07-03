<script setup lang="ts">
// "Portfolio Value Over Time" — a line chart of total portfolio value (USDC)
// from persisted snapshots (GET /api/portfolio/history). Green when the value
// rose over the selected timeframe, red when it fell. Reuses chart.js (the
// existing charting library) — no new dependency. Rendered inside PortfolioPanel
// so it reads as one coherent portfolio view.
import { computed, ref, watch, onMounted } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import { LESSONS } from "../academy/deeplinks";
import InfoTip from "./InfoTip.vue";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const { t } = useI18n();
const store = useTraderStore();

type Range = "24h" | "7d" | "30d" | "1y" | "all";
const RANGES: { key: Range; label: string }[] = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "1y", label: "1Y" },
  { key: "all", label: "ALL" },
];
const range = ref<Range>("7d");

function load(): void {
  void store.loadPortfolioHistory(range.value);
}
onMounted(load);
watch(range, load);
// Re-pull when the portfolio refreshes (a new snapshot may have been written).
watch(() => store.portfolio?.updatedAt, load);

// Only points we could value in USDC drive the line.
const points = computed(() =>
  store.portfolioHistory.filter((p) => p.totalUsd != null) as { ts: string; totalUsd: number }[],
);
const enough = computed(() => points.value.length >= 2);

// Green if the value rose over the window, red if it fell (project convention).
const up = computed(() => {
  const p = points.value;
  return p.length < 2 || p[p.length - 1].totalUsd >= p[0].totalUsd;
});
const lineColor = computed(() => (up.value ? "#2fbf71" : "#ff5d6c"));
const fillColor = computed(() =>
  up.value ? "rgba(47, 191, 113, 0.15)" : "rgba(255, 93, 108, 0.15)",
);

function labelFor(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  // Intraday view shows the time; longer views show the date.
  return range.value === "24h"
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
// Full timestamps for the tooltip title (parallel to the data array).
const fullTs = computed(() => points.value.map((p) => new Date(p.ts).toLocaleString()));

const chartData = computed<ChartData<"line">>(() => {
  const last = points.value.length - 1;
  return {
    labels: points.value.map((p) => labelFor(p.ts)),
    datasets: [
      {
        label: t("portfolio.history.valueLabel"),
        data: points.value.map((p) => p.totalUsd),
        borderColor: lineColor.value,
        backgroundColor: fillColor.value,
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        // Highlight only the current (rightmost) value.
        pointRadius: (ctx) => (ctx.dataIndex === last ? 4 : 0),
        pointHoverRadius: 5,
        pointBackgroundColor: lineColor.value,
      },
    ],
  };
});

const options = computed<ChartOptions<"line">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      intersect: false,
      callbacks: {
        title: (items) => fullTs.value[items[0]?.dataIndex ?? 0] ?? "",
        label: (item) => `${fmtNum(item.parsed.y, 2)} USDC`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: "#8595ab", maxRotation: 0, autoSkipPadding: 20 },
      grid: { color: "rgba(31, 42, 60, 0.6)" },
    },
    y: {
      ticks: { color: "#8595ab" },
      grid: { color: "rgba(31, 42, 60, 0.6)" },
    },
  },
}));
</script>

<template>
  <section class="pf-history">
    <div class="pfh-head">
      <h3 class="pfh-title">
        {{ t("portfolio.history.title") }}
        <InfoTip :text="t('portfolio.history.hint')" :learn-more="LESSONS.portfolioValue" :label="t('portfolio.history.title')" />
      </h3>
      <div class="segmented pfh-tabs" role="group" :aria-label="t('portfolio.history.title')">
        <button
          v-for="r in RANGES"
          :key="r.key"
          class="seg"
          :class="{ active: range === r.key }"
          @click="range = r.key"
        >
          {{ r.label }}
        </button>
      </div>
    </div>

    <p v-if="!enough" class="muted pfh-empty">{{ t("portfolio.history.notEnough") }}</p>
    <div v-else class="pfh-chart">
      <Line :data="chartData" :options="options" />
    </div>
  </section>
</template>

<style scoped>
.pf-history {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.pfh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.pfh-title {
  display: inline-flex;
  align-items: center;
  margin: 0;
  font-size: 14px;
}
.pfh-tabs .seg {
  padding: 5px 12px;
  font-size: 12px;
  min-height: 32px;
}
/* AUDIT-003: a scoped min-height outranks the global 44px mobile floor
   (scoped selectors compile with an attribute selector), so restate it. */
@media (max-width: 767px) {
  .pfh-tabs .seg {
    min-height: 44px;
  }
}
.pfh-empty {
  font-size: 13px;
  padding: 8px 0;
}
/* Fixed height so the chart scales to the container width and never overflows
   or forces horizontal scroll on mobile (maintainAspectRatio is off). */
.pfh-chart {
  position: relative;
  height: 220px;
  width: 100%;
}
@media (max-width: 767px) {
  .pfh-chart {
    height: 180px;
  }
}
</style>
