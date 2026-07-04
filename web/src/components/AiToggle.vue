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
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";

const { t } = useI18n();
const store = useTraderStore();

function set(on: boolean): void {
  if (store.aiEnabled !== on) void store.setAiEnabled(on);
}
function setMode(auto: boolean): void {
  if (store.isAutoTrade !== auto) void store.setAutoApprove(auto);
}
// Read-only / Paper / Live are mutually exclusive access modes; the backend
// enforces exclusivity too, this just routes the click to the right toggle.
function setAccess(mode: "readonly" | "paper" | "live"): void {
  if (mode === "live") {
    if (!store.isLive) void store.setLiveTrading(true);
  } else if (mode === "paper") {
    if (!store.isPaper) void store.setPaperTrading(true);
  } else {
    if (store.isLive) void store.setLiveTrading(false);
    if (store.isPaper) void store.setPaperTrading(false);
  }
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
        <button class="seg" :class="{ active: store.aiEnabled }" :aria-pressed="store.aiEnabled" @click="set(true)">
          {{ t("common.ai.enable") }}
        </button>
        <button class="seg pause" :class="{ active: !store.aiEnabled }" :aria-pressed="!store.aiEnabled" @click="set(false)">
          {{ t("common.ai.pause") }}
        </button>
      </div>
    </div>

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
        <button class="seg auto" :class="{ active: store.isAutoTrade }" :aria-pressed="store.isAutoTrade" @click="setMode(true)">
          {{ t("topBar.autoTrade") }}
        </button>
      </div>
    </div>
  </section>
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
</style>
