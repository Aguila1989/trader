<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, dateTimeStr } from "../format";
import TokenChart from "./TokenChart.vue";
import InfoTip from "./InfoTip.vue";
import AssetSelect from "./AssetSelect.vue";

const store = useTraderStore();

const TIMEFRAMES = [
  { key: "hour", label: "Hour" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "year", label: "Year" },
] as const;

const TIPS = {
  spread:
    "The difference between the best buy and best sell price in the order book. A wider spread means higher implicit cost per trade.",
  trigger:
    "If the price reaches this level, the position is closed. For a long this is below the current price; for a short, above it — it caps the loss if the trade goes against you.",
};

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
const trigger = ref("");
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
const formValid = computed(
  () => triggerValid.value && (sellAll.value || Number(quantity.value) > 0),
);
const triggerHint = computed(() => {
  const m = mid.value;
  if (m == null) return "Set a trigger price.";
  return effectiveSide.value === "long"
    ? `Long stop: trigger must be BELOW the current price (${fmtNum(m, 7)}).`
    : `Short stop: trigger must be ABOVE the current price (${fmtNum(m, 7)}).`;
});

async function submit(): Promise<void> {
  if (!formValid.value || submitting.value || !store.selectedToken) return;
  submitting.value = true;
  try {
    const ok = await store.setStopLoss({
      base: store.selectedToken,
      quote: store.selectedQuote,
      triggerPrice: trigger.value.trim(),
      sellAll: sellAll.value,
      quantityToSell: sellAll.value ? undefined : quantity.value.trim(),
      notes: notes.value.trim() || undefined,
    });
    if (ok) {
      trigger.value = "";
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
      <button class="btn" @click="store.closeToken()">← Back</button>
      <h2>{{ code }} <span class="muted">/ {{ quoteCode }}</span></h2>
      <span v-if="store.tokenLoading" class="muted refreshing">refreshing…</span>
    </div>

    <p v-if="store.tokenError" class="violations">{{ store.tokenError }}</p>

    <div class="topbook">
      <div>Bid <span class="mono pos">{{ fmtNum(store.tokenBook?.bestBid, 7) }}</span></div>
      <div>Ask <span class="mono neg">{{ fmtNum(store.tokenBook?.bestAsk, 7) }}</span></div>
      <div>
        Spread<InfoTip :text="TIPS.spread" label="What is spread?" />
        <span class="mono">
          {{ store.tokenBook?.spreadBps != null ? fmtNum(store.tokenBook.spreadBps, 1) + " bps" : "-" }}
        </span>
      </div>
    </div>

    <div class="book">
      <div>
        <h3>Bids</h3>
        <ul class="levels bids">
          <li v-if="!(store.tokenBook?.bids?.length)" class="muted-row">
            <span class="muted">(empty)</span>
          </li>
          <li v-for="(lv, i) in store.tokenBook?.bids ?? []" :key="'b' + i">
            <span class="px">{{ fmtNum(lv.price, 7) }}</span>
            <span class="amt">{{ fmtNum(lv.amount) }}</span>
          </li>
        </ul>
      </div>
      <div>
        <h3>Asks</h3>
        <ul class="levels asks">
          <li v-if="!(store.tokenBook?.asks?.length)" class="muted-row">
            <span class="muted">(empty)</span>
          </li>
          <li v-for="(lv, i) in store.tokenBook?.asks ?? []" :key="'a' + i">
            <span class="px">{{ fmtNum(lv.price, 7) }}</span>
            <span class="amt">{{ fmtNum(lv.amount) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="chart-head">
      <h3>Price</h3>
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
    <h3>Stop loss</h3>
    <p v-if="store.killSwitch" class="violations sl-note">
      Kill switch is ACTIVE — stops will not fire until it is released.
    </p>
    <p v-else-if="store.isReadOnly" class="muted sl-note">
      Live trading is off — a stop is recorded now but only executes once live
      trading is armed.
    </p>
    <p v-if="side === 'flat'" class="muted sl-note">
      The bot holds no position on this pair yet — a stop here activates if/when
      it opens one.
    </p>

    <div class="sl-form">
      <label class="order-field">
        <span class="order-label">Asset</span>
        <AssetSelect
          :model-value="store.selectedToken ?? ''"
          :options="pairOptions"
          locked
          aria-label="Stop-loss asset"
        />
      </label>
      <label class="order-field">
        <span class="order-label">
          Trigger price ({{ quoteCode }})<InfoTip :text="TIPS.trigger" label="Trigger price" />
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
      <label class="sl-checkbox">
        <input v-model="sellAll" type="checkbox" /> Sell all
      </label>
      <label v-if="!sellAll" class="order-field">
        <span class="order-label">Quantity ({{ code }})</span>
        <input
          v-model="quantity"
          class="order-input"
          type="text"
          inputmode="decimal"
          placeholder="0.00"
        />
      </label>
      <label class="order-field sl-notes">
        <span class="order-label">Notes (optional)</span>
        <input v-model="notes" class="order-input" type="text" placeholder="reason / annotation" />
      </label>
      <button class="btn primary" :disabled="!formValid || submitting" @click="submit">
        {{ submitting ? "Setting…" : "Set Stop Loss" }}
      </button>
    </div>
    <p class="muted sl-hint" :class="{ neg: trigger && !triggerValid }">{{ triggerHint }}</p>
    <p v-if="store.stopLossError" class="violations">{{ store.stopLossError }}</p>

    <h4 class="sl-sub">Active stop losses</h4>
    <ul class="levels sl-list">
      <li v-if="pairStops.length === 0" class="muted-row">
        <span class="muted">(none)</span>
      </li>
      <li v-for="s in pairStops" :key="s.id" class="sl-row">
        <span class="mono">@ {{ s.triggerPrice }}</span>
        <span>{{ s.sellAll ? "all" : s.quantityToSell }}</span>
        <span class="tag" :class="s.setBy">{{ s.setBy }}</span>
        <span class="muted sl-created">{{ dateTimeStr(s.createdAt) }}</span>
        <button class="btn sl-cancel" @click="store.cancelStopLoss(s.id)">Cancel</button>
      </li>
    </ul>

    <!-- Audit log (collapsible) ---------------------------------------- -->
    <button class="order-disclosure" type="button" @click="toggleAudit">
      {{ showAudit ? "▾" : "▸" }} Audit log
    </button>
    <table v-if="showAudit" class="audit-table">
      <thead>
        <tr>
          <th>Time</th>
          <th>Action</th>
          <th>By</th>
          <th>Change</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!store.stopLossAudit || store.stopLossAudit.rows.length === 0">
          <td colspan="5" class="muted">No audit entries for this pair.</td>
        </tr>
        <tr v-for="a in store.stopLossAudit?.rows ?? []" :key="a.id">
          <td class="muted">{{ dateTimeStr(a.ts) }}</td>
          <td>{{ a.action }}</td>
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
