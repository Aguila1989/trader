<script setup lang="ts">
// Authenticated app shell: the persistent sidebar + (for trading pages) the
// global header, with the active page rendered in a nested <router-view>. The
// Academy is a child too so it gets the sidebar, but it is marked
// meta.standalone so the trading header is NOT shown over it (Change 3 — the
// Academy stays usable with no login and no trading context). The settings modal
// is owned here so the header's gear button can open it from anywhere.
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { session } from "../auth/session";
import { uiState } from "../ui/uiState";
import { maybeAutoStartTour, tourState } from "../onboarding/tour";
import { loadBillingStatus } from "../billing/premium";
import { walletState } from "../wallet/walletState";
import Sidebar from "./Sidebar.vue";
import GlobalHeader from "./GlobalHeader.vue";
import SettingsModal from "./SettingsModal.vue";
import OnboardingTour from "./OnboardingTour.vue";

const route = useRoute();
const { t } = useI18n();

// The trading header only makes sense on trading pages for a logged-in user.
const showHeader = computed(() => !!session.user && route.meta.standalone !== true);

// Fix 2: a wallet that's configured but has never been funded makes trades
// fail silently (the server rejects on-chain calls with no balance, but
// nothing in the UI explains why). Show a dismissible reminder while that's
// true. Skip public/standalone routes (Academy, pricing, token detail, etc.)
// and skip until wallet status has actually loaded, so it never flashes on
// screens where a wallet isn't relevant or before we know the real state.
const bannerDismissed = ref(false);
const showFundingBanner = computed(
  () =>
    !!session.user &&
    route.meta.public !== true &&
    route.meta.standalone !== true &&
    walletState.loaded &&
    walletState.configured &&
    !walletState.funded &&
    !bannerDismissed.value,
);

function dismissFundingBanner(): void {
  bannerDismissed.value = true;
}

const justCopied = ref(false);
async function copyAddress(): Promise<void> {
  if (!walletState.publicKey) return;
  try {
    await navigator.clipboard.writeText(walletState.publicKey);
    justCopied.value = true;
    setTimeout(() => (justCopied.value = false), 1500);
  } catch {
    /* clipboard blocked - ignore */
  }
}

// Onboarding tour (Feature 1): auto-start exactly once — logged in, wallet
// configured, onboardingCompleted still false server-side. The shell re-mounts
// after wallet setup ("Continue" navigates here), so first-time users get the
// tour right after their wallet is ready.
onMounted(() => {
  void maybeAutoStartTour();
  // Feature 2: premium/tier state drives the AI locks + the Upgrade nav entry.
  if (session.user) void loadBillingStatus();
});
</script>

<template>
  <div class="app-shell" :class="{ collapsed: uiState.sidebarCollapsed }">
    <Sidebar />
    <div class="app-main">
      <GlobalHeader v-if="showHeader" />
      <div v-if="showFundingBanner" class="funding-banner" role="alert">
        <div class="fb-text">
          <strong>{{ t("walletFunding.title") }}</strong>
          <span>{{ t("walletFunding.body") }}</span>
        </div>
        <div class="fb-actions">
          <button class="btn fb-address" type="button" :title="t('walletFunding.copyTitle')" @click="copyAddress">
            <code>{{ walletState.publicKey }}</code>
            <span class="fb-copied" :class="{ show: justCopied }">{{ t("walletFunding.copied") }}</span>
          </button>
          <button class="btn" type="button" @click="dismissFundingBanner">{{ t("walletFunding.dismiss") }}</button>
        </div>
      </div>
      <router-view />
    </div>
    <SettingsModal v-if="uiState.settingsOpen" />
    <OnboardingTour v-if="tourState.active" />
  </div>
</template>

<style scoped>
.app-shell {
  --sidebar-w: 220px;
  --sidebar-w-collapsed: 64px;
}
.app-main {
  margin-left: var(--sidebar-w);
  min-height: 100vh;
  transition: margin-left 0.15s ease;
}
.app-shell.collapsed .app-main {
  margin-left: var(--sidebar-w-collapsed);
}

/* Mobile: the sidebar is an overlay drawer, so content takes the full width and
   leaves room for the fixed hamburger. */
@media (max-width: 767px) {
  .app-main {
    margin-left: 0;
  }
}

.funding-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 20px 0;
  padding: 10px 16px;
  border: 1px solid #5e4a1f;
  background: rgba(245, 166, 35, 0.12);
  color: var(--warn);
  border-radius: 8px;
  font-size: 13px;
}
.fb-text {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  color: var(--warn);
}
.fb-text span {
  color: var(--text);
}
.fb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fb-address {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.fb-address code {
  font-family: monospace;
  font-size: 12px;
}
.fb-copied {
  position: absolute;
  top: -22px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--pos);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.fb-copied.show {
  opacity: 1;
}
</style>
