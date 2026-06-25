<script setup lang="ts">
// AI Log sub-tab: paginated/filterable AI reasoning + decision events.
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { api } from "../api";
import { useTraderStore } from "../stores/trader";
import { dateTimeStr } from "../format";
import type { AiLogEntry, RiskProfile } from "../types";

const { t } = useI18n();
const store = useTraderStore();

const rows = ref<AiLogEntry[]>([]);
const total = ref(0);
const limit = ref(50);
const offset = ref(0);
const loading = ref(false);
const expanded = ref<Set<string>>(new Set());

const eventType = ref("");
const token = ref("");
const from = ref("");
const to = ref("");

// [filter value, i18n key suffix under aiLog.events.*]
const EVENT_TYPES = [
  ["", "all"],
  ["proposal", "proposal"],
  ["accepted", "accepted"],
  ["rejected", "rejected"],
  ["risk_constraint", "riskConstraint"],
  ["stop_loss", "stopLoss"],
  ["trail_update", "trailUpdate"],
  ["cooldown", "cooldown"],
  ["risk_profile", "riskProfile"],
] as const;

async function load(): Promise<void> {
  loading.value = true;
  try {
    const page = await api.aiLog({
      limit: limit.value,
      offset: offset.value,
      eventType: eventType.value || undefined,
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

watch([eventType, token, from, to, limit], () => {
  offset.value = 0;
  void load();
});
watch(
  () => store.logsFocus,
  (f) => {
    if (f?.sub === "ai") {
      expanded.value = new Set(expanded.value).add(f.id); // reassign for reactivity
      void load();
    }
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
function toggle(id: string): void {
  if (expanded.value.has(id)) expanded.value.delete(id);
  else expanded.value.add(id);
  // reassign to trigger reactivity on the Set
  expanded.value = new Set(expanded.value);
}
function code(spec?: string): string {
  return spec ? store.tokenFor(spec).code : "—";
}
function riskSummary(rp?: RiskProfile): string {
  if (!rp) return "—";
  return `PS:${rp.positionSize[0]} SL:${rp.stopLossDistance[0]} TF:${rp.tradeFrequency[0]} VT:${rp.volatilityTolerance[0]} DD:${rp.drawdownTolerance[0]} SP:${rp.slippageTolerance[0]}`.toUpperCase();
}
</script>

<template>
  <div class="logs-pane">
    <div class="logs-filters">
      <select v-model="eventType" :aria-label="t('aiLog.eventTypeFilter')">
        <option v-for="[v, key] in EVENT_TYPES" :key="v || 'all'" :value="v">{{ t(`aiLog.events.${key}`) }}</option>
      </select>
      <select v-model="token" :aria-label="t('aiLog.tokenFilter')">
        <option value="">{{ t("aiLog.allTokens") }}</option>
        <option v-for="tk in store.universe" :key="tk.spec" :value="tk.spec">{{ tk.code }}</option>
      </select>
      <label class="logs-date">{{ t("aiLog.from") }} <input v-model="from" type="date" /></label>
      <label class="logs-date">{{ t("aiLog.to") }} <input v-model="to" type="date" /></label>
      <select v-model.number="limit" :aria-label="t('aiLog.pageSize')">
        <option :value="50">{{ t("aiLog.perPage", { n: 50 }) }}</option>
        <option :value="100">{{ t("aiLog.perPage", { n: 100 }) }}</option>
        <option :value="200">{{ t("aiLog.perPage", { n: 200 }) }}</option>
      </select>
      <span class="muted page-info">{{ rangeStart }}-{{ rangeEnd }} {{ t("aiLog.of") }} {{ total }}</span>
      <button class="btn" :disabled="offset === 0" @click="prev">{{ t("aiLog.prev") }}</button>
      <button class="btn" :disabled="rangeEnd >= total" @click="next">{{ t("aiLog.next") }}</button>
    </div>

    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>{{ t("aiLog.col.timestamp") }}</th>
            <th>{{ t("aiLog.col.eventType") }}</th>
            <th>{{ t("aiLog.col.token") }}</th>
            <th>{{ t("aiLog.col.reasoning") }}</th>
            <th>{{ t("aiLog.col.riskProfile") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="muted center">{{ loading ? t("aiLog.loading") : t("aiLog.empty") }}</td>
          </tr>
          <template v-for="r in rows" :key="r.id">
            <tr
              class="ai-row"
              :class="{ 'row-focus': store.logsFocus?.sub === 'ai' && store.logsFocus?.id === r.id }"
              @click="toggle(r.id)"
            >
              <td class="mono">{{ dateTimeStr(r.ts) }}</td>
              <td><span class="evt-badge">{{ r.eventType.replace(/_/g, " ") }}</span></td>
              <td :title="r.baseAsset">{{ code(r.baseAsset) }}{{ r.quoteAsset ? "/" + code(r.quoteAsset) : "" }}</td>
              <td class="ai-reason" :class="{ clamp: !expanded.has(r.id) }">{{ r.reasoning }}</td>
              <td class="mono ai-rp">{{ riskSummary(r.riskProfile) }}</td>
            </tr>
            <tr v-if="expanded.has(r.id)" class="ai-expand">
              <td colspan="5">
                <div class="ai-full">{{ r.reasoning }}</div>
                <div v-if="r.confidence || r.direction || r.price" class="muted ai-meta">
                  <span v-if="r.direction">{{ t("aiLog.meta.direction") }}: {{ r.direction }}</span>
                  <span v-if="r.confidence">{{ t("aiLog.meta.confidence") }}: {{ r.confidence }}</span>
                  <span v-if="r.price">{{ t("aiLog.meta.price") }}: {{ r.price }}</span>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.ai-row { cursor: pointer; }
.ai-reason.clamp { max-width: 420px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-rp { font-size: 11px; color: var(--muted); }
.evt-badge {
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em;
  padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted);
}
.ai-expand td { background: var(--panel-2); }
.ai-full { white-space: pre-wrap; padding: 6px 2px; }
.ai-meta { display: flex; gap: 14px; font-size: 12px; padding-bottom: 6px; }
</style>
