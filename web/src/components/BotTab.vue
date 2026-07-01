<script setup lang="ts">
// Bot trading: AI analysis, the proposal feed, AI stop losses, the liquidity
// scanner, price alerts, and the AI's trade history. Composition only. The bot
// settings + risk settings moved behind the header gear icon (SettingsModal).
import AiToggle from "./AiToggle.vue";
import BotAnalysisPanel from "./BotAnalysisPanel.vue";
import ProposalsPanel from "./ProposalsPanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import LiquidityPanel from "./LiquidityPanel.vue";
import TrustlineWarningsPanel from "./TrustlineWarningsPanel.vue";
import TrustlineSuggestionsPanel from "./TrustlineSuggestionsPanel.vue";
import AlertsPanel from "./AlertsPanel.vue";
import HistoryTable from "./HistoryTable.vue";
</script>

<template>
  <AiToggle />
  <BotAnalysisPanel />
  <ProposalsPanel />
  <StopLossPanel mode="ai" />
  <!-- Feature 4: deterioration warnings first (held tokens), then add-suggestions. -->
  <TrustlineWarningsPanel />
  <TrustlineSuggestionsPanel />
  <LiquidityPanel />
  <AlertsPanel />
  <HistoryTable source="bot" />
</template>
