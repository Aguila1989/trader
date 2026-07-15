<script setup lang="ts">
// Root of the Learning Centre — the "/academy" route. Owns the internal view
// state (overview → lesson → quiz) and navigation; children are presentational
// and emit intent. "Back to Trading" returns to the dashboard route.
//
// Imports only the static curriculum, the progress store, the shared locale
// adapter, and i18n — no trading logic, AI service, or Stellar SDK.
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { getChapterById } from "../content";
import { lessonPath } from "../deeplinks";
import { useLocale } from "../locale";
import { useAcademyStore } from "../progress";
import AcademyDashboard from "./AcademyDashboard.vue";
import AcademyLanding from "./AcademyLanding.vue";
import AcademySearch from "./AcademySearch.vue";
import ChapterOverview from "./ChapterOverview.vue";
import LessonView from "./LessonView.vue";
import QuizView from "./QuizView.vue";
import LangSwitcher from "../../components/LangSwitcher.vue";
import { isLoggedIn } from "../../auth/session";
import { scrollToTop } from "../../lib/scroll";
import { PREVIEW_CHAPTER_ID, isPreviewLesson } from "../preview";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
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

// Feature 1E: pull the account's server-side progress once on entry so cards
// show real cross-device state. No-op for anonymous visitors.
void academy.hydrateFromServer();

type View = "overview" | "lesson" | "quiz";
const view = ref<View>("overview");
const chapterId = ref<string>("");
const lessonIndex = ref(0);

const chapter = computed(() => getChapterById(locale.value, chapterId.value));

// Account gate (2026-07 Feature 1): lessons require a session, except the free
// preview (chapter 1, lesson 1). Internal navigation swaps component state
// without touching the router, so the router guard alone cannot enforce this -
// every nav function below checks too. The redirect brings the user straight
// back to what they tried to open after logging in.
function gotoLogin(redirectTo?: string): void {
  void router.push({ path: "/login", query: { redirect: redirectTo ?? route.fullPath } });
}

function openChapter(id: string): void {
  const ch = getChapterById(locale.value, id);
  if (!ch) return;
  // Anonymous first, unlock second: a logged-out visitor clicking ANY locked
  // card must land on login (not silently no-op on the level gate).
  if (!loggedIn && id !== PREVIEW_CHAPTER_ID) {
    gotoLogin(lessonPath(id, ch.lessons[0]?.id ?? ""));
    return;
  }
  if (!academy.isChapterUnlocked(ch)) return;
  chapterId.value = id;
  lessonIndex.value = 0;
  view.value = "lesson";
  academy.markLessonViewed(id, 0);
  scrollTop();
}

function gotoLesson(i: number): void {
  const ch = chapter.value;
  if (!ch) return;
  const idx = Math.min(Math.max(0, i), ch.lessons.length - 1);
  // Anonymous readers may only see the preview lesson (c1, index 0).
  if (!loggedIn && !isPreviewLesson(ch.id, ch.lessons[idx]?.id)) {
    gotoLogin(lessonPath(ch.id, ch.lessons[idx]?.id ?? ""));
    return;
  }
  lessonIndex.value = idx;
  academy.markLessonViewed(ch.id, lessonIndex.value);
  scrollTop();
}

function openQuiz(): void {
  if (!chapter.value) return;
  // Quizzes record server-side progress - account required.
  if (!loggedIn) {
    gotoLogin();
    return;
  }
  view.value = "quiz";
  scrollTop();
}

function backToOverview(): void {
  view.value = "overview";
  scrollTop();
}

// Feature 1H: "Verder leren" resumes a chapter at its first unfinished lesson
// (unlike openChapter, which always starts at lesson 0).
function resumeChapter(cId: string, lessonIdx: number): void {
  const ch = getChapterById(locale.value, cId);
  if (!ch) return;
  chapterId.value = cId;
  lessonIndex.value = Math.min(Math.max(0, lessonIdx), ch.lessons.length - 1);
  view.value = "lesson";
  academy.markLessonViewed(cId, lessonIndex.value);
  scrollTop();
}

// Shared scroll utility (Bug 1 consolidation) — one implementation app-wide.
const scrollTop = scrollToTop;

// Feature 5 — lesson deeplinks. Open a specific lesson by ids, BYPASSING the
// unlock gate so any lesson is reachable directly (incl. EXPERT lessons).
// Invalid ids fall back to the overview (no-op). Account-gated for anonymous
// visitors except the preview lesson (the router guard already redirects
// those; this check is defense in depth for the component-level entry points).
function openLessonByIds(cId: string, lId: string): void {
  if (!loggedIn && !isPreviewLesson(cId, lId)) {
    gotoLogin(lessonPath(cId, lId));
    return;
  }
  const ch = getChapterById(locale.value, cId);
  if (!ch) return;
  const idx = ch.lessons.findIndex((l) => l.id === lId);
  if (idx < 0) return;
  chapterId.value = cId;
  lessonIndex.value = idx;
  view.value = "lesson";
  academy.markLessonViewed(cId, idx);
  scrollTop();
}

// React to /academy/chapter/:chapterId/lesson/:lessonId on first load and on
// later param changes (vue-router reuses this component across param changes).
// Navigating BACK to plain /academy (params gone) must reset to the overview -
// without this the reused component kept showing the last-opened lesson.
watch(
  () => [route.params.chapterId, route.params.lessonId] as const,
  ([cId, lId]) => {
    if (typeof cId === "string" && typeof lId === "string") openLessonByIds(cId, lId);
    else view.value = "overview";
  },
  { immediate: true },
);

// A search result was chosen: push the deeplink so the URL reflects it and the
// watcher above opens the lesson — one code path for both entry points.
function onSearchOpen(cId: string, lId: string): void {
  void router.push(lessonPath(cId, lId));
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

    <!-- Anonymous /academy shows the sign-up landing (1D); the chapter
         overview is the logged-in experience. Lesson/quiz views below serve
         both (the preview lesson is reachable anonymously). -->
    <AcademyLanding v-if="view === 'overview' && !loggedIn" @open="openChapter" />

    <AcademySearch v-if="view === 'overview' && loggedIn" @open="onSearchOpen" />

    <!-- Feature 1H: stats + continue-learning rail above the all-lessons grid -->
    <AcademyDashboard v-if="view === 'overview' && loggedIn" @resume="resumeChapter" />

    <ChapterOverview v-if="view === 'overview' && loggedIn" @open="openChapter" />

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
