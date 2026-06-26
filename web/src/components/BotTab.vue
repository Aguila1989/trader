<script setup lang="ts">
// Bot trading: AI analysis + config, the proposal feed, AI stop losses, the
// liquidity scanner, price alerts, and the AI's trade history. Composition only.
import AiToggle from "./AiToggle.vue";
import BotAnalysisPanel from "./BotAnalysisPanel.vue";
import RiskSettingsPanel from "./RiskSettingsPanel.vue";
import SettingsPanel from "./SettingsPanel.vue";
import ProposalsPanel from "./ProposalsPanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import LiquidityPanel from "./LiquidityPanel.vue";
import AlertsPanel from "./AlertsPanel.vue";
import HistoryTable from "./HistoryTable.vue";
</script>

<template>
  <AiToggle />
  <BotAnalysisPanel />
  <RiskSettingsPanel />
  <SettingsPanel />
  <ProposalsPanel />
  <StopLossPanel mode="ai" />
  <LiquidityPanel />
  <AlertsPanel />
  <HistoryTable source="bot" />
</template>
