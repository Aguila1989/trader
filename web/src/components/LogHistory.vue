<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { timeStr } from "../format";
import type { LogEntry, LogLevel } from "../types";

const { t } = useI18n();
const store = useTraderStore();

const LEVELS = ["", "info", "warn", "error", "trade", "ai"];

const rows = computed(() => store.logsPage?.rows ?? []);
const total = computed(() => store.logsPage?.total ?? 0);
const rangeStart = computed(() =>
  total.value === 0 ? 0 : store.logPageOffset + 1,
);
const rangeEnd = computed(() =>
  Math.min(store.logPageOffset + store.logPageLimit, total.value),
);

function levelText(l: string): string {
  return l ? l : t("logHistory.allLevels");
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
}

// Group the flat ts-DESC rows into per-day sections, preserving order.
interface DaySection {
  day: string;
  entries: LogEntry[];
}
const days = computed<DaySection[]>(() => {
  const out: DaySection[] = [];
  for (const e of rows.value) {
    const day = dayKey(e.ts);
    const last = out[out.length - 1];
    if (last && last.day === day) last.entries.push(e);
    else out.push({ day, entries: [e] });
  }
  return out;
});

// Local search box with a debounced push into the store.
const search = ref(store.logQuery);
let debounce: ReturnType<typeof setTimeout> | null = null;
watch(search, (v) => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => store.setLogQuery(v), 300);
});
</script>

<template>
  <section class="panel">
    <div class="hist-head">
      <h2>{{ t("logHistory.title") }}</h2>
      <div class="hist-controls">
        <select
          :value="store.logLevelFilter"
          @change="
            store.setLogLevelFilter(($event.target as HTMLSelectElement).value)
          "
        >
          <option v-for="l in LEVELS" :key="l || 'all'" :value="l">
            {{ levelText(l) }}
          </option>
        </select>
        <input
          v-model="search"
          type="search"
          class="log-search"
          :placeholder="t('logHistory.searchPlaceholder')"
        />
        <span class="muted page-info">
          {{ rangeStart }}-{{ rangeEnd }} {{ t("logHistory.of") }} {{ total }}
        </span>
        <button
          class="btn"
          :disabled="store.logPageOffset === 0"
          @click="store.logPrevPage()"
        >
          {{ t("logHistory.prev") }}
        </button>
        <button
          class="btn"
          :disabled="rangeEnd >= total"
          @click="store.logNextPage()"
        >
          {{ t("logHistory.next") }}
        </button>
      </div>
    </div>

    <p v-if="!store.snapshot?.dbConnected" class="muted db-note">
      {{ t("logHistory.inMemoryNote") }}
    </p>

    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>{{ t("logHistory.colTime") }}</th>
            <th>{{ t("logHistory.colLevel") }}</th>
            <th>{{ t("logHistory.colMessage") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="3" class="muted center">
              {{ t("logHistory.noLogs") }}
            </td>
          </tr>
          <template v-for="d in days" :key="d.day">
            <tr class="day-row">
              <td colspan="3">{{ d.day }}</td>
            </tr>
            <tr v-for="(e, i) in d.entries" :key="e.ts + i">
              <td class="mono">{{ timeStr(e.ts) }}</td>
              <td>
                <span class="lvl" :class="'lvl-' + (e.level as LogLevel)">
                  {{ e.level }}
                </span>
              </td>
              <td>{{ e.message }}</td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.day-row td {
  font-weight: 700;
  background: var(--panel-2);
}
.log-search {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 6px 10px;
}
/* Reuse the same level colors as the live feed (style.css scopes them
   under .log; mirror them here so they apply inside this table). */
.lvl {
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.04em;
}
.lvl-info {
  color: var(--muted);
}
.lvl-warn {
  color: var(--warn);
}
.lvl-error {
  color: var(--neg);
}
.lvl-trade {
  color: var(--accent);
}
.lvl-ai {
  color: #b58cff;
}
</style>
