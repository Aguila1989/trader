<script setup lang="ts">
// Small, non-blocking info popover. Shown on hover (desktop) and on tap
// (mobile); dismisses on mouse-out or tap-outside. Deliberately NOT the native
// title= attribute — those can't be styled and don't work well on touch.
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
  }>(),
  { label: "", placement: "left" },
);

// Fall back to the translated default when no explicit label is supplied.
const ariaLabel = computed(() => props.label || t("infoTip.moreInformation"));

const open = ref(false);
const root = ref<HTMLElement | null>(null);
const popId = `infotip-${useId()}`;

function show(): void {
  open.value = true;
}
function hide(): void {
  open.value = false;
}
function toggle(): void {
  open.value = !open.value;
}

function onDocPointer(e: Event): void {
  if (!root.value?.contains(e.target as Node)) hide();
}

// Only listen for outside taps while open (cheap, and avoids leaks).
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener("pointerdown", onDocPointer, true);
  else document.removeEventListener("pointerdown", onDocPointer, true);
});
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", onDocPointer, true),
);
</script>

<template>
  <span
    ref="root"
    class="infotip"
    @mouseenter="show"
    @mouseleave="hide"
  >
    <button
      type="button"
      class="infotip-icon"
      :aria-label="ariaLabel"
      :aria-describedby="open ? popId : undefined"
      :aria-expanded="open"
      @click.stop="toggle"
      @focus="show"
      @blur="hide"
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
    </span>
  </span>
</template>
