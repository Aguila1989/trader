<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, assetCode as code } from "../format";
import type { UniverseToken } from "../types";
import AssetSelect from "./AssetSelect.vue";
import PendingPayments from "./PendingPayments.vue";

const { t } = useI18n();
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
    <h2>{{ t("wallet.title") }}</h2>
    <p v-if="store.isReadOnly" class="muted w-note">
      {{ t("wallet.readOnlyNote") }}
    </p>

    <h3>{{ t("wallet.receive") }}</h3>
    <div v-if="account" class="w-receive">
      <span class="mono w-addr" :title="account">{{ shortKey(account) }}</span>
      <button class="btn" @click="copyAddress">{{ t("wallet.copyAddress") }}</button>
    </div>
    <p v-else class="muted">{{ t("wallet.noAccount") }}</p>

    <h3>{{ t("wallet.send") }}</h3>
    <div class="w-form">
      <input v-model="sendTo" class="w-input wide" :placeholder="t('wallet.destinationPlaceholder')" />
      <AssetSelect
        v-model="sendAsset"
        :options="heldTokens"
        :placeholder="t('wallet.assetPlaceholder')"
        :aria-label="t('wallet.sendAssetAria')"
      />
      <input v-model="sendAmount" class="w-input" inputmode="decimal" :placeholder="t('wallet.amountPlaceholder')" />
      <input v-model="sendMemo" class="w-input" :placeholder="t('wallet.memoPlaceholder')" />
      <button
        class="btn primary"
        :disabled="sending || store.isReadOnly || !sendValid"
        @click="send"
      >
        {{ sending ? t("wallet.sending") : t("wallet.send") }}
      </button>
    </div>
    <p v-if="sendInsufficient" class="violations">
      {{ t("wallet.insufficient", { code: store.tokenFor(sendAsset).code, held: fmtNum(sendHeld) }) }}
    </p>

    <h3>{{ t("wallet.swap") }}</h3>
    <div class="w-form">
      <AssetSelect
        v-model="swapFrom"
        :options="heldTokens"
        :placeholder="t('wallet.fromHeldPlaceholder')"
        :aria-label="t('wallet.swapFromAria')"
      />
      <input v-model="swapAmount" class="w-input" inputmode="decimal" :placeholder="t('wallet.amountPlaceholder')" />
      <AssetSelect
        v-model="swapTo"
        :options="swapToOptions"
        :placeholder="t('wallet.toPlaceholder')"
        :aria-label="t('wallet.swapToAria')"
      />
      <button
        class="btn"
        :disabled="quoting || !swapValid"
        @click="getQuote"
      >
        {{ quoting ? t("wallet.quoting") : t("wallet.quote") }}
      </button>
      <button class="btn primary" :disabled="swapping || store.isReadOnly || !quote" @click="doSwap">
        {{ swapping ? t("wallet.swapping") : t("wallet.swap") }}
      </button>
    </div>
    <p v-if="swapInsufficient" class="violations">
      {{ t("wallet.insufficient", { code: store.tokenFor(swapFrom).code, held: fmtNum(swapHeld) }) }}
    </p>
    <p v-if="quote" class="muted w-quote">
      ≈ <span class="mono">{{ fmtNum(quote.destAmount) }}</span> {{ code(quote.destAsset) }}
      {{ t("wallet.for") }} {{ fmtNum(quote.sendAmount) }} {{ code(quote.sendAsset) }}
      <span v-if="quote.path.length">{{ t("wallet.via") }} {{ quote.path.map(code).join(" → ") }}</span>
    </p>

    <PendingPayments />

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
