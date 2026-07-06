<script setup lang="ts">
import { onMounted, ref } from "vue";
import { api, UnauthorizedError, type Overview } from "../api";
import { xlm } from "../format";

const emit = defineEmits<{ (e: "unauthorized"): void }>();

const data = ref<Overview | null>(null);
const error = ref("");
const copied = ref(false);
const recalcBusy = ref(false);
const recalcMsg = ref("");

async function load(): Promise<void> {
  error.value = "";
  try {
    data.value = await api.overview();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    error.value = (err as Error).message;
  }
}

async function copyAddress(): Promise<void> {
  if (!data.value?.feeWallet) return;
  try {
    await navigator.clipboard.writeText(data.value.feeWallet);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // clipboard API unavailable — non-fatal, silently ignore
  }
}

async function runRecalc(): Promise<void> {
  recalcBusy.value = true;
  recalcMsg.value = "";
  try {
    await api.tierRecalc();
    recalcMsg.value = "Tier recalculation started.";
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    recalcMsg.value = (err as Error).message;
  } finally {
    recalcBusy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div class="tab-body">
    <p v-if="error" class="error-text">{{ error }}</p>

    <div v-if="data" class="grid-2">
      <section class="panel">
        <h2>Fee wallet</h2>
        <p v-if="data.feeWallet" class="mono" style="word-break: break-all">
          {{ data.feeWallet }}
          <button class="btn small" style="margin-left: 8px" @click="copyAddress">
            {{ copied ? "Copied!" : "Copy" }}
          </button>
        </p>
        <p v-else class="muted">No fee wallet configured.</p>
        <div class="stat">
          <span class="k">XLM balance</span>
          <span class="v">
            {{ data.feeWallet ? (data.feeWalletBalanceXlm != null ? `${xlm(data.feeWalletBalanceXlm)} XLM` : "unfunded/unreachable") : "—" }}
          </span>
        </div>
      </section>

      <section class="panel">
        <h2>Subscriptions</h2>
        <div class="stats">
          <div class="stat">
            <span class="k">Active premium</span>
            <span class="v">{{ data.subscriptions.activePremium }}</span>
          </div>
          <div class="stat">
            <span class="k">New this month</span>
            <span class="v">{{ data.subscriptions.newThisMonth }}</span>
          </div>
          <div class="stat">
            <span class="k">Cancelled this month</span>
            <span class="v">{{ data.subscriptions.cancelledThisMonth }}</span>
          </div>
        </div>
        <p class="hint" style="margin-top: 10px">
          MRR ≈ €{{ data.subscriptions.mrrEurApprox.toFixed(2) }} (monthly-equivalent
          approximation — exact revenue in Stripe)
        </p>
        <p>
          <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener">
            Open Stripe dashboard →
          </a>
        </p>
      </section>
    </div>

    <section v-if="data" class="panel">
      <h2>Maintenance</h2>
      <button class="btn" :disabled="recalcBusy" @click="runRecalc">
        {{ recalcBusy ? "Starting…" : "Run tier recalculation now" }}
      </button>
      <p v-if="recalcMsg" class="hint" style="margin-top: 8px">{{ recalcMsg }}</p>
    </section>
  </div>
</template>
