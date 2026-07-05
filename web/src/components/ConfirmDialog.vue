<script setup lang="ts">
// Feature 6: the app's first REAL confirmation dialog (every confirm before
// this was an inline button-swap). Generic on purpose - the kill switch uses
// it with a consequences list + a countdown-armed destructive button; simpler
// confirms (reactivation, future admin actions) use it plain.
//
// UX contract: modal overlay (backdrop + Escape cancel), reference-counted
// scroll lock shared with the other modals, 44px tap targets, safe-area aware
// on mobile. `countdownSec` keeps the CONFIRM button disabled with a visible
// "(2) -> (1) ->" countdown so a double-tap can never trigger a destructive
// action accidentally.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { acquireScrollLock, releaseScrollLock } from "../ui/uiState";

const props = withDefaults(
  defineProps<{
    title: string;
    confirmLabel: string;
    cancelLabel: string;
    /** Style the confirm button as destructive (red). */
    destructive?: boolean;
    /** Seconds the confirm button stays disabled after opening (0 = enabled). */
    countdownSec?: number;
  }>(),
  { destructive: false, countdownSec: 0 },
);

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const remaining = ref(props.countdownSec);
let ticker: number | null = null;

const confirmText = computed(() =>
  remaining.value > 0 ? `${props.confirmLabel} (${remaining.value})` : props.confirmLabel,
);

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") emit("cancel");
}

onMounted(() => {
  acquireScrollLock();
  document.addEventListener("keydown", onKeydown);
  if (remaining.value > 0) {
    ticker = window.setInterval(() => {
      remaining.value -= 1;
      if (remaining.value <= 0 && ticker !== null) {
        window.clearInterval(ticker);
        ticker = null;
      }
    }, 1000);
  }
});

onBeforeUnmount(() => {
  releaseScrollLock();
  document.removeEventListener("keydown", onKeydown);
  if (ticker !== null) window.clearInterval(ticker);
});
</script>

<template>
  <Teleport to="body">
    <div class="cd-back" @click.self="emit('cancel')">
      <div class="cd-card" role="alertdialog" aria-modal="true" :aria-label="title">
        <h2 class="cd-title">{{ title }}</h2>
        <div class="cd-body">
          <slot />
        </div>
        <div class="cd-actions">
          <button class="btn cd-btn" type="button" @click="emit('cancel')">{{ cancelLabel }}</button>
          <button
            class="btn cd-btn"
            :class="destructive ? 'cd-destructive' : 'primary'"
            type="button"
            :disabled="remaining > 0"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.cd-back {
  position: fixed;
  inset: 0;
  background: rgba(4, 8, 18, 0.66);
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
.cd-card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 18px 20px;
  width: min(92vw, 520px);
  max-height: calc(100vh - 48px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
  overflow-y: auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
}
.cd-title {
  margin: 0 0 10px;
  font-size: 17px;
  color: var(--text);
}
.cd-body {
  font-size: 14px;
  line-height: 1.55;
  color: var(--text);
}
.cd-body :deep(ul) {
  margin: 6px 0 12px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cd-body :deep(p) {
  margin: 0 0 8px;
}
.cd-body :deep(.cd-muted) {
  color: var(--muted);
}
.cd-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.cd-btn {
  min-height: 44px;
  min-width: 110px;
}
.cd-destructive {
  background: var(--neg);
  border-color: var(--neg);
  color: #2a0e12;
  font-weight: 700;
}
.cd-destructive:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
