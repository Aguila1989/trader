<script setup lang="ts">
// Per-factor AI risk profile. BASIC mode: LOW/MEDIUM/HIGH per factor (LOW =
// current conservative behavior). EXPERT mode: exact numeric thresholds per
// factor + preset loader. Changes POST immediately (next proposal). The backend
// clamps every value, so the UI is a convenience layer over server validation.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import InfoTip from "./InfoTip.vue";
import { LESSONS } from "../academy/deeplinks";
import {
  EXPERT_PRESETS,
  EXPERT_RANGES,
  defaultExpertProfile,
  matchExpertPreset,
  type ExpertRiskProfile,
  type RiskLevel,
  type RiskPreset,
  type RiskProfile,
} from "../types";

const store = useTraderStore();
const { t } = useI18n();

// AUDIT-018: computed (not a module-time const) so the labels/tips re-render
// when the user switches language live via LangSwitcher.
const FACTORS = computed<{ key: keyof RiskProfile; label: string; tip: string }[]>(() => [
  { key: "positionSize", label: t("riskSettings.factors.positionSize.label"), tip: t("riskSettings.factors.positionSize.tip") },
  { key: "stopLossDistance", label: t("riskSettings.factors.stopLossDistance.label"), tip: t("riskSettings.factors.stopLossDistance.tip") },
  { key: "tradeFrequency", label: t("riskSettings.factors.tradeFrequency.label"), tip: t("riskSettings.factors.tradeFrequency.tip") },
  { key: "volatilityTolerance", label: t("riskSettings.factors.volatilityTolerance.label"), tip: t("riskSettings.factors.volatilityTolerance.tip") },
  { key: "drawdownTolerance", label: t("riskSettings.factors.drawdownTolerance.label"), tip: t("riskSettings.factors.drawdownTolerance.tip") },
  { key: "slippageTolerance", label: t("riskSettings.factors.slippageTolerance.label"), tip: t("riskSettings.factors.slippageTolerance.tip") },
]);
const LEVELS: RiskLevel[] = ["low", "medium", "high"];
const PRESETS: RiskPreset[] = ["conservative", "balanced", "aggressive"];

const profile = computed(() => store.riskProfile);
const expertMode = computed(() => profile.value.expertMode === true);
const expert = computed<ExpertRiskProfile>(() => profile.value.expert ?? defaultExpertProfile());

// --- basic mode ---
const anyHigh = computed(() => {
  const p = profile.value;
  return [p.positionSize, p.stopLossDistance, p.tradeFrequency, p.volatilityTolerance, p.drawdownTolerance, p.slippageTolerance].includes("high");
});
const overall = computed<"LOW" | "MEDIUM" | "HIGH" | "MIXED">(() => {
  const p = profile.value;
  const vals = [p.positionSize, p.stopLossDistance, p.tradeFrequency, p.volatilityTolerance, p.drawdownTolerance, p.slippageTolerance];
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
    ...profile.value,
    positionSize: "low", stopLossDistance: "low", tradeFrequency: "low",
    volatilityTolerance: "low", drawdownTolerance: "low", slippageTolerance: "low",
  });
}

// --- expert mode ---
function setExpertMode(on: boolean): void {
  void store.setRiskProfile({ ...profile.value, expertMode: on, expert: profile.value.expert ?? defaultExpertProfile() });
}
function updateExpert(patch: Partial<ExpertRiskProfile>): void {
  void store.setRiskProfile({ ...profile.value, expertMode: true, expert: { ...expert.value, ...patch } });
}
function clampField(field: keyof typeof EXPERT_RANGES, n: number): number {
  const r = EXPERT_RANGES[field];
  return Math.min(r.max, Math.max(r.min, n));
}
function onNum(field: keyof typeof EXPERT_RANGES, ev: Event): void {
  const n = Number((ev.target as HTMLInputElement).value);
  if (!Number.isFinite(n)) return;
  updateExpert({ [field]: clampField(field, n) } as Partial<ExpertRiskProfile>);
}

const currentPreset = computed(() => matchExpertPreset(expert.value));
function onPreset(ev: Event): void {
  const v = (ev.target as HTMLSelectElement).value as RiskPreset | "custom";
  if (v === "custom") return;
  void store.setRiskProfile({ ...profile.value, expertMode: true, expert: { ...EXPERT_PRESETS[v] } });
}

// Live position-size preview + cap warning.
const balXlm = computed(() => store.heldBalance("XLM"));
const maxOrder = computed(() => balXlm.value * (expert.value.positionSizePct / 100));
const aiCap = computed(() => store.limits?.maxAmountPerTrade ?? null);
const exceedsCap = computed(() => aiCap.value != null && maxOrder.value > aiCap.value);
const stopTight = computed(() => expert.value.stopLossMode === "pct" && expert.value.stopLossPct < 1);

// HIGH banner: any value more aggressive than the Aggressive preset.
const beyondHigh = computed(() => {
  const e = expert.value;
  const H = EXPERT_PRESETS.aggressive;
  return (
    e.positionSizePct > H.positionSizePct ||
    (e.stopLossMode === "pct" && e.stopLossPct > H.stopLossPct) ||
    e.minConfidence < H.minConfidence ||
    e.maxVolatilityPct > H.maxVolatilityPct ||
    (!e.drawdownNeverPause && e.drawdownPausePct > H.drawdownPausePct) ||
    e.maxSlippagePct > H.maxSlippagePct
  );
});
</script>

<template>
  <section class="panel">
    <div class="rs-head">
      <h2>{{ t("riskSettings.title") }}</h2>
      <label class="rs-expert-toggle">
        <input type="checkbox" :checked="expertMode" @change="setExpertMode(($event.target as HTMLInputElement).checked)" />
        {{ t("riskSettings.expert.toggle") }}
      </label>
    </div>
    <p class="muted rs-note">{{ t("riskSettings.note") }}</p>

    <!-- ============ BASIC MODE ============ -->
    <template v-if="!expertMode">
      <div v-if="anyHigh" class="rs-warn">⚠ {{ t("riskSettings.highWarning") }}</div>
      <ul class="rs-list">
        <li v-for="f in FACTORS" :key="f.key" class="rs-row">
          <span class="rs-label">{{ f.label }}<InfoTip :text="f.tip" :label="f.label" :learn-more="LESSONS.riskFactors" /></span>
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
          {{ t("riskSettings.overall") }}:
          <strong :class="'rs-' + overall.toLowerCase()">{{ overall }}</strong>
        </span>
        <button class="btn rs-reset" :disabled="overall === 'LOW'" @click="resetLow">
          {{ t("riskSettings.resetToLow") }}
        </button>
      </div>
    </template>

    <!-- ============ EXPERT MODE ============ -->
    <template v-else>
      <div class="rs-preset">
        <label class="rs-label">{{ t("riskSettings.expert.preset") }}</label>
        <select class="rs-input" :value="currentPreset" @change="onPreset">
          <option v-for="p in PRESETS" :key="p" :value="p">{{ t("riskSettings.expert.presets." + p) }}</option>
          <option v-if="currentPreset === 'custom'" value="custom">{{ t("riskSettings.expert.presets.custom") }}</option>
        </select>
        <span v-if="currentPreset !== 'custom'" class="muted rs-preset-desc">
          {{ t("riskSettings.expert.presetDesc." + currentPreset) }}
        </span>
      </div>

      <div v-if="beyondHigh" class="rs-warn">⚠ {{ t("riskSettings.expert.highWarning") }}</div>

      <div class="rs-xlist">
        <!-- Position size -->
        <div class="rs-xrow">
          <span class="rs-label">{{ t("riskSettings.expert.positionSize") }}</span>
          <div class="rs-xinput">
            <input
              type="number" class="rs-input" :min="EXPERT_RANGES.positionSizePct.min" :max="EXPERT_RANGES.positionSizePct.max"
              :step="EXPERT_RANGES.positionSizePct.step" :value="expert.positionSizePct"
              @change="onNum('positionSizePct', $event)"
            /><span class="rs-unit">%</span>
          </div>
          <span class="rs-preview muted">
            {{ t("riskSettings.expert.positionPreview", { bal: fmtNum(balXlm), amt: fmtNum(maxOrder) }) }}
          </span>
          <span v-if="exceedsCap" class="rs-fieldwarn">
            ⚠ {{ t("riskSettings.expert.positionExceedsCap", { cap: fmtNum(aiCap) }) }}
          </span>
        </div>

        <!-- Stop loss distance -->
        <div class="rs-xrow">
          <span class="rs-label">{{ t("riskSettings.factors.stopLossDistance.label") }}</span>
          <div class="segmented rs-seg">
            <button class="seg" :class="{ active: expert.stopLossMode === 'pct' }" @click="updateExpert({ stopLossMode: 'pct' })">
              {{ t("riskSettings.expert.stopMode.pct") }}
            </button>
            <button class="seg" :class="{ active: expert.stopLossMode === 'amount' }" @click="updateExpert({ stopLossMode: 'amount' })">
              {{ t("riskSettings.expert.stopMode.amount") }}
            </button>
          </div>
          <div class="rs-xinput">
            <input
              v-if="expert.stopLossMode === 'pct'"
              type="number" class="rs-input" :min="EXPERT_RANGES.stopLossPct.min" :max="EXPERT_RANGES.stopLossPct.max"
              :step="EXPERT_RANGES.stopLossPct.step" :value="expert.stopLossPct" @change="onNum('stopLossPct', $event)"
            />
            <input
              v-else type="number" class="rs-input" :min="EXPERT_RANGES.stopLossAmount.min"
              :step="EXPERT_RANGES.stopLossAmount.step" :value="expert.stopLossAmount" @change="onNum('stopLossAmount', $event)"
            />
            <span class="rs-unit">{{ expert.stopLossMode === "pct" ? "%" : "XLM" }}</span>
          </div>
          <span v-if="stopTight" class="rs-fieldwarn">⚠ {{ t("riskSettings.expert.stopTight") }}</span>
        </div>

        <!-- Trade frequency = min confidence -->
        <div class="rs-xrow">
          <span class="rs-label">
            {{ t("riskSettings.expert.minConfidence") }}<InfoTip :text="t('riskSettings.expert.minConfidenceTip')" :label="t('riskSettings.expert.minConfidence')" :learn-more="LESSONS.riskFactors" />
          </span>
          <div class="rs-xinput">
            <input
              type="number" class="rs-input" :min="EXPERT_RANGES.minConfidence.min" :max="EXPERT_RANGES.minConfidence.max"
              :step="EXPERT_RANGES.minConfidence.step" :value="expert.minConfidence" @change="onNum('minConfidence', $event)"
            /><span class="rs-unit">/ 100</span>
          </div>
        </div>

        <!-- Asset volatility tolerance -->
        <div class="rs-xrow">
          <span class="rs-label">
            {{ t("riskSettings.expert.maxVolatility") }}<InfoTip :text="t('riskSettings.expert.maxVolatilityTip')" :label="t('riskSettings.expert.maxVolatility')" :learn-more="LESSONS.riskFactors" />
          </span>
          <div class="rs-xinput">
            <input
              type="number" class="rs-input" :min="EXPERT_RANGES.maxVolatilityPct.min" :max="EXPERT_RANGES.maxVolatilityPct.max"
              :step="EXPERT_RANGES.maxVolatilityPct.step" :value="expert.maxVolatilityPct" @change="onNum('maxVolatilityPct', $event)"
            /><span class="rs-unit">%</span>
          </div>
        </div>

        <!-- Drawdown tolerance -->
        <div class="rs-xrow">
          <span class="rs-label">{{ t("riskSettings.expert.drawdownPause") }}</span>
          <div class="rs-xinput">
            <input
              type="number" class="rs-input" :min="EXPERT_RANGES.drawdownPausePct.min" :max="EXPERT_RANGES.drawdownPausePct.max"
              :step="EXPERT_RANGES.drawdownPausePct.step" :value="expert.drawdownPausePct"
              :disabled="expert.drawdownNeverPause" @change="onNum('drawdownPausePct', $event)"
            /><span class="rs-unit">%</span>
          </div>
          <label class="rs-check">
            <input type="checkbox" :checked="expert.drawdownNeverPause" @change="updateExpert({ drawdownNeverPause: ($event.target as HTMLInputElement).checked })" />
            {{ t("riskSettings.expert.neverPause") }}
          </label>
        </div>

        <!-- Slippage tolerance -->
        <div class="rs-xrow">
          <span class="rs-label">{{ t("riskSettings.expert.slippage") }}</span>
          <div class="rs-xinput">
            <input
              type="number" class="rs-input" :min="EXPERT_RANGES.maxSlippagePct.min" :max="EXPERT_RANGES.maxSlippagePct.max"
              :step="EXPERT_RANGES.maxSlippagePct.step" :value="expert.maxSlippagePct" @change="onNum('maxSlippagePct', $event)"
            /><span class="rs-unit">%</span>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.rs-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.rs-head h2 { margin: 0; }
.rs-expert-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); cursor: pointer; }
.rs-note { font-size: 12px; margin-top: 6px; }
.rs-warn {
  background: rgba(245, 166, 35, 0.12); border: 1px solid #5e4a1f; color: var(--warn);
  border-radius: 8px; padding: 8px 12px; font-size: 13px; margin-bottom: 12px;
}
.rs-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.rs-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.rs-label { display: inline-flex; align-items: center; font-size: 13px; }
.rs-seg .seg { padding: 5px 14px; font-size: 12px; }
.rs-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; flex-wrap: wrap; }
.rs-overall { font-size: 13px; color: var(--muted); }
.rs-overall strong { letter-spacing: 0.04em; }
.rs-low { color: var(--pos); }
.rs-medium { color: var(--warn); }
.rs-high { color: var(--neg); }
.rs-mixed { color: var(--accent); }
.rs-reset { padding: 4px 12px; font-size: 12px; }

/* expert */
.rs-preset { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.rs-preset-desc { font-size: 12px; }
.rs-input {
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 8px;
  color: var(--text); padding: 6px 10px; font-family: ui-monospace, monospace; max-width: 130px;
}
.rs-input:focus { outline: none; border-color: var(--accent); }
.rs-input:disabled { opacity: 0.5; }
.rs-xlist { display: flex; flex-direction: column; gap: 14px; }
.rs-xrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rs-xrow .rs-label { min-width: 220px; flex: 1 1 220px; }
.rs-xinput { display: inline-flex; align-items: center; gap: 6px; }
.rs-unit { font-size: 12px; color: var(--muted); }
.rs-preview { font-size: 12px; flex-basis: 100%; }
.rs-fieldwarn { font-size: 12px; color: var(--warn); flex-basis: 100%; }
.rs-check { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); cursor: pointer; }
</style>
