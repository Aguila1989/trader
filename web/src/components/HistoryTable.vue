<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { downloadFile } from "../api";
import { fmtNum, dateTimeStr, shortKey } from "../format";
import type { TradeProposal } from "../types";

const { t } = useI18n();

// "manual" / "bot" filter the loaded page by who initiated each trade; "all"
// shows everything. (Filtering is over the current page — server-side paged
// filtering is a later refinement.)
const props = withDefaults(defineProps<{ source?: "manual" | "bot" | "all" }>(), {
  source: "all",
});

const store = useTraderStore();

// AUDIT-002: pagination/filter state is shared store state; claim it for this
// source so switching Manual <-> Bot never shows the other tab's page/filter.
onMounted(() => store.claimTradesView(props.source));

// A trade counts as manual when explicitly initiated by the user, else it's a
// bot (AI/system) trade. Persisted rows lack `initiator` but keep `provider`.
function isManual(p: TradeProposal): boolean {
  return (p.initiator ?? (p.provider === "manual" ? "manual" : "ai")) === "manual";
}
const title = computed(() =>
  props.source === "manual"
    ? t("history.title.manual")
    : props.source === "bot"
      ? t("history.title.bot")
      : t("history.title.all"),
);

// SEC-04: download the CSV via an authenticated Bearer fetch + blob, so the
// dashboard token never appears in the download URL (logs / history / Referer).
function exportCsv(): void {
  void downloadFile("/api/trades.csv", "trades.csv");
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

// Localized label for a status code. Falls back to the underscore-stripped code
// when no translation exists for that status.
function statusText(s: string): string {
  const key = `history.status.${s}`;
  const label = t(key);
  return label === key ? s.replace(/_/g, " ") : label;
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
            {{ s ? statusText(s) : t("history.allStatuses") }}
          </option>
        </select>
        <span class="muted page-info">
          {{ rangeStart }}-{{ rangeEnd }} {{ t("history.ofTotal") }} {{ total }}
        </span>
        <button class="btn" :disabled="store.pageOffset === 0" @click="store.prevPage()">
          {{ t("history.prev") }}
        </button>
        <button
          class="btn"
          :disabled="rangeEnd >= total"
          @click="store.nextPage()"
        >
          {{ t("history.next") }}
        </button>
        <button class="btn" :disabled="total === 0" :title="t('history.exportCsvTitle')" @click="exportCsv">
          {{ t("history.exportCsv") }}
        </button>
      </div>
    </div>

    <p v-if="!store.snapshot?.dbConnected" class="muted db-note">
      {{ t("history.dbNote") }}
    </p>

    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>{{ t("history.col.time") }}</th>
            <th>{{ t("history.col.side") }}</th>
            <th>{{ t("history.col.pair") }}</th>
            <th class="num">{{ t("history.col.amount") }}</th>
            <th class="num">{{ t("history.col.limit") }}</th>
            <th v-if="source === 'bot'">{{ t("history.col.conf") }}</th>
            <th>{{ t("history.col.status") }}</th>
            <th v-if="source === 'bot'">{{ t("history.col.aiReasoning") }}</th>
            <th>{{ t("history.col.tx") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td :colspan="source === 'bot' ? 9 : 7" class="muted center">
              {{
                source === "manual"
                  ? t("history.empty.manual")
                  : source === "bot"
                    ? t("history.empty.bot")
                    : t("history.empty.all")
              }}
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
