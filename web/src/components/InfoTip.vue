<script setup lang="ts">
// Small, non-blocking info popover. TAP-FIRST (App/Play Store requirement):
// a click/tap on the ℹ icon PINS the popover open; it closes on a second tap,
// a tap anywhere outside, or Escape. Desktop keeps a 300ms-delayed hover
// PREVIEW as a convenience, but hover-out never closes a pinned popover — so
// the "Learn more →" link inside is always reachable. Deliberately NOT the
// native title= attribute — those can't be styled and don't work on touch.
import { ref, watch, onBeforeUnmount, useId, computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    /** The explanation text. */
    text: string;
    /** Accessible label for the trigger. */
    label?: string;
    /** Which edge the popover aligns to (avoids clipping near a panel edge). */
    placement?: "left" | "right";
    /**
     * Feature 5: optional Academy deeplink. When set, a "Learn more →" link is
     * rendered at the bottom of the popover (e.g. "/academy/chapter/c2/lesson/c2-l3").
     */
    learnMore?: string;
  }>(),
  { label: "", placement: "left", learnMore: "" },
);

// Fall back to the translated default when no explicit label is supplied.
const ariaLabel = computed(() => props.label || t("infoTip.moreInformation"));

const open = ref(false);
// True when the popover was opened by an explicit tap/click: only another
// explicit action (tap, outside tap, Escape) closes it — never hover-out/blur.
const pinned = ref(false);
const root = ref<HTMLElement | null>(null);
const popId = `infotip-${useId()}`;

const HOVER_DELAY_MS = 300;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
function clearHoverTimer(): void {
  if (hoverTimer != null) {
    clearTimeout(hoverTimer);
    hoverTimer = null;
  }
}

function onMouseEnter(): void {
  if (open.value) return;
  clearHoverTimer();
  hoverTimer = setTimeout(() => {
    open.value = true;
  }, HOVER_DELAY_MS);
}
function onMouseLeave(): void {
  clearHoverTimer();
  if (!pinned.value) open.value = false;
}

/** The primary interaction: tap/click toggles the pinned popover. */
function toggle(): void {
  clearHoverTimer();
  if (pinned.value) {
    close();
  } else {
    pinned.value = true;
    open.value = true;
  }
}

function close(): void {
  clearHoverTimer();
  pinned.value = false;
  open.value = false;
}

// Keyboard focus shows the preview; focus leaving the whole root (icon AND
// popover) hides an unpinned preview. Focus moving INTO the popover (e.g.
// tabbing to "Learn more") must not close it — that was the old blur bug.
function onFocusIn(): void {
  if (!open.value) open.value = true;
}
function onFocusOut(e: FocusEvent): void {
  if (pinned.value) return;
  const next = e.relatedTarget as Node | null;
  if (!next || !root.value?.contains(next)) open.value = false;
}

function onDocPointer(e: Event): void {
  if (!root.value?.contains(e.target as Node)) close();
}
function onDocKey(e: KeyboardEvent): void {
  if (e.key === "Escape") close();
}

// Only listen for outside taps / Escape while open (cheap, and avoids leaks).
watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener("pointerdown", onDocPointer, true);
    document.addEventListener("keydown", onDocKey, true);
  } else {
    document.removeEventListener("pointerdown", onDocPointer, true);
    document.removeEventListener("keydown", onDocKey, true);
  }
});
onBeforeUnmount(() => {
  clearHoverTimer();
  document.removeEventListener("pointerdown", onDocPointer, true);
  document.removeEventListener("keydown", onDocKey, true);
});
</script>

<template>
  <span
    ref="root"
    class="infotip"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <button
      type="button"
      class="infotip-icon"
      :aria-label="ariaLabel"
      :aria-describedby="open ? popId : undefined"
      :aria-expanded="open"
      @click.stop="toggle"
    >
      &#9432;
    </button>
    <span
      v-if="open"
      :id="popId"
      class="infotip-pop"
      :class="`pop-${placement}`"
      role="tooltip"
    >
      {{ text }}
      <RouterLink
        v-if="learnMore"
        :to="learnMore"
        class="infotip-learn"
        @click="close"
      >
        {{ t("infoTip.learnMore") }}
      </RouterLink>
    </span>
  </span>
</template>

<style scoped>
/* Feature 5: the "Learn more →" deeplink at the bottom of the popover. */
.infotip-learn {
  display: block;
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid var(--line);
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
  /* Comfortable tap target inside the popover (App Store requirement). */
  min-height: 32px;
  display: flex;
  align-items: center;
}
.infotip-learn:hover {
  text-decoration: underline;
}
</style>
