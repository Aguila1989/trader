<script setup lang="ts">
import { computed } from "vue";
import { useTraderStore } from "../stores/trader";
import { fmtNum } from "../format";

const store = useTraderStore();

const positions = computed(() => store.positions);

/** Issued assets are "CODE:ISSUER"; show just the code (full form on hover). */
function assetCode(spec: string): string {
  return spec.split(":")[0] ?? spec;
}
</script>

<template>
  <section class="panel">
    <h2>Open positions</h2>
    <p class="muted pos-note">
      Net exposure from this system's own fills (signed-FIFO, quote-denominated).
    </p>
    <div class="table-wrap">
      <table class="hist">
        <thead>
          <tr>
            <th>Pair</th>
            <th>Side</th>
            <th class="num">Net qty</th>
            <th class="num">Avg price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="positions.length === 0">
            <td colspan="4" class="muted center">
              Flat - no open positions from trading.
            </td>
          </tr>
          <tr v-for="p in positions" :key="p.pair">
            <td class="mono" :title="`${p.base}/${p.quote}`">
              {{ assetCode(p.base) }}/{{ assetCode(p.quote) }}
            </td>
            <td :class="p.netQty >= 0 ? 'side-buy' : 'side-sell'">
              {{ p.netQty >= 0 ? "LONG" : "SHORT" }}
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
