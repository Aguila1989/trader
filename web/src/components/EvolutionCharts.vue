<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { timeStr } from "../format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const { t } = useI18n();
const store = useTraderStore();

const labels = computed(() => store.evolution.map((p) => timeStr(p.ts)));
const hasData = computed(() => store.evolution.length > 0);

const volumeData = computed<ChartData<"line">>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: t("evolution.cumulativeVolume"),
      data: store.evolution.map((p) => p.cumulativeVolume),
      borderColor: "#5b8cff",
      backgroundColor: "rgba(91, 140, 255, 0.15)",
      fill: true,
      tension: 0.25,
      pointRadius: 2,
    },
  ],
}));

const tradesData = computed<ChartData<"line">>(() => ({
  labels: labels.value,
  datasets: [
    {
      label: t("evolution.cumulativeTrades"),
      data: store.evolution.map((p) => p.cumulativeTrades),
      borderColor: "#2fbf71",
      backgroundColor: "rgba(47, 191, 113, 0.15)",
      fill: true,
      stepped: true,
      pointRadius: 2,
    },
  ],
}));

const options: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index", intersect: false },
  plugins: {
    legend: { labels: { color: "#8595ab" } },
    tooltip: { intersect: false },
  },
  scales: {
    x: {
      ticks: { color: "#8595ab", maxRotation: 0, autoSkipPadding: 16 },
      grid: { color: "rgba(31, 42, 60, 0.6)" },
    },
    y: {
      beginAtZero: true,
      ticks: { color: "#8595ab" },
      grid: { color: "rgba(31, 42, 60, 0.6)" },
    },
  },
};
</script>

<template>
  <section class="panel">
    <h2>{{ t("evolution.title") }}</h2>
    <p v-if="!hasData" class="muted">
      {{ t("evolution.emptyState") }}
    </p>
    <div v-else class="charts">
      <div class="chart-box">
        <Line :data="volumeData" :options="options" />
      </div>
      <div class="chart-box">
        <Line :data="tradesData" :options="options" />
      </div>
    </div>
  </section>
</template>
