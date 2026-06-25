<script setup lang="ts">
// Landing view: chapters grouped by level (BASIC / ADVANCED / EXPERT), each
// group with a progress bar and lock state, each chapter rendered as a card with
// lesson checkmarks and a quiz badge. Levels unlock as the prior level's quizzes
// are passed. Includes the "Reset progress" control (with confirmation).
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { getChapterGroups } from "../content";
import { useLocale } from "../locale";
import { useAcademyStore } from "../progress";
import type { Chapter, Level } from "../types";

const emit = defineEmits<{ (e: "open", chapterId: string): void }>();
const { t } = useI18n();
const academy = useAcademyStore();
const { locale } = useLocale();

const groups = computed(() => getChapterGroups(locale.value));

function unlockKey(level: Level): string {
  if (level === "ADVANCED") return "academy.unlock.advanced";
  if (level === "EXPERT") return "academy.unlock.expert";
  return "";
}

/** Per-chapter view-model: counts, lock state, and quiz badge. */
function cardState(ch: Chapter): {
  viewed: number;
  total: number;
  locked: boolean;
  quiz: "passed" | "retry" | "todo";
} {
  const cp = academy.chapterProgress(ch.id);
  const viewed = academy.chapterLessonsViewed(ch);
  const attempted = cp.attempts.length > 0;
  const quiz = cp.quizPassed ? "passed" : attempted ? "retry" : "todo";
  return { viewed, total: ch.lessons.length, locked: !academy.isChapterUnlocked(ch), quiz };
}

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function open(ch: Chapter): void {
  if (academy.isChapterUnlocked(ch)) emit("open", ch.id);
}

// --- reset progress confirmation ---
const confirmingReset = ref(false);
function doReset(): void {
  academy.resetAll();
  confirmingReset.value = false;
}
</script>

<template>
  <div class="overview">
    <header class="ov-head">
      <div>
        <h1 class="ov-title">{{ t("academy.title") }}</h1>
        <p class="ov-sub muted">{{ t("academy.subtitle") }}</p>
      </div>
      <button class="btn ov-reset" @click="confirmingReset = true">{{ t("academy.reset") }}</button>
    </header>

    <section v-for="g in groups" :key="g.level" class="ov-group">
      <div class="grp-head">
        <span class="badge lvl" :class="'lvl-' + g.level.toLowerCase()">{{ t("academy.level." + g.level) }}</span>
        <span class="grp-blurb muted">{{ t("academy.levelBlurb." + g.level) }}</span>
        <span v-if="!academy.isLevelUnlocked(g.level)" class="grp-lock">🔒 {{ t(unlockKey(g.level)) }}</span>
        <span v-else-if="academy.isLevelComplete(g.level)" class="grp-done pos">✓ {{ t("academy.levelComplete") }}</span>
      </div>

      <div class="grp-progress">
        <div class="bar">
          <div
            class="bar-fill"
            :class="'fill-' + g.level.toLowerCase()"
            :style="{ width: pct(academy.levelLessonStats(g.level).viewed, academy.levelLessonStats(g.level).total) + '%' }"
          />
        </div>
        <span class="bar-label muted">
          {{ t("academy.lessonsCompleted", { viewed: academy.levelLessonStats(g.level).viewed, total: academy.levelLessonStats(g.level).total }) }}
          ·
          {{ t("academy.quizzesPassed", { passed: academy.passedByLevel[g.level].passed, total: academy.passedByLevel[g.level].total }) }}
        </span>
      </div>

      <div class="cards">
        <button
          v-for="ch in g.chapters"
          :key="ch.id"
          class="card chap-card"
          :class="{ locked: cardState(ch).locked }"
          :disabled="cardState(ch).locked"
          @click="open(ch)"
        >
          <div class="cc-top">
            <span class="cc-num">{{ t("academy.chapter", { n: ch.number }) }}</span>
            <span v-if="cardState(ch).quiz === 'passed'" class="badge cc-badge ok">✓ {{ t("academy.badge.passed") }}</span>
            <span v-else-if="cardState(ch).quiz === 'retry'" class="badge cc-badge retry">↻ {{ t("academy.badge.retry") }}</span>
            <span v-else-if="cardState(ch).locked" class="badge cc-badge lock">🔒 {{ t("academy.badge.locked") }}</span>
          </div>

          <div class="cc-title">{{ ch.title }}</div>
          <div class="cc-desc">{{ ch.description }}</div>

          <div class="cc-foot">
            <span class="cc-pips">
              <span
                v-for="(l, i) in ch.lessons"
                :key="l.id"
                class="pip"
                :class="{ done: i < cardState(ch).viewed }"
                :title="l.title"
              >{{ i < cardState(ch).viewed ? "✓" : "•" }}</span>
            </span>
            <span class="cc-count muted">{{ t("academy.lessonsCount", { viewed: cardState(ch).viewed, total: cardState(ch).total }) }}</span>
          </div>
        </button>
      </div>
    </section>

    <!-- Reset confirmation modal -->
    <div v-if="confirmingReset" class="modal-backdrop" @click.self="confirmingReset = false">
      <div class="modal panel" role="alertdialog" aria-modal="true" aria-labelledby="reset-h">
        <h2 id="reset-h">{{ t("academy.resetModal.title") }}</h2>
        <p class="muted">{{ t("academy.resetModal.body") }}</p>
        <div class="modal-actions">
          <button class="btn" @click="confirmingReset = false">{{ t("academy.resetModal.cancel") }}</button>
          <button class="btn danger active" @click="doReset">{{ t("academy.resetModal.confirm") }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: 26px; }
.ov-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.ov-title { margin: 0 0 4px; font-size: 24px; }
.ov-sub { margin: 0; max-width: 640px; font-size: 13px; }
.ov-reset { flex-shrink: 0; }

.ov-group { display: flex; flex-direction: column; gap: 12px; }
.grp-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.grp-blurb { font-size: 13px; }
.grp-lock { font-size: 12px; color: var(--warn); }
.grp-done { font-size: 12px; font-weight: 600; }

.badge.lvl { font-weight: 700; }
.lvl-basic { color: var(--pos); border-color: #1f5e42; }
.lvl-advanced { color: var(--accent); border-color: #29406e; }
.lvl-expert { color: #b58cff; border-color: #3a3a6e; }

.grp-progress { display: flex; flex-direction: column; gap: 6px; }
.bar { height: 8px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.bar-fill { height: 100%; transition: width 0.3s ease; }
.fill-basic { background: var(--pos); }
.fill-advanced { background: var(--accent); }
.fill-expert { background: #b58cff; }
.bar-label { font-size: 12px; }

.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }

.chap-card {
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text);
  font: inherit;
  transition: border-color 0.12s, transform 0.06s;
}
.chap-card:hover:not(:disabled) { border-color: var(--accent); transform: translateY(-1px); }
.chap-card.locked { opacity: 0.55; cursor: not-allowed; }

.cc-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cc-num { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
.cc-badge { font-size: 11px; }
.cc-badge.ok { color: var(--pos); border-color: #1f5e42; }
.cc-badge.retry { color: var(--warn); border-color: #5e4a1f; }
.cc-badge.lock { color: var(--muted); }
.cc-title { font-weight: 600; font-size: 15px; }
.cc-desc { color: var(--muted); font-size: 13px; line-height: 1.4; flex: 1; }

.cc-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
.cc-pips { display: flex; gap: 4px; }
.pip {
  width: 16px; height: 16px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 10px; background: var(--panel-2); border: 1px solid var(--line); color: var(--muted);
}
.pip.done { background: #112a1d; border-color: #1f5e42; color: var(--pos); }
.cc-count { font-size: 11px; }

.modal-backdrop {
  position: fixed; inset: 0; z-index: 80;
  background: rgba(4, 8, 14, 0.66);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal { max-width: 420px; width: 100%; }
.modal h2 { margin: 0 0 8px; }
.modal p { margin: 0 0 16px; font-size: 13px; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
</style>
