<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, UnauthorizedError, type Settings } from "../api";

const emit = defineEmits<{ (e: "unauthorized"): void }>();

const settings = ref<Settings | null>(null);
const loadError = ref("");

// fee wallet
const feeWalletInput = ref("");
const feeWalletConfirming = ref(false);
const feeWalletMsg = ref<{ kind: "ok" | "err"; text: string } | null>(null);

// prices
const monthlyInput = ref<number | null>(null);
const annualInput = ref<number | null>(null);
const priceMsg = ref<{ kind: "ok" | "err"; text: string } | null>(null);

// trustline score
const minScoreInput = ref<number | null>(null);
const minScoreMsg = ref<{ kind: "ok" | "err"; text: string } | null>(null);

async function load(): Promise<void> {
  loadError.value = "";
  try {
    settings.value = await api.settings();
    feeWalletInput.value = settings.value.feeWalletAddress ?? "";
    monthlyInput.value = settings.value.premiumPriceMonthlyEur;
    annualInput.value = settings.value.premiumPriceAnnualEur;
    minScoreInput.value = settings.value.trustlineScanMinScore;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    loadError.value = (err as Error).message;
  }
}

function askFeeWalletConfirm(): void {
  feeWalletMsg.value = null;
  feeWalletConfirming.value = true;
}
function cancelFeeWalletConfirm(): void {
  feeWalletConfirming.value = false;
}

async function saveFeeWallet(): Promise<void> {
  feeWalletConfirming.value = false;
  try {
    await api.setSetting("feeWalletAddress", feeWalletInput.value.trim());
    feeWalletMsg.value = { kind: "ok", text: "Fee wallet address updated." };
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    feeWalletMsg.value = { kind: "err", text: (err as Error).message };
  }
}

async function savePrices(): Promise<void> {
  priceMsg.value = null;
  try {
    if (monthlyInput.value != null) {
      await api.setSetting("premiumPriceMonthlyEur", monthlyInput.value);
    }
    if (annualInput.value != null) {
      await api.setSetting("premiumPriceAnnualEur", annualInput.value);
    }
    priceMsg.value = { kind: "ok", text: "Prices updated." };
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    priceMsg.value = { kind: "err", text: (err as Error).message };
  }
}

async function saveMinScore(): Promise<void> {
  minScoreMsg.value = null;
  try {
    await api.setSetting("trustlineScanMinScore", minScoreInput.value);
    minScoreMsg.value = { kind: "ok", text: "Trustline minimum score updated." };
    await load();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    minScoreMsg.value = { kind: "err", text: (err as Error).message };
  }
}

onMounted(load);
</script>

<template>
  <div class="tab-body">
    <p v-if="loadError" class="error-text">{{ loadError }}</p>

    <section v-if="settings" class="panel">
      <h2>Fee wallet</h2>
      <label class="field">
        <span>Fee wallet address</span>
        <input v-model="feeWalletInput" type="text" class="mono" :disabled="feeWalletConfirming" />
      </label>

      <div v-if="feeWalletConfirming" style="margin-top: 10px">
        <p class="confirm-text">
          Changing this address will redirect all future fees. This takes effect immediately. Confirm?
        </p>
        <div class="confirm-row">
          <button class="btn danger" @click="saveFeeWallet">Confirm</button>
          <button class="btn" @click="cancelFeeWalletConfirm">Cancel</button>
        </div>
      </div>
      <div v-else style="margin-top: 10px">
        <button class="btn primary" @click="askFeeWalletConfirm">Save</button>
      </div>

      <p v-if="feeWalletMsg" :class="feeWalletMsg.kind === 'ok' ? 'success-text' : 'error-text'" style="margin-top: 8px">
        {{ feeWalletMsg.text }}
      </p>
    </section>

    <section v-if="settings" class="panel">
      <h2>Premium pricing</h2>
      <div class="grid-2">
        <label class="field">
          <span>Monthly price (EUR)</span>
          <input v-model.number="monthlyInput" type="number" min="0" step="0.01" />
        </label>
        <label class="field">
          <span>Annual price (EUR)</span>
          <input v-model.number="annualInput" type="number" min="0" step="0.01" />
        </label>
      </div>
      <p class="hint" style="margin-top: 8px">New checkouts pick up price changes immediately.</p>
      <button class="btn primary" style="margin-top: 10px" @click="savePrices">Save</button>
      <p v-if="priceMsg" :class="priceMsg.kind === 'ok' ? 'success-text' : 'error-text'" style="margin-top: 8px">
        {{ priceMsg.text }}
      </p>
    </section>

    <section v-if="settings" class="panel">
      <h2>Trustline scan</h2>
      <label class="field" style="max-width: 200px">
        <span>Minimum score (0-10)</span>
        <input v-model.number="minScoreInput" type="number" min="0" max="10" step="1" />
      </label>
      <button class="btn primary" style="margin-top: 10px" @click="saveMinScore">Save</button>
      <p v-if="minScoreMsg" :class="minScoreMsg.kind === 'ok' ? 'success-text' : 'error-text'" style="margin-top: 8px">
        {{ minScoreMsg.text }}
      </p>
    </section>
  </div>
</template>
