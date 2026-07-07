<script setup lang="ts">
// Production hardening (Fix 1): a render/runtime error thrown anywhere in the
// wrapped subtree used to blank-screen the whole SPA (58 components, real
// money) with no way back except a manual URL edit. `onErrorCaptured` catches
// it here, logs it (so it isn't silently swallowed - app.config.errorHandler in
// main.ts covers errors outside the render/lifecycle path), and swaps the slot
// for a small "Something went wrong" panel with Reload / Try again. Returning
// `false` stops the error from propagating further up (and from hitting the
// global handler a second time).
import { ref, onErrorCaptured } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const failed = ref(false);

onErrorCaptured((err) => {
  console.error("[ErrorBoundary] caught render error:", err);
  failed.value = true;
  return false;
});

function reload(): void {
  window.location.reload();
}

function tryAgain(): void {
  failed.value = false;
}
</script>

<template>
  <div v-if="failed" class="eb-panel" role="alert">
    <div class="eb-icon" aria-hidden="true">⚠</div>
    <h2 class="eb-title">{{ t("errorBoundary.title") }}</h2>
    <p class="eb-body">{{ t("errorBoundary.body") }}</p>
    <div class="eb-actions">
      <button class="btn primary" type="button" @click="reload">{{ t("errorBoundary.reload") }}</button>
      <button class="btn" type="button" @click="tryAgain">{{ t("errorBoundary.tryAgain") }}</button>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.eb-panel {
  max-width: 480px;
  margin: 80px auto;
  padding: 32px 28px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--panel);
  color: var(--text);
  text-align: center;
}
.eb-icon {
  font-size: 32px;
  color: var(--warn);
  margin-bottom: 8px;
}
.eb-title {
  margin: 0 0 8px;
  font-size: 18px;
}
.eb-body {
  margin: 0 0 20px;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}
.eb-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>
