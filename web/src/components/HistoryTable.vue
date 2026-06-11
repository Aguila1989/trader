<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, dateTimeStr, shortKey } from "../format";

const store = useTraderStore();

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

const rows = computed(() => store.tradesPage?.rows ?? []);
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
      <h2>Trade history</h2>
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
            <th>Status</th>
            <th>Tx</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="7" class="muted center">No trades on this page.</td>
          </tr>
          <tr v-for="p in rows" :key="p.id">
            <td class="mono">{{ dateTimeStr(p.updatedAt) }}</td>
            <td :class="p.side === 'buy' ? 'side-buy' : 'side-sell'">
              {{ p.side.toUpperCase() }}
            </td>
            <td class="mono">{{ p.baseAsset }}/{{ p.quoteAsset }}</td>
            <td class="num mono">{{ fmtNum(p.amount) }}</td>
            <td class="num mono">{{ fmtNum(p.limitPrice) }}</td>
            <td><span class="status" :class="p.status">{{ statusText(p.status) }}</span></td>
            <td class="mono">{{ p.txHash ? shortKey(p.txHash) : "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
