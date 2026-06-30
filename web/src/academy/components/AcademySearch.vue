<script setup lang="ts">
// Feature 5 — Academy search bar (client-side only). Searches the static
// curriculum already in memory; emits `open(chapterId, lessonId)` when a result
// is chosen. No API call, no user data — see academy/search.ts.
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getChapters } from "../content";
import { useLocale } from "../locale";
import { searchLessons, highlightParts, MIN_QUERY } from "../search";

const emit = defineEmits<{ (e: "open", chapterId: string, lessonId: string): void }>();

const { t } = useI18n();
const { locale } = useLocale();

const query = ref("");
const trimmed = computed(() => query.value.trim());
const active = computed(() => trimmed.value.length >= MIN_QUERY);

const results = computed(() =>
  active.value ? searchLessons(getChapters(locale.value), trimmed.value) : [],
);

function levelClass(level: string): string {
  return "lvl-" + level.toLowerCase();
}

function clear(): void {
  query.value = "";
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    clear();
    (e.target as HTMLElement)?.blur?.();
  }
}
</script>

<template>
  <section class="acs">
    <div class="acs-field">
      <span class="acs-icon" aria-hidden="true">⌕</span>
      <input
        v-model="query"
        type="search"
        class="acs-input"
        :placeholder="t('academySearch.placeholder')"
        :aria-label="t('academySearch.placeholder')"
        autocomplete="off"
        @keydown="onKeydown"
      />
      <button
        v-if="query.length"
        type="button"
        class="acs-clear"
        :aria-label="t('academySearch.clear')"
        @click="clear"
      >
        ×
      </button>
    </div>

    <div v-if="active" class="acs-results">
      <p v-if="results.length === 0" class="acs-empty muted">
        {{ t("academySearch.noResults", { query: trimmed }) }}
      </p>

      <ul v-else class="acs-list">
        <li v-for="r in results" :key="r.chapterId + r.lessonId">
          <button class="acs-result" @click="emit('open', r.chapterId, r.lessonId)">
            <span class="acs-row1">
              <span class="badge lvl" :class="levelClass(r.level)">{{ t("academy.level." + r.level) }}</span>
              <span class="acs-lesson">{{ r.lessonTitle }}</span>
            </span>
            <span class="acs-chap muted">{{ t("academy.chapter", { n: r.chapterNumber }) }} · {{ r.chapterTitle }}</span>
            <span class="acs-excerpt">
              <template v-for="(p, i) in highlightParts(r.excerpt, trimmed)" :key="i">
                <mark v-if="p.hit">{{ p.text }}</mark>
                <template v-else>{{ p.text }}</template>
              </template>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.acs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.acs-field {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0 12px;
}
.acs-field:focus-within {
  border-color: var(--accent);
}
.acs-icon {
  color: var(--muted);
  font-size: 18px;
}
.acs-input {
  flex: 1;
  background: none;
  border: 0;
  color: var(--text);
  font: inherit;
  padding: 12px 4px;
  outline: none;
}
.acs-input::-webkit-search-cancel-button {
  display: none;
}
.acs-clear {
  background: none;
  border: 0;
  color: var(--muted);
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 6px;
}
.acs-clear:hover {
  color: var(--text);
}
.acs-results {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-2);
  overflow: hidden;
}
.acs-empty {
  margin: 0;
  padding: 16px;
  font-size: 14px;
}
.acs-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 420px;
  overflow-y: auto;
}
.acs-list li + li {
  border-top: 1px solid var(--line);
}
.acs-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  text-align: left;
  background: none;
  border: 0;
  cursor: pointer;
  padding: 12px 16px;
  font: inherit;
  color: var(--text);
}
.acs-result:hover {
  background: rgba(91, 140, 255, 0.08);
}
.acs-row1 {
  display: flex;
  align-items: center;
  gap: 10px;
}
.acs-lesson {
  font-weight: 600;
}
.acs-chap {
  font-size: 12px;
}
.acs-excerpt {
  font-size: 13px;
  color: #c2cee0;
  line-height: 1.5;
}
.acs-excerpt mark {
  background: rgba(245, 166, 35, 0.28);
  color: inherit;
  border-radius: 3px;
  padding: 0 1px;
}
.badge.lvl {
  font-weight: 700;
  font-size: 11px;
  padding: 2px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.lvl-basic {
  color: var(--pos);
  border-color: #1f5e42;
}
.lvl-advanced {
  color: var(--accent);
  border-color: #29406e;
}
.lvl-expert {
  color: #b58cff;
  border-color: #3a3a6e;
}
</style>
