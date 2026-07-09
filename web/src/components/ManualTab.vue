<script setup lang="ts">
// Manual trading: user-placed orders, stop losses, open orders, trustlines, and
// the user's own trade history. Composition only — no logic. Receive/Send/Swap
// moved to the dedicated Receive & Send route.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import ManualTradePanel from "./ManualTradePanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import TrustlinesPanel from "./TrustlinesPanel.vue";
import HistoryTable from "./HistoryTable.vue";

const { t } = useI18n();
const store = useTraderStore();

// Fix 3: the Read-only/Paper/Live trading-access mode is set on the Bot tab
// (AiToggle.vue) but was only ever SHOWN there - a Manual-tab-only user had no
// way to see it without switching tabs. Reuse the exact topBar.* wording/
// getters AiToggle already uses (store.isLive/isPaper) so this never drifts
// out of sync with the real gate.
//
// Bug 4C semantics (see AiToggle.vue's header comment): this mode gates the
// AI ONLY - manual orders are ALWAYS allowed, just filled differently per
// mode (Read-only: submitted directly. Paper: paper-filled. Live: submitted
// on-chain). The hint below is worded per-mode so it never implies a manual
// order could be blocked here.
const modeLabel = computed(() =>
  store.isLive ? t("topBar.liveBtn") : store.isPaper ? t("topBar.paperBtn") : t("topBar.readonlyBtn"),
);
const modeBadgeClass = computed(() => (store.isLive ? "live" : store.isPaper ? "warn" : ""));
const modeHint = computed(() =>
  store.isLive
    ? t("manualTrade.modeBadge.hint.live")
    : store.isPaper
      ? t("manualTrade.modeBadge.hint.paper")
      : t("manualTrade.modeBadge.hint.readonly"),
);
</script>

<template>
  <div class="mtab-mode" role="status" :aria-label="t('manualTrade.modeBadge.aria')">
    <span class="badge" :class="modeBadgeClass">{{ modeLabel }}</span>
    <span class="muted mtab-mode-hint">{{ modeHint }}</span>
  </div>
  <ManualTradePanel />
  <StopLossPanel mode="manual" />
  <TrustlinesPanel />
  <HistoryTable source="manual" />
</template>

<style scoped>
.mtab-mode {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.mtab-mode-hint {
  font-size: 12px;
  line-height: 1.4;
}
</style>
