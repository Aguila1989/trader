<script setup lang="ts">
// Single-lesson reader. Presentational: it renders the lesson (already localized
// content via the chapter prop) and emits navigation intent. Chrome strings come
// from i18n.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useLocale } from "../locale";
import { glossaryFor } from "../glossary";
import { segmentText } from "../segment";
import TermTip from "./TermTip.vue";
import type { Chapter } from "../types";

const props = defineProps<{ chapter: Chapter; lessonIndex: number }>();
const emit = defineEmits<{
  (e: "goto", index: number): void;
  (e: "quiz"): void;
  (e: "overview"): void;
}>();

const { t } = useI18n();
const { locale } = useLocale();
const lesson = computed(() => props.chapter.lessons[props.lessonIndex]);

// Split the lesson prose into text + glossary-term segments. `used` is shared
// across paragraphs + the example so each term is linked only on first use.
const segments = computed(() => {
  const g = glossaryFor(locale.value);
  const used = new Set<string>();
  const paras = lesson.value.paragraphs.map((p) => segmentText(p, g, used));
  const example = segmentText(lesson.value.example, g, used);
  return { paras, example };
});
const total = computed(() => props.chapter.lessons.length);
const isFirst = computed(() => props.lessonIndex === 0);
const isLast = computed(() => props.lessonIndex >= total.value - 1);
const levelClass = computed(() => "lvl-" + props.chapter.level.toLowerCase());
</script>

<template>
  <div class="lesson">
    <header class="ls-head">
      <button class="link-btn" @click="emit('overview')">{{ t("academy.lesson.all") }}</button>
      <div class="ls-titles">
        <span class="badge lvl" :class="levelClass">{{ t("academy.level." + chapter.level) }}</span>
        <span class="ls-chap">{{ t("academy.chapter", { n: chapter.number }) }} · {{ chapter.title }}</span>
      </div>
      <span class="ls-progress muted">{{ t("academy.lesson.progress", { n: lessonIndex + 1, total }) }}</span>
    </header>

    <div class="ls-steps">
      <button
        v-for="(l, i) in chapter.lessons"
        :key="l.id"
        class="step"
        :class="{ active: i === lessonIndex }"
        :title="l.title"
        :aria-label="t('academy.lesson.progress', { n: i + 1, total })"
        @click="emit('goto', i)"
      />
    </div>

    <article class="panel ls-body">
      <h1 class="ls-h1">{{ lesson.title }}</h1>
      <p v-for="(segs, i) in segments.paras" :key="i" class="ls-p">
        <template v-for="(s, j) in segs" :key="j">
          <TermTip v-if="s.kind === 'term'" :term="s.term" :def="s.def" />
          <template v-else>{{ s.text }}</template>
        </template>
      </p>

      <div class="ls-example">
        <span class="ex-tag">{{ t("academy.lesson.example") }}</span>
        <p>
          <template v-for="(s, j) in segments.example" :key="j">
            <TermTip v-if="s.kind === 'term'" :term="s.term" :def="s.def" />
            <template v-else>{{ s.text }}</template>
          </template>
        </p>
      </div>
    </article>

    <nav class="ls-nav">
      <button class="btn" :disabled="isFirst" @click="emit('goto', lessonIndex - 1)">
        {{ t("academy.lesson.prev") }}
      </button>

      <button v-if="!isLast" class="btn primary" @click="emit('goto', lessonIndex + 1)">
        {{ t("academy.lesson.next") }}
      </button>
      <button v-else class="btn accent ls-quiz" @click="emit('quiz')">
        {{ t("academy.lesson.takeQuiz") }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.lesson { display: flex; flex-direction: column; gap: 14px; }

.ls-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.link-btn { background: none; border: 0; color: var(--accent); cursor: pointer; font: inherit; padding: 0; }
.link-btn:hover { text-decoration: underline; }
.ls-titles { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ls-chap { font-weight: 600; }
.ls-progress { font-size: 13px; }

.badge.lvl { font-weight: 700; }
.lvl-basic { color: var(--pos); border-color: #1f5e42; }
.lvl-advanced { color: var(--accent); border-color: #29406e; }
.lvl-expert { color: #b58cff; border-color: #3a3a6e; }

.ls-steps { display: flex; gap: 6px; }
.step {
  flex: 1; height: 5px; border: 0; padding: 0; border-radius: 999px;
  background: var(--line); cursor: pointer;
}
.step:hover { background: var(--muted); }
.step.active { background: var(--accent); }

.ls-body { padding: 24px 28px; }
.ls-h1 { margin: 0 0 14px; font-size: 22px; }
.ls-p { margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #d6e2f2; }

.ls-example {
  margin-top: 18px;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  padding: 14px 16px;
}
.ex-tag {
  display: inline-block;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--accent); font-weight: 700; margin-bottom: 6px;
}
.ls-example p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--text); }

.ls-nav { display: flex; justify-content: space-between; gap: 12px; }
.ls-quiz { font-weight: 700; }
</style>
