<script setup lang="ts">
// App shell. With vue-router, App is just the persistent root: it initialises
// the trader store ONCE (App is always mounted, so the SSE stream and data
// survive navigation between the dashboard and the Academy) and renders the
// active route.
import { onMounted } from "vue";
import { useTraderStore } from "./stores/trader";

const store = useTraderStore();
onMounted(() => void store.init());
</script>

<template>
  <router-view />
</template>
