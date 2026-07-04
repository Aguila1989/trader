// Onboarding tour state (Feature 1). Same module-singleton pattern as
// ui/uiState.ts: a tiny reactive object plus imperative helpers. The step
// MACHINE (spotlight targets, required-action detection) lives in
// components/OnboardingTour.vue where the Pinia store and router are available;
// this module only owns "is the tour running and on which step" plus the
// auto-start decision, so non-component code (AppLayout mount, AccountSection's
// Restart button) can drive it without importing the heavy component.
import { reactive } from "vue";
import { authApi } from "../api";
import { session } from "../auth/session";
import { loadWalletStatus, walletState } from "../wallet/walletState";

export const TOUR_STEP_COUNT = 8;

export const tourState = reactive<{ active: boolean; step: number }>({
  active: false,
  step: 0,
});

export function startTour(): void {
  tourState.step = 0;
  tourState.active = true;
}

/** Stop rendering the tour. Persisting the completed/skipped flag is the
 *  caller's job (OnboardingTour.vue) so a network failure can be surfaced. */
export function endTour(): void {
  tourState.active = false;
}

// One auto-start attempt per shell mount; reset when the preconditions are not
// met yet (e.g. the user is still on /wallet-setup) so the check re-runs after
// the wallet-setup "Continue" navigation re-mounts the shell.
let autoStartPending = false;

/**
 * Auto-start the tour exactly once: logged in + wallet configured +
 * onboardingCompleted still false on the server. Called from AppLayout's
 * onMounted. Never throws; on any doubt it simply does not start.
 */
export async function maybeAutoStartTour(): Promise<void> {
  if (autoStartPending || tourState.active || !session.user) return;
  autoStartPending = true;
  try {
    await loadWalletStatus();
    if (!walletState.loaded || !walletState.configured) {
      // Not set up yet - allow a later re-check (shell re-mounts after setup).
      autoStartPending = false;
      return;
    }
    const r = await authApi.me();
    if (r.user && r.user.onboardingCompleted === false) startTour();
  } catch {
    autoStartPending = false; // transient failure - allow a retry on re-mount
  }
}
