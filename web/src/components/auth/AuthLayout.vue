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
      <div class="auth-body">
        <!-- Fix 2: benefit-led hero so the value prop lands before the form
             asks for credentials (desktop: beside the card; mobile: stacked
             above, short enough to stay non-scrolling). -->
        <section class="auth-hero" :aria-label="t('auth.hero.title')">
          <p class="auth-hero-title">{{ t("auth.hero.title") }}</p>
          <ul class="auth-hero-list">
            <li>
              <svg class="auth-hero-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ t("auth.hero.custody") }}</span>
            </li>
            <li>
              <svg class="auth-hero-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ t("auth.hero.aiAssist") }}</span>
            </li>
            <li>
              <svg class="auth-hero-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span>{{ t("auth.hero.manualFree") }}</span>
            </li>
          </ul>
        </section>

        <div class="panel auth-card">
          <slot />
        </div>
      </div>
      <p class="auth-tagline muted">{{ t("auth.brand") }} · {{ t("auth.tagline") }}</p>
    </main>
  </div>
</template>

<style scoped>
/* auth-wrap/auth-top/auth-main/auth-card/auth-tagline are global (style.css);
   this wrapper + the hero itself are new for Fix 2, so they're scoped here
   instead of touching the shared stylesheet. */
.auth-body {
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
@media (min-width: 720px) {
  .auth-body {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 48px;
  }
  .auth-hero {
    flex: 1;
    max-width: 320px;
  }
}
.auth-hero {
  width: 100%;
  max-width: 420px;
}
.auth-hero-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}
.auth-hero-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.auth-hero-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.4;
}
.auth-hero-icon {
  flex-shrink: 0;
  color: var(--pos);
  margin-top: 1px;
}
</style>
