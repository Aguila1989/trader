<script setup lang="ts">
// Feature 4 — "Trustline Warnings". Held tokens whose metrics deteriorated since
// last week's scan. The bot only warns; it NEVER removes a trustline. "Review
// Token" opens the token detail; "Dismiss Warning" snoozes it for 7 days.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import { goToToken } from "../token/navigation";
import { fmtNum } from "../format";
import type { TrustlineWarning } from "../types";
import { warningLessonPath } from "../academy/deeplinks";

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

const warnings = computed(() => store.trustlineWarnings);

function review(w: TrustlineWarning): void {
  goToToken(router, w.asset, "whitelist");
}
function snooze(w: TrustlineWarning): void {
  void store.snoozeTrustlineWarning(w.asset);
}
</script>

<template>
  <section class="panel">
    <h2>{{ t("trustlineSuggestions.warningsTitle") }}</h2>
    <p class="muted tw-intro">{{ t("trustlineSuggestions.warningsIntro") }}</p>

    <p v-if="warnings.length === 0" class="muted">{{ t("trustlineSuggestions.emptyWarnings") }}</p>

    <div v-else class="tw-cards">
      <div v-for="w in warnings" :key="w.asset" class="card tw-card">
        <div class="row">
          <div class="headline">
            <span class="tw-icon">⚠</span>
            <button class="link-token" :title="w.asset" @click="review(w)">{{ w.assetCode }}</button>
          </div>
          <div class="tw-scorechg mono">
            {{ t("trustlineSuggestions.prevVsNow", { prev: w.previousOverall ?? "-", now: w.currentOverall }) }}
          </div>
        </div>

        <div class="tw-triggers">
          <span v-for="trig in w.triggers" :key="trig" class="tw-badge">
            {{ t("trustlineSuggestions.triggers." + trig) }}
          </span>
        </div>

        <ul class="tw-changed">
          <li v-for="(c, i) in w.changed" :key="i">{{ c }}</li>
        </ul>

        <p class="tw-explain">{{ w.explanation }}</p>

        <p class="muted tw-holding">
          {{ t("trustlineSuggestions.held") }}: <span class="mono">{{ fmtNum(w.balance) }} {{ w.assetCode }}</span>
          <span v-if="w.estimatedValueXlm != null">
            · {{ t("trustlineSuggestions.estValue") }}: <span class="mono">{{ fmtNum(w.estimatedValueXlm) }} XLM</span>
          </span>
        </p>

        <RouterLink :to="warningLessonPath(w.triggers)" class="tw-learn">
          {{ t("trustlineSuggestions.whatDoesThisMean") }}
        </RouterLink>

        <div class="actions">
          <button class="btn accent" @click="review(w)">{{ t("trustlineSuggestions.actions.review") }}</button>
          <button class="btn" @click="snooze(w)">{{ t("trustlineSuggestions.actions.snooze") }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tw-intro { margin: 0 0 10px; font-size: 12px; }
.tw-cards { display: flex; flex-direction: column; gap: 10px; }
.tw-card { display: flex; flex-direction: column; gap: 8px; border-left: 3px solid var(--warn); }
.tw-icon { color: var(--warn); margin-right: 6px; }
.link-token {
  background: none; border: 0; color: var(--accent); cursor: pointer;
  font: inherit; font-weight: 600; padding: 0;
}
.link-token:hover { text-decoration: underline; }
.tw-scorechg { font-size: 12px; color: var(--muted); white-space: nowrap; }
.tw-triggers { display: flex; flex-wrap: wrap; gap: 6px; }
.tw-badge {
  background: rgba(245, 166, 35, 0.18);
  color: var(--warn);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tw-changed { margin: 0; padding-left: 16px; font-size: 12.5px; }
.tw-explain { margin: 0; font-size: 13px; }
.tw-holding { font-size: 12px; margin: 0; }
.tw-learn { font-size: 12px; color: var(--accent); text-decoration: none; }
.tw-learn:hover { text-decoration: underline; }
.actions { display: flex; gap: 8px; }
</style>
