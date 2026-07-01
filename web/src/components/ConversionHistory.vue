<script setup lang="ts">
// XLM Conversion History — a collapsible, read-only view derived entirely from
// the existing trade log (action === "SWAP"). No new backend: swaps are already
// recorded in dbo.TradeLog, so this is just a filtered fetch. Loads lazily the
// first time it's expanded.
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../api";
import { useTraderStore } from "../stores/trader";
import { fmtNum, dateTimeStr } from "../format";
import type { TradeLogEntry } from "../types";

const { t } = useI18n();
const store = useTraderStore();

const open = ref(false);
const loading = ref(false);
const loaded = ref(false);
const rows = ref<TradeLogEntry[]>([]);

async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = await api.tradeLog({ action: "SWAP", limit: 20, offset: 0 });
    rows.value = page.rows;
  } catch {
    rows.value = [];
  } finally {
    loading.value = false;
    loaded.value = true;
  }
}

function toggle(): void {
  open.value = !open.value;
  if (open.value && !loaded.value) void load();
}

function code(spec: string): string {
  return store.tokenFor(spec).code;
}
</script>

<template>
  <section class="panel">
    <button class="ch-head" type="button" :aria-expanded="open" @click="toggle">
      <span class="ch-title">
        {{ open ? "▾" : "▸" }} {{ t("receiveSend.conversion.title") }}
      </span>
      <span class="muted ch-sub">{{ t("receiveSend.conversion.subtitle") }}</span>
    </button>

    <div v-if="open" class="ch-body">
      <p v-if="loading" class="muted">{{ t("tradeLog.loading") }}</p>
      <p v-else-if="rows.length === 0" class="muted">{{ t("receiveSend.conversion.empty") }}</p>
      <div v-else class="table-wrap">
        <table class="hist">
          <thead>
            <tr>
              <th>{{ t("receiveSend.conversion.date") }}</th>
              <th>{{ t("receiveSend.conversion.from") }}</th>
              <th>{{ t("receiveSend.conversion.to") }}</th>
              <th class="num">{{ t("tradeLog.columns.amount") }}</th>
              <th>{{ t("receiveSend.conversion.status") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id">
              <td class="mono">{{ dateTimeStr(r.ts) }}</td>
              <td :title="r.baseAsset">{{ code(r.baseAsset) }}</td>
              <td :title="r.quoteAsset">{{ code(r.quoteAsset) }}</td>
              <td class="num mono">{{ fmtNum(r.amount, 7) }}</td>
              <td><span class="status" :class="r.status.toLowerCase()">{{ r.status }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ch-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  background: none;
  border: 0;
  color: var(--text);
  cursor: pointer;
  padding: 4px 0;
  text-align: left;
  min-height: 44px;
}
.ch-title {
  font-weight: 600;
  font-size: 15px;
}
.ch-sub {
  font-size: 12px;
}
.ch-body {
  margin-top: 12px;
}
</style>
