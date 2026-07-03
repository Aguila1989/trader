<script setup lang="ts">
// Receive & Send route. Consolidates everything that used to live in the
// (now-removed) WalletPanel on the Manual tab — the receive address, the manual
// token send form, and the general swap — and adds a client-side QR of the
// PUBLIC key plus a trade-log–derived XLM conversion history. Pending payments
// moved to their own route; auto-swap settings live in Settings ▸ Swap & Transfer.
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { walletState } from "../wallet/walletState";
import { fmtNum, assetCode as code } from "../format";
import { LESSONS } from "../academy/deeplinks";
import type { UniverseToken } from "../types";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";
import ReceiveQr from "./wallet/ReceiveQr.vue";
import ConversionHistory from "./ConversionHistory.vue";

const { t } = useI18n();
const store = useTraderStore();

// The operator's own wallet (per-user, authoritative) — what we show + encode.
const account = computed(() => walletState.publicKey);

const heldTokens = computed(() => store.heldTokens);
const swapToOptions = computed<UniverseToken[]>(() => {
  const seen = new Set<string>();
  const out: UniverseToken[] = [];
  for (const tk of [...store.universe, ...store.heldTokens]) {
    const k = tk.spec.toUpperCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(tk);
  }
  return out;
});

const justCopied = ref(false);
async function copyAddress(): Promise<void> {
  if (!account.value) return;
  try {
    await navigator.clipboard.writeText(account.value);
    justCopied.value = true;
    setTimeout(() => (justCopied.value = false), 1500);
  } catch {
    /* clipboard may be blocked; the address is shown for manual copy */
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
// AUDIT-023: validate the destination shape CLIENT-SIDE before allowing a live
// on-chain payment: a Stellar public key (G + 55 base32 chars) or a federation
// address (user*domain.tld, resolved server-side). A typo'd address should be
// an inline field error, not a submitted transaction.
const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const FEDERATION_RE = /^[^*\s]+\*[^*\s]+\.[^*\s]+$/;
const sendToInvalid = computed(() => {
  const to = sendTo.value.trim();
  return to.length > 0 && !STELLAR_ADDRESS_RE.test(to) && !FEDERATION_RE.test(to);
});
const sendValid = computed(
  () =>
    !!sendTo.value.trim() &&
    !sendToInvalid.value &&
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
watch([swapFrom, swapTo, swapAmount], () => {
  store.swapQuoteResult = null;
});
async function getQuote(): Promise<void> {
  if (quoting.value || !swapValid.value) return;
  quoting.value = true;
  try {
    await store.getSwapQuote(swapFrom.value.trim(), swapTo.value.trim(), swapAmount.value.trim());
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
  <main class="page">
    <h1 class="page-title">{{ t("receiveSend.pageTitle") }}</h1>

    <!-- RECEIVE -->
    <section class="panel">
      <h2>
        {{ t("wallet.receive") }}
        <InfoTip :text="t('receiveSend.qrCaption')" :learn-more="LESSONS.receiveFunds" :label="t('wallet.receive')" />
      </h2>
      <p v-if="store.isReadOnly" class="muted w-note">{{ t("wallet.readOnlyNote") }}</p>

      <div v-if="account" class="rcv">
        <div class="rcv-qr">
          <ReceiveQr :value="account" />
          <p class="muted rcv-hint">{{ t("receiveSend.qrHint") }}</p>
        </div>
        <div class="rcv-addr-box">
          <span class="muted rcv-addr-label">{{ t("wallet.copyAddress") }}</span>
          <code class="mono rcv-addr">{{ account }}</code>
          <button class="btn rcv-copy" @click="copyAddress">
            {{ justCopied ? t("walletSetup.chipCopied") : t("wallet.copyAddress") }}
          </button>
        </div>
      </div>
      <p v-else class="muted">{{ t("wallet.noAccount") }}</p>
    </section>

    <!-- SEND -->
    <section class="panel">
      <h2>{{ t("wallet.send") }}</h2>
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
        <!-- Bug 4C: Read-only never blocks a manual send (the mode gates the AI
             only). PAPER is the one exception: sends move REAL funds and have
             no simulation, so they are disabled while simulating (the backend
             refuses too). Wallet + kill switch stay enforced server-side. -->
        <button class="btn primary" :disabled="sending || store.isPaper || !sendValid" @click="send">
          {{ sending ? t("wallet.sending") : t("wallet.send") }}
        </button>
      </div>
      <p v-if="store.isPaper" class="muted w-note">{{ t("wallet.paperNote") }}</p>
      <p v-if="sendToInvalid" class="violations">
        {{ t("wallet.invalidDestination") }}
      </p>
      <p v-if="sendInsufficient" class="violations">
        {{ t("wallet.insufficient", { code: store.tokenFor(sendAsset).code, held: fmtNum(sendHeld) }) }}
      </p>
    </section>

    <!-- SWAP -->
    <section class="panel">
      <h2>{{ t("wallet.swap") }}</h2>
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
        <button class="btn" :disabled="quoting || !swapValid" @click="getQuote">
          {{ quoting ? t("wallet.quoting") : t("wallet.quote") }}
        </button>
        <button class="btn primary" :disabled="swapping || store.isPaper || !quote" @click="doSwap">
          {{ swapping ? t("wallet.swapping") : t("wallet.swap") }}
        </button>
      </div>
      <p v-if="store.isPaper" class="muted w-note">{{ t("wallet.paperNote") }}</p>
      <p v-if="swapInsufficient" class="violations">
        {{ t("wallet.insufficient", { code: store.tokenFor(swapFrom).code, held: fmtNum(swapHeld) }) }}
      </p>
      <p v-if="quote" class="muted w-quote">
        ≈ <span class="mono">{{ fmtNum(quote.destAmount) }}</span> {{ code(quote.destAsset) }}
        {{ t("wallet.for") }} {{ fmtNum(quote.sendAmount) }} {{ code(quote.sendAsset) }}
        <span v-if="quote.path.length">{{ t("wallet.via") }} {{ quote.path.map(code).join(" → ") }}</span>
      </p>
      <p v-if="store.walletError" class="violations">{{ store.walletError }}</p>
    </section>

    <!-- XLM CONVERSION HISTORY (derived from the trade log) -->
    <ConversionHistory />
  </main>
</template>

<style scoped>
.rcv {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: flex-start;
}
.rcv-qr {
  flex: 0 0 auto;
  text-align: center;
}
.rcv-hint {
  font-size: 12px;
  margin: 8px 0 0;
}
.rcv-addr-box {
  flex: 1 1 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.rcv-addr-label {
  font-size: 12px;
}
.rcv-addr {
  word-break: break-all;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
}
.rcv-copy {
  align-self: flex-start;
  min-height: 40px;
}
/* AUDIT-020: restate the 44px mobile floor (scoped specificity beats the
   global .btn rule, which left this button at 40px on phones). */
@media (max-width: 767px) {
  .rcv-copy {
    min-height: 44px;
  }
}
.w-note {
  font-size: 12px;
  margin-top: 0;
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
  padding: 9px 10px;
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
</style>
