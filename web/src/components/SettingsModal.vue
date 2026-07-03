<script setup lang="ts">
// Settings panel opened by the header gear icon. Hosts the existing bot settings
// (SettingsPanel: AI Trading / Risk & Safety / Automation / Swap & Transfer) and
// the Risk Settings panel (LOW/MED/HIGH + Expert Mode), plus the new Account
// section (email, created date, change password). Overlay modal on desktop;
// full-screen on mobile. Body scroll is locked while open.
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { acquireScrollLock, closeSettings, releaseScrollLock } from "../ui/uiState";
import SettingsPanel from "./SettingsPanel.vue";
import RiskSettingsPanel from "./RiskSettingsPanel.vue";
import AccountSection from "./AccountSection.vue";

const { t } = useI18n();
const router = useRouter();
const tab = ref<"bot" | "risk" | "account">("bot");

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") closeSettings();
}

// AUDIT-024: the modal is plain reactive state (not a route), so the mobile
// back button used to navigate the page UNDER the modal (or exit the app)
// instead of closing it. A global navigation guard (registered only while the
// modal is open) closes the modal and CANCELS the navigation — vue-router
// restores the history position itself on a cancelled popstate, so the back
// button becomes "close the modal, stay on the page". Deliberately NOT a raw
// history.pushState sentinel: that would clobber vue-router's own history
// state (position/current) and corrupt its navigation bookkeeping.
let removeGuard: (() => void) | null = null;

onMounted(() => {
  document.addEventListener("keydown", onKey);
  acquireScrollLock();
  removeGuard = router.beforeEach(() => {
    closeSettings();
    return false; // swallow this navigation; the modal closing IS the action
  });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  releaseScrollLock();
  if (removeGuard) {
    removeGuard();
    removeGuard = null;
  }
});
</script>

<template>
  <div class="sm-back" @click.self="closeSettings">
    <div class="sm-modal" role="dialog" aria-modal="true" :aria-label="t('settingsModal.title')">
      <header class="sm-head">
        <h2 class="sm-title">{{ t("settingsModal.title") }}</h2>
        <button class="sm-close" type="button" :aria-label="t('settingsModal.close')" @click="closeSettings">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </header>

      <div class="sm-tabs" role="tablist">
        <button class="seg" role="tab" :aria-selected="tab === 'bot'" :class="{ active: tab === 'bot' }" @click="tab = 'bot'">
          {{ t("settingsModal.tabs.bot") }}
        </button>
        <button class="seg" role="tab" :aria-selected="tab === 'risk'" :class="{ active: tab === 'risk' }" @click="tab = 'risk'">
          {{ t("settingsModal.tabs.risk") }}
        </button>
        <button class="seg" role="tab" :aria-selected="tab === 'account'" :class="{ active: tab === 'account' }" @click="tab = 'account'">
          {{ t("settingsModal.tabs.account") }}
        </button>
      </div>

      <div class="sm-body">
        <SettingsPanel v-if="tab === 'bot'" />
        <RiskSettingsPanel v-else-if="tab === 'risk'" />
        <AccountSection v-else />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sm-back {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px;
  overflow-y: auto;
}
.sm-modal {
  width: 100%;
  max-width: 760px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 64px);
}
.sm-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--line);
}
.sm-title {
  margin: 0;
  font-size: 18px;
}
.sm-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  border-radius: 8px;
}
.sm-close:hover {
  color: var(--text);
  background: var(--panel-2);
}
.sm-tabs {
  display: flex;
  gap: 6px;
  padding: 12px 18px 0;
  flex-wrap: wrap;
}
.sm-tabs .seg {
  min-height: 40px;
}
/* AUDIT-019: restate the 44px mobile floor (a scoped rule outranks the
   global one, leaving these tabs stuck at 40px on phones). */
@media (max-width: 767px) {
  .sm-tabs .seg {
    min-height: 44px;
  }
}
.sm-body {
  padding: 16px 18px 22px;
  overflow-y: auto;
}

/* Full-screen on mobile, respecting safe-area insets. */
@media (max-width: 767px) {
  .sm-back {
    padding: 0;
  }
  .sm-modal {
    max-width: none;
    min-height: 100vh;
    max-height: none;
    border: 0;
    border-radius: 0;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
  }
}
</style>
