<script setup lang="ts">
// Renders a Stellar PUBLIC key as a scannable QR code, generated entirely
// client-side (vendored byte-mode generator in src/lib/qr.ts). Output is an
// inline SVG so it stays crisp at any size — it scales to the container, which
// is what the Receive page relies on across desktop/tablet/mobile.
//
// SECURITY: the `value` is the public address ONLY. A secret key is never passed
// to this component or encoded into a QR.
import { computed } from "vue";
import { makeQr } from "../../lib/qr";

const props = defineProps<{ value: string }>();

const QUIET = 4; // spec quiet zone (modules) around the symbol

const qr = computed(() => {
  if (!props.value) return null;
  try {
    return makeQr(props.value, "M");
  } catch {
    return null;
  }
});

// One SVG <path> of all dark modules — cheaper than ~1000 <rect> nodes.
const path = computed(() => {
  const q = qr.value;
  if (!q) return "";
  let d = "";
  for (let y = 0; y < q.size; y++) {
    for (let x = 0; x < q.size; x++) {
      if (q.modules[y][x]) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`;
    }
  }
  return d;
});

const dim = computed(() => (qr.value ? qr.value.size + QUIET * 2 : 0));
</script>

<template>
  <svg
    v-if="qr"
    class="qr"
    :viewBox="`0 0 ${dim} ${dim}`"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    shape-rendering="crispEdges"
    :aria-label="value"
  >
    <rect :width="dim" :height="dim" fill="#ffffff" />
    <path :d="path" fill="#000000" />
  </svg>
</template>

<style scoped>
.qr {
  display: block;
  width: 100%;
  height: auto;
  /* Comfortably scannable on mobile, never wider than its column. */
  max-width: 240px;
  border-radius: 10px;
  /* A small white frame so the quiet zone is preserved against the dark UI. */
  background: #ffffff;
  padding: 8px;
  box-sizing: border-box;
}
</style>
