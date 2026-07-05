<script setup lang="ts">
// Bot-tab AI workspace: ask the analyst about a pair, sweep the universe, read
// its commentary, and see the AI trading configuration (read-only this stage —
// editable config lands with the Settings store). The trading cap shown here
// applies to AI trades only; manual orders bypass it.
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import { goToToken } from "../token/navigation";
import { fmtNum } from "../format";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";
import { LESSONS } from "../academy/deeplinks";

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

const TIPS = computed(() => ({
  cap: t("botAnalysis.tips.cap"),
  cooldown: t("botAnalysis.tips.cooldown"),
  exposure: t("botAnalysis.tips.exposure"),
  risk: t("botAnalysis.tips.risk"),
}));

const aiBase = ref("XLM");
const aiQuote = ref("");

function ask(): void {
  if (!aiQuote.value.trim()) {
    store.reasoning = t("botAnalysis.pickQuote");
    return;
  }
  void store.analyze(aiBase.value.trim(), aiQuote.value.trim());
}

const tokenChips = computed(() =>
  store.universe.filter((t) => t.spec.toUpperCase() !== "XLM"),
);

// AI config (read-only). Each row: [label, value, tooltip?, learnMoreDeeplink?].
const configRows = computed(() => {
  const l = store.limits;
  if (!l) return [];
  return [
    [t("botAnalysis.config.capStd"), fmtNum(l.maxAmountPerTrade), TIPS.value.cap, LESSONS.tradingCap],
    [t("botAnalysis.config.capHigh"), fmtNum(l.maxAmountPerTradeHigh), TIPS.value.cap, LESSONS.tradingCap],
    [t("botAnalysis.config.maxOpenExposure"), fmtNum(l.maxOpenExposure), TIPS.value.exposure, LESSONS.tradingCap],
    [t("botAnalysis.config.perPairExposure"), String(l.pairExposureMultiplier), TIPS.value.exposure, LESSONS.tradingCap],
    [t("botAnalysis.config.cooldown"), `${l.cooldownSeconds} s`, TIPS.value.cooldown, LESSONS.riskFactors],
    [t("botAnalysis.config.minRiskReward"), String(l.minRiskReward), TIPS.value.risk, LESSONS.targetPrice],
    [t("botAnalysis.config.maxSlippage"), `${l.maxSlippageBps} bps`, "", ""],
    [t("botAnalysis.config.maxDailyVolume"), fmtNum(l.maxDailyVolume), "", ""],
    [t("botAnalysis.config.maxTradesPerDay"), String(l.maxTradesPerDay), "", ""],
    [t("botAnalysis.config.maxDailyLoss"), fmtNum(l.maxDailyLoss), "", ""],
  ] as const;
});
</script>

<template>
  <div class="grid">
    <section class="panel">
      <h2>{{ t("botAnalysis.aiAnalysis") }}</h2>
      <div class="market-controls">
        <AssetSelect v-model="aiBase" class="sel-pair" :options="store.universe" :aria-label="t('botAnalysis.baseAssetAria')" />
        <span class="sep">/</span>
        <AssetSelect
          v-model="aiQuote"
          class="sel-pair"
          :options="store.universe"
          :placeholder="t('botAnalysis.quoteTokenPlaceholder')"
          :aria-label="t('botAnalysis.quoteAssetAria')"
        />
        <button class="btn primary" :disabled="store.analyzing || store.scanning" @click="ask">
          {{ t("botAnalysis.askAi") }}
        </button>
        <button class="btn accent" :disabled="store.analyzing || store.scanning" @click="store.scanChain()">
          {{ store.scanning ? t("botAnalysis.scanning") : t("botAnalysis.scanChain") }}
        </button>
      </div>

      <div class="reasoning" :class="{ loading: store.analyzing || store.scanning }">
        {{ store.reasoning || t("botAnalysis.reasoningPlaceholder") }}
      </div>

      <h3>{{ t("botAnalysis.tokens") }}</h3>
      <div class="token-list">
        <button
          v-for="tok in tokenChips"
          :key="tok.spec"
          class="btn token-chip"
          :title="tok.name || tok.spec"
          @click="goToToken(router, tok.spec, 'trading')"
        >
          {{ tok.code }}
        </button>
        <span v-if="tokenChips.length === 0" class="muted">{{ t("botAnalysis.none") }}</span>
      </div>
    </section>

    <section class="panel">
      <h2>{{ t("botAnalysis.tradingConfig") }}<InfoTip :text="TIPS.cap" :label="t('botAnalysis.tradingCap')" :learn-more="LESSONS.tradingCap" /></h2>
      <p class="muted cfg-note">
        {{ t("botAnalysis.cfgNote") }}
      </p>
      <ul class="limits">
        <li v-for="[k, v, tip, learn] in configRows" :key="k">
          <span class="muted">
            {{ k }}<InfoTip v-if="tip" :text="tip" :label="k" :learn-more="learn" />
          </span>
          <span class="mono">{{ v }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.market-controls .asset-select.sel-pair {
  flex: 1 1 160px;
  min-width: 130px;
}
.cfg-note {
  font-size: 12px;
  margin-top: 0;
}
.token-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.token-chip {
  padding: 4px 10px;
  font-size: 12px;
}
</style>
