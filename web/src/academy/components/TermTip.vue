<script setup lang="ts">
// Inline glossary term: a dotted-underlined word that toggles a small
// "What does this mean?" popover with a plain-language definition. Used for the
// first occurrence of each technical term in a lesson.
import { ref } from "vue";
import { useI18n } from "vue-i18n";

defineProps<{ term: string; def: string }>();
const { t } = useI18n();
const open = ref(false);
</script>

<template>
  <span class="termtip">
    <button type="button" class="term" :aria-expanded="open" @click="open = !open">{{ term }}</button>
    <span v-if="open" class="termtip-pop" role="tooltip">
      <strong class="termtip-q">{{ t("academy.whatDoesThisMean") }}</strong>
      <span class="termtip-def">{{ def }}</span>
    </span>
  </span>
</template>

<style scoped>
.termtip { position: relative; display: inline; }
.term {
  background: none; border: 0; padding: 0; font: inherit; color: inherit; cursor: help;
  text-decoration: underline dotted; text-underline-offset: 2px; text-decoration-color: var(--accent);
}
.term:hover, .term[aria-expanded="true"] { color: var(--accent); }
.termtip-pop {
  position: absolute; left: 0; top: calc(100% + 6px); z-index: 60;
  width: max-content; max-width: 280px;
  background: var(--panel-2); color: var(--text);
  border: 1px solid var(--line); border-radius: 8px; padding: 8px 10px;
  font-size: 12px; line-height: 1.45; font-weight: 400; text-align: left;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5); white-space: normal;
}
.termtip-q { display: block; color: var(--accent); font-size: 11px; margin-bottom: 3px; }
.termtip-def { display: block; }
</style>
