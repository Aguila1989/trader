<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum, dateTimeStr } from "../format";
import TokenChart from "./TokenChart.vue";
import InfoTip from "./InfoTip.vue";
import AssetSelect from "./AssetSelect.vue";
import { LESSONS } from "../academy/deeplinks";

const store = useTraderStore();
const { t } = useI18n();

const TIMEFRAMES = computed(
  () =>
    [
      { key: "hour", label: t("tokenDetail.timeframe.hour") },
      { key: "day", label: t("tokenDetail.timeframe.day") },
      { key: "week", label: t("tokenDetail.timeframe.week") },
      { key: "year", label: t("tokenDetail.timeframe.year") },
    ] as const,
);

const TIPS = computed(() => ({
  spread: t("tokenDetail.tips.spread"),
  trigger: t("tokenDetail.tips.trigger"),
  trailing: t("tokenDetail.tips.trailing"),
}));

function auditLabel(action: string): string {
  return action === "trail_updated" ? t("tokenDetail.audit.trailUpdated") : action;
}
function liveTrigger(s: { isTrailing?: boolean; currentTrailPrice?: string; triggerPrice: string }): string {
  return s.isTrailing && s.currentTrailPrice != null ? s.currentTrailPrice : s.triggerPrice;
}

const code = computed(
  () => (store.selectedToken ?? "").split(":")[0] || (store.selectedToken ?? ""),
);
const quoteCode = computed(
  () => (store.selectedQuote ?? "XLM").split(":")[0] || store.selectedQuote,
);
// The detail page is scoped to ONE token, so the picker is pre-selected and
// locked — it just shows which asset the stop applies to.
const pairOptions = computed(() =>
  store.selectedToken ? [store.tokenFor(store.selectedToken)] : [],
);

const mid = computed(() => {
  const b = store.tokenBook;
  if (!b) return null;
  if (b.bestBid != null && b.bestAsk != null) return (b.bestBid + b.bestAsk) / 2;
  return b.bestBid ?? b.bestAsk ?? null;
});

// The bot's net position on this pair (drives the long/short stop direction).
const position = computed(() =>
  store.positions.find(
    (p) => p.base === store.selectedToken && p.quote === store.selectedQuote,
  ),
);
const side = computed<"long" | "short" | "flat">(() => {
  const n = position.value?.netQty ?? 0;
  if (Math.abs(n) < 1e-7) return "flat";
  return n > 0 ? "long" : "short";
});
const effectiveSide = computed(() => (side.value === "short" ? "short" : "long"));

// Active stops for THIS pair.
const pairStops = computed(() =>
  store.stopLosses.filter(
    (s) =>
      s.status === "active" &&
      s.baseAsset === store.selectedToken &&
      s.quoteAsset === store.selectedQuote,
  ),
);

// --- Set Stop Loss form ---
const stopType = ref<"regular" | "trailing">("regular");
const trigger = ref("");
const trailBy = ref<"pct" | "amount">("pct");
const trailValue = ref("");
const sellAll = ref(true);
const quantity = ref("");
const notes = ref("");
const submitting = ref(false);

const triggerValid = computed(() => {
  const t = Number(trigger.value);
  if (!(t > 0)) return false;
  const m = mid.value;
  if (m == null) return true; // can't validate without a price; backend will
  return effectiveSide.value === "long" ? t < m : t > m;
});

const trailNum = computed(() => Number(trailValue.value));
// Initial trailing-stop preview from the live mid, direction-aware.
const initialTrailPrice = computed<number | null>(() => {
  const m = mid.value;
  if (m == null || !(trailNum.value > 0)) return null;
  const p =
    effectiveSide.value === "long"
      ? trailBy.value === "pct"
        ? m * (1 - trailNum.value / 100)
        : m - trailNum.value
      : trailBy.value === "pct"
        ? m * (1 + trailNum.value / 100)
        : m + trailNum.value;
  return p > 0 ? Number(p.toFixed(7)) : null;
});
const trailValid = computed(() => {
  if (!(trailNum.value > 0)) return false;
  const m = mid.value;
  const ip = initialTrailPrice.value;
  if (m == null || ip == null) return true; // backend validates
  return effectiveSide.value === "long" ? ip < m : ip > m;
});

const formValid = computed(() => {
  const qtyOk = sellAll.value || Number(quantity.value) > 0;
  if (!qtyOk) return false;
  return stopType.value === "trailing" ? trailValid.value : triggerValid.value;
});
const triggerHint = computed(() => {
  const m = mid.value;
  if (stopType.value === "trailing") {
    if (initialTrailPrice.value == null) return t("tokenDetail.hint.setTrailDistance");
    return t("tokenDetail.hint.trailingPreview", {
      initial: fmtNum(initialTrailPrice.value, 7),
      current: fmtNum(m, 7),
      direction:
        effectiveSide.value === "long"
          ? t("tokenDetail.hint.up")
          : t("tokenDetail.hint.down"),
    });
  }
  if (m == null) return t("tokenDetail.hint.setTriggerPrice");
  return effectiveSide.value === "long"
    ? t("tokenDetail.hint.longStop", { price: fmtNum(m, 7) })
    : t("tokenDetail.hint.shortStop", { price: fmtNum(m, 7) });
});

async function submit(): Promise<void> {
  if (!formValid.value || submitting.value || !store.selectedToken) return;
  submitting.value = true;
  try {
    const ok = await store.setStopLoss(
      stopType.value === "trailing"
        ? {
            base: store.selectedToken,
            quote: store.selectedQuote,
            stopType: "trailing",
            trailBy: trailBy.value,
            trailValue: trailValue.value.trim(),
            sellAll: sellAll.value,
            quantityToSell: sellAll.value ? undefined : quantity.value.trim(),
            notes: notes.value.trim() || undefined,
          }
        : {
            base: store.selectedToken,
            quote: store.selectedQuote,
            triggerPrice: trigger.value.trim(),
            sellAll: sellAll.value,
            quantityToSell: sellAll.value ? undefined : quantity.value.trim(),
            notes: notes.value.trim() || undefined,
          },
    );
    if (ok) {
      trigger.value = "";
      trailValue.value = "";
      quantity.value = "";
      notes.value = "";
    }
  } finally {
    submitting.value = false;
  }
}

// --- Audit (collapsible, lazy-loaded) ---
const showAudit = ref(false);
function toggleAudit(): void {
  showAudit.value = !showAudit.value;
  if (showAudit.value && store.selectedToken) {
    void store.loadStopLossAudit(store.selectedToken, store.selectedQuote);
  }
}

// Auto-refresh the order book every 30s while mounted only.
let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  timer = setInterval(() => void store.loadTokenBook(), 30_000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <section class="panel token-detail">
    <div class="detail-head">
      <button class="btn" @click="store.closeToken()">← {{ t("tokenDetail.back") }}</button>
      <h2>{{ code }} <span class="muted">/ {{ quoteCode }}</span></h2>
      <span v-if="store.tokenLoading" class="muted refreshing">{{ t("tokenDetail.refreshing") }}</span>
    </div>

    <p v-if="store.tokenError" class="violations">{{ store.tokenError }}</p>

    <div class="topbook">
      <div>{{ t("tokenDetail.bid") }} <span class="mono pos">{{ fmtNum(store.tokenBook?.bestBid, 7) }}</span></div>
      <div>{{ t("tokenDetail.ask") }} <span class="mono neg">{{ fmtNum(store.tokenBook?.bestAsk, 7) }}</span></div>
      <div>
        {{ t("tokenDetail.spread") }}<InfoTip :text="TIPS.spread" :label="t('tokenDetail.tips.spreadLabel')" :learn-more="LESSONS.spread" />
        <span class="mono">
          {{ store.tokenBook?.spreadBps != null ? fmtNum(store.tokenBook.spreadBps, 1) + " bps" : "-" }}
        </span>
      </div>
    </div>

    <div class="book">
      <div>
        <h3>{{ t("tokenDetail.bids") }}</h3>
        <ul class="levels bids">
          <li v-if="!(store.tokenBook?.bids?.length)" class="muted-row">
            <span class="muted">{{ t("tokenDetail.empty") }}</span>
          </li>
          <li v-for="(lv, i) in store.tokenBook?.bids ?? []" :key="'b' + i">
            <span class="px">{{ fmtNum(lv.price, 7) }}</span>
            <span class="amt">{{ fmtNum(lv.amount) }}</span>
          </li>
        </ul>
      </div>
      <div>
        <h3>{{ t("tokenDetail.asks") }}</h3>
        <ul class="levels asks">
          <li v-if="!(store.tokenBook?.asks?.length)" class="muted-row">
            <span class="muted">{{ t("tokenDetail.empty") }}</span>
          </li>
          <li v-for="(lv, i) in store.tokenBook?.asks ?? []" :key="'a' + i">
            <span class="px">{{ fmtNum(lv.price, 7) }}</span>
            <span class="amt">{{ fmtNum(lv.amount) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="chart-head">
      <h3>{{ t("tokenDetail.price") }}</h3>
      <div class="segmented">
        <button
          v-for="tf in TIMEFRAMES"
          :key="tf.key"
          class="seg"
          :class="{ active: store.tokenTimeframe === tf.key }"
          @click="store.setTokenTimeframe(tf.key)"
        >
          {{ tf.label }}
        </button>
      </div>
    </div>
    <TokenChart :candles="store.tokenCandles" :timeframe="store.tokenTimeframe" />

    <!-- Stop loss ------------------------------------------------------- -->
    <h3>{{ t("tokenDetail.stopLoss") }}</h3>
    <p v-if="store.killSwitch" class="violations sl-note">
      {{ t("tokenDetail.killSwitchActive") }}
    </p>
    <p v-else-if="store.isReadOnly" class="muted sl-note">
      {{ t("tokenDetail.readOnlyNote") }}
    </p>
    <p v-if="side === 'flat'" class="muted sl-note">
      {{ t("tokenDetail.flatNote") }}
    </p>

    <div class="segmented sl-type">
      <button class="seg" :class="{ active: stopType === 'regular' }" @click="stopType = 'regular'">
        {{ t("tokenDetail.regularStopLoss") }}
      </button>
      <button class="seg" :class="{ active: stopType === 'trailing' }" @click="stopType = 'trailing'">
        {{ t("tokenDetail.trailingStopLoss") }}<InfoTip :text="TIPS.trailing" :label="t('tokenDetail.trailingStopLoss')" placement="right" :learn-more="LESSONS.trailingStop" />
      </button>
    </div>

    <div class="sl-form">
      <label class="order-field">
        <span class="order-label">{{ t("tokenDetail.asset") }}</span>
        <AssetSelect
          :model-value="store.selectedToken ?? ''"
          :options="pairOptions"
          locked
          :aria-label="t('tokenDetail.stopLossAsset')"
        />
      </label>
      <label v-if="stopType === 'regular'" class="order-field">
        <span class="order-label">
          {{ t("tokenDetail.triggerPrice") }} ({{ quoteCode }})<InfoTip :text="TIPS.trigger" :label="t('tokenDetail.triggerPriceLabel')" :learn-more="LESSONS.stopLoss" />
        </span>
        <input
          v-model="trigger"
          class="order-input"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
          @keyup.enter="submit"
        />
      </label>
      <template v-else>
        <label class="order-field">
          <span class="order-label">{{ t("tokenDetail.trailBy") }}</span>
          <div class="segmented sl-trailby">
            <button class="seg" :class="{ active: trailBy === 'pct' }" @click="trailBy = 'pct'">%</button>
            <button class="seg" :class="{ active: trailBy === 'amount' }" @click="trailBy = 'amount'">{{ t("tokenDetail.amount") }}</button>
          </div>
        </label>
        <label class="order-field">
          <span class="order-label">{{ trailBy === "pct" ? t("tokenDetail.trailPercent") : t("tokenDetail.trailAmount", { code: quoteCode }) }}</span>
          <input
            v-model="trailValue"
            class="order-input"
            type="text"
            inputmode="decimal"
            :placeholder="trailBy === 'pct' ? t('tokenDetail.trailPctPlaceholder') : '0.00'"
            @keyup.enter="submit"
          />
        </label>
      </template>
      <label class="sl-checkbox">
        <input v-model="sellAll" type="checkbox" /> {{ t("tokenDetail.sellAll") }}
      </label>
      <label v-if="!sellAll" class="order-field">
        <span class="order-label">{{ t("tokenDetail.quantity") }} ({{ code }})</span>
        <input
          v-model="quantity"
          class="order-input"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
        />
      </label>
      <label class="order-field sl-notes">
        <span class="order-label">{{ t("tokenDetail.notesOptional") }}</span>
        <input v-model="notes" class="order-input" type="text" :placeholder="t('tokenDetail.notesPlaceholder')" />
      </label>
      <button class="btn primary" :disabled="!formValid || submitting" @click="submit">
        {{ submitting ? t("tokenDetail.setting") : t("tokenDetail.setStopLoss") }}
      </button>
    </div>
    <p
      class="muted sl-hint"
      :class="{ neg: stopType === 'trailing' ? (trailValue && !trailValid) : (trigger && !triggerValid) }"
    >
      {{ triggerHint }}
    </p>
    <p v-if="store.stopLossError" class="violations">{{ store.stopLossError }}</p>

    <h4 class="sl-sub">{{ t("tokenDetail.activeStopLosses") }}</h4>
    <ul class="levels sl-list">
      <li v-if="pairStops.length === 0" class="muted-row">
        <span class="muted">{{ t("tokenDetail.none") }}</span>
      </li>
      <li v-for="s in pairStops" :key="s.id" class="sl-row">
        <span class="mono">@ {{ fmtNum(liveTrigger(s), 7) }}</span>
        <span v-if="s.isTrailing" class="tag trailing">{{ t("tokenDetail.trailing") }}</span>
        <span v-if="s.isTrailing" class="muted sl-trailinfo mono">
          HWM {{ fmtNum(s.highWaterMark, 7) }}<template v-if="mid != null"> · {{ fmtNum(Math.abs(mid - Number(liveTrigger(s))), 7) }} {{ t("tokenDetail.toTrigger") }}</template>
        </span>
        <span>{{ s.sellAll ? t("tokenDetail.all") : s.quantityToSell }}</span>
        <span class="tag" :class="s.setBy">{{ s.setBy }}</span>
        <span class="muted sl-created">{{ dateTimeStr(s.createdAt) }}</span>
        <button class="btn sl-cancel" @click="store.cancelStopLoss(s.id)">{{ t("tokenDetail.cancel") }}</button>
      </li>
    </ul>

    <!-- Audit log (collapsible) ---------------------------------------- -->
    <button class="order-disclosure" type="button" @click="toggleAudit">
      {{ showAudit ? "▾" : "▸" }} {{ t("tokenDetail.auditLog") }}
    </button>
    <table v-if="showAudit" class="audit-table">
      <thead>
        <tr>
          <th>{{ t("tokenDetail.col.time") }}</th>
          <th>{{ t("tokenDetail.col.action") }}</th>
          <th>{{ t("tokenDetail.col.by") }}</th>
          <th>{{ t("tokenDetail.col.change") }}</th>
          <th>{{ t("tokenDetail.col.note") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!store.stopLossAudit || store.stopLossAudit.rows.length === 0">
          <td colspan="5" class="muted">{{ t("tokenDetail.noAuditEntries") }}</td>
        </tr>
        <tr v-for="a in store.stopLossAudit?.rows ?? []" :key="a.id">
          <td class="muted">{{ dateTimeStr(a.ts) }}</td>
          <td :class="{ 'trail-evt': a.action === 'trail_updated' }">{{ auditLabel(a.action) }}</td>
          <td>{{ a.initiator }}</td>
          <td class="mono">
            {{ a.oldValue != null ? a.oldValue + " → " : "" }}{{ a.newValue ?? "" }}
          </td>
          <td class="muted">{{ a.note ?? "" }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.detail-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.detail-head h2 {
  margin: 0;
}
.refreshing {
  font-size: 12px;
}
.chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.sl-note {
  font-size: 12px;
  margin: 4px 0;
}
.sl-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}
.sl-notes {
  flex: 1 1 200px;
}
.sl-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding-bottom: 8px;
}
.sl-hint {
  font-size: 11px;
  margin: 4px 0;
}
.sl-sub {
  margin-bottom: 4px;
}
.sl-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.sl-created {
  font-size: 11px;
}
.sl-cancel {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
.tag {
  border-radius: 6px;
  padding: 1px 7px;
  font-size: 11px;
  text-transform: uppercase;
}
.tag.manual {
  background: rgba(91, 140, 255, 0.18);
  color: #5b8cff;
}
.tag.ai {
  background: rgba(47, 191, 113, 0.18);
  color: #2fbf71;
}
.tag.trailing {
  background: rgba(91, 140, 255, 0.18);
  color: var(--accent);
}
.sl-type {
  align-self: flex-start;
  margin: 4px 0 10px;
}
.sl-trailby {
  align-self: flex-start;
}
.sl-trailinfo {
  font-size: 11px;
}
.trail-evt {
  color: var(--accent);
}
.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 6px;
}
.audit-table th,
.audit-table td {
  text-align: left;
  padding: 4px 8px;
  border-bottom: 1px solid var(--line);
}
</style>
