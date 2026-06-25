<script setup lang="ts">
// Global language picker — a small badge-shaped <select> styled like the AI
// provider picker in the top bar. Binds to the app-wide vue-i18n locale.
import { useI18n } from "vue-i18n";
import { LOCALE_LABELS, SUPPORTED_LOCALES, setLocale, type Locale } from "../i18n";

const { t, locale } = useI18n();

function onChange(e: Event): void {
  setLocale((e.target as HTMLSelectElement).value as Locale);
}
</script>

<template>
  <select
    class="ai-select lang-select"
    :value="locale"
    :aria-label="t('common.language')"
    :title="t('common.language')"
    @change="onChange"
  >
    <option v-for="l in SUPPORTED_LOCALES" :key="l" :value="l">
      {{ LOCALE_LABELS[l] }}
    </option>
  </select>
</template>

<style scoped>
.lang-select {
  color: var(--text);
  border-color: var(--line);
}
.lang-select:hover {
  border-color: var(--accent);
}
</style>
