<script setup lang="ts">
// Bot-tab AI workspace: ask the analyst about a pair, sweep the universe, read
// its commentary, and see the AI trading configuration (read-only this stage —
// editable config lands with the Settings store). The trading cap shown here
// applies to AI trades only; manual orders bypass it.
import { computed, ref } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import AssetSelect from "./AssetSelect.vue";
import InfoTip from "./InfoTip.vue";

const store = useTraderStore();

const TIPS = {
  cap: "The maximum amount the AI is allowed to trade in a single order. Manual trades are not subject to this limit.",
  cooldown: "Minimum time the AI must wait between opening new positions.",
  exposure: "Cap on total open position value across all pairs (XLM-equivalent).",
  risk: "Minimum reward-to-risk ratio the AI must state (target vs invalidation) to open a trade.",
};

const aiBase = ref("XLM");
const aiQuote = ref("");

function ask(): void {
  if (!aiQuote.value.trim()) {
    store.reasoning = "Pick a quote asset to analyze.";
    return;
  }
  void store.analyze(aiBase.value.trim(), aiQuote.value.trim());
}

const tokenChips = computed(() =>
  store.universe.filter((t) => t.spec.toUpperCase() !== "XLM"),
);

// AI config (read-only). Each row: [label, value, tooltip?].
const configRows = computed(() => {
  const l = store.limits;
  if (!l) return [];
  return [
    ["Trading cap / order (std)", fmtNum(l.maxAmountPerTrade), TIPS.cap],
    ["Trading cap / order (high tier)", fmtNum(l.maxAmountPerTradeHigh), TIPS.cap],
    ["Max open exposure", fmtNum(l.maxOpenExposure), TIPS.exposure],
    ["Per-pair exposure ×", String(l.pairExposureMultiplier), TIPS.exposure],
    ["Cooldown between entries", `${l.cooldownSeconds} s`, TIPS.cooldown],
    ["Min reward / risk", String(l.minRiskReward), TIPS.risk],
    ["Max slippage", `${l.maxSlippageBps} bps`, ""],
    ["Max daily volume", fmtNum(l.maxDailyVolume), ""],
    ["Max trades / day", String(l.maxTradesPerDay), ""],
    ["Max daily loss", fmtNum(l.maxDailyLoss), ""],
  ] as const;
});
</script>

<template>
  <div class="grid">
    <section class="panel">
      <h2>AI analysis</h2>
      <div class="market-controls">
        <AssetSelect v-model="aiBase" class="sel-pair" :options="store.universe" aria-label="Analysis base asset" />
        <span class="sep">/</span>
        <AssetSelect
          v-model="aiQuote"
          class="sel-pair"
          :options="store.universe"
          placeholder="quote token"
          aria-label="Analysis quote asset"
        />
        <button class="btn primary" :disabled="store.analyzing || store.scanning" @click="ask">
          Ask AI
        </button>
        <button class="btn accent" :disabled="store.analyzing || store.scanning" @click="store.scanChain()">
          {{ store.scanning ? "Scanning..." : "Scan chain" }}
        </button>
      </div>

      <div class="reasoning" :class="{ loading: store.analyzing || store.scanning }">
        {{
          store.reasoning ||
          "Pick a pair and hit “Ask AI”, or “Scan chain” to sweep the reputable-token universe."
        }}
      </div>

      <h3>Tokens</h3>
      <div class="token-list">
        <button
          v-for="t in tokenChips"
          :key="t.spec"
          class="btn token-chip"
          :title="t.name || t.spec"
          @click="store.openToken(t.spec)"
        >
          {{ t.code }}
        </button>
        <span v-if="tokenChips.length === 0" class="muted">(none)</span>
      </div>
    </section>

    <section class="panel">
      <h2>AI trading config<InfoTip :text="TIPS.cap" label="Trading cap" /></h2>
      <p class="muted cfg-note">
        Applies to AI-initiated trades. Manual orders bypass the size caps.
        Editing these live arrives with the settings update.
      </p>
      <ul class="limits">
        <li v-for="[k, v, tip] in configRows" :key="k">
          <span class="muted">
            {{ k }}<InfoTip v-if="tip" :text="tip" :label="k" />
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
