<script setup lang="ts">
import { ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

const store = useTraderStore();
const code = ref("");
const issuer = ref("");
const homeDomain = ref("");
const busy = ref(false);

async function add(): Promise<void> {
  if (busy.value || !code.value.trim()) return;
  busy.value = true;
  try {
    const ok = await store.addTrustline({
      code: code.value.trim(),
      issuer: issuer.value.trim() || undefined,
      homeDomain: homeDomain.value.trim() || undefined,
    });
    if (ok) {
      code.value = "";
      issuer.value = "";
      homeDomain.value = "";
    }
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
      Assets the wallet can hold. Add one (by issuer key, or just a code + home
      domain) to trade or receive it; each add locks 0.5 XLM reserve.
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
      <input v-model="code" class="tl-input" placeholder="CODE (e.g. USDC)" />
      <input v-model="issuer" class="tl-input" placeholder="issuer G... (optional)" />
      <input v-model="homeDomain" class="tl-input" placeholder="or home domain (e.g. centre.io)" />
      <button
        class="btn primary"
        :disabled="busy || store.isReadOnly || !code.trim()"
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
}
.tl-input {
  flex: 1 1 140px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
}
.tl-input:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
