<script setup lang="ts">
// Stop-loss management. mode="manual": a form to set a REGULAR or TRAILING stop
// for any whitelisted token + the list of user-set stops. mode="ai": the read +
// cancel view of AI-set stops (with the AI's reasoning in notes). Trailing stops
// are badged and show their live trail price + high-water mark.
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { api } from "../api";
import { fmtNum, dateTimeStr } from "../format";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";

const props = defineProps<{ mode: "manual" | "ai" }>();
const store = useTraderStore();
const { t } = useI18n();

const TIPS = computed(() => ({
  trailing: t("stopLoss.tips.trailing"),
}));

const stops = computed(() =>
  store.stopLosses.filter((s) => s.status === "active" && s.setBy === props.mode),
);

function code(spec: string): string {
  return store.tokenFor(spec).code;
}
function liveTrigger(s: { isTrailing?: boolean; currentTrailPrice?: string; triggerPrice: string }): string {
  return s.isTrailing && s.currentTrailPrice != null ? s.currentTrailPrice : s.triggerPrice;
}

// --- manual set form ---
const base = ref("");
const quote = ref("XLM");
const stopType = ref<"regular" | "trailing">("regular");
const trigger = ref("");
const trailBy = ref<"pct" | "amount">("pct");
const trailValue = ref("");
const sellAll = ref(true);
const quantity = ref("");
const submitting = ref(false);

// Live mid for the chosen pair, used only to preview the initial trailing stop.
const mid = ref<number | null>(null);
watch([base, quote], async () => {
  mid.value = null;
  if (!base.value || !quote.value || base.value === quote.value) return;
  // Guard against out-of-order responses when the pair changes quickly: ignore a
  // result whose pair is no longer the selected one (last-writer-wins race).
  const b = base.value;
  const q = quote.value;
  try {
    const ob = await api.orderbook(b, q);
    if (b !== base.value || q !== quote.value) return;
    mid.value =
      ob.bestBid != null && ob.bestAsk != null
        ? (ob.bestBid + ob.bestAsk) / 2
        : ob.bestBid ?? ob.bestAsk ?? null;
  } catch {
    if (b === base.value && q === quote.value) mid.value = null;
  }
});

const trailNum = computed(() => Number(trailValue.value));
// Initial (long-side) trailing stop preview from the live mid.
const initialTrailPrice = computed<number | null>(() => {
  if (mid.value == null || !(trailNum.value > 0)) return null;
  const p =
    trailBy.value === "pct"
      ? mid.value * (1 - trailNum.value / 100)
      : mid.value - trailNum.value;
  return p > 0 ? Number(p.toFixed(7)) : null;
});

const formValid = computed(() => {
  const pairOk = !!base.value && !!quote.value && base.value !== quote.value;
  const qtyOk = sellAll.value || Number(quantity.value) > 0;
  if (!pairOk || !qtyOk) return false;
  return stopType.value === "trailing"
    ? trailNum.value > 0 && initialTrailPrice.value != null
    : Number(trigger.value) > 0;
});

async function submit(): Promise<void> {
  if (!formValid.value || submitting.value) return;
  submitting.value = true;
  try {
    const ok = await store.setStopLoss(
      stopType.value === "trailing"
        ? {
            base: base.value,
            quote: quote.value,
            stopType: "trailing",
            trailBy: trailBy.value,
            trailValue: trailValue.value.trim(),
            sellAll: sellAll.value,
            quantityToSell: sellAll.value ? undefined : quantity.value.trim(),
          }
        : {
            base: base.value,
            quote: quote.value,
            triggerPrice: trigger.value.trim(),
            sellAll: sellAll.value,
            quantityToSell: sellAll.value ? undefined : quantity.value.trim(),
          },
    );
    if (ok) {
      trigger.value = "";
      trailValue.value = "";
      quantity.value = "";
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="panel">
    <h2>{{ mode === "manual" ? t("stopLoss.titleManual") : t("stopLoss.titleAi") }}</h2>

    <template v-if="mode === 'manual'">
      <div class="segmented sl-type">
        <button class="seg" :class="{ active: stopType === 'regular' }" @click="stopType = 'regular'">
          {{ t("stopLoss.regularStopLoss") }}
        </button>
        <button class="seg" :class="{ active: stopType === 'trailing' }" @click="stopType = 'trailing'">
          {{ t("stopLoss.trailingStopLoss") }}<InfoTip :text="TIPS.trailing" :label="t('stopLoss.trailingStopLoss')" placement="right" />
        </button>
      </div>

      <div class="sl-form">
        <label class="order-field">
          <span class="order-label">{{ t("stopLoss.token") }}</span>
          <AssetSelect v-model="base" :options="store.universe" :placeholder="t('stopLoss.tokenPlaceholder')" :aria-label="t('stopLoss.tokenAria')" />
        </label>
        <label class="order-field">
          <span class="order-label">{{ t("stopLoss.quote") }}</span>
          <AssetSelect v-model="quote" :options="store.universe" :aria-label="t('stopLoss.quoteAria')" />
        </label>

        <label v-if="stopType === 'regular'" class="order-field">
          <span class="order-label">{{ t("stopLoss.triggerPrice") }}</span>
          <input v-model="trigger" class="order-input" type="text" inputmode="decimal" placeholder="0.00" @keyup.enter="submit" />
        </label>

        <template v-else>
          <div class="order-field">
            <span class="order-label">{{ t("stopLoss.trailBy") }}</span>
            <div class="segmented sl-trailby">
              <button class="seg" :class="{ active: trailBy === 'pct' }" @click="trailBy = 'pct'">%</button>
              <button class="seg" :class="{ active: trailBy === 'amount' }" @click="trailBy = 'amount'">{{ t("stopLoss.amount") }}</button>
            </div>
          </div>
          <label class="order-field">
            <span class="order-label">{{ trailBy === "pct" ? t("stopLoss.trailPercent") : t("stopLoss.trailAmount") }}</span>
            <input
              v-model="trailValue"
              class="order-input"
              type="text"
              inputmode="decimal"
              :placeholder="trailBy === 'pct' ? t('stopLoss.trailPercentPlaceholder') : '0.00'"
              @keyup.enter="submit"
            />
          </label>
        </template>

        <label class="sl-checkbox"><input v-model="sellAll" type="checkbox" /> {{ t("stopLoss.sellAll") }}</label>
        <label v-if="!sellAll" class="order-field">
          <span class="order-label">{{ t("stopLoss.quantity") }}</span>
          <input v-model="quantity" class="order-input" type="text" inputmode="decimal" placeholder="0.00" />
        </label>
        <button class="btn primary" :disabled="!formValid || submitting" @click="submit">
          {{ submitting ? t("stopLoss.setting") : t("stopLoss.setStopLoss") }}
        </button>
      </div>

      <p v-if="stopType === 'trailing' && initialTrailPrice != null" class="muted sl-preview">
        {{ t("stopLoss.initialStopPrice") }}: <span class="mono">{{ fmtNum(initialTrailPrice, 7) }}</span>
        ({{ t("stopLoss.current") }} <span class="mono">{{ fmtNum(mid, 7) }}</span> − {{ t("stopLoss.trail") }}
        {{ trailBy === "pct" ? trailValue + "%" : trailValue }})
      </p>
      <p v-else-if="stopType === 'trailing'" class="muted sl-preview">
        {{ t("stopLoss.trailHint") }}
      </p>
    </template>
    <p v-if="mode === 'manual' && store.stopLossError" class="violations">{{ store.stopLossError }}</p>

    <table class="sl-table">
      <thead>
        <tr>
          <th>{{ t("stopLoss.token") }}</th>
          <th class="num">{{ t("stopLoss.trigger") }}</th>
          <th class="num">{{ t("stopLoss.highWater") }}</th>
          <th>{{ t("stopLoss.quantity") }}</th>
          <th v-if="mode === 'ai'">{{ t("stopLoss.reasoning") }}</th>
          <th>{{ t("stopLoss.created") }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="stops.length === 0">
          <td :colspan="mode === 'ai' ? 7 : 6" class="muted">{{ t("stopLoss.none") }}</td>
        </tr>
        <tr v-for="s in stops" :key="s.id">
          <td :title="s.baseAsset">
            {{ code(s.baseAsset) }}/{{ code(s.quoteAsset) }}
            <span v-if="s.isTrailing" class="tag trailing">{{ t("stopLoss.trailingTag") }}</span>
          </td>
          <td class="num mono">
            {{ fmtNum(liveTrigger(s), 7) }}
            <span v-if="s.isTrailing && s.trailPercent != null" class="muted sl-traildesc">(−{{ s.trailPercent }}%)</span>
            <span v-else-if="s.isTrailing && s.trailAmount != null" class="muted sl-traildesc">(−{{ fmtNum(s.trailAmount, 7) }})</span>
          </td>
          <td class="num mono">{{ s.isTrailing ? fmtNum(s.highWaterMark, 7) : "—" }}</td>
          <td>{{ s.sellAll ? t("stopLoss.allQty") : s.quantityToSell }}</td>
          <td v-if="mode === 'ai'" class="muted sl-notes">{{ s.notes || "—" }}</td>
          <td class="muted">{{ dateTimeStr(s.createdAt) }}</td>
          <td>
            <button class="btn sl-cancel" :disabled="store.isReadOnly" @click="store.cancelStopLoss(s.id)">
              {{ t("stopLoss.cancel") }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.sl-type,
.sl-trailby {
  align-self: flex-start;
}
.sl-type {
  margin-bottom: 10px;
}
.sl-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 8px;
}
.sl-form .asset-select {
  min-width: 130px;
}
.order-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.order-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.order-input {
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
  max-width: 140px;
}
.order-input:focus {
  outline: none;
  border-color: var(--accent);
}
.sl-checkbox {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding-bottom: 8px;
}
.sl-preview {
  font-size: 12px;
  margin: 0 0 8px;
}
.sl-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.sl-table th,
.sl-table td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--panel-2);
}
.sl-table th.num,
.sl-table td.num {
  text-align: right;
}
.sl-traildesc {
  font-size: 11px;
}
.sl-notes {
  max-width: 280px;
  font-size: 12px;
}
.sl-cancel {
  padding: 2px 10px;
  font-size: 12px;
}
.tag.trailing {
  background: rgba(91, 140, 255, 0.18);
  color: var(--accent);
  border-radius: 6px;
  padding: 1px 7px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-left: 6px;
}
</style>
