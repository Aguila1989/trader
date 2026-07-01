<script setup lang="ts">
// Authenticated app shell: the persistent sidebar + (for trading pages) the
// global header, with the active page rendered in a nested <router-view>. The
// Academy is a child too so it gets the sidebar, but it is marked
// meta.standalone so the trading header is NOT shown over it (Change 3 — the
// Academy stays usable with no login and no trading context). The settings modal
// is owned here so the header's gear button can open it from anywhere.
import { computed } from "vue";
import { useRoute } from "vue-router";
import { session } from "../auth/session";
import { uiState } from "../ui/uiState";
import Sidebar from "./Sidebar.vue";
import GlobalHeader from "./GlobalHeader.vue";
import SettingsModal from "./SettingsModal.vue";

const route = useRoute();

// The trading header only makes sense on trading pages for a logged-in user.
const showHeader = computed(() => !!session.user && route.meta.standalone !== true);
</script>

<template>
  <div class="app-shell" :class="{ collapsed: uiState.sidebarCollapsed }">
    <Sidebar />
    <div class="app-main">
      <GlobalHeader v-if="showHeader" />
      <router-view />
    </div>
    <SettingsModal v-if="uiState.settingsOpen" />
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
</style>
