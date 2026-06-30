<script setup lang="ts">
// Feature 4 — "Suggested Trustlines". Top tokens the user does not yet hold,
// scored by the weekly AI scan. Each card carries the mandatory risk disclaimer.
// "Add Trustline" pre-fills the existing Trustlines panel (the user confirms
// there); "Dismiss" hides the card until the next scan. Includes the scan
// status + a "Run Now" button.
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { dateTimeStr } from "../format";
import type { TrustlineSuggestion } from "../types";
import InfoTip from "./InfoTip.vue";
import { LESSONS } from "../academy/deeplinks";

const { t } = useI18n();
const store = useTraderStore();

const suggestions = computed(() => store.trustlineSuggestions);
const status = computed(() => store.weeklyScanStatus);
const running = computed(() => status.value?.scanning ?? false);
const busy = ref(false);

/** Score colour: >=7 healthy, >=4 caution, else poor. */
function scoreClass(n: number): string {
  return n >= 7 ? "pos" : n >= 4 ? "warn" : "neg";
}

async function runNow(): Promise<void> {
  busy.value = true;
  try {
    await store.runTrustlineScan();
  } finally {
    busy.value = false;
  }
}

function add(s: TrustlineSuggestion): void {
  store.prefillTrustline(s.asset);
}

function dismiss(s: TrustlineSuggestion): void {
  void store.dismissTrustlineSuggestion(s.asset);
}
</script>

<template>
  <section class="panel">
    <div class="ts-head">
      <h2>{{ t("trustlineSuggestions.suggestionsTitle") }}</h2>
      <button
        class="btn accent"
        :disabled="busy || running || !(status?.enabled ?? false)"
        @click="runNow"
      >
        {{ running ? t("trustlineSuggestions.scan.running") : t("trustlineSuggestions.scan.runNow") }}
      </button>
    </div>
    <p class="muted ts-intro">{{ t("trustlineSuggestions.intro") }}</p>

    <p class="muted ts-status">
      <span>
        {{ t("trustlineSuggestions.scan.lastScan") }}:
        <span class="mono">{{ status?.lastScanAt ? dateTimeStr(status.lastScanAt) : t("trustlineSuggestions.scan.never") }}</span>
      </span>
      <span v-if="status?.enabled">
        · {{ t("trustlineSuggestions.scan.nextScan") }}:
        <span class="mono">{{ status?.nextScanAt ? dateTimeStr(status.nextScanAt) : "-" }}</span>
      </span>
      <span v-if="status && status.lastScanTokenCount != null">
        · {{ t("trustlineSuggestions.scan.tokens", { n: status.lastScanTokenCount }) }}
      </span>
    </p>
    <p v-if="status && !status.enabled" class="muted">{{ t("trustlineSuggestions.scan.disabled") }}</p>
    <p v-if="status?.enabled && store.snapshot && !store.snapshot.aiReady" class="ts-err">
      {{ t("trustlineSuggestions.scan.noAiKey") }}
    </p>
    <p v-if="status?.lastError" class="ts-err">{{ t("trustlineSuggestions.scan.failed", { error: status.lastError }) }}</p>
    <p v-if="store.trustlineScanError" class="ts-err">{{ store.trustlineScanError }}</p>

    <!-- Mandatory disclaimer, shown prominently above all suggestion cards. -->
    <div class="rs-warn">{{ t("trustlineSuggestions.disclaimer") }}</div>

    <p v-if="suggestions.length === 0" class="muted">{{ t("trustlineSuggestions.empty") }}</p>

    <div v-else class="ts-cards">
      <div v-for="s in suggestions" :key="s.asset" class="card ts-card">
        <div class="row">
          <div class="headline">
            <button class="link-token" :title="s.asset" @click="store.openToken(s.asset)">
              {{ s.assetCode }}
            </button>
            <span v-if="s.toml?.projectName" class="muted ts-proj">{{ s.toml.projectName }}</span>
          </div>
          <div class="ts-overall" :class="scoreClass(s.scores.overallScore)">
            {{ s.scores.overallScore }}/10
            <span class="ts-overall-lbl">{{ t("trustlineSuggestions.overall") }}</span>
          </div>
        </div>

        <div class="ts-scores">
          <span :class="scoreClass(s.scores.liquidityScore)">
            {{ t("trustlineSuggestions.scores.liquidity") }} {{ s.scores.liquidityScore }}
          </span>
          <span :class="scoreClass(s.scores.legitimacyScore)">
            {{ t("trustlineSuggestions.scores.legitimacy") }} {{ s.scores.legitimacyScore }}
          </span>
          <span :class="scoreClass(s.scores.trendScore)">
            {{ t("trustlineSuggestions.scores.trend") }} {{ s.scores.trendScore }}
          </span>
          <span :class="scoreClass(s.scores.riskScore)">
            {{ t("trustlineSuggestions.scores.risk") }} {{ s.scores.riskScore }}
            <InfoTip :text="t('trustlineSuggestions.riskHint')" :label="t('trustlineSuggestions.scores.risk')" :learn-more="LESSONS.readingSuggestions" />
          </span>
        </div>

        <p class="ts-summary">{{ s.scores.summary }}</p>

        <ul v-if="s.scores.redFlags.length" class="ts-flags">
          <li v-for="(f, i) in s.scores.redFlags" :key="i">⚠ {{ f }}</li>
        </ul>

        <p v-if="s.toml?.description" class="muted ts-desc">{{ s.toml.description }}</p>
        <p class="ts-links">
          <a v-if="s.toml?.website" :href="s.toml.website" target="_blank" rel="noopener noreferrer">
            {{ t("trustlineSuggestions.website") }}
          </a>
          <span v-else-if="!s.homeDomain" class="muted">{{ t("trustlineSuggestions.noToml") }}</span>
          <span v-else class="muted mono">{{ s.homeDomain }}</span>
        </p>

        <RouterLink :to="LESSONS.whatIsTrustline" class="ts-learn">
          {{ t("trustlineSuggestions.learnTrustlines") }}
        </RouterLink>

        <div class="actions">
          <button class="btn primary" @click="add(s)">{{ t("trustlineSuggestions.actions.add") }}</button>
          <button class="btn" @click="dismiss(s)">{{ t("trustlineSuggestions.actions.dismiss") }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ts-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.ts-intro { margin: 0 0 8px; font-size: 12px; }
.ts-status { font-size: 12px; display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 10px; }
.ts-err { color: var(--neg); font-size: 12px; margin: 4px 0; }
.rs-warn {
  background: rgba(245, 166, 35, 0.1);
  border: 1px solid #5e4a1f;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12.5px;
  color: var(--warn);
  margin: 0 0 12px;
}
.ts-cards { display: flex; flex-direction: column; gap: 10px; }
.ts-card { display: flex; flex-direction: column; gap: 8px; }
.link-token {
  background: none; border: 0; color: var(--accent); cursor: pointer;
  font: inherit; font-weight: 600; padding: 0;
}
.link-token:hover { text-decoration: underline; }
.ts-proj { margin-left: 8px; font-weight: 400; font-size: 12px; }
.ts-overall { font-weight: 700; font-size: 16px; white-space: nowrap; }
.ts-overall-lbl {
  display: block; font-size: 9px; font-weight: 400; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--muted); text-align: right;
}
.ts-scores { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 12px; }
.ts-summary { margin: 0; font-size: 13px; }
.ts-flags { margin: 0; padding-left: 16px; font-size: 12px; color: var(--warn); }
.ts-desc { font-size: 12px; margin: 0; }
.ts-links { margin: 0; font-size: 12px; }
.ts-links a { color: var(--accent); }
.ts-learn { font-size: 12px; color: var(--accent); text-decoration: none; }
.ts-learn:hover { text-decoration: underline; }
.actions { display: flex; gap: 8px; }
.pos { color: var(--pos); }
.warn { color: var(--warn); }
.neg { color: var(--neg); }
</style>
