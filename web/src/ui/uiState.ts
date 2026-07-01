// Tiny reactive UI-state singleton (same module-singleton pattern as
// auth/session.ts and wallet/walletState.ts). Holds purely-presentational state
// shared across the shell: whether the Settings panel is open, and whether the
// desktop sidebar is collapsed. Keeping the collapse flag here (not inside the
// Sidebar) lets the layout offset its content by the right amount and persists
// the choice across navigation.
import { reactive } from "vue";

const COLLAPSE_KEY = "sidebar_collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export const uiState = reactive<{ settingsOpen: boolean; sidebarCollapsed: boolean }>({
  settingsOpen: false,
  sidebarCollapsed: readCollapsed(),
});

export function openSettings(): void {
  uiState.settingsOpen = true;
}

export function closeSettings(): void {
  uiState.settingsOpen = false;
}

export function toggleSidebar(): void {
  uiState.sidebarCollapsed = !uiState.sidebarCollapsed;
  try {
    localStorage.setItem(COLLAPSE_KEY, uiState.sidebarCollapsed ? "1" : "0");
  } catch {
    /* private mode — fine for the session */
  }
}
