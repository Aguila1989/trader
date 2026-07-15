<script setup lang="ts">
// Chapter quiz: one question at a time with immediate per-answer feedback, a
// final score screen, pass/fail at PASS_RATIO, and reshuffle-on-retry. Each
// finished attempt is recorded in the progress store (persists to localStorage
// and, signed-in, to the server via /api/academy/progress/:slug/quiz).
//
// Feature 1G (2026-07): the result screen shows the score as a large percent,
// a "lesson completed" confirmation on pass, WHICH questions went wrong on
// fail, and the attempt history ("Poging 1: 55% | Poging 2: 80% ✓").
// Question/option text is localized content (from the chapter prop); chrome is i18n.
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { academyApi, type AcademyQuizAttemptRecord } from "../../api";
import { isLoggedIn } from "../../auth/session";
import { useAcademyStore } from "../progress";
import { PASS_RATIO } from "../types";
import type { Chapter } from "../types";

const props = defineProps<{ chapter: Chapter }>();
const emit = defineEmits<{ (e: "overview"): void }>();
const { t } = useI18n();
const academy = useAcademyStore();

const questions = computed(() => props.chapter.quiz);
const total = computed(() => questions.value.length);
const passPctLabel = Math.round(PASS_RATIO * 100);

// --- attempt history (Feature 1G) ---
// Local attempts always exist (every attempt is recorded on-device); the
// server list is used instead when it knows MORE (attempts from another
// device). The just-finished attempt is always in the local list, so the
// longer list is the more complete one.
const serverHistory = ref<AcademyQuizAttemptRecord[]>([]);
onMounted(() => {
  if (!isLoggedIn()) return;
  void academyApi
    .quizHistory(props.chapter.id)
    .then((rows) => {
      if (Array.isArray(rows)) serverHistory.value = rows;
    })
    .catch(() => {});
});
const attemptHistory = computed<{ n: number; pct: number; passed: boolean }[]>(() => {
  const local = academy.chapterProgress(props.chapter.id).attempts.map((a, i) => ({
    n: i + 1,
    pct: a.total > 0 ? Math.round((a.score / a.total) * 100) : 0,
    passed: a.passed,
  }));
  const remote = serverHistory.value.map((a) => ({
    n: a.attemptNumber,
    pct: a.scorePercent,
    passed: a.passed,
  }));
  return remote.length > local.length ? remote : local;
});

// Wrong answers this run, for the fail-screen review.
interface WrongAnswer {
  prompt: string;
  your: string;
  correct: string;
}
const wrongAnswers = ref<WrongAnswer[]>([]);

function shuffled(): number[] {
  const a = questions.value.map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const order = ref<number[]>(shuffled());
const pos = ref(0);
const chosen = ref<number | null>(null);
const correctCount = ref(0);
const finished = ref(false);
const result = ref<{ score: number; total: number; passed: boolean } | null>(null);

const current = computed(() => questions.value[order.value[pos.value]]);
const answered = computed(() => chosen.value !== null);
const isCorrect = computed(() => answered.value && chosen.value === current.value.correctIndex);
const isLastQuestion = computed(() => pos.value >= total.value - 1);

function choose(optIndex: number): void {
  if (answered.value) return;
  chosen.value = optIndex;
  if (optIndex === current.value.correctIndex) {
    correctCount.value++;
  } else {
    wrongAnswers.value.push({
      prompt: current.value.prompt,
      your: current.value.options[optIndex]?.text ?? "",
      correct: current.value.options[current.value.correctIndex]?.text ?? "",
    });
  }
}

function next(): void {
  if (!answered.value) return;
  if (isLastQuestion.value) {
    finish();
  } else {
    pos.value++;
    chosen.value = null;
  }
}

function finish(): void {
  const score = correctCount.value;
  const tot = total.value;
  const passed = tot > 0 && score / tot >= PASS_RATIO;
  academy.recordQuizAttempt(props.chapter.id, score, tot, new Date().toISOString());
  result.value = { score, total: tot, passed };
  finished.value = true;
}

const scorePct = computed(() =>
  result.value && result.value.total > 0
    ? Math.round((result.value.score / result.value.total) * 100)
    : 0,
);

function tryAgain(): void {
  order.value = shuffled();
  pos.value = 0;
  chosen.value = null;
  correctCount.value = 0;
  wrongAnswers.value = [];
  finished.value = false;
  result.value = null;
}

function optionClass(i: number): string {
  if (!answered.value) return "";
  if (i === current.value.correctIndex) return "correct";
  if (i === chosen.value) return "wrong";
  return "dim";
}
</script>

<template>
  <div class="quiz">
    <header class="qz-head">
      <button class="link-btn" @click="emit('overview')">{{ t("academy.lesson.all") }}</button>
      <span class="qz-chap">
        {{ t("academy.quiz.label") }} · {{ t("academy.chapter", { n: chapter.number }) }} · {{ chapter.title }}
      </span>
      <span v-if="!finished" class="qz-progress muted">{{ t("academy.quiz.progress", { n: pos + 1, total }) }}</span>
    </header>

    <!-- Question flow -->
    <section v-if="!finished" class="panel qz-card">
      <div class="qz-bar">
        <div class="qz-bar-fill" :style="{ width: ((pos + (answered ? 1 : 0)) / total) * 100 + '%' }" />
      </div>

      <h2 class="qz-prompt">{{ current.prompt }}</h2>

      <ul class="qz-options">
        <li v-for="(opt, i) in current.options" :key="i">
          <button class="qz-option" :class="optionClass(i)" :disabled="answered" @click="choose(i)">
            <span class="qz-mark" aria-hidden="true">{{ String.fromCharCode(65 + i) }}</span>
            <span class="qz-opt-text">{{ opt.text }}</span>
            <span v-if="answered && i === current.correctIndex" class="qz-icon">✓</span>
            <span v-else-if="answered && i === chosen" class="qz-icon">✗</span>
          </button>
        </li>
      </ul>

      <div v-if="answered" class="qz-feedback" :class="isCorrect ? 'ok' : 'bad'">
        <strong>{{ isCorrect ? t("academy.quiz.correct") : t("academy.quiz.notQuite") }}</strong>
        <p class="qz-fb-line">{{ current.options[chosen!].explanation }}</p>
        <p v-if="!isCorrect" class="qz-fb-correct">
          {{ t("academy.quiz.correctAnswer", { text: current.options[current.correctIndex].text }) }}
          <span class="muted"> — {{ current.options[current.correctIndex].explanation }}</span>
        </p>
      </div>

      <div class="qz-actions">
        <button class="btn primary" :disabled="!answered" @click="next">
          {{ isLastQuestion ? t("academy.quiz.seeResults") : t("academy.quiz.next") }}
        </button>
      </div>
    </section>

    <!-- Result screen (Feature 1G) -->
    <section v-else-if="result" class="panel qz-result" :class="result.passed ? 'passed' : 'failed'">
      <div class="qz-score" :class="result.passed ? 'pos' : 'warn'">{{ scorePct }}%</div>
      <div class="qz-score-sub muted">{{ result.score }} / {{ result.total }}</div>
      <div class="qz-verdict" :class="result.passed ? 'pos' : 'warn'">
        {{ result.passed ? t("academy.quiz.passed") : t("academy.quiz.notPassed") }}
      </div>

      <!-- Pass: explicit lesson-completed confirmation -->
      <p v-if="result.passed" class="qz-done pos">
        <svg viewBox="0 0 24 24" class="qz-ic"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2" /><path d="M8.5 12.5l2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {{ t("academy.quiz.lessonDone") }}
      </p>

      <p class="qz-result-note muted">
        <template v-if="result.passed">
          {{ t("academy.quiz.resultPass", { pct: passPctLabel }) }}
          <template v-if="chapter.level !== 'EXPERT'"> {{ t("academy.quiz.resultPassUnlock") }}</template>
        </template>
        <template v-else>
          {{ t("academy.quiz.resultFail", { pct: passPctLabel }) }}
        </template>
      </p>

      <!-- Fail: review of the questions answered wrong this run -->
      <div v-if="!result.passed && wrongAnswers.length" class="qz-wrong">
        <h3 class="qz-wrong-title">{{ t("academy.quiz.wrongTitle") }}</h3>
        <div v-for="(w, i) in wrongAnswers" :key="i" class="qz-wrong-item">
          <p class="qz-wrong-q">{{ w.prompt }}</p>
          <p class="qz-wrong-a neg">✗ {{ t("academy.quiz.yourAnswer", { text: w.your }) }}</p>
          <p class="qz-wrong-a pos">✓ {{ t("academy.quiz.correctAnswer", { text: w.correct }) }}</p>
        </div>
      </div>

      <!-- Attempt history: "Poging 1: 55% | Poging 2: 80% ✓" -->
      <div v-if="attemptHistory.length" class="qz-attempts">
        <span class="qz-attempts-title muted">{{ t("academy.quiz.attemptsTitle") }}:</span>
        <span v-for="a in attemptHistory" :key="a.n" class="qz-attempt" :class="{ passed: a.passed }">
          {{ t("academy.quiz.attemptLabel", { n: a.n, pct: a.pct }) }}<template v-if="a.passed"> ✓</template>
        </span>
      </div>

      <div class="qz-result-actions">
        <button v-if="!result.passed" class="btn accent qz-retry" @click="tryAgain">{{ t("academy.quiz.tryAgain") }}</button>
        <button class="btn qz-back-btn" :class="{ primary: result.passed }" @click="emit('overview')">
          {{ t("academy.quiz.back") }}
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.quiz { display: flex; flex-direction: column; gap: 14px; }
.qz-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.link-btn { background: none; border: 0; color: var(--accent); cursor: pointer; font: inherit; padding: 0; }
.link-btn:hover { text-decoration: underline; }
.qz-chap { font-weight: 600; }
.qz-progress { font-size: 13px; }

.qz-card { padding: 22px 26px; display: flex; flex-direction: column; gap: 16px; }
.qz-bar { height: 6px; background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; overflow: hidden; }
.qz-bar-fill { height: 100%; background: var(--accent); transition: width 0.25s ease; }
.qz-prompt { margin: 0; font-size: 18px; line-height: 1.5; }

.qz-options { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.qz-option {
  width: 100%; display: flex; align-items: center; gap: 12px;
  background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px;
  color: var(--text); padding: 12px 14px; cursor: pointer; font: inherit; text-align: left;
  transition: border-color 0.12s, background 0.12s;
}
.qz-option:hover:not(:disabled) { border-color: var(--accent); }
.qz-option:disabled { cursor: default; }
.qz-mark {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: #1b2536; border: 1px solid var(--line); font-size: 12px; font-weight: 700; color: var(--muted);
}
.qz-opt-text { flex: 1; line-height: 1.45; }
.qz-icon { font-weight: 800; font-size: 16px; }
.qz-option.correct { border-color: #1f5e42; background: rgba(47, 191, 113, 0.12); }
.qz-option.correct .qz-mark { background: #112a1d; border-color: #1f5e42; color: var(--pos); }
.qz-option.correct .qz-icon { color: var(--pos); }
.qz-option.wrong { border-color: #5e1f28; background: rgba(255, 93, 108, 0.12); }
.qz-option.wrong .qz-mark { background: #2a141a; border-color: #5e1f28; color: var(--neg); }
.qz-option.wrong .qz-icon { color: var(--neg); }
.qz-option.dim { opacity: 0.6; }

.qz-feedback { border-radius: 10px; padding: 12px 14px; border: 1px solid var(--line); }
.qz-feedback.ok { border-color: #1f5e42; background: rgba(47, 191, 113, 0.08); }
.qz-feedback.bad { border-color: #5e4a1f; background: rgba(245, 166, 35, 0.08); }
.qz-feedback strong { display: block; margin-bottom: 4px; }
.qz-feedback.ok strong { color: var(--pos); }
.qz-feedback.bad strong { color: var(--warn); }
.qz-fb-line, .qz-fb-correct { margin: 4px 0 0; font-size: 13px; line-height: 1.55; }

.qz-actions { display: flex; justify-content: flex-end; }

.qz-result { text-align: center; padding: 36px 28px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.qz-result.passed { border-color: #1f5e42; }
.qz-result.failed { border-color: #5e4a1f; }
.qz-score { font-size: 48px; font-weight: 800; font-family: ui-monospace, monospace; line-height: 1; }
.qz-score-sub { font-size: 14px; }
.qz-verdict { font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.qz-done { display: inline-flex; align-items: center; gap: 6px; margin: 0; font-weight: 700; font-size: 15px; }
.qz-ic { width: 18px; height: 18px; }
.qz-result-note { max-width: 460px; font-size: 13px; line-height: 1.55; }
.qz-result-actions { display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap; justify-content: center; }
/* Feature 1G: comfortable tap targets on the result actions (esp. retry). */
.qz-retry, .qz-back-btn { min-height: 44px; min-width: 44px; padding: 0 20px; }

/* Fail review: which questions were wrong */
.qz-wrong { text-align: left; width: 100%; max-width: 560px; display: flex; flex-direction: column; gap: 10px; }
.qz-wrong-title { margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
.qz-wrong-item { background: var(--panel-2); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }
.qz-wrong-q { margin: 0 0 6px; font-weight: 600; font-size: 13.5px; line-height: 1.45; }
.qz-wrong-a { margin: 2px 0 0; font-size: 13px; line-height: 1.45; }

/* Attempt history */
.qz-attempts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; font-size: 13px; }
.qz-attempts-title { font-weight: 600; }
.qz-attempt { background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 4px 12px; min-height: 28px; display: inline-flex; align-items: center; }
.qz-attempt.passed { color: var(--pos); border-color: #1f5e42; }
</style>
