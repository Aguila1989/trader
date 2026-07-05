<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import { goToToken } from "../token/navigation";
import { fmtNum } from "../format";
import type { RankTrend, VolumeTrend } from "../types";
import InfoTip from "./InfoTip.vue";
import { LESSONS } from "../academy/deeplinks";

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

const TIPS = computed(() => ({
  liquidity: t("liquidity.tips.liquidity"),
  spread: t("liquidity.tips.spread"),
}));

const recs = computed(() => store.liquidityRecs);

function rankArrow(t?: RankTrend): string {
  return t === "improving" ? "▲" : t === "declining" ? "▼" : t ? "→" : "";
}
function volArrow(t?: VolumeTrend): string {
  return t === "growing" ? "▲" : t === "shrinking" ? "▼" : t ? "→" : "";
}
function trendClass(t?: string): string {
  return t === "improving" || t === "growing"
    ? "pos"
    : t === "declining" || t === "shrinking"
      ? "neg"
      : "muted";
}
</script>

<template>
  <section class="panel">
    <h2>{{ t("liquidity.title") }}</h2>
    <p class="muted scanner-note">
      {{ t("liquidity.scannerNote") }}
    </p>

    <p v-if="recs.length === 0" class="muted">
      {{ t("liquidity.empty.before") }}
      <span class="mono">LIQUIDITY_SCAN_INTERVAL_SECONDS</span> &gt; 0;
      {{ t("liquidity.empty.after") }}
    </p>

    <table v-else class="liq-table">
      <thead>
        <tr>
          <th>#</th>
          <th>{{ t("liquidity.cols.asset") }}</th>
          <th class="num">
            {{ t("liquidity.cols.vol24h") }}<InfoTip :text="TIPS.liquidity" :label="t('liquidity.labels.liquidityScore')" placement="right" :learn-more="LESSONS.liquidity" />
          </th>
          <th class="num">
            {{ t("liquidity.cols.spread") }}<InfoTip :text="TIPS.spread" :label="t('liquidity.labels.spread')" placement="right" :learn-more="LESSONS.spread" />
          </th>
          <th>{{ t("liquidity.cols.rankTrend") }}</th>
          <th>{{ t("liquidity.cols.volume") }}</th>
          <th class="num">{{ t("liquidity.cols.consistency") }}</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in recs" :key="r.asset" :class="{ recommended: r.recommended }">
          <td class="mono">{{ r.rank }}</td>
          <td>
            <button class="link-token" :title="r.asset" @click="goToToken(router, r.asset, 'trading')">
              {{ r.assetCode }}
            </button>
          </td>
          <td class="num mono">{{ fmtNum(r.baseVolume24h) }}</td>
          <td class="num mono">
            {{ r.spreadBps != null ? fmtNum(r.spreadBps, 1) + " bps" : "-" }}
          </td>
          <td :class="trendClass(r.rankTrend)">
            {{ r.rankTrend ? rankArrow(r.rankTrend) + " " + r.rankTrend : "-" }}
          </td>
          <td :class="trendClass(r.volumeTrend)">
            {{ r.volumeTrend ? volArrow(r.volumeTrend) + " " + r.volumeTrend : "-" }}
          </td>
          <td class="num mono">
            {{ r.consistencyPct != null ? r.consistencyPct + "%" : "-" }}
          </td>
          <td>
            <span v-if="r.recommended" class="watch-badge">{{ t("liquidity.watch") }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.scanner-note {
  font-size: 12px;
  margin-top: 0;
}
.liq-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.liq-table th,
.liq-table td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid var(--line);
}
.liq-table th.num,
.liq-table td.num {
  text-align: right;
}
.liq-table tr.recommended {
  background: rgba(47, 191, 113, 0.08);
}
.link-token {
  background: none;
  border: 0;
  color: var(--accent);
  cursor: pointer;
  font: inherit;
  padding: 0;
}
.link-token:hover {
  text-decoration: underline;
}
.watch-badge {
  background: rgba(47, 191, 113, 0.18);
  color: var(--pos, #2fbf71);
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
