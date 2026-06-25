<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

const { t } = useI18n();
const store = useTraderStore();

const positions = computed(() => store.positions);

/** Issued assets are "CODE:ISSUER"; show just the code (full form on hover). */
function assetCode(spec: string): string {
  return spec.split(":")[0] ?? spec;
}
</script>

<template>
  <section class="panel">
    <h2>{{ t("positions.title") }}</h2>
    <p class="muted pos-note">
      {{ t("positions.note") }}
    </p>
    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>{{ t("positions.pair") }}</th>
            <th>{{ t("positions.side") }}</th>
            <th class="num">{{ t("positions.netQty") }}</th>
            <th class="num">{{ t("positions.avgPrice") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="positions.length === 0">
            <td colspan="4" class="muted center">
              {{ t("positions.empty") }}
            </td>
          </tr>
          <tr v-for="p in positions" :key="p.pair">
            <td class="mono" :title="`${p.base}/${p.quote}`">
              {{ assetCode(p.base) }}/{{ assetCode(p.quote) }}
            </td>
            <td :class="p.netQty >= 0 ? 'side-buy' : 'side-sell'">
              {{ p.netQty >= 0 ? t("positions.long") : t("positions.short") }}
            </td>
            <td class="num mono">{{ fmtNum(Math.abs(p.netQty)) }}</td>
            <td class="num mono">{{ fmtNum(p.avgPrice) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.pos-note {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
}
</style>
