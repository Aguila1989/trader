<script setup lang="ts">
// Bot trading: AI analysis + config, the proposal feed, AI stop losses, the
// liquidity scanner, price alerts, and the AI's trade history. Composition only.
import BotAnalysisPanel from "./BotAnalysisPanel.vue";
import RiskSettingsPanel from "./RiskSettingsPanel.vue";
import ProposalsPanel from "./ProposalsPanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import LiquidityPanel from "./LiquidityPanel.vue";
import AlertsPanel from "./AlertsPanel.vue";
import HistoryTable from "./HistoryTable.vue";
</script>

<template>
  <BotAnalysisPanel />
  <RiskSettingsPanel />
  <ProposalsPanel />
  <StopLossPanel mode="ai" />
  <LiquidityPanel />
  <AlertsPanel />
  <HistoryTable source="bot" />
</template>
