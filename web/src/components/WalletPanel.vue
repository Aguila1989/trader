<script setup lang="ts">
import { computed, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey } from "../format";

const store = useTraderStore();

const account = computed(() => store.snapshot?.account ?? null);
// Held assets (funded) as quick-pick options for the asset fields.
const heldAssets = computed(() =>
  store.balances.filter((b) => Number(b.balance) > 0).map((b) => b.asset),
);

async function copyAddress(): Promise<void> {
  if (account.value) {
    try {
      await navigator.clipboard.writeText(account.value);
    } catch {
      /* clipboard may be blocked; the address is shown for manual copy */
    }
  }
}

// --- Send ---
const sendTo = ref("");
const sendAsset = ref("XLM");
const sendAmount = ref("");
const sendMemo = ref("");
const sending = ref(false);
async function send(): Promise<void> {
  if (sending.value || !sendTo.value.trim() || !(Number(sendAmount.value) > 0)) return;
  sending.value = true;
  try {
    const ok = await store.pay({
      destination: sendTo.value.trim(),
      asset: sendAsset.value.trim() || "XLM",
      amount: sendAmount.value.trim(),
      memo: sendMemo.value.trim() || undefined,
    });
    if (ok) {
      sendTo.value = "";
      sendAmount.value = "";
      sendMemo.value = "";
    }
  } finally {
    sending.value = false;
  }
}

// --- Swap ---
const swapFrom = ref("XLM");
const swapTo = ref("");
const swapAmount = ref("");
const quoting = ref(false);
const swapping = ref(false);
const quote = computed(() => store.swapQuoteResult);
async function getQuote(): Promise<void> {
  if (quoting.value || !swapFrom.value.trim() || !swapTo.value.trim() || !(Number(swapAmount.value) > 0))
    return;
  quoting.value = true;
  try {
    await store.getSwapQuote(swapFrom.value.trim(), swapTo.value.trim(), swapAmount.value.trim());
  } finally {
    quoting.value = false;
  }
}
async function doSwap(): Promise<void> {
  if (swapping.value || !quote.value) return;
  swapping.value = true;
  try {
    const ok = await store.executeSwap({
      sendAsset: swapFrom.value.trim(),
      sendAmount: swapAmount.value.trim(),
      destAsset: swapTo.value.trim(),
    });
    if (ok) swapAmount.value = "";
  } finally {
    swapping.value = false;
  }
}

function code(spec: string): string {
  return spec.split(":")[0] || spec;
}
</script>

<template>
  <section class="panel">
    <h2>Wallet</h2>
    <p v-if="store.isReadOnly" class="muted w-note">
      Receiving works in any mode. Sending, swapping and claiming require live
      trading to be armed.
    </p>

    <h3>Receive</h3>
    <div v-if="account" class="w-receive">
      <span class="mono w-addr" :title="account">{{ shortKey(account) }}</span>
      <button class="btn" @click="copyAddress">Copy address</button>
    </div>
    <p v-else class="muted">(no account configured)</p>

    <h3>Send</h3>
    <div class="w-form">
      <input v-model="sendTo" class="w-input wide" placeholder="destination G... or name*domain" />
      <input v-model="sendAsset" class="w-input" list="held-assets" placeholder="asset (XLM or CODE:ISSUER)" />
      <input v-model="sendAmount" class="w-input" inputmode="decimal" placeholder="amount" />
      <input v-model="sendMemo" class="w-input" placeholder="memo (optional)" />
      <button class="btn primary" :disabled="sending || store.isReadOnly || !sendTo.trim() || !(Number(sendAmount) > 0)" @click="send">
        {{ sending ? "Sending…" : "Send" }}
      </button>
    </div>

    <h3>Swap</h3>
    <div class="w-form">
      <input v-model="swapFrom" class="w-input" list="held-assets" placeholder="from (CODE:ISSUER)" />
      <input v-model="swapAmount" class="w-input" inputmode="decimal" placeholder="amount" @input="store.swapQuoteResult = null" />
      <input v-model="swapTo" class="w-input" placeholder="to (CODE:ISSUER)" />
      <button class="btn" :disabled="quoting || !swapFrom.trim() || !swapTo.trim() || !(Number(swapAmount) > 0)" @click="getQuote">
        {{ quoting ? "Quoting…" : "Quote" }}
      </button>
      <button class="btn primary" :disabled="swapping || store.isReadOnly || !quote" @click="doSwap">
        {{ swapping ? "Swapping…" : "Swap" }}
      </button>
    </div>
    <p v-if="quote" class="muted w-quote">
      ≈ <span class="mono">{{ fmtNum(quote.destAmount) }}</span> {{ code(quote.destAsset) }}
      for {{ fmtNum(quote.sendAmount) }} {{ code(quote.sendAsset) }}
      <span v-if="quote.path.length">via {{ quote.path.map(code).join(" → ") }}</span>
    </p>

    <datalist id="held-assets">
      <option v-for="a in heldAssets" :key="a" :value="a" />
    </datalist>

    <h3>Pending payments</h3>
    <ul class="levels">
      <li v-if="store.claimables.length === 0" class="muted-row">
        <span class="muted">(none)</span>
      </li>
      <li v-for="c in store.claimables" :key="c.id" class="w-claim">
        <span class="px">{{ fmtNum(c.amount) }} {{ code(c.asset) }}</span>
        <button class="btn w-claim-btn" :disabled="store.isReadOnly" @click="store.claim(c.id)">Claim</button>
      </li>
    </ul>

    <p v-if="store.walletError" class="violations">{{ store.walletError }}</p>
  </section>
</template>

<style scoped>
.w-note {
  font-size: 12px;
  margin-top: 0;
}
.w-receive {
  display: flex;
  align-items: center;
  gap: 10px;
}
.w-addr {
  word-break: break-all;
}
.w-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.w-input {
  flex: 1 1 130px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--text);
  padding: 7px 10px;
  font-family: ui-monospace, monospace;
}
.w-input.wide {
  flex: 2 1 280px;
}
.w-input:focus {
  outline: none;
  border-color: var(--accent);
}
.w-quote {
  font-size: 12px;
}
.w-claim {
  display: flex;
  align-items: center;
  gap: 10px;
}
.w-claim-btn {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 12px;
}
</style>
