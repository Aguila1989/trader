<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, timeStr } from "../format";

const store = useTraderStore();

const pnlClass = computed(() => {
  const v = store.daily?.realizedPnl ?? 0;
  return v < 0 ? "neg" : v > 0 ? "pos" : "";
});
</script>

<template>
  <section class="panel stats">
    <div class="stat">
      <span class="k">Account</span>
      <span class="v mono" :title="store.snapshot?.account ?? ''">
        {{ shortKey(store.snapshot?.account) }}
      </span>
    </div>
    <div class="stat">
      <span class="k">Daily volume</span>
      <span class="v">
        {{ fmtNum(store.daily?.volume) }} /
        {{ fmtNum(store.limits?.maxDailyVolume) }}
      </span>
    </div>
    <div class="stat">
      <span class="k">Trades today</span>
      <span class="v">
        {{ store.daily?.tradeCount ?? 0 }} / {{ store.limits?.maxTradesPerDay ?? "-" }}
      </span>
    </div>
    <div class="stat">
      <span class="k">Realized PnL</span>
      <span
        class="v"
        :class="pnlClass"
        :title="`Daily loss halts at -${fmtNum(store.limits?.maxDailyLoss)} XLM`"
      >
        {{ fmtNum(store.daily?.realizedPnl, 2) }} XLM
      </span>
    </div>
    <div class="stat">
      <span class="k">Last trade</span>
      <span class="v">{{ timeStr(store.daily?.lastTradeAt) }}</span>
    </div>
  </section>
</template>
