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
const haltBusy = ref(false);
const haltMsg = ref("");
const confirmingHalt = ref(false);

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

function askHalt(): void {
  confirmingHalt.value = true;
}
function cancelHalt(): void {
  confirmingHalt.value = false;
}

async function confirmHalt(): Promise<void> {
  confirmingHalt.value = false;
  await setPlatformHalted(true);
}

// Resuming is the "safe" direction (mirrors Users.vue's enableDirectly) — no
// confirm step needed.
async function resume(): Promise<void> {
  await setPlatformHalted(false);
}

async function setPlatformHalted(halted: boolean): Promise<void> {
  haltBusy.value = true;
  haltMsg.value = "";
  try {
    const res = await api.setPlatformHalted(halted);
    if (data.value) data.value.platformHalted = res.platformHalted;
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      emit("unauthorized");
      return;
    }
    haltMsg.value = (err as Error).message;
  } finally {
    haltBusy.value = false;
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

    <section
      v-if="data"
      class="panel"
      :style="data.platformHalted ? { borderColor: 'var(--neg)', background: '#1a1013' } : {}"
    >
      <div class="confirm-row" style="justify-content: space-between">
        <div>
          <h2 style="margin: 0 0 4px">
            Platform status:
            <span :class="data.platformHalted ? 'neg' : 'pos'">
              {{ data.platformHalted ? "HALTED" : "RUNNING" }}
            </span>
          </h2>
          <p class="hint" style="margin: 0">
            {{
              data.platformHalted
                ? "AI trading, new subscription checkouts and fee collection are frozen for ALL users."
                : "AI trading, checkouts and fee collection are operating normally."
            }}
          </p>
        </div>

        <div v-if="confirmingHalt" class="confirm-row">
          <button class="btn danger" :disabled="haltBusy" @click="confirmHalt">
            Confirm halt
          </button>
          <button class="btn small" @click="cancelHalt">Cancel</button>
        </div>
        <div v-else>
          <button
            v-if="!data.platformHalted"
            class="btn danger"
            :disabled="haltBusy"
            @click="askHalt"
          >
            Halt platform
          </button>
          <button v-else class="btn ok" :disabled="haltBusy" @click="resume">
            {{ haltBusy ? "Resuming…" : "Resume platform" }}
          </button>
        </div>
      </div>
      <p v-if="confirmingHalt" class="confirm-text" style="margin-top: 8px">
        This immediately stops AI trading, subscription checkouts and fee collection for every
        user. Per-user kill switches are unaffected. Confirm to proceed.
      </p>
      <p v-if="haltMsg" class="error-text" style="margin-top: 8px">{{ haltMsg }}</p>
    </section>

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
