<script setup lang="ts">
// Logs route. Wraps the existing LogsTab (Trade History / AI Log / System sub-
// tabs, with filters, pagination and CSV export). The live log is NOT here — it
// lives on the Trading page; this page is the full history. The deep-link from a
// live-log entry (store.logsFocus) is read by LogsTab on mount and watched by
// the tables, so clicking an entry on the Trading page then landing here still
// highlights the right row.
import { useI18n } from "vue-i18n";
import LogsTab from "./LogsTab.vue";

const { t } = useI18n();
</script>

<template>
  <main class="page">
    <h1 class="page-title">{{ t("sidebar.logs") }}</h1>
    <LogsTab />
  </main>
</template>
