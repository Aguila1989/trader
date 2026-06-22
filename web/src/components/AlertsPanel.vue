<script setup lang="ts">
import { ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, assetCode as code } from "../format";
import AssetSelect from "./AssetSelect.vue";

const store = useTraderStore();
const base = ref("XLM");
const quote = ref("");
const direction = ref<"above" | "below">("above");
const price = ref("");
const busy = ref(false);

async function add(): Promise<void> {
  if (busy.value || !quote.value.trim() || !(Number(price.value) > 0)) return;
  busy.value = true;
  try {
    const ok = await store.setAlert({
      base: base.value.trim() || "XLM",
      quote: quote.value.trim(),
      direction: direction.value,
      price: price.value.trim(),
    });
    if (ok) price.value = "";
  } finally {
    busy.value = false;
  }
}

</script>

<template>
  <section class="panel">
    <h2>Price alerts</h2>
    <p class="muted al-note">
      Notify when a pair's mid crosses a price. Evaluated by the position
      monitor each tick; grant notification permission for a desktop toast.
    </p>
    <div class="al-form">
      <AssetSelect
        v-model="base"
        :options="store.universe"
        aria-label="Alert base asset"
      />
      <AssetSelect
        v-model="quote"
        :options="store.universe"
        placeholder="quote token"
        aria-label="Alert quote asset"
      />
      <select v-model="direction" class="al-input">
        <option value="above">above</option>
        <option value="below">below</option>
      </select>
      <input v-model="price" class="al-input" inputmode="decimal" placeholder="price" />
      <button
        class="btn primary"
        :disabled="busy || !quote.trim() || !(Number(price) > 0)"
        @click="add"
      >
        {{ busy ? "Adding…" : "Add alert" }}
      </button>
    </div>
    <p v-if="store.alertError" class="violations">{{ store.alertError }}</p>
    <ul class="levels">
      <li v-if="store.priceAlerts.length === 0" class="muted-row">
        <span class="muted">(none)</span>
      </li>
      <li v-for="a in store.priceAlerts" :key="a.id" class="al-row">
        <span class="px">{{ code(a.baseAsset) }}/{{ code(a.quoteAsset) }}</span>
        <span class="mono">{{ a.direction }} {{ fmtNum(a.price, 7) }}</span>
        <button class="btn al-cancel" @click="store.cancelAlert(a.id)">Cancel</button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.al-note {
  font-size: 12px;
  margin-top: 0;
}
.al-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.al-input {
  flex: 1 1 110px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
}
.al-input.wide {
  flex: 2 1 220px;
}
.al-input:focus {
  outline: none;
  border-color: var(--accent);
}
.al-form .asset-select {
  flex: 1 1 160px;
  min-width: 130px;
}
.al-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.al-cancel {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
</style>
