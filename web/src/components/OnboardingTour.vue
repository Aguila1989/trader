<script setup lang="ts">
// Interactive onboarding tour (Feature 1). Full-screen spotlight overlay: four
// dim panels leave a "hole" over the highlighted element (which therefore stays
// visible AND tappable — nothing covers it), a ring marks it, and a card
// explains the step. Action steps advance when the user performs the real
// interaction (detected from the app's actual state: uiState, the Pinia store,
// the route) — never from fake buttons. Observe-only steps cover the hole with
// a transparent blocker so e.g. a brand-new user cannot tap "Live trading"
// mid-tour, and advance via a Next button.
//
// The tour is mounted by AppLayout (which persists across child routes), so it
// survives the navigation some steps require. tourState (onboarding/tour.ts)
// owns "active + step index"; this component owns everything DOM/step-machine.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type WatchStopHandle } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { authApi } from "../api";
import { uiState } from "../ui/uiState";
import { useTraderStore } from "../stores/trader";
import { TOUR_STEP_COUNT, endTour, tourState } from "../onboarding/tour";
import { scrollToSection } from "../lib/scroll";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useTraderStore();

// --- responsive mode (the sidebar collapse control only exists on desktop; on
// mobile the equivalent lesson is the ☰ drawer) ---
const isMobile = ref(window.matchMedia("(max-width: 767px)").matches);

type StepId = "welcome" | "sidebar" | "portfolio" | "modes" | "manual" | "bot" | "academy" | "done";

interface StepDef {
  id: StepId;
  /** Selector of the element to spotlight; null = centered card, no spotlight. */
  target: () => string | null;
  /** Put the app in the right place for this step (route / tab / drawer). */
  place?: () => void;
  /** Card button for non-action steps. Action steps advance from the user's
   *  real interaction instead. */
  button?: "start" | "next" | "startTrading";
  /** Cover the spotlight hole (observe-only steps). */
  blockTarget?: boolean;
  /** Use the *Mobile i18n variants when on a phone. */
  mobileVariant?: boolean;
}

function goTrading(): void {
  uiState.mobileNavOpen = false;
  if (route.name !== "trading") void router.push("/").catch(() => {});
}

const steps: StepDef[] = [
  { id: "welcome", target: () => null, place: goTrading, button: "start" },
  {
    id: "sidebar",
    target: () => (isMobile.value ? '[data-tour="hamburger"]' : '[data-tour="sidebar-collapse"]'),
    mobileVariant: true,
  },
  { id: "portfolio", target: () => '[data-tour="portfolio"]', place: goTrading },
  {
    id: "modes",
    target: () => '[data-tour="trading-mode"]',
    place: () => {
      goTrading();
      store.closeToken();
      store.setActiveTab("bot");
    },
    button: "next",
    blockTarget: true,
  },
  {
    id: "manual",
    target: () => '[data-tour="tab-manual"]',
    place: () => {
      goTrading();
      store.closeToken();
      // The user must genuinely tap Manual, so make sure it isn't already active.
      if (store.activeTab !== "bot") store.setActiveTab("bot");
    },
  },
  {
    id: "bot",
    target: () => '[data-tour="tab-bot"]',
    place: () => {
      goTrading();
      store.closeToken();
      if (store.activeTab !== "manual") store.setActiveTab("manual");
    },
  },
  {
    id: "academy",
    // Mobile with the drawer closed: first spotlight the ☰ button; once the
    // drawer opens the target switches to the Academy link inside it.
    target: () => (isMobile.value && !uiState.mobileNavOpen ? '[data-tour="hamburger"]' : '[data-tour="nav-academy"]'),
    mobileVariant: true,
  },
  { id: "done", target: () => null, button: "startTrading" },
];

const step = computed<StepDef>(() => steps[Math.min(tourState.step, steps.length - 1)]!);

// --- Accessibility: focus management ----------------------------------------
// The tour is a full-screen non-native dialog; treat it like a modal: focus
// moves into the card on open and on every step change, Tab/Shift+Tab stay
// inside the card, Escape skips the tour through the exact same path as the
// Skip button, and focus returns to wherever it was before the tour started
// once it ends.
const cardRef = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;

const FOCUS_TRAP_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusableIn(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUS_TRAP_SELECTOR)).filter(
    (el) => el.offsetParent !== null,
  );
}

function trapTabKey(e: KeyboardEvent, container: HTMLElement | null): void {
  if (e.key !== "Tab" || !container) return;
  const focusables = focusableIn(container);
  if (focusables.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = focusables[0]!;
  const last = focusables[focusables.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function focusCard(): void {
  void nextTick(() => {
    const container = cardRef.value;
    if (!container) return;
    const focusables = focusableIn(container);
    (focusables[0] ?? container).focus();
  });
}

function onKey(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    void finish();
    return;
  }
  trapTabKey(e, cardRef.value);
}

// --- spotlight measurement -------------------------------------------------
const rect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
// Consecutive measure() calls that found no element. After ~1.5s of misses on
// an action step, the card falls back to a Next button so the tour can never
// dead-end on a missing/renamed anchor.
const missCount = ref(0);
let scrolledForStep = -1;
let measureTimer: number | null = null;

function measure(): void {
  const sel = step.value.target();
  if (!sel) {
    rect.value = null;
    missCount.value = 0;
    return;
  }
  const el = document.querySelector<HTMLElement>(sel);
  if (!el) {
    rect.value = null;
    missCount.value++;
    return;
  }
  missCount.value = 0;
  if (scrolledForStep !== tourState.step) {
    scrolledForStep = tourState.step;
    // Instant (smooth:false): the rect is measured right below this line.
    scrollToSection(el, { align: "nearest", smooth: false });
  }
  const r = el.getBoundingClientRect();
  const PAD = 6;
  rect.value = {
    top: Math.max(0, r.top - PAD),
    left: Math.max(0, r.left - PAD),
    width: Math.max(0, r.width + PAD * 2),
    height: Math.max(0, r.height + PAD * 2),
  };
}

function onResize(): void {
  isMobile.value = window.matchMedia("(max-width: 767px)").matches;
  measure();
}

// --- step machine ------------------------------------------------------------
let stopWatch: WatchStopHandle | null = null;
let clickTrapEl: HTMLElement | null = null;

function onTargetClickCapture(e: Event): void {
  // Register the tap as the completed action but keep the tour stable: don't
  // let the tap ALSO drill into a token detail page mid-tutorial.
  e.preventDefault();
  e.stopPropagation();
  advance();
}

function attachClickTrap(): void {
  if (!tourState.active || step.value.id !== "portfolio") return;
  const sel = step.value.target();
  const el = sel ? document.querySelector<HTMLElement>(sel) : null;
  if (!el) {
    window.setTimeout(attachClickTrap, 250); // anchor not rendered yet — retry
    return;
  }
  clickTrapEl = el;
  el.addEventListener("click", onTargetClickCapture, true);
}

function detachClickTrap(): void {
  clickTrapEl?.removeEventListener("click", onTargetClickCapture, true);
  clickTrapEl = null;
}

function cleanupStep(): void {
  if (stopWatch) {
    stopWatch();
    stopWatch = null;
  }
  detachClickTrap();
}

function setupStep(): void {
  cleanupStep();
  const s = step.value;
  s.place?.();
  scrolledForStep = -1;
  missCount.value = 0;
  measure();

  if (s.id === "sidebar") {
    // Watch BOTH signals (not just the current mode's): the viewport can cross
    // the mobile breakpoint mid-step, and the step's target/copy already switch
    // reactively — the advance detection must too.
    stopWatch = watch(
      [() => uiState.sidebarCollapsed, () => uiState.mobileNavOpen],
      ([collapsed, drawerOpen], [collapsedWas, drawerWas]) => {
        const collapseToggled = collapsed !== collapsedWas;
        const drawerOpened = drawerOpen && !drawerWas;
        if (collapseToggled || drawerOpened) advance();
      },
    );
  } else if (s.id === "portfolio") {
    attachClickTrap();
  } else if (s.id === "manual") {
    stopWatch = watch(
      () => store.activeTab,
      (tab) => {
        if (tab === "manual") advance();
      },
    );
  } else if (s.id === "bot") {
    stopWatch = watch(
      () => store.activeTab,
      (tab) => {
        if (tab === "bot") advance();
      },
    );
  } else if (s.id === "academy") {
    stopWatch = watch(
      () => route.name,
      (n) => {
        if (n === "academy" || n === "academy-lesson") advance();
      },
    );
  }

  focusCard();
}

function advance(): void {
  if (tourState.step >= steps.length - 1) {
    void finish();
    return;
  }
  tourState.step++;
}

const finishing = ref(false);
/** Complete OR skip: both mark the tutorial done (the spec's "show once"), the
 *  Settings > Account "Restart Tutorial" button is the way back in. */
async function finish(): Promise<void> {
  if (finishing.value) return;
  finishing.value = true;
  cleanupStep();
  // Fire-and-forget: the tour must close instantly; if this write fails the
  // only consequence is the tour offering itself once more on the next load.
  void authApi.setOnboarding(true);
  endTour();
  goTrading();
}

watch(
  () => tourState.step,
  () => setupStep(),
);

onMounted(() => {
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.addEventListener("keydown", onKey);
  setupStep();
  measureTimer = window.setInterval(measure, 250);
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  cleanupStep();
  document.removeEventListener("keydown", onKey);
  if (measureTimer !== null) window.clearInterval(measureTimer);
  window.removeEventListener("resize", onResize);
  if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus();
});

// --- card content -------------------------------------------------------------
const i18nParams = computed(() => ({
  app: t("common.appName"),
  step: tourState.step + 1,
  total: TOUR_STEP_COUNT,
}));

const stepTitle = computed(() => t(`onboarding.steps.${step.value.id}.title`, i18nParams.value));
const stepBody = computed(() => {
  const s = step.value;
  const key =
    s.mobileVariant && isMobile.value
      ? `onboarding.steps.${s.id}.bodyMobile`
      : `onboarding.steps.${s.id}.body`;
  return t(key, i18nParams.value);
});

/** True when an action step's anchor has been missing for ~1.5s. */
const anchorLost = computed(() => missCount.value > 6);

const actionText = computed(() => {
  const s = step.value;
  if (s.button || anchorLost.value) return "";
  const key =
    s.mobileVariant && isMobile.value
      ? `onboarding.steps.${s.id}.actionMobile`
      : `onboarding.steps.${s.id}.action`;
  return t(key, i18nParams.value);
});

const primaryLabel = computed(() => {
  const s = step.value;
  if (s.button === "start") return t("onboarding.start");
  if (s.button === "startTrading") return t("onboarding.startTrading");
  if (s.button === "next" || anchorLost.value) return t("onboarding.next");
  return "";
});

function primaryClick(): void {
  advance();
}

// --- card geometry (desktop; mobile + centered handled purely in CSS) ---------
const CARD_W = 340;
const CARD_EST_H = 240;
const cardStyle = computed<Record<string, string>>(() => {
  if (isMobile.value || !rect.value) return {} as Record<string, string>;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = rect.value;
  const below = r.top + r.height + 12;
  const top = vh - below > CARD_EST_H ? below : Math.max(12, r.top - 12 - CARD_EST_H);
  const left = Math.min(Math.max(12, r.left), Math.max(12, vw - CARD_W - 12));
  return { top: `${top}px`, left: `${left}px`, width: `${CARD_W}px` };
});

const px = (n: number): string => `${n}px`;
</script>

<template>
  <div class="tour" role="dialog" aria-modal="true" :aria-label="stepTitle">
    <!-- Dim layer: four panels around the spotlight hole (target stays live),
         or one full panel when the step has no target. -->
    <template v-if="rect">
      <div class="tour-dim" :style="{ top: '0', left: '0', right: '0', height: px(rect.top) }"></div>
      <div class="tour-dim" :style="{ top: px(rect.top), left: '0', width: px(rect.left), height: px(rect.height) }"></div>
      <div class="tour-dim" :style="{ top: px(rect.top), left: px(rect.left + rect.width), right: '0', height: px(rect.height) }"></div>
      <div class="tour-dim" :style="{ top: px(rect.top + rect.height), left: '0', right: '0', bottom: '0' }"></div>
      <div class="tour-ring" :style="{ top: px(rect.top), left: px(rect.left), width: px(rect.width), height: px(rect.height) }"></div>
      <div
        v-if="step.blockTarget"
        class="tour-block"
        :style="{ top: px(rect.top), left: px(rect.left), width: px(rect.width), height: px(rect.height) }"
      ></div>
    </template>
    <div v-else class="tour-dim tour-dim-full"></div>

    <section class="tour-card" ref="cardRef" tabindex="-1" :class="{ centered: !rect }" :style="cardStyle" aria-live="polite">
      <header class="tour-head">
        <span class="tour-progress">{{ t("onboarding.progress", { step: tourState.step + 1, total: TOUR_STEP_COUNT }) }}</span>
        <button class="tour-skip" type="button" @click="finish">{{ t("onboarding.skip") }}</button>
      </header>
      <h2 class="tour-title">{{ stepTitle }}</h2>
      <p class="tour-body">{{ stepBody }}</p>
      <p v-if="actionText" class="tour-action">▸ {{ actionText }}</p>
      <div v-if="primaryLabel" class="tour-btns">
        <button class="btn primary tour-primary" type="button" @click="primaryClick">{{ primaryLabel }}</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* The root is a pass-through layer: only the dim panels / blocker / card catch
   pointer events, so the spotlight hole stays fully interactive. */
.tour {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
}
.tour-dim {
  position: fixed;
  background: rgba(4, 8, 18, 0.62);
  pointer-events: auto;
}
.tour-dim-full {
  inset: 0;
}
.tour-ring {
  position: fixed;
  border: 2px solid var(--accent);
  border-radius: 12px;
  box-shadow: 0 0 0 4px rgba(91, 140, 255, 0.28);
  pointer-events: none;
  transition: top 0.15s ease, left 0.15s ease, width 0.15s ease, height 0.15s ease;
}
/* Transparent cover for observe-only steps (e.g. don't let a first-time user
   actually tap "Live trading" while it is being explained). */
.tour-block {
  position: fixed;
  pointer-events: auto;
}

.tour-card {
  position: fixed;
  pointer-events: auto;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px calc(14px + 2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  max-width: 92vw;
  box-sizing: border-box;
}
.tour-card.centered {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: min(92vw, 380px);
}
.tour-card:focus {
  outline: none;
}

.tour-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}
.tour-progress {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.02em;
}
/* Always-visible skip: a quiet but comfortably tappable text button. */
.tour-skip {
  border: 0;
  background: none;
  color: var(--muted);
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  min-height: 44px;
  padding: 0 6px;
  margin: -10px -6px;
}
.tour-skip:hover {
  color: var(--text);
}

.tour-title {
  margin: 0 0 6px;
  font-size: 17px;
  color: var(--text);
}
.tour-body {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text);
}
.tour-action {
  margin: 10px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
}
.tour-btns {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.tour-primary {
  min-height: 44px;
  min-width: 120px;
}

/* Mobile: bottom sheet inside the safe area; targets stack above it. */
@media (max-width: 767px) {
  .tour-card,
  .tour-card.centered {
    left: 12px;
    right: 12px;
    top: auto;
    bottom: calc(12px + env(safe-area-inset-bottom));
    transform: none;
    width: auto;
    max-width: none;
  }
}
</style>
