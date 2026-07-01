<script setup lang="ts">
// Pending Payments route. PendingPayments was previously a child of WalletPanel
// (on the Manual tab); it's fully self-contained, so it moves here as-is.
import { useI18n } from "vue-i18n";
import PendingPayments from "./PendingPayments.vue";

const { t } = useI18n();
</script>

<template>
  <main class="page">
    <h1 class="page-title">{{ t("sidebar.pending") }}</h1>
    <PendingPayments />
  </main>
</template>
