<script setup lang="ts">
import { useTraderStore } from "../stores/trader";
import { timeStr } from "../format";

const store = useTraderStore();
</script>

<template>
  <section class="panel">
    <h2>Live log</h2>
    <ul class="log">
      <li v-for="(e, i) in store.logs" :key="e.ts + i">
        <span class="t">{{ timeStr(e.ts) }}</span>
        <span class="lvl" :class="'lvl-' + e.level">{{ e.level }}</span>
        <span>{{ e.message }}</span>
      </li>
    </ul>
  </section>
</template>
