<script setup lang="ts">
// Shared chrome for every unauthenticated screen (login / register / forgot /
// reset / verify). Renders the brand, the language switcher, and the Academy
// button so unauthenticated users can reach the Academy from here too (spec).
// The card content is provided via the default slot.
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import LangSwitcher from "../LangSwitcher.vue";

const { t } = useI18n();
const router = useRouter();
</script>

<template>
  <div class="auth-wrap">
    <header class="auth-top">
      <span class="auth-brand"><span class="logo">◆</span> {{ t("auth.brand") }}</span>
      <div class="auth-top-end">
        <LangSwitcher />
        <button class="btn academy-link" type="button" @click="router.push('/academy')">
          {{ t("common.academy") }} →
        </button>
      </div>
    </header>

    <main class="auth-main">
      <div class="panel auth-card">
        <slot />
      </div>
      <p class="auth-tagline muted">{{ t("auth.brand") }} · {{ t("auth.tagline") }}</p>
    </main>
  </div>
</template>
