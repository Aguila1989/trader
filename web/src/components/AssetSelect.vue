<script setup lang="ts">
// Searchable, STRICT token picker. You can type to filter but can only pick
// from the supplied options (no free CODE:ISSUER entry). Used everywhere the
// user used to type an asset code. When `locked` it renders as a fixed,
// non-interactive field (e.g. on a token's own detail page).
import { ref, computed, watch, nextTick, onBeforeUnmount, useId } from "vue";
import { useI18n } from "vue-i18n";
import { shortKey } from "../format";
import type { UniverseToken } from "../types";

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    /** Currently-selected spec ("XLM" or "CODE:ISSUER"). */
    modelValue: string;
    /** Selectable tokens. Defaults to [] so a not-yet-loaded/malformed source
     *  never makes this picker throw (which would break router navigation). */
    options?: UniverseToken[];
    locked?: boolean;
    placeholder?: string;
    ariaLabel?: string;
  }>(),
  { locked: false, placeholder: undefined, ariaLabel: undefined, options: () => [] },
);

// Default labels are translated; parents can still override via props.
const placeholderLabel = computed(() => props.placeholder ?? t("assetSelect.selectToken"));
const ariaLabelText = computed(() => props.ariaLabel ?? t("assetSelect.asset"));

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();

const open = ref(false);
const query = ref("");
const activeIndex = ref(0);
const root = ref<HTMLElement | null>(null);
const searchEl = ref<HTMLInputElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);

// Stable ids for the ARIA combobox/listbox/active-descendant wiring.
const uid = useId();
const listId = `as-list-${uid}`;
const optId = (i: number) => `as-opt-${uid}-${i}`;

const selected = computed(
  () =>
    props.options.find(
      (o) => o.spec.toUpperCase() === (props.modelValue ?? "").toUpperCase(),
    ) ?? null,
);

function sub(o: UniverseToken): string {
  return o.domain ?? (o.issuer ? shortKey(o.issuer) : "");
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter(
    (o) =>
      o.code.toLowerCase().includes(q) ||
      o.name.toLowerCase().includes(q) ||
      (o.domain ?? "").toLowerCase().includes(q) ||
      (o.issuer ?? "").toLowerCase().includes(q) ||
      o.spec.toLowerCase().includes(q),
  );
});

function openPanel(): void {
  if (props.locked) return;
  open.value = true;
  query.value = "";
  const i = filtered.value.findIndex(
    (o) => o.spec.toUpperCase() === (props.modelValue ?? "").toUpperCase(),
  );
  activeIndex.value = i >= 0 ? i : 0;
  void nextTick(() => searchEl.value?.focus());
}
function close(): void {
  open.value = false;
}
// Return focus to the trigger so keyboard users aren't dropped to <body>.
function closeAndFocus(): void {
  close();
  void nextTick(() => triggerEl.value?.focus());
}
function pick(o: UniverseToken): void {
  emit("update:modelValue", o.spec);
  closeAndFocus();
}
function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowDown") {
    activeIndex.value = Math.min(filtered.value.length - 1, activeIndex.value + 1);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    activeIndex.value = Math.max(0, activeIndex.value - 1);
    e.preventDefault();
  } else if (e.key === "Enter") {
    const o = filtered.value[activeIndex.value];
    if (o) pick(o);
    e.preventDefault();
  } else if (e.key === "Escape") {
    closeAndFocus();
  }
}

watch(filtered, () => {
  activeIndex.value = 0;
});

function onDocPointer(e: Event): void {
  if (!root.value?.contains(e.target as Node)) close();
}
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener("pointerdown", onDocPointer, true);
  else document.removeEventListener("pointerdown", onDocPointer, true);
});
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", onDocPointer, true),
);
</script>

<template>
  <div ref="root" class="asset-select" :class="{ open, locked }">
    <button
      ref="triggerEl"
      type="button"
      class="asset-trigger"
      :class="{ placeholder: !selected }"
      :disabled="locked"
      :aria-label="ariaLabelText"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open ? close() : openPanel()"
    >
      <span v-if="selected" class="asset-pick">
        <span class="asset-code">{{ selected.code }}</span>
        <span v-if="selected.name" class="asset-name muted">{{ selected.name }}</span>
      </span>
      <span v-else class="asset-ph muted">{{ placeholderLabel }}</span>
      <span v-if="!locked" class="asset-caret" aria-hidden="true">▾</span>
    </button>

    <div v-if="open" class="asset-panel">
      <input
        ref="searchEl"
        v-model="query"
        class="asset-search"
        type="text"
        role="combobox"
        :aria-expanded="open"
        :aria-controls="listId"
        :aria-activedescendant="filtered[activeIndex] ? optId(activeIndex) : undefined"
        :placeholder="t('assetSelect.searchPlaceholder', { label: ariaLabelText.toLowerCase() })"
        :aria-label="t('assetSelect.searchLabel', { label: ariaLabelText })"
        @keydown="onKeydown"
      />
      <ul :id="listId" class="asset-options" role="listbox">
        <li v-if="filtered.length === 0" class="asset-empty muted">
          {{ t("assetSelect.noMatch") }}
        </li>
        <li
          v-for="(o, i) in filtered"
          :id="optId(i)"
          :key="o.spec"
          class="asset-option"
          :class="{
            active: i === activeIndex,
            selected: o.spec.toUpperCase() === (modelValue ?? '').toUpperCase(),
          }"
          role="option"
          :aria-selected="o.spec.toUpperCase() === (modelValue ?? '').toUpperCase()"
          @mouseenter="activeIndex = i"
          @click="pick(o)"
        >
          <span class="asset-code">{{ o.code }}</span>
          <span class="asset-name">{{ o.name || "—" }}</span>
          <span v-if="sub(o)" class="asset-sub muted">{{ sub(o) }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
