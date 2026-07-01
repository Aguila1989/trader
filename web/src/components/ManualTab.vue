<script setup lang="ts">
// Manual trading: user-placed orders, stop losses, open orders, trustlines, and
// the user's own trade history. Composition only — no logic. Receive/Send/Swap
// moved to the dedicated Receive & Send route.
import ManualTradePanel from "./ManualTradePanel.vue";
import StopLossPanel from "./StopLossPanel.vue";
import TrustlinesPanel from "./TrustlinesPanel.vue";
import HistoryTable from "./HistoryTable.vue";
</script>

<template>
  <ManualTradePanel />
  <StopLossPanel mode="manual" />
  <TrustlinesPanel />
  <HistoryTable source="manual" />
</template>
