<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
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
import type { Candle } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

const props = defineProps<{ candles: Candle[]; timeframe: string }>();

const { t } = useI18n();

// Label by timeframe: intraday -> time, otherwise date. Note Horizon omits
// empty buckets on thin markets, so spacing can be uneven - the labels make the
// real bucket times visible rather than implying perfectly regular intervals.
function labelFor(iso: string, tf: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return tf === "hour"
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString();
}

const hasData = computed(() => props.candles.length > 0);

const chartData = computed<ChartData<"line">>(() => ({
  labels: props.candles.map((c) => labelFor(c.time, props.timeframe)),
  datasets: [
    {
      label: t("tokenChart.close"),
      data: props.candles.map((c) => c.close),
      borderColor: "#5b8cff",
      backgroundColor: "rgba(91, 140, 255, 0.15)",
      fill: true,
      tension: 0.25,
      pointRadius: 1,
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
      // Prices are not zero-based; let the axis frame the actual range.
      beginAtZero: false,
      ticks: { color: "#8595ab" },
      grid: { color: "rgba(31, 42, 60, 0.6)" },
    },
  },
};
</script>

<template>
  <div class="chart-box">
    <p v-if="!hasData" class="muted">
      {{ t("tokenChart.noHistory") }}
    </p>
    <Line v-else :data="chartData" :options="options" />
  </div>
</template>
