<script setup lang="ts">
// Persistent header above the tabs: the existing TopBar controls, a bot-status
// strip (all derived from existing store state), and the wallet overview
// (PortfolioPanel). Everything here stays visible when the user switches tabs.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import TopBar from "./TopBar.vue";
import PortfolioPanel from "./PortfolioPanel.vue";
import WalletChip from "./wallet/WalletChip.vue";

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

const activeStops = computed(
  () => store.stopLosses.filter((s) => s.status === "active").length,
);
const whitelistCount = computed(() => store.limits?.assetWhitelist.length ?? 0);
// Stops are recorded but DON'T fire while the kill switch is engaged — say so,
// rather than letting the count imply protection is live.
const killOn = computed(() => store.killSwitch);
// Feature 4: deterioration warnings for held trustlines (always visible here).
const trustlineWarnings = computed(() => store.trustlineWarnings.length);
function viewWarnings(): void {
  // Warnings live on the Bot sub-tab of the Trading page (route "/").
  store.setActiveTab("bot");
  void router.push("/");
}
</script>

<template>
  <TopBar />
  <div class="header-body">
    <div v-if="trustlineWarnings > 0" class="tl-banner" role="alert">
      <span>⚠ {{ t("trustlineSuggestions.banner.warnings", { n: trustlineWarnings }, trustlineWarnings) }}</span>
      <button class="btn" @click="viewWarnings">{{ t("trustlineSuggestions.banner.view") }}</button>
    </div>
    <section class="panel bot-status">
      <WalletChip />
      <div class="bs-item">
        <span class="bs-dot" :class="store.connected ? 'on' : 'off'" aria-hidden="true"></span>
        Stellar Horizon:
        <strong :class="store.connected ? 'pos' : 'neg'">
          {{ store.connected ? t("globalHeader.connected") : t("globalHeader.disconnected") }}
        </strong>
      </div>
      <div class="bs-item">
        {{ t("globalHeader.activeStopLosses") }}: <strong>{{ activeStops }}</strong>
        <span v-if="killOn && activeStops > 0" class="neg bs-warn">{{ t("globalHeader.killSwitchWarn") }}</span>
      </div>
      <div class="bs-item">{{ t("globalHeader.whitelistedTokens") }}: <strong>{{ whitelistCount }}</strong></div>
    </section>
    <PortfolioPanel />
  </div>
</template>

<style scoped>
.header-body {
  max-width: 1180px;
  margin: 0 auto;
  padding: 16px 20px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bot-status {
  display: flex;
  flex-wrap: wrap;
  gap: 22px;
  align-items: center;
  font-size: 13px;
}
.bs-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--muted);
}
.bs-item strong {
  color: var(--text);
}
.bs-warn {
  font-size: 12px;
}
.tl-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 14px;
  border: 1px solid #5e4a1f;
  background: rgba(245, 166, 35, 0.12);
  color: var(--warn);
  border-radius: 8px;
  font-size: 13px;
}
.bs-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  display: inline-block;
}
.bs-dot.on {
  background: var(--pos);
}
.bs-dot.off {
  background: var(--neg);
}
</style>
