<script setup lang="ts">
import { onMounted } from "vue";
import { useTraderStore } from "./stores/trader";
import GlobalHeader from "./components/GlobalHeader.vue";
import ManualTab from "./components/ManualTab.vue";
import BotTab from "./components/BotTab.vue";
import LogsTab from "./components/LogsTab.vue";
import StatsPanel from "./components/StatsPanel.vue";
import PositionsPanel from "./components/PositionsPanel.vue";
import EvolutionCharts from "./components/EvolutionCharts.vue";
import LogHistory from "./components/LogHistory.vue";
import LiveLogDrawer from "./components/LiveLogDrawer.vue";
import TokenDetail from "./components/TokenDetail.vue";

const store = useTraderStore();
onMounted(() => void store.init());

// Switching tabs also leaves any open token-detail drill-down.
function selectTab(tab: "manual" | "bot" | "logs"): void {
  store.setActiveTab(tab);
  store.closeToken();
}
</script>

<template>
  <!-- Persistent global header: controls + bot status + wallet overview. -->
  <GlobalHeader />

  <main>
    <!-- Tab bar sits directly below the header. Switching never reloads. -->
    <div class="tabbar" role="tablist" aria-label="Trading sections">
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'manual' && !store.selectedToken"
        :class="{ active: store.activeTab === 'manual' && !store.selectedToken }"
        @click="selectTab('manual')"
      >
        Manual Trading
      </button>
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'bot' && !store.selectedToken"
        :class="{ active: store.activeTab === 'bot' && !store.selectedToken }"
        @click="selectTab('bot')"
      >
        Bot Trading
      </button>
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'logs' && !store.selectedToken"
        :class="{ active: store.activeTab === 'logs' && !store.selectedToken }"
        @click="selectTab('logs')"
      >
        Logs
      </button>
    </div>

    <!-- Tab body. A drilled-in token overlays the body; the header stays put. -->
    <div class="tab-body">
      <TokenDetail v-if="store.selectedToken" />
      <ManualTab v-else-if="store.activeTab === 'manual'" />
      <BotTab v-else-if="store.activeTab === 'bot'" />
      <LogsTab v-else />
    </div>

    <!-- Cross-cutting: account / positions / analytics / raw diagnostics log. -->
    <StatsPanel />
    <PositionsPanel />
    <EvolutionCharts />
    <LogHistory />
  </main>

  <!-- Always-visible live log (last 20 combined events), above the footer. -->
  <LiveLogDrawer />

  <footer class="foot">
    The AI proposes &mdash; your backend enforces policy, signs and submits.
    Start on testnet with a throwaway hot wallet.
  </footer>
</template>
