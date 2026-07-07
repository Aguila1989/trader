<script setup lang="ts">
// The Bot tab's trading-control panel. Holds the controls the operator asked to
// keep OUT of the global header (it was too busy there):
//   - Trading access  (Read-only / Paper / Live)   - store.liveTrading/paperTrading
//   - AI master switch (Enable / Pause)             - Feature 1, store.aiEnabled
//   - AI trade mode    (Approve every trade / Auto) - store.autoApprove
// The header keeps only status badges + the always-reachable kill switch.
//
// TRADING ACCESS MODE SEMANTICS (Bug 4C — gates the AI ONLY, never the user):
//   Read-only:    AI cannot trade. Manual trades: allowed, submitted directly.
//   Paper:        AI simulates.    Manual trades: allowed, paper-filled.
//   Live trading: AI can trade.    Manual trades: allowed, submitted on-chain.
// The mode only ever changes here (user click); it persists and is restored at
// boot exactly as last set (Bug 3).
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { billingState } from "../billing/premium";
import ConfirmDialog from "./ConfirmDialog.vue";

const { t } = useI18n();
const store = useTraderStore();

// Fund-safety: enabling Live trading or Auto-Approve each arms unattended,
// on-chain, real-money order submission — an inverted risk gate compared to the
// kill switch (which only PAUSES) already having a full consequences dialog.
// Gate the ENABLE direction here (where the buttons are); disabling / going
// read-only stays an instant, one-click action.
const showLiveConfirm = ref(false);
const showAutoApproveConfirm = ref(false);

// Feature 2: ENABLING the AI (and auto-trade) is premium-only; pausing and the
// trading-access mode stay free. The server re-checks on every call - these
// disables are the UX layer of the same gate, never the enforcement.
const premiumLocked = computed(() => billingState.loaded && !billingState.isPremium);

function set(on: boolean): void {
  if (on && premiumLocked.value) return;
  if (store.aiEnabled !== on) void store.setAiEnabled(on);
}
function setMode(auto: boolean): void {
  if (auto && premiumLocked.value) return;
  if (store.isAutoTrade === auto) return;
  if (auto) {
    showAutoApproveConfirm.value = true; // confirm before arming unattended trading
    return;
  }
  void store.setAutoApprove(false);
}
function confirmAutoApprove(): void {
  showAutoApproveConfirm.value = false;
  if (!store.isAutoTrade) void store.setAutoApprove(true);
}
// Read-only / Paper / Live are mutually exclusive access modes; the backend
// enforces exclusivity too, this just routes the click to the right toggle.
function setAccess(mode: "readonly" | "paper" | "live"): void {
  if (mode === "live") {
    if (!store.isLive) showLiveConfirm.value = true; // confirm before arming real trading
  } else if (mode === "paper") {
    if (!store.isPaper) void store.setPaperTrading(true);
  } else {
    if (store.isLive) void store.setLiveTrading(false);
    if (store.isPaper) void store.setPaperTrading(false);
  }
}
function confirmLiveTrading(): void {
  showLiveConfirm.value = false;
  if (!store.isLive) void store.setLiveTrading(true);
}
</script>

<template>
  <section class="panel ai-toggle" :class="{ off: !store.aiEnabled }">
    <!-- Trading access (master arm): observe / simulate / submit. Moved here from
         the header (it also gates manual orders + wallet sends). -->
    <div class="at-row">
      <div class="at-head">
        <span class="at-mode-label">{{ t("common.ai.access") }}</span>
        <span class="muted at-hint">{{ t("common.ai.accessHint") }}</span>
      </div>
      <div class="segmented at-seg" role="group" data-tour="trading-mode" :aria-label="t('common.ai.access')">
        <button
          class="seg"
          :class="{ active: !store.isLive && !store.isPaper }"
          @click="setAccess('readonly')"
        >
          {{ t("topBar.readonlyBtn") }}
        </button>
        <button
          class="seg auto"
          :class="{ active: store.isPaper }"
          :title="t('topBar.paperTitle')"
          @click="setAccess('paper')"
        >
          {{ t("topBar.paperBtn") }}
        </button>
        <button
          class="seg live"
          :class="{ active: store.isLive }"
          :disabled="!store.canGoLive"
          :title="store.canGoLive ? t('topBar.liveTitleEnabled') : t('topBar.liveTitleDisabled')"
          @click="setAccess('live')"
        >
          {{ t("topBar.liveBtn") }}
        </button>
      </div>
    </div>

    <!-- AI master switch (Feature 1). -->
    <div class="at-row at-row-sep">
      <div class="at-head">
        <span class="at-state" :class="store.aiEnabled ? 'pos' : 'neg'">
          ● {{ store.aiEnabled ? t("common.ai.active") : t("common.ai.paused") }}
        </span>
        <span class="muted at-hint">{{ t("common.ai.toggleHint") }}</span>
      </div>
      <div class="segmented at-seg" role="group" :aria-label="t('common.ai.toggleLabel')">
        <button
          class="seg"
          :class="{ active: store.aiEnabled }"
          :aria-pressed="store.aiEnabled"
          :disabled="premiumLocked && !store.aiEnabled"
          :title="premiumLocked ? t('billing.gate.lockedControl') : undefined"
          @click="set(true)"
        >
          {{ premiumLocked && !store.aiEnabled ? "🔒 " : "" }}{{ t("common.ai.enable") }}
        </button>
        <button class="seg pause" :class="{ active: !store.aiEnabled }" :aria-pressed="!store.aiEnabled" @click="set(false)">
          {{ t("common.ai.pause") }}
        </button>
      </div>
    </div>
    <p v-if="premiumLocked" class="at-lockhint">
      {{ t("billing.gate.title") }} —
      <RouterLink to="/pricing">{{ t("billing.gate.cta") }}</RouterLink>
    </p>

    <!-- AI trade mode: approve each trade vs. fully automated. -->
    <div class="at-row at-row-sep">
      <div class="at-head">
        <span class="at-mode-label">
          {{ t("common.ai.tradeMode") }}:
          <strong :class="store.isAutoTrade ? 'warn' : 'pos'">
            {{ store.isAutoTrade ? t("topBar.autoTrade") : t("topBar.approveEveryTrade") }}
          </strong>
        </span>
        <span class="muted at-hint">{{ t("common.ai.tradeModeHint") }}</span>
      </div>
      <div class="segmented at-seg" role="group" :aria-label="t('common.ai.tradeMode')">
        <button class="seg" :class="{ active: !store.isAutoTrade }" :aria-pressed="!store.isAutoTrade" @click="setMode(false)">
          {{ t("topBar.approveEveryTrade") }}
        </button>
        <button
          class="seg auto"
          :class="{ active: store.isAutoTrade }"
          :aria-pressed="store.isAutoTrade"
          :disabled="premiumLocked && !store.isAutoTrade"
          :title="premiumLocked ? t('billing.gate.lockedControl') : undefined"
          @click="setMode(true)"
        >
          {{ premiumLocked && !store.isAutoTrade ? "🔒 " : "" }}{{ t("topBar.autoTrade") }}
        </button>
      </div>
    </div>
  </section>

  <!-- Fund-safety: enabling Live trading arms real, on-chain, real-money order
       submission — same weight as the kill switch. -->
  <ConfirmDialog
    v-if="showLiveConfirm"
    :title="t('topBar.liveConfirm.title')"
    :confirm-label="t('topBar.liveConfirm.confirm')"
    :cancel-label="t('topBar.liveConfirm.cancel')"
    destructive
    :countdown-sec="2"
    @confirm="confirmLiveTrading"
    @cancel="showLiveConfirm = false"
  >
    <p><strong>{{ t("topBar.liveConfirm.willTitle") }}</strong></p>
    <ul>
      <li>{{ t("topBar.liveConfirm.will.realTrades") }}</li>
      <li>{{ t("topBar.liveConfirm.will.realFunds") }}</li>
      <li>{{ t("topBar.liveConfirm.will.policyStillApplies") }}</li>
    </ul>
    <p class="cd-muted">{{ t("topBar.liveConfirm.note") }}</p>
  </ConfirmDialog>

  <!-- Fund-safety: enabling Auto-Approve lets the AI submit real trades
       unattended — no per-trade approval step remains. -->
  <ConfirmDialog
    v-if="showAutoApproveConfirm"
    :title="t('topBar.autoApproveConfirm.title')"
    :confirm-label="t('topBar.autoApproveConfirm.confirm')"
    :cancel-label="t('topBar.autoApproveConfirm.cancel')"
    destructive
    :countdown-sec="2"
    @confirm="confirmAutoApprove"
    @cancel="showAutoApproveConfirm = false"
  >
    <p><strong>{{ t("topBar.autoApproveConfirm.willTitle") }}</strong></p>
    <ul>
      <li>{{ t("topBar.autoApproveConfirm.will.noAsk") }}</li>
      <li>{{ t("topBar.autoApproveConfirm.will.unattended") }}</li>
      <li>{{ t("topBar.autoApproveConfirm.will.killSwitchStillWorks") }}</li>
    </ul>
    <p class="cd-muted">{{ t("topBar.autoApproveConfirm.note") }}</p>
  </ConfirmDialog>
</template>

<style scoped>
.ai-toggle { display: flex; flex-direction: column; gap: 14px; }
.ai-toggle.off { border-color: #5e1f28; }
.at-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.at-row-sep { border-top: 1px solid var(--line); padding-top: 14px; }
.at-head { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.at-state { font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
.at-mode-label { font-weight: 600; font-size: 13px; }
.at-mode-label strong { letter-spacing: 0.02em; }
.at-hint { font-size: 12px; max-width: 620px; line-height: 1.45; }
.at-seg { flex-shrink: 0; }
.at-seg .seg { padding: 6px 16px; font-weight: 600; }
.at-seg .seg.pause.active { background: var(--neg); color: #2a0e12; }
.at-lockhint { margin: 0; font-size: 12px; color: var(--muted); }
.at-lockhint a { color: var(--accent); }
</style>
