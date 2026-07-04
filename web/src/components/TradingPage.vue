<script setup lang="ts">
// Trading route ("/"). Hosts the internal Manual/Bot sub-tab switcher (the same
// split as before — only its parent navigation changed from a top-level tab to a
// sidebar route) plus the cross-cutting analytics panels and the live log, which
// is now scoped to THIS page only (Change 5).
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import ManualTab from "./ManualTab.vue";
import BotTab from "./BotTab.vue";
import StatsPanel from "./StatsPanel.vue";
import PositionsPanel from "./PositionsPanel.vue";
import EvolutionCharts from "./EvolutionCharts.vue";
import TokenDetail from "./TokenDetail.vue";
import LiveLogDrawer from "./LiveLogDrawer.vue";

const { t } = useI18n();
const store = useTraderStore();

// Manual/Bot are the only two sub-tabs now; leaving either also closes any
// token drill-down overlay.
function selectTab(tab: "manual" | "bot"): void {
  store.setActiveTab(tab);
  store.closeToken();
}
</script>

<template>
  <main class="page">
    <!-- Internal Manual/Bot switcher -->
    <div class="tabbar" role="tablist" :aria-label="t('common.tablistAria')">
      <button
        class="tab"
        role="tab"
        data-tour="tab-manual"
        :aria-selected="store.activeTab === 'manual' && !store.selectedToken"
        :class="{ active: store.activeTab === 'manual' && !store.selectedToken }"
        @click="selectTab('manual')"
      >
        {{ t("common.tab.manual") }}
      </button>
      <button
        class="tab"
        role="tab"
        data-tour="tab-bot"
        :aria-selected="store.activeTab === 'bot' && !store.selectedToken"
        :class="{ active: store.activeTab === 'bot' && !store.selectedToken }"
        @click="selectTab('bot')"
      >
        {{ t("common.tab.bot") }}
      </button>
    </div>

    <!-- A drilled-in token overlays the body. -->
    <div class="tab-body">
      <TokenDetail v-if="store.selectedToken" />
      <ManualTab v-else-if="store.activeTab === 'manual'" />
      <BotTab v-else />
    </div>

    <!-- Cross-cutting analytics (trading context only). -->
    <StatsPanel />
    <PositionsPanel />
    <EvolutionCharts />
  </main>

  <!-- Live log is only shown here, never on Receive / Pending / Logs / Academy. -->
  <LiveLogDrawer />

  <footer class="foot">{{ t("common.footer") }}</footer>
</template>
