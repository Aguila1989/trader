<script setup lang="ts">
// Primary navigation. Replaces the old top-level Manual/Bot/Logs tab bar AND the
// standalone Academy entry point. Auth-aware (presentational only — the router
// guard + server middleware remain the real boundary):
//   logged out -> [Academy]
//   logged in  -> [Trading, Receive & Send, Pending Payments, Logs] | Academy
//                 + Log out pinned to the bottom.
//
// Desktop/tablet: a fixed vertical rail, collapsible to icons-only (persisted).
// Mobile (<768px): a hamburger button opens a slide-in drawer (tap a link, tap
// the backdrop, or tap × to close). The Academy entry is set apart with a
// divider, a secondary accent colour, and a "New" badge until the user has
// opened at least one lesson.
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { session, logout } from "../auth/session";
import { useAcademyStore } from "../academy/progress";
import { uiState, toggleSidebar, openSettings } from "../ui/uiState";

const { t } = useI18n();
const route = useRoute();
const academy = useAcademyStore();

const loggedIn = computed(() => !!session.user);
// Show the "New" badge until the visitor has opened any lesson (same localStorage
// progress the Academy itself uses; works logged-out too).
const showNew = computed(() => !academy.hasStartedAnyLesson);

// Trading-section links (logged-in only). icon = key into the inline SVG set.
const tradingLinks = [
  { name: "trading", to: "/", labelKey: "sidebar.trading", icon: "trading" },
  { name: "receive", to: "/receive", labelKey: "sidebar.receiveSend", icon: "receive" },
  { name: "pending", to: "/pending", labelKey: "sidebar.pending", icon: "pending" },
  { name: "logs", to: "/logs", labelKey: "sidebar.logs", icon: "logs" },
] as const;

function isActive(name: string): boolean {
  return route.name === name;
}

// --- collapse (desktop, persisted) — lives in uiState so the layout offsets
// its content by the matching width. ---
const collapsed = computed(() => uiState.sidebarCollapsed);

// --- mobile drawer ---
const mobileOpen = ref(false);
// Any navigation closes the drawer (tap-a-link behaviour).
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  },
);

async function doLogout(): Promise<void> {
  // Reload even if the logout request is slow or the backend is unreachable, so
  // the button never appears dead. The server clears cookies on success; either
  // way the hard reload resets in-memory store state + SSE/poll timers and the
  // guard routes the (cookieless) app to /login.
  await Promise.race([logout().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
  window.location.reload();
}
</script>

<template>
  <!-- Mobile-only hamburger (hidden >=768px via CSS). Fixed so it's reachable on
       every page, including the (header-less) Academy. -->
  <button
    class="hamburger"
    type="button"
    :aria-label="t('sidebar.openMenu')"
    :aria-expanded="mobileOpen"
    @click="mobileOpen = true"
  >
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>

  <!-- Backdrop (mobile drawer only) -->
  <div v-if="mobileOpen" class="sb-backdrop" @click="mobileOpen = false"></div>

  <aside
    class="sidebar"
    :class="{ collapsed, 'mobile-open': mobileOpen }"
    :aria-label="t('sidebar.nav')"
  >
    <div class="sb-top">
      <span class="sb-brand">{{ t("common.appName") }}</span>
      <!-- Desktop collapse toggle -->
      <button
        class="sb-collapse"
        type="button"
        :aria-label="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        :title="collapsed ? t('sidebar.expand') : t('sidebar.collapse')"
        @click="toggleSidebar"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path :d="collapsed ? 'M9 6l6 6-6 6' : 'M15 6l-6 6 6 6'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <!-- Mobile close (×) -->
      <button class="sb-close" type="button" :aria-label="t('sidebar.closeMenu')" @click="mobileOpen = false">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <nav class="sb-nav">
      <template v-if="loggedIn">
        <RouterLink
          v-for="l in tradingLinks"
          :key="l.name"
          :to="l.to"
          class="sb-link"
          :class="{ active: isActive(l.name) }"
          :title="t(l.labelKey)"
        >
          <span class="sb-icon" aria-hidden="true">
            <!-- trading: trend line -->
            <svg v-if="l.icon === 'trading'" viewBox="0 0 24 24"><path d="M3 17l5-5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path d="M16 7h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <!-- receive & send: up/down arrows -->
            <svg v-else-if="l.icon === 'receive'" viewBox="0 0 24 24"><path d="M7 4v13M7 17l-3-3M7 17l3-3M17 20V7M17 7l-3 3M17 7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <!-- pending: clock -->
            <svg v-else-if="l.icon === 'pending'" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
            <!-- logs: list -->
            <svg v-else viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <span class="sb-label">{{ t(l.labelKey) }}</span>
        </RouterLink>

        <!-- 1. divider sets the learning area apart from the doing area -->
        <hr class="sb-divider" />
      </template>

      <!-- Academy: shown in BOTH states; 2. secondary accent + 3. "New" badge -->
      <RouterLink
        to="/academy"
        class="sb-link sb-academy"
        :class="{ active: isActive('academy') || isActive('academy-lesson') }"
        :title="t('sidebar.academy')"
      >
        <span class="sb-icon academy-accent" aria-hidden="true">
          <!-- academy: graduation cap -->
          <svg viewBox="0 0 24 24"><path d="M12 4L2 9l10 5 10-5-10-5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><path d="M6 11v4c0 1.3 2.7 2.5 6 2.5s6-1.2 6-2.5v-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <!-- collapsed-state unread dot lives on the icon -->
          <span v-if="showNew" class="sb-newdot" :aria-label="t('sidebar.newBadgeAria')"></span>
        </span>
        <span class="sb-label">{{ t("sidebar.academy") }}</span>
        <span v-if="showNew" class="sb-newbadge">{{ t("sidebar.newBadge") }}</span>
      </RouterLink>
    </nav>

    <!-- Account / session actions pinned to the bottom (Gmail/Slack convention) -->
    <div v-if="loggedIn" class="sb-foot">
      <button class="sb-link" type="button" :title="t('settingsModal.gear')" @click="openSettings">
        <span class="sb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span class="sb-label">{{ t("settingsModal.gear") }}</span>
      </button>
      <button class="sb-link sb-logout" type="button" :title="t('sidebar.logout')" @click="doLogout">
        <span class="sb-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M14 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /><path d="M10 12h10M20 12l-3-3M20 12l-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span class="sb-label">{{ t("sidebar.logout") }}</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Width is driven by a CSS var so the layout can offset its content. */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--sidebar-w, 220px);
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border-right: 1px solid var(--line);
  z-index: 40;
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  padding-top: calc(10px + env(safe-area-inset-top));
  box-sizing: border-box;
  transition: width 0.15s ease;
}
.sidebar.collapsed {
  width: var(--sidebar-w-collapsed, 64px);
}

.sb-top {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px 12px;
  min-height: 44px;
}
.sb-brand {
  font-weight: 700;
  font-size: 16px;
  color: var(--text);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
}
.sidebar.collapsed .sb-brand {
  opacity: 0;
  width: 0;
}
.sb-collapse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel-2);
  color: var(--muted);
  cursor: pointer;
}
.sb-collapse:hover {
  color: var(--text);
  border-color: var(--accent);
}
.sb-close {
  display: none; /* mobile only */
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
}

.sb-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  flex: 1;
}

/* Every nav row is a comfortable 44px touch target. */
.sb-link {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 10px;
  color: var(--muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border: 0;
  background: none;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
}
.sb-link:hover {
  background: var(--panel-2);
  color: var(--text);
}
.sb-link.active {
  background: rgba(91, 140, 255, 0.14);
  color: var(--text);
}
.sb-link.active .sb-icon {
  color: var(--accent);
}
.sb-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  position: relative;
}
.sb-icon :deep(svg) {
  width: 22px;
  height: 22px;
}
.sb-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sidebar.collapsed .sb-label {
  display: none;
}

.sb-divider {
  border: 0;
  border-top: 1px solid var(--line);
  margin: 10px 6px;
}

/* Academy: secondary accent (purple) not used by the other links. */
.academy-accent {
  color: var(--accent-2);
}
.sb-academy:hover .academy-accent,
.sb-academy.active .academy-accent {
  color: var(--accent-2);
}
.sb-newbadge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent-2);
  background: rgba(181, 140, 255, 0.16);
  border-radius: 999px;
  padding: 2px 7px;
}
.sidebar.collapsed .sb-newbadge {
  display: none;
}
/* Unread dot on the icon — the collapsed-mode equivalent of the badge. */
.sb-newdot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--accent-2);
  border: 1.5px solid var(--panel);
}

.sb-foot {
  border-top: 1px solid var(--line);
  padding-top: 8px;
  margin-top: 6px;
}
.sb-logout:hover {
  color: var(--neg);
}

.hamburger,
.sb-backdrop {
  display: none; /* desktop: no hamburger / backdrop */
}

/* ---- Mobile: rail becomes a slide-in drawer ---- */
@media (max-width: 767px) {
  .hamburger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: calc(8px + env(safe-area-inset-top));
    left: 8px;
    width: 44px;
    height: 44px;
    z-index: 45;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--panel);
    color: var(--text);
    cursor: pointer;
  }
  .sb-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 49;
  }
  .sidebar {
    width: min(82vw, 300px) !important;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 50;
  }
  .sidebar.mobile-open {
    transform: translateX(0);
  }
  /* On mobile the rail never collapses to icons — it's a full drawer. */
  .sidebar.collapsed .sb-brand,
  .sidebar.collapsed .sb-label {
    display: initial;
    opacity: 1;
    width: auto;
  }
  .sidebar.collapsed .sb-newbadge {
    display: inline;
  }
  .sb-collapse {
    display: none;
  }
  .sb-close {
    display: inline-flex;
  }
}
</style>
