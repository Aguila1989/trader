<script setup lang="ts">
import { onMounted } from "vue";
import { useTraderStore } from "./stores/trader";
import TopBar from "./components/TopBar.vue";
import StatsPanel from "./components/StatsPanel.vue";
import PositionsPanel from "./components/PositionsPanel.vue";
import MarketPanel from "./components/MarketPanel.vue";
import ProposalsPanel from "./components/ProposalsPanel.vue";
import EvolutionCharts from "./components/EvolutionCharts.vue";
import HistoryTable from "./components/HistoryTable.vue";
import LogFeed from "./components/LogFeed.vue";

const store = useTraderStore();
onMounted(() => void store.init());
</script>

<template>
  <TopBar />
  <main>
    <StatsPanel />
    <PositionsPanel />
    <MarketPanel />
    <ProposalsPanel />
    <EvolutionCharts />
    <HistoryTable />
    <LogFeed />
  </main>
  <footer class="foot">
    The AI proposes &mdash; your backend enforces policy, signs and submits.
    Start on testnet with a throwaway hot wallet.
  </footer>
</template>
