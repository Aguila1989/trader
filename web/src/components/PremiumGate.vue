<script setup lang="ts">
// Feature 2: the premium lock. Wraps an AI-trading panel: content stays
// VISIBLE (dimmed + non-interactive) with a lock explanation and a pricing
// CTA on top - the spec's "show it as locked with an explanation, never as
// absent". The server independently re-checks premium on every AI call, so
// this is purely presentational.
import { useI18n } from "vue-i18n";
import { billingState } from "../billing/premium";

const { t } = useI18n();
</script>

<template>
  <div v-if="billingState.loaded && !billingState.isPremium" class="pgate">
    <div class="pgate-content" aria-hidden="true" inert>
      <slot />
    </div>
    <div class="pgate-overlay" role="note">
      <div class="pgate-card">
        <span class="pgate-lock" aria-hidden="true">🔒</span>
        <h3 class="pgate-title">{{ t("billing.gate.title") }}</h3>
        <p class="pgate-body">{{ t("billing.gate.body") }}</p>
        <RouterLink class="btn primary pgate-cta" to="/pricing">{{ t("billing.gate.cta") }}</RouterLink>
      </div>
    </div>
  </div>
  <slot v-else />
</template>

<style scoped>
.pgate {
  position: relative;
}
.pgate-content {
  filter: blur(2px) grayscale(0.4);
  opacity: 0.55;
  pointer-events: none;
  user-select: none;
}
.pgate-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.pgate-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 20px;
  max-width: 420px;
  text-align: center;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.45);
}
.pgate-lock {
  font-size: 22px;
}
.pgate-title {
  margin: 8px 0 6px;
  font-size: 16px;
  color: var(--text);
}
.pgate-body {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--muted);
}
.pgate-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 18px;
  text-decoration: none;
}
</style>
