<script setup lang="ts">
// Per-factor AI risk profile (LOW/MEDIUM/HIGH). LOW reproduces the current
// conservative behavior; raising a factor lets the AI take more risk on that
// dimension. Changes POST immediately and take effect on the next proposal.
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import InfoTip from "./InfoTip.vue";
import type { RiskLevel, RiskProfile } from "../types";

const store = useTraderStore();

const FACTORS: { key: keyof RiskProfile; label: string; tip: string }[] = [
  {
    key: "positionSize",
    label: "Position size",
    tip: "LOW: AI trades the minimum safe amount per order (current behavior). MEDIUM: scales position size to a moderate % of available balance. HIGH: uses a larger % of available balance per order.",
  },
  {
    key: "stopLossDistance",
    label: "Stop loss distance",
    tip: "LOW: stop placed close to entry (tight, limits losses). MEDIUM: a moderate distance from entry. HIGH: further from entry (wider, allows more movement). The AI prefers a trailing stop at MEDIUM/HIGH.",
  },
  {
    key: "tradeFrequency",
    label: "Trade frequency",
    tip: "LOW: trades conservatively, only on high-confidence signals. MEDIUM: trades on moderate-confidence signals. HIGH: trades more frequently, including lower-confidence signals.",
  },
  {
    key: "volatilityTolerance",
    label: "Asset volatility tolerance",
    tip: "LOW: only stable, high-liquidity tokens. MEDIUM: also considers moderately volatile tokens. HIGH: considers all whitelisted tokens including volatile ones.",
  },
  {
    key: "drawdownTolerance",
    label: "Drawdown tolerance",
    tip: "LOW: pauses trading if the portfolio drops more than 5% in 24h. MEDIUM: pauses if it drops more than 10% in 24h. HIGH: does not pause based on portfolio drawdown.",
  },
  {
    key: "slippageTolerance",
    label: "Slippage tolerance",
    tip: "LOW: rejects trades where slippage exceeds 0.5% (current behavior). MEDIUM: accepts slippage up to 1.5%. HIGH: accepts slippage up to 3%.",
  },
];
const LEVELS: RiskLevel[] = ["low", "medium", "high"];

const profile = computed(() => store.riskProfile);
const anyHigh = computed(() => Object.values(profile.value).includes("high"));
const overall = computed<"LOW" | "MEDIUM" | "HIGH" | "MIXED">(() => {
  const vals = Object.values(profile.value);
  if (vals.every((v) => v === "low")) return "LOW";
  if (vals.every((v) => v === "high")) return "HIGH";
  if (vals.every((v) => v === "medium")) return "MEDIUM";
  return "MIXED";
});

function setLevel(key: keyof RiskProfile, level: RiskLevel): void {
  if (profile.value[key] === level) return;
  void store.setRiskProfile({ ...profile.value, [key]: level });
}
function resetLow(): void {
  void store.setRiskProfile({
    positionSize: "low",
    stopLossDistance: "low",
    tradeFrequency: "low",
    volatilityTolerance: "low",
    drawdownTolerance: "low",
    slippageTolerance: "low",
  });
}
</script>

<template>
  <section class="panel">
    <h2>Risk settings</h2>
    <p class="muted rs-note">
      How aggressively the AI trades, per factor. LOW = current (most
      conservative) behavior; raising a factor lets the AI take more risk on that
      dimension. Changes take effect on the next proposal — no restart needed.
    </p>

    <div v-if="anyHigh" class="rs-warn">
      ⚠ One or more risk factors are set to HIGH. The AI may place larger or more
      frequent trades. Monitor your portfolio closely.
    </div>

    <ul class="rs-list">
      <li v-for="f in FACTORS" :key="f.key" class="rs-row">
        <span class="rs-label">
          {{ f.label }}<InfoTip :text="f.tip" :label="f.label" />
        </span>
        <div class="segmented rs-seg" role="group" :aria-label="f.label">
          <button
            v-for="lvl in LEVELS"
            :key="lvl"
            class="seg"
            :class="{ active: profile[f.key] === lvl }"
            :aria-pressed="profile[f.key] === lvl"
            @click="setLevel(f.key, lvl)"
          >
            {{ lvl.toUpperCase() }}
          </button>
        </div>
      </li>
    </ul>

    <div class="rs-foot">
      <span class="rs-overall">
        Overall risk profile:
        <strong :class="'rs-' + overall.toLowerCase()">{{ overall }}</strong>
      </span>
      <button class="btn rs-reset" :disabled="overall === 'LOW'" @click="resetLow">
        Reset to LOW
      </button>
    </div>
  </section>
</template>

<style scoped>
.rs-note {
  font-size: 12px;
  margin-top: 0;
}
.rs-warn {
  background: rgba(245, 166, 35, 0.12);
  border: 1px solid #5e4a1f;
  color: var(--warn);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  margin-bottom: 12px;
}
.rs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.rs-label {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
}
.rs-seg .seg {
  padding: 5px 14px;
  font-size: 12px;
}
.rs-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.rs-overall {
  font-size: 13px;
  color: var(--muted);
}
.rs-overall strong {
  letter-spacing: 0.04em;
}
.rs-low {
  color: var(--pos);
}
.rs-medium {
  color: var(--warn);
}
.rs-high {
  color: var(--neg);
}
.rs-mixed {
  color: var(--accent);
}
.rs-reset {
  padding: 4px 12px;
  font-size: 12px;
}
</style>
