<script setup lang="ts">
// The trading dashboard — the app's home route ("/"). This is the content that
// previously lived directly in App.vue; it moved here when vue-router was added
// so the Academy can be its own route. The store is initialised once in App.vue
// (which is always mounted), so navigating away and back never re-inits the SSE
// stream or reloads data.
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { useTraderStore } from "../stores/trader";
import GlobalHeader from "./GlobalHeader.vue";
import ManualTab from "./ManualTab.vue";
import BotTab from "./BotTab.vue";
import LogsTab from "./LogsTab.vue";
import StatsPanel from "./StatsPanel.vue";
import PositionsPanel from "./PositionsPanel.vue";
import EvolutionCharts from "./EvolutionCharts.vue";
import TokenDetail from "./TokenDetail.vue";
import LangSwitcher from "./LangSwitcher.vue";
import { session, logout } from "../auth/session";

const { t } = useI18n();
const router = useRouter();
const store = useTraderStore();

// Switching tabs also leaves any open token-detail drill-down.
function selectTab(tab: "manual" | "bot" | "logs"): void {
  store.setActiveTab(tab);
  store.closeToken();
}

// Logout: revoke the session server-side, clear cookies, then hard-reload so all
// in-memory store state + SSE/poll timers reset cleanly (the guard then routes
// the cookieless app to /login).
async function doLogout(): Promise<void> {
  await logout();
  window.location.reload();
}
</script>

<template>
  <!-- Persistent global header: controls + bot status + wallet overview. -->
  <GlobalHeader />

  <main>
    <!-- Tab bar sits directly below the header. Switching never reloads. -->
    <div class="tabbar" role="tablist" :aria-label="t('common.tablistAria')">
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'manual' && !store.selectedToken"
        :class="{ active: store.activeTab === 'manual' && !store.selectedToken }"
        @click="selectTab('manual')"
      >
        {{ t("common.tab.manual") }}
      </button>
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'bot' && !store.selectedToken"
        :class="{ active: store.activeTab === 'bot' && !store.selectedToken }"
        @click="selectTab('bot')"
      >
        {{ t("common.tab.bot") }}
      </button>
      <button
        class="tab"
        role="tab"
        :aria-selected="store.activeTab === 'logs' && !store.selectedToken"
        :class="{ active: store.activeTab === 'logs' && !store.selectedToken }"
        @click="selectTab('logs')"
      >
        {{ t("common.tab.logs") }}
      </button>

      <!-- Right-aligned: identity, language switcher, Academy entry, logout. -->
      <div class="tabbar-end">
        <span v-if="session.user" class="signed-in muted" :title="session.user.email">
          {{ t("auth.signedInAs", { email: session.user.displayName || session.user.email }) }}
        </span>
        <LangSwitcher />
        <button class="tab academy-link" @click="router.push('/academy')">
          {{ t("common.academy") }} →
        </button>
        <button class="btn logout-btn" type="button" @click="doLogout">
          {{ t("auth.logout") }}
        </button>
      </div>
    </div>

    <!-- Tab body. A drilled-in token overlays the body; the header stays put. -->
    <div class="tab-body">
      <TokenDetail v-if="store.selectedToken" />
      <ManualTab v-else-if="store.activeTab === 'manual'" />
      <BotTab v-else-if="store.activeTab === 'bot'" />
      <LogsTab v-else />
    </div>

    <!-- Cross-cutting: account / positions / analytics. The full log history
         lives in the Logs tab (Feature 7); the live log is in the app shell. -->
    <StatsPanel />
    <PositionsPanel />
    <EvolutionCharts />
  </main>

  <footer class="foot">{{ t("common.footer") }}</footer>
</template>

<style scoped>
.tabbar-end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.academy-link {
  color: var(--accent);
}
.academy-link:hover {
  color: var(--text);
}
.signed-in {
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.logout-btn {
  padding: 6px 12px;
  font-size: 12px;
}
</style>
