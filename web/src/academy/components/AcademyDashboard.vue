<script setup lang="ts">
// Authenticated /academy dashboard (2026-07 Feature 1H): a stats row + a
// "continue learning" horizontal touch-scroll rail, rendered ABOVE the full
// chapter overview (which is the "all lessons" grid). Purely derived from the
// progress store; emits resume intent to AcademyPage.
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { getChapters } from "../content";
import { useLocale } from "../locale";
import { useAcademyStore } from "../progress";
import type { Chapter } from "../types";

const emit = defineEmits<{ (e: "resume", chapterId: string, lessonIndex: number): void }>();
const { t } = useI18n();
const { locale } = useLocale();
const academy = useAcademyStore();

const stats = computed(() => academy.dashboardStats);

interface ContinueCard {
  chapter: Chapter;
  percent: number;
  resumeIndex: number;
}

// Chapters with reading activity but not yet completed, newest-ish first (by
// chapter order — there is no per-row timestamp client-side). Resume at the
// first lesson that is neither completed server-side nor viewed locally.
const continueCards = computed<ContinueCard[]>(() => {
  const out: ContinueCard[] = [];
  for (const ch of getChapters(locale.value)) {
    const s = academy.chapterCardState(ch);
    if (s.state !== "in-progress") continue;
    const local = academy.chapterProgress(ch.id);
    let resumeIndex = ch.lessons.findIndex((l, i) => {
      const item = academy.serverProgress[l.id];
      const done = item ? item.status === "Completed" : local.viewedLessons.includes(i);
      return !done;
    });
    if (resumeIndex < 0) resumeIndex = ch.lessons.length - 1;
    out.push({ chapter: ch, percent: s.percent, resumeIndex });
  }
  return out;
});
</script>

<template>
  <div class="dash">
    <!-- Stats row -->
    <div class="dash-stats">
      <div class="stat">
        <span class="stat-num">{{ stats.lessonsCompleted }} <span class="stat-total muted">/ {{ stats.lessonsTotal }}</span></span>
        <span class="stat-label muted">{{ t("academy.dashboard.lessonsDone") }}</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ stats.certificates }}</span>
        <span class="stat-label muted">{{ t("academy.dashboard.certificates") }}</span>
      </div>
      <div class="stat">
        <span class="stat-num">{{ stats.lessonsInProgress }}</span>
        <span class="stat-label muted">{{ t("academy.dashboard.inProgress") }}</span>
      </div>
    </div>

    <!-- Continue learning rail (only when something is in progress) -->
    <section v-if="continueCards.length" class="dash-continue">
      <h2 class="dc-title">{{ t("academy.dashboard.continueTitle") }}</h2>
      <div class="dc-rail" role="list">
        <article v-for="c in continueCards" :key="c.chapter.id" class="dc-card" role="listitem">
          <span class="dc-chap muted">{{ t("academy.chapter", { n: c.chapter.number }) }}</span>
          <span class="dc-name">{{ c.chapter.title }}</span>
          <div class="dc-bar">
            <div class="dc-bar-fill" :style="{ width: c.percent + '%' }" />
          </div>
          <button class="btn primary dc-cta" @click="emit('resume', c.chapter.id, c.resumeIndex)">
            {{ t("academy.dashboard.continueCta") }}
          </button>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dash { display: flex; flex-direction: column; gap: 20px; }

.dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
.stat {
  background: var(--surface-1);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-num { font-size: 24px; font-weight: 700; font-family: ui-monospace, monospace; }
.stat-total { font-size: 14px; font-weight: 500; }
.stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }

.dc-title { margin: 0 0 10px; font-size: 16px; font-weight: 600; }
.dc-rail {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch; /* momentum scroll on iOS */
  scroll-snap-type: x proximity;
  padding-bottom: 6px; /* room for the scrollbar, keeps cards un-clipped */
}
.dc-card {
  flex: 0 0 auto;
  width: 240px;
  scroll-snap-align: start;
  background: var(--surface-1);
  border: 0.5px solid var(--border);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dc-chap { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
.dc-name { font-weight: 600; font-size: 14px; line-height: 1.35; flex: 1; }
.dc-bar { height: 4px; border-radius: 999px; background: var(--panel-2); overflow: hidden; }
.dc-bar-fill { height: 100%; background: var(--fill-accent); }
.dc-cta { min-height: 44px; font-weight: 600; }
</style>
