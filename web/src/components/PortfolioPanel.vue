<script setup lang="ts">
import { computed } from "vue";
import { Doughnut } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

ChartJS.register(ArcElement, Tooltip, Legend);

const store = useTraderStore();

const PALETTE = [
  "#5b8cff", "#2fbf71", "#ffb454", "#e0607e", "#9b6bff",
  "#3bc9db", "#f06595", "#94d82d", "#ff922b", "#748ffc",
];

// Priced holdings, largest first.
const priced = computed(() =>
  (store.portfolio?.holdings ?? [])
    .filter((h) => h.xlmValue != null && h.xlmValue > 0)
    .sort((a, b) => (b.xlmValue ?? 0) - (a.xlmValue ?? 0)),
);
const unpriced = computed(() =>
  (store.portfolio?.holdings ?? []).filter((h) => h.xlmValue == null),
);
const totalXlm = computed(() => store.portfolio?.totalXlm ?? 0);

function code(spec: string): string {
  return spec.split(":")[0] || spec;
}
function pct(v: number | null): string {
  if (v == null || totalXlm.value <= 0) return "-";
  return `${((v / totalXlm.value) * 100).toFixed(1)}%`;
}

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: priced.value.map((h) => code(h.asset)),
  datasets: [
    {
      data: priced.value.map((h) => h.xlmValue ?? 0),
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
    <h2>Portfolio</h2>
    <p class="muted pf-total">
      Total: <span class="mono">{{ fmtNum(totalXlm) }}</span> XLM-equivalent
    </p>
    <p v-if="priced.length === 0" class="muted">
      No priced holdings yet (balances value against their XLM market).
    </p>
    <div v-else class="pf-body">
      <div class="chart-box pf-chart">
        <Doughnut :data="chartData" :options="options" />
      </div>
      <ul class="levels pf-list">
        <li v-for="h in priced" :key="h.asset" class="pf-row">
          <span class="px">{{ code(h.asset) }}</span>
          <span class="amt">{{ fmtNum(h.balance) }}</span>
          <span class="mono pf-pct">{{ pct(h.xlmValue) }}</span>
        </li>
      </ul>
    </div>
    <p v-if="unpriced.length" class="muted pf-unpriced">
      Unpriced (no XLM market): {{ unpriced.map((h) => code(h.asset)).join(", ") }}
    </p>
  </section>
</template>

<style scoped>
.pf-total {
  margin-top: 0;
}
.pf-body {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}
.pf-chart {
  flex: 1 1 220px;
  min-width: 220px;
  height: 220px;
}
.pf-list {
  flex: 1 1 200px;
}
.pf-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pf-pct {
  margin-left: auto;
}
.pf-unpriced {
  font-size: 11px;
}
</style>
