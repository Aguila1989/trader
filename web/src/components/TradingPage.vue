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
import LiveLogDrawer from "./LiveLogDrawer.vue";

const { t } = useI18n();
const store = useTraderStore();

// Manual/Bot are the only two sub-tabs now. (Feature 5: the token drill-down
// is its own /token/... route - no overlay to close here anymore.)
function selectTab(tab: "manual" | "bot"): void {
  store.setActiveTab(tab);
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
        :aria-selected="store.activeTab === 'manual'"
        :class="{ active: store.activeTab === 'manual' }"
        @click="selectTab('manual')"
      >
        {{ t("common.tab.manual") }}
      </button>
      <button
        class="tab"
        role="tab"
        data-tour="tab-bot"
        :aria-selected="store.activeTab === 'bot'"
        :class="{ active: store.activeTab === 'bot' }"
        @click="selectTab('bot')"
      >
        {{ t("common.tab.bot") }}
      </button>
    </div>

    <div class="tab-body">
      <ManualTab v-if="store.activeTab === 'manual'" />
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
