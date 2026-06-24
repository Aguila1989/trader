<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import { withToken } from "../api";
import { fmtNum, dateTimeStr, shortKey } from "../format";
import type { TradeProposal } from "../types";

// "manual" / "bot" filter the loaded page by who initiated each trade; "all"
// shows everything. (Filtering is over the current page — server-side paged
// filtering is a later refinement.)
const props = withDefaults(defineProps<{ source?: "manual" | "bot" | "all" }>(), {
  source: "all",
});

const store = useTraderStore();

// A trade counts as manual when explicitly initiated by the user, else it's a
// bot (AI/system) trade. Persisted rows lack `initiator` but keep `provider`.
function isManual(p: TradeProposal): boolean {
  return (p.initiator ?? (p.provider === "manual" ? "manual" : "ai")) === "manual";
}
const title = computed(() =>
  props.source === "manual"
    ? "Manual trade history"
    : props.source === "bot"
      ? "Bot trade history"
      : "Trade history",
);

// Download the full trade history as CSV. The token rides as a query param
// (same mechanism the SSE stream uses) so the attachment download authenticates.
function exportCsv(): void {
  const a = document.createElement("a");
  a.href = withToken("/api/trades.csv");
  a.download = "trades.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const STATUSES = [
  "",
  "proposed",
  "pending_approval",
  "submitted",
  "submitting",
  "blocked",
  "rejected",
  "failed",
];

const rows = computed(() => {
  const all = store.tradesPage?.rows ?? [];
  if (props.source === "all") return all;
  return all.filter((p) => (props.source === "manual" ? isManual(p) : !isManual(p)));
});
const total = computed(() => store.tradesPage?.total ?? 0);
const rangeStart = computed(() => (total.value === 0 ? 0 : store.pageOffset + 1));
const rangeEnd = computed(() =>
  Math.min(store.pageOffset + store.pageLimit, total.value),
);

function statusText(s: string): string {
  return s.replace(/_/g, " ");
}
</script>

<template>
  <section class="panel">
    <div class="hist-head">
      <h2>{{ title }}</h2>
      <div class="hist-controls">
        <select
          :value="store.statusFilter"
          @change="store.setStatusFilter(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="s in STATUSES" :key="s || 'all'" :value="s">
            {{ s ? statusText(s) : "all statuses" }}
          </option>
        </select>
        <span class="muted page-info">
          {{ rangeStart }}-{{ rangeEnd }} of {{ total }}
        </span>
        <button class="btn" :disabled="store.pageOffset === 0" @click="store.prevPage()">
          Prev
        </button>
        <button
          class="btn"
          :disabled="rangeEnd >= total"
          @click="store.nextPage()"
        >
          Next
        </button>
        <button class="btn" :disabled="total === 0" title="Download all trades as CSV" @click="exportCsv">
          Export CSV
        </button>
      </div>
    </div>

    <p v-if="!store.snapshot?.dbConnected" class="muted db-note">
      In-memory only - persisted history needs SQL Server (see README).
    </p>

    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>Time</th>
            <th>Side</th>
            <th>Pair</th>
            <th class="num">Amount</th>
            <th class="num">Limit</th>
            <th v-if="source === 'bot'">Conf</th>
            <th>Status</th>
            <th v-if="source === 'bot'">AI reasoning</th>
            <th>Tx</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td :colspan="source === 'bot' ? 9 : 7" class="muted center">
              No {{ source === "all" ? "" : source + " " }}trades on this page.
            </td>
          </tr>
          <tr v-for="p in rows" :key="p.id">
            <td class="mono">{{ dateTimeStr(p.updatedAt) }}</td>
            <td :class="p.side === 'buy' ? 'side-buy' : 'side-sell'">
              {{ p.side.toUpperCase() }}
            </td>
            <td class="mono">{{ p.baseAsset }}/{{ p.quoteAsset }}</td>
            <td class="num mono">{{ fmtNum(p.amount) }}</td>
            <td class="num mono">{{ fmtNum(p.limitPrice) }}</td>
            <td v-if="source === 'bot'" class="muted">{{ p.confidence ?? "-" }}</td>
            <td><span class="status" :class="p.status">{{ statusText(p.status) }}</span></td>
            <td v-if="source === 'bot'" class="muted hist-reason" :title="p.reason">{{ p.reason || "-" }}</td>
            <td class="mono">{{ p.txHash ? shortKey(p.txHash) : "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.hist-reason {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
}
</style>
