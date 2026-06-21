<script setup lang="ts">
import { onMounted } from "vue";
import { useTraderStore } from "./stores/trader";
import TopBar from "./components/TopBar.vue";
import StatsPanel from "./components/StatsPanel.vue";
import PositionsPanel from "./components/PositionsPanel.vue";
import MarketPanel from "./components/MarketPanel.vue";
import ProposalsPanel from "./components/ProposalsPanel.vue";
import EvolutionCharts from "./components/EvolutionCharts.vue";
import LiquidityPanel from "./components/LiquidityPanel.vue";
import HistoryTable from "./components/HistoryTable.vue";
import LogHistory from "./components/LogHistory.vue";
import LogFeed from "./components/LogFeed.vue";
import TokenDetail from "./components/TokenDetail.vue";

const store = useTraderStore();
onMounted(() => void store.init());
</script>

<template>
  <TopBar />
  <!-- Single-view SPA: a selected token swaps the dashboard for its detail
       view (no router). The "← Back" button inside TokenDetail clears it. -->
  <main v-if="!store.selectedToken">
    <StatsPanel />
    <PositionsPanel />
    <MarketPanel />
    <ProposalsPanel />
    <EvolutionCharts />
    <LiquidityPanel />
    <HistoryTable />
    <LogHistory />
    <LogFeed />
  </main>
  <main v-else>
    <TokenDetail />
  </main>
  <footer class="foot">
    The AI proposes &mdash; your backend enforces policy, signs and submits.
    Start on testnet with a throwaway hot wallet.
  </footer>
</template>
