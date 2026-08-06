<script setup lang="ts">
// Minimal global footer (2026-07 Feature 2): Academy · Privacy · Transparantie
// · Contact. The /transparency link deliberately sits BETWEEN Privacy and
// Contact (spec). Privacy has no page yet (legal docs pending the custody
// decision) so it renders as a non-clickable hint instead of a dead link;
// Contact is the shared support mailbox (web/src/support.ts).
import { useI18n } from "vue-i18n";
import { SUPPORT_EMAIL } from "../support";
import { SINGLE_USER } from "../singleUser";

const { t } = useI18n();
</script>

<template>
  <footer class="app-footer">
    <nav class="af-nav" aria-label="footer">
      <router-link class="af-link" to="/academy">{{ t("footer.academy") }}</router-link>
      <!-- SINGLE_USER personal build: no legal/fee-transparency/support surface
           (no public audience) - only the Academy link remains. -->
      <template v-if="!SINGLE_USER">
        <span class="af-sep" aria-hidden="true">·</span>
        <span class="af-link af-disabled" :title="t('footer.comingSoon')">{{ t("footer.privacy") }}</span>
        <span class="af-sep" aria-hidden="true">·</span>
        <router-link class="af-link" to="/transparency">{{ t("footer.transparency") }}</router-link>
        <span class="af-sep" aria-hidden="true">·</span>
        <a class="af-link" :href="`mailto:${SUPPORT_EMAIL}`">{{ t("footer.contact") }}</a>
      </template>
    </nav>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: auto;
  padding: 18px 20px;
  padding-bottom: calc(18px + env(safe-area-inset-bottom));
  border-top: 0.5px solid var(--border);
}
.af-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}
.af-link {
  color: var(--muted);
  text-decoration: none;
  /* Comfortable tap target without visually bloating the footer. */
  padding: 12px 6px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
}
.af-link:hover,
.af-link:focus-visible {
  color: var(--text);
}
.af-disabled {
  opacity: 0.55;
  cursor: default;
}
.af-sep {
  color: var(--muted);
  opacity: 0.6;
}
</style>
