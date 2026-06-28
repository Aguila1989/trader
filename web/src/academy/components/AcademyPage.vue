<script setup lang="ts">
// Root of the Learning Centre — the "/academy" route. Owns the internal view
// state (overview → lesson → quiz) and navigation; children are presentational
// and emit intent. "Back to Trading" returns to the dashboard route.
//
// Imports only the static curriculum, the progress store, the shared locale
// adapter, and i18n — no trading logic, AI service, or Stellar SDK.
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { getChapterById } from "../content";
import { useLocale } from "../locale";
import { useAcademyStore } from "../progress";
import ChapterOverview from "./ChapterOverview.vue";
import LessonView from "./LessonView.vue";
import QuizView from "./QuizView.vue";
import LangSwitcher from "../../components/LangSwitcher.vue";
import { isLoggedIn } from "../../auth/session";

const { t } = useI18n();
const router = useRouter();
const academy = useAcademyStore();
const { locale } = useLocale();

// Feature 2: the "← Back" button is context-aware, decided purely client-side
// from the session-marker cookie (no API call): logged in -> back to the app;
// logged out -> back to the login screen. Captured once on entry.
const loggedIn = isLoggedIn();
const backLabel = computed(() => (loggedIn ? t("common.backToApp") : t("common.backToLogin")));
function goBack(): void {
  router.push(loggedIn ? "/" : "/login");
}

type View = "overview" | "lesson" | "quiz";
const view = ref<View>("overview");
const chapterId = ref<string>("");
const lessonIndex = ref(0);

const chapter = computed(() => getChapterById(locale.value, chapterId.value));

function openChapter(id: string): void {
  const ch = getChapterById(locale.value, id);
  if (!ch || !academy.isChapterUnlocked(ch)) return;
  chapterId.value = id;
  lessonIndex.value = 0;
  view.value = "lesson";
  academy.markLessonViewed(id, 0);
  scrollTop();
}

function gotoLesson(i: number): void {
  const ch = chapter.value;
  if (!ch) return;
  lessonIndex.value = Math.min(Math.max(0, i), ch.lessons.length - 1);
  academy.markLessonViewed(ch.id, lessonIndex.value);
  scrollTop();
}

function openQuiz(): void {
  if (!chapter.value) return;
  view.value = "quiz";
  scrollTop();
}

function backToOverview(): void {
  view.value = "overview";
  scrollTop();
}

function scrollTop(): void {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    /* SSR / non-browser — ignore */
  }
}
</script>

<template>
  <div class="academy">
    <div class="academy-bar">
      <button class="btn academy-back" @click="goBack">
        {{ backLabel }}
      </button>
      <span class="academy-brand"><span class="logo">◆</span> {{ t("common.academy") }}</span>
      <span class="academy-bar-end"><LangSwitcher /></span>
    </div>

    <ChapterOverview v-if="view === 'overview'" @open="openChapter" />

    <LessonView
      v-else-if="view === 'lesson' && chapter"
      :chapter="chapter"
      :lesson-index="lessonIndex"
      @goto="gotoLesson"
      @quiz="openQuiz"
      @overview="backToOverview"
    />

    <QuizView
      v-else-if="view === 'quiz' && chapter"
      :chapter="chapter"
      @overview="backToOverview"
    />
  </div>
</template>

<style scoped>
.academy {
  max-width: 1180px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.academy-bar {
  display: flex;
  align-items: center;
  gap: 14px;
}
.academy-back {
  font-weight: 600;
}
.academy-brand {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.01em;
}
.academy-bar-end {
  margin-left: auto;
}
</style>
