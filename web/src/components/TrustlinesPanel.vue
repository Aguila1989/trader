<script setup lang="ts">
import { computed, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import AssetSelect from "./AssetSelect.vue";

const store = useTraderStore();
const selected = ref("");
const busy = ref(false);

// Tokens you can still add: the curated/whitelisted universe minus XLM and
// minus assets you already have a trustline for. Picking one supplies the
// full CODE:ISSUER, so no manual issuer/home-domain entry is needed.
const addable = computed(() => {
  const have = new Set(store.trustlines.map((t) => t.asset.toUpperCase()));
  return store.universe.filter(
    (t) => t.spec.toUpperCase() !== "XLM" && !have.has(t.spec.toUpperCase()),
  );
});

async function add(): Promise<void> {
  if (busy.value || !selected.value) return;
  busy.value = true;
  try {
    const ok = await store.addTrustline({ asset: selected.value });
    if (ok) selected.value = "";
  } finally {
    busy.value = false;
  }
}

async function remove(asset: string): Promise<void> {
  await store.removeTrustline({ asset });
}
</script>

<template>
  <section class="panel">
    <h2>Trustlines</h2>
    <p class="muted tl-note">
      Assets the wallet can hold. Pick a token to add its trustline so you can
      trade or receive it; each add locks 0.5 XLM reserve.
      <span v-if="store.isReadOnly">Arm live trading to modify trustlines.</span>
    </p>
    <ul class="levels">
      <li v-if="store.trustlines.length === 0" class="muted-row">
        <span class="muted">(only XLM)</span>
      </li>
      <li v-for="t in store.trustlines" :key="t.asset" class="tl-row">
        <span class="px" :title="t.asset">{{ t.code }}</span>
        <span class="amt">{{ fmtNum(t.balance) }}</span>
        <button
          class="btn tl-remove"
          :disabled="store.isReadOnly || Number(t.balance) > 0"
          :title="Number(t.balance) > 0 ? 'Sell/transfer the balance to zero first' : 'Remove trustline'"
          @click="remove(t.asset)"
        >
          Remove
        </button>
      </li>
    </ul>
    <div class="tl-form">
      <AssetSelect
        v-model="selected"
        :options="addable"
        placeholder="Pick a token to add"
        aria-label="Trustline asset"
      />
      <button
        class="btn primary"
        :disabled="busy || store.isReadOnly || !selected"
        @click="add"
      >
        {{ busy ? "Adding…" : "Add trustline" }}
      </button>
    </div>
    <p v-if="store.trustlineError" class="violations">{{ store.trustlineError }}</p>
  </section>
</template>

<style scoped>
.tl-note {
  font-size: 12px;
  margin-top: 0;
}
.tl-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.tl-remove {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
.tl-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.tl-form .asset-select {
  flex: 1 1 240px;
  min-width: 180px;
}
</style>
