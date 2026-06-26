<script setup lang="ts">
// App shell. With vue-router, App is just the persistent root: it initialises
// the trader store ONCE (App is always mounted, so the SSE stream and data
// survive navigation between the dashboard and the Academy) and renders the
// active route.
import { onMounted } from "vue";
import { useTraderStore } from "./stores/trader";
import LiveLogDrawer from "./components/LiveLogDrawer.vue";

const store = useTraderStore();
onMounted(() => void store.init());
</script>

<template>
  <router-view />
  <!-- Feature 7: the live log (last 20 events) is always visible on EVERY route,
       including the Academy. The full, paginated history lives only in the Logs tab. -->
  <LiveLogDrawer />
</template>
