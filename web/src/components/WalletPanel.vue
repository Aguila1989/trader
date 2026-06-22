<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, assetCode as code } from "../format";
import type { UniverseToken } from "../types";
import AssetSelect from "./AssetSelect.vue";

const store = useTraderStore();

const account = computed(() => store.snapshot?.account ?? null);
// You can only send/swap FROM assets you actually hold.
const heldTokens = computed(() => store.heldTokens);
// Swap destinations: the whitelisted universe PLUS anything already held (so a
// held-but-unlisted asset is still a valid destination), de-duped by spec.
const swapToOptions = computed<UniverseToken[]>(() => {
  const seen = new Set<string>();
  const out: UniverseToken[] = [];
  for (const t of [...store.universe, ...store.heldTokens]) {
    const k = t.spec.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
});

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

const sendHeld = computed(() => store.heldBalance(sendAsset.value));
const sendInsufficient = computed(
  () => Number(sendAmount.value) > 0 && Number(sendAmount.value) > sendHeld.value,
);
const sendValid = computed(
  () =>
    !!sendTo.value.trim() &&
    Number(sendAmount.value) > 0 &&
    !sendInsufficient.value,
);

async function send(): Promise<void> {
  if (sending.value || !sendValid.value) return;
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

const swapHeld = computed(() => store.heldBalance(swapFrom.value));
const swapInsufficient = computed(
  () => Number(swapAmount.value) > 0 && Number(swapAmount.value) > swapHeld.value,
);
const swapValid = computed(
  () =>
    !!swapFrom.value &&
    !!swapTo.value &&
    swapFrom.value !== swapTo.value &&
    Number(swapAmount.value) > 0 &&
    !swapInsufficient.value,
);

// Any change to the pair or amount invalidates a previously-fetched quote.
watch([swapFrom, swapTo, swapAmount], () => {
  store.swapQuoteResult = null;
});

async function getQuote(): Promise<void> {
  if (quoting.value || !swapValid.value) return;
  quoting.value = true;
  try {
    await store.getSwapQuote(
      swapFrom.value.trim(),
      swapTo.value.trim(),
      swapAmount.value.trim(),
    );
  } finally {
    quoting.value = false;
  }
}
async function doSwap(): Promise<void> {
  if (swapping.value || !quote.value || swapInsufficient.value) return;
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
      <AssetSelect
        v-model="sendAsset"
        :options="heldTokens"
        placeholder="asset"
        aria-label="Send asset"
      />
      <input v-model="sendAmount" class="w-input" inputmode="decimal" placeholder="amount" />
      <input v-model="sendMemo" class="w-input" placeholder="memo (optional)" />
      <button
        class="btn primary"
        :disabled="sending || store.isReadOnly || !sendValid"
        @click="send"
      >
        {{ sending ? "Sending…" : "Send" }}
      </button>
    </div>
    <p v-if="sendInsufficient" class="violations">
      Insufficient {{ store.tokenFor(sendAsset).code }}: you hold
      {{ fmtNum(sendHeld) }}.
    </p>

    <h3>Swap</h3>
    <div class="w-form">
      <AssetSelect
        v-model="swapFrom"
        :options="heldTokens"
        placeholder="from (held)"
        aria-label="Swap from"
      />
      <input v-model="swapAmount" class="w-input" inputmode="decimal" placeholder="amount" />
      <AssetSelect
        v-model="swapTo"
        :options="swapToOptions"
        placeholder="to"
        aria-label="Swap to"
      />
      <button
        class="btn"
        :disabled="quoting || !swapValid"
        @click="getQuote"
      >
        {{ quoting ? "Quoting…" : "Quote" }}
      </button>
      <button class="btn primary" :disabled="swapping || store.isReadOnly || !quote" @click="doSwap">
        {{ swapping ? "Swapping…" : "Swap" }}
      </button>
    </div>
    <p v-if="swapInsufficient" class="violations">
      Insufficient {{ store.tokenFor(swapFrom).code }}: you hold
      {{ fmtNum(swapHeld) }}.
    </p>
    <p v-if="quote" class="muted w-quote">
      ≈ <span class="mono">{{ fmtNum(quote.destAmount) }}</span> {{ code(quote.destAsset) }}
      for {{ fmtNum(quote.sendAmount) }} {{ code(quote.sendAsset) }}
      <span v-if="quote.path.length">via {{ quote.path.map(code).join(" → ") }}</span>
    </p>

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
.w-form .asset-select {
  flex: 1 1 150px;
  min-width: 130px;
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
