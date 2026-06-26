<script setup lang="ts">
// Feature 1: the AI trading master switch, shown at the top of the Bot tab.
// Pausing stops AI proposals/orders/stop-losses; scanner, stop-loss monitor and
// manual trading keep running. State is persisted server-side (survives restart).
//
// Also surfaces the AI-specific TRADE MODE (Approve every trade vs. Auto-trade)
// here, contextually next to the AI switch. It is the SAME control as the header
// one (store.autoApprove) — auto-approve only affects AI/scanner proposals;
// manual orders always run attended. The header keeps the global access mode +
// kill switch, which also gate manual trading and wallet sends.
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
</script>

<template>
  <section class="panel ai-toggle" :class="{ off: !store.aiEnabled }">
    <div class="at-row">
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

    <!-- AI trade mode (mirrors the header's Approve/Auto toggle; AI-only). -->
    <div class="at-row at-row-mode">
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
.at-row-mode { border-top: 1px solid var(--line); padding-top: 14px; }
.at-head { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.at-state { font-weight: 700; font-size: 14px; letter-spacing: 0.02em; }
.at-mode-label { font-weight: 600; font-size: 13px; }
.at-mode-label strong { letter-spacing: 0.02em; }
.at-hint { font-size: 12px; max-width: 620px; line-height: 1.45; }
.at-seg { flex-shrink: 0; }
.at-seg .seg { padding: 6px 16px; font-weight: 600; }
.at-seg .seg.pause.active { background: var(--neg); color: #2a0e12; }
</style>
