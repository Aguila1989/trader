<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum, shortKey, timeStr } from "../format";

const { t } = useI18n();
const store = useTraderStore();

const pnlClass = computed(() => {
  const v = store.daily?.realizedPnl ?? 0;
  return v < 0 ? "neg" : v > 0 ? "pos" : "";
});
</script>

<template>
  <section class="panel stats">
    <div class="stat">
      <span class="k">{{ t("stats.account") }}</span>
      <span class="v mono" :title="store.snapshot?.account ?? ''">
        {{ shortKey(store.snapshot?.account) }}
      </span>
    </div>
    <div class="stat">
      <span class="k">{{ t("stats.dailyVolume") }}</span>
      <span class="v">
        {{ fmtNum(store.daily?.volume) }} /
        {{ fmtNum(store.limits?.maxDailyVolume) }}
      </span>
    </div>
    <div class="stat">
      <span class="k">{{ t("stats.tradesToday") }}</span>
      <span class="v">
        {{ store.daily?.tradeCount ?? 0 }} / {{ store.limits?.maxTradesPerDay ?? "-" }}
      </span>
    </div>
    <div class="stat">
      <span class="k">{{ t("stats.realizedPnl") }}</span>
      <span
        class="v"
        :class="pnlClass"
        :title="t('stats.dailyLossHalt', { n: fmtNum(store.limits?.maxDailyLoss) })"
      >
        {{ fmtNum(store.daily?.realizedPnl, 2) }} XLM
      </span>
    </div>
    <div class="stat">
      <span class="k">{{ t("stats.lastTrade") }}</span>
      <span class="v">{{ timeStr(store.daily?.lastTradeAt) }}</span>
    </div>
  </section>
</template>
