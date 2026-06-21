<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";
import type { RankTrend, VolumeTrend } from "../types";

const store = useTraderStore();

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
    <h2>Liquidity scanner</h2>
    <p class="muted scanner-note">
      Top assets by 24h XLM-pair volume. Observe-only — it never trades; promote
      a “watch” candidate by hand via SCAN_ASSETS / ASSET_WHITELIST.
    </p>

    <p v-if="recs.length === 0" class="muted">
      No data yet. Enable the scanner with
      <span class="mono">LIQUIDITY_SCAN_INTERVAL_SECONDS</span> &gt; 0; trend data
      fills in after ~24 hourly snapshots.
    </p>

    <table v-else class="liq-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Asset</th>
          <th class="num">24h vol (XLM)</th>
          <th class="num">Spread</th>
          <th>Rank trend</th>
          <th>Volume</th>
          <th class="num">Consistency</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in recs" :key="r.asset" :class="{ recommended: r.recommended }">
          <td class="mono">{{ r.rank }}</td>
          <td>
            <button class="link-token" :title="r.asset" @click="store.openToken(r.asset)">
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
            <span v-if="r.recommended" class="watch-badge">watch</span>
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
