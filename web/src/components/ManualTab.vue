<script setup lang="ts">
// Manual trading: user-placed orders, stop losses, open orders, wallet ops,
// trustlines, and the user's own trade history. Composition only — no logic.
import ManualTradePanel from "./ManualTradePanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import WalletPanel from "./WalletPanel.vue";
import TrustlinesPanel from "./TrustlinesPanel.vue";
import HistoryTable from "./HistoryTable.vue";
</script>

<template>
  <ManualTradePanel />
  <StopLossPanel mode="manual" />
  <WalletPanel />
  <TrustlinesPanel />
  <HistoryTable source="manual" />
</template>
