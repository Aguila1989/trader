<script setup lang="ts">
// Persistent, always-visible live log: last 20 combined trade+AI events (newest
// first), seeded from the persistent store and streamed over SSE — read-only.
// Filter All/Trades/AI, pause/resume (freezes the list so it doesn't jump), and
// click an entry to open it in the Logs tab.
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import type { LiveLogItem } from "../stores/trader";

const { t } = useI18n();
const store = useTraderStore();
const open = ref(true);
const paused = ref(false);
const filter = ref<"all" | "trade" | "ai">("all");
const frozen = ref<LiveLogItem[] | null>(null);

function togglePause(): void {
  paused.value = !paused.value;
  if (paused.value) {
    frozen.value = [...store.liveLog];
  } else {
    // On resume, re-pull the authoritative last-20 from the persisted store so
    // any events that scrolled off the 20-deep ring during a long pause aren't
    // silently skipped.
    frozen.value = null;
    void store.loadLiveLog();
  }
}

const items = computed(() => {
  const src = paused.value && frozen.value ? frozen.value : store.liveLog;
  return filter.value === "all" ? src : src.filter((i) => i.stream === filter.value);
});

function hhmmss(ts: string): string {
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "--:--:--" : d.toTimeString().slice(0, 8);
}
function desc(i: LiveLogItem): string {
  if (i.stream === "trade") {
    const e = i.entry;
    return `${e.action} ${e.amount} ${store.tokenFor(e.baseAsset).code} @ ${e.price} — ${e.status}`;
  }
  const e = i.entry;
  const tok = e.baseAsset ? ` ${store.tokenFor(e.baseAsset).code}` : "";
  return `${e.eventType.replace(/_/g, " ")}${tok}: ${e.reasoning}`;
}
</script>

<template>
  <div class="livelog" :class="{ collapsed: !open }">
    <div class="livelog-head">
      <button class="livelog-toggle" @click="open = !open">
        {{ open ? "▾" : "▸" }} {{ t("liveLog.title") }}
        <span class="muted livelog-count">({{ items.length }})</span>
      </button>
      <div v-if="open" class="livelog-controls">
        <div class="segmented livelog-filter" role="group" :aria-label="t('liveLog.filterAria')">
          <button class="seg" :class="{ active: filter === 'all' }" @click="filter = 'all'">{{ t("liveLog.filter.all") }}</button>
          <button class="seg" :class="{ active: filter === 'trade' }" @click="filter = 'trade'">{{ t("liveLog.filter.trades") }}</button>
          <button class="seg" :class="{ active: filter === 'ai' }" @click="filter = 'ai'">AI</button>
        </div>
        <button class="btn livelog-pause" @click="togglePause">{{ paused ? t("liveLog.actions.resume") : t("liveLog.actions.pause") }}</button>
      </div>
    </div>
    <ul v-if="open" class="livelog-list">
      <li v-if="items.length === 0" class="muted livelog-empty">{{ t("liveLog.empty") }}</li>
      <li
        v-for="i in items"
        :key="i.entry.id"
        class="livelog-row"
        :title="t('liveLog.openInLogs')"
        @click="store.focusLog(i.stream, i.entry.id)"
      >
        <span class="mono livelog-time">{{ hhmmss(i.entry.ts) }}</span>
        <span class="livelog-stream" :class="i.stream">{{ i.stream === "trade" ? t("liveLog.streamTrade") : "AI" }}</span>
        <span v-if="i.stream === 'trade'" class="ini-badge" :class="i.entry.initiator.toLowerCase()">
          {{ i.entry.initiator }}
        </span>
        <span class="livelog-desc">{{ desc(i) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.livelog {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 20px;
}
.livelog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.livelog-toggle {
  background: none;
  border: 0;
  color: var(--text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 0;
}
.livelog-count {
  font-weight: 400;
  font-size: 12px;
}
.livelog-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.livelog-filter .seg {
  padding: 4px 12px;
  font-size: 12px;
}
.livelog-pause {
  padding: 4px 12px;
  font-size: 12px;
}
.livelog-list {
  list-style: none;
  margin: 0 0 8px;
  padding: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  font-size: 12px;
}
.livelog-empty {
  padding: 6px;
}
.livelog-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 4px;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
}
.livelog-row:last-child {
  border-bottom: 0;
}
.livelog-row:hover {
  background: rgba(91, 140, 255, 0.08);
}
.livelog-time {
  color: var(--muted);
  flex-shrink: 0;
}
.livelog-stream {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.livelog-stream.trade {
  background: rgba(47, 191, 113, 0.18);
  color: var(--pos);
}
.livelog-stream.ai {
  background: rgba(181, 140, 255, 0.18);
  color: #b58cff;
}
.livelog-desc {
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
