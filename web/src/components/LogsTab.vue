<script setup lang="ts">
// Logs tab: Trade History + AI Log sub-tabs. A deep-link from the live log
// selects the right sub-tab (and the table highlights/expands the row).
import { ref, watch } from "vue";
import { useTraderStore } from "../stores/trader";
import TradeLogTable from "./TradeLogTable.vue";
import AiLogTable from "./AiLogTable.vue";

const store = useTraderStore();
const sub = ref<"trade" | "ai">(store.logsFocus?.sub ?? "trade");
watch(
  () => store.logsFocus,
  (f) => {
    if (f) sub.value = f.sub;
  },
);
</script>

<template>
  <section class="panel">
    <div class="tabbar sub-tabbar" role="tablist" aria-label="Log views">
      <button class="tab" role="tab" :aria-selected="sub === 'trade'" :class="{ active: sub === 'trade' }" @click="sub = 'trade'">
        Trade History
      </button>
      <button class="tab" role="tab" :aria-selected="sub === 'ai'" :class="{ active: sub === 'ai' }" @click="sub = 'ai'">
        AI Log
      </button>
    </div>
    <TradeLogTable v-if="sub === 'trade'" />
    <AiLogTable v-else />
  </section>
</template>

<style scoped>
.sub-tabbar {
  margin-bottom: 12px;
}
</style>
