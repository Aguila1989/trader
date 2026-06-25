<script setup lang="ts">
// Trade History sub-tab: paginated/filterable structured trade log + CSV export.
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../api";
import { useTraderStore } from "../stores/trader";
import { fmtNum, dateTimeStr, shortKey } from "../format";
import type { TradeLogEntry } from "../types";

const store = useTraderStore();
const { t } = useI18n();

const rows = ref<TradeLogEntry[]>([]);
const total = ref(0);
const limit = ref(50);
const offset = ref(0);
const loading = ref(false);

const initiator = ref(""); // "" | MANUAL | AI
const action = ref(""); // "" | BUY | SELL | SWAP | CANCEL | REJECTED
const token = ref(""); // "" | spec
const from = ref("");
const to = ref("");

const ACTIONS = ["", "BUY", "SELL", "SWAP", "CANCEL", "REJECTED"];

async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = await api.tradeLog({
      limit: limit.value,
      offset: offset.value,
      initiator: initiator.value || undefined,
      action: action.value || undefined,
      token: token.value || undefined,
      from: from.value ? new Date(`${from.value}T00:00:00`).toISOString() : undefined,
      to: to.value ? new Date(`${to.value}T23:59:59.999`).toISOString() : undefined,
    });
    rows.value = page.rows;
    total.value = page.total;
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// Re-query from page 1 whenever a filter or page size changes.
watch([initiator, action, token, from, to, limit], () => {
  offset.value = 0;
  void load();
});
// Re-load when the deep-link points here (open from the live log).
watch(
  () => store.logsFocus,
  (f) => {
    if (f?.sub === "trade") void load();
  },
);
onMounted(load);

const rangeStart = computed(() => (total.value === 0 ? 0 : offset.value + 1));
const rangeEnd = computed(() => Math.min(offset.value + limit.value, total.value));
function prev(): void {
  if (offset.value > 0) {
    offset.value = Math.max(0, offset.value - limit.value);
    void load();
  }
}
function next(): void {
  if (rangeEnd.value < total.value) {
    offset.value += limit.value;
    void load();
  }
}

function code(spec: string): string {
  return store.tokenFor(spec).code;
}

// CSV of the currently-visible (filtered) page.
function exportCsv(): void {
  const head = ["Timestamp", "Initiator", "Token", "Action", "Amount", "Price", "TotalValue", "Status", "TxHash"];
  const esc = (v: string): string => {
    const s = String(v ?? "");
    // Guard against CSV formula injection + quote separators.
    const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
    return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
  };
  const lines = [head.join(",")];
  for (const r of rows.value) {
    lines.push(
      [r.ts, r.initiator, `${code(r.baseAsset)}/${code(r.quoteAsset)}`, r.action, r.amount, r.price, r.totalValue, r.status, r.txHash ?? ""]
        .map(esc)
        .join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trade-log.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>

<template>
  <div class="logs-pane">
    <div class="logs-filters">
      <select v-model="initiator" :aria-label="t('tradeLog.filters.initiatorAria')">
        <option value="">{{ t("tradeLog.filters.allInitiators") }}</option>
        <option value="MANUAL">{{ t("tradeLog.filters.manual") }}</option>
        <option value="AI">AI</option>
      </select>
      <select v-model="action" :aria-label="t('tradeLog.filters.actionAria')">
        <option v-for="a in ACTIONS" :key="a || 'all'" :value="a">{{ a || t("tradeLog.filters.allActions") }}</option>
      </select>
      <select v-model="token" :aria-label="t('tradeLog.filters.tokenAria')">
        <option value="">{{ t("tradeLog.filters.allTokens") }}</option>
        <option v-for="t in store.universe" :key="t.spec" :value="t.spec">{{ t.code }}</option>
      </select>
      <label class="logs-date">{{ t("tradeLog.filters.from") }} <input v-model="from" type="date" /></label>
      <label class="logs-date">{{ t("tradeLog.filters.to") }} <input v-model="to" type="date" /></label>
      <select v-model.number="limit" :aria-label="t('tradeLog.filters.pageSizeAria')">
        <option :value="50">{{ t("tradeLog.filters.perPage", { n: 50 }) }}</option>
        <option :value="100">{{ t("tradeLog.filters.perPage", { n: 100 }) }}</option>
        <option :value="200">{{ t("tradeLog.filters.perPage", { n: 200 }) }}</option>
      </select>
      <span class="muted page-info">{{ rangeStart }}-{{ rangeEnd }} {{ t("tradeLog.of") }} {{ total }}</span>
      <button class="btn" :disabled="offset === 0" @click="prev">{{ t("tradeLog.actions.prev") }}</button>
      <button class="btn" :disabled="rangeEnd >= total" @click="next">{{ t("tradeLog.actions.next") }}</button>
      <button class="btn" :disabled="rows.length === 0" @click="exportCsv">{{ t("tradeLog.actions.exportCsv") }}</button>
    </div>

    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>{{ t("tradeLog.columns.timestamp") }}</th>
            <th>{{ t("tradeLog.columns.initiator") }}</th>
            <th>{{ t("tradeLog.columns.token") }}</th>
            <th>{{ t("tradeLog.columns.action") }}</th>
            <th class="num">{{ t("tradeLog.columns.amount") }}</th>
            <th class="num">{{ t("tradeLog.columns.price") }}</th>
            <th class="num">{{ t("tradeLog.columns.totalValue") }}</th>
            <th>{{ t("tradeLog.columns.status") }}</th>
            <th>{{ t("tradeLog.columns.txHash") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="9" class="muted center">{{ loading ? t("tradeLog.loading") : t("tradeLog.empty") }}</td>
          </tr>
          <tr v-for="r in rows" :key="r.id" :class="{ 'row-focus': store.logsFocus?.sub === 'trade' && store.logsFocus?.id === r.id }">
            <td class="mono">{{ dateTimeStr(r.ts) }}</td>
            <td><span class="ini-badge" :class="r.initiator.toLowerCase()">{{ r.initiator }}</span></td>
            <td :title="r.baseAsset">{{ code(r.baseAsset) }}/{{ code(r.quoteAsset) }}</td>
            <td :class="r.action === 'BUY' ? 'side-buy' : r.action === 'SELL' ? 'side-sell' : ''">{{ r.action }}</td>
            <td class="num mono">{{ fmtNum(r.amount, 7) }}</td>
            <td class="num mono">{{ fmtNum(r.price, 7) }}</td>
            <td class="num mono">{{ fmtNum(r.totalValue) }}</td>
            <td><span class="status" :class="r.status.toLowerCase()">{{ r.status }}</span></td>
            <td class="mono">{{ r.txHash && r.txHash !== "paper" ? shortKey(r.txHash) : r.txHash ?? "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
