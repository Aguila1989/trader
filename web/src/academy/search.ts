// Feature 5 — client-side Academy search. Pure functions over the static
// curriculum already loaded in the browser (no API, no fetch, no user data).
import type { Chapter, Level } from "./types";

export interface SearchResult {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  level: Level;
  lessonId: string;
  lessonTitle: string;
  /** A short excerpt of the matching field, containing the query. */
  excerpt: string;
}

/** Minimum query length before searching (1 char matches everything). */
export const MIN_QUERY = 2;
const EXCERPT_RADIUS = 60;

/** Field that matched, in descending relevance — drives result ordering. */
const RANK = { title: 0, body: 1, quiz: 2, chapter: 3 } as const;
type Field = keyof typeof RANK;

/** A trimmed excerpt centred on the first match of `q` within `text`. */
function makeExcerpt(text: string, q: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  const idx = clean.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return clean.slice(0, EXCERPT_RADIUS * 2);
  const start = Math.max(0, idx - EXCERPT_RADIUS);
  const end = Math.min(clean.length, idx + q.length + EXCERPT_RADIUS);
  return (start > 0 ? "…" : "") + clean.slice(start, end).trim() + (end < clean.length ? "…" : "");
}

/**
 * Search every lesson across all chapters. Matches (case-insensitive) against:
 * lesson title, lesson body (paragraphs + example), chapter title, chapter
 * description, and quiz prompts. Returns at most one result per lesson, ordered
 * by match relevance (title > body > quiz > chapter), then by chapter order.
 */
export function searchLessons(chapters: Chapter[], rawQuery: string): SearchResult[] {
  const q = rawQuery.trim().toLowerCase();
  if (q.length < MIN_QUERY) return [];

  const ranked: { result: SearchResult; rank: number }[] = [];
  for (const ch of chapters) {
    const titleHay = ch.title.toLowerCase();
    const descHay = ch.description.toLowerCase();
    const quizText = ch.quiz.map((qq) => qq.prompt).join(" • ");
    const quizHay = quizText.toLowerCase();

    for (const lesson of ch.lessons) {
      const body = `${lesson.paragraphs.join(" ")} ${lesson.example}`;
      const matched: Field | null =
        lesson.title.toLowerCase().includes(q)
          ? "title"
          : body.toLowerCase().includes(q)
            ? "body"
            : quizHay.includes(q)
              ? "quiz"
              : titleHay.includes(q) || descHay.includes(q)
                ? "chapter"
                : null;
      if (!matched) continue;

      const source =
        matched === "title"
          ? lesson.title
          : matched === "body"
            ? body
            : matched === "quiz"
              ? quizText
              : `${ch.title} — ${ch.description}`;

      ranked.push({
        rank: RANK[matched],
        result: {
          chapterId: ch.id,
          chapterNumber: ch.number,
          chapterTitle: ch.title,
          level: ch.level,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          excerpt: makeExcerpt(source, q),
        },
      });
    }
  }

  ranked.sort((a, b) => a.rank - b.rank || a.result.chapterNumber - b.result.chapterNumber);
  return ranked.map((r) => r.result);
}

/**
 * Split `text` into highlight segments around case-insensitive matches of
 * `rawQuery`. The template renders `hit` parts in <mark> — never via v-html, so
 * the (user-typed) query can never inject markup.
 */
export function highlightParts(
  text: string,
  rawQuery: string,
): { text: string; hit: boolean }[] {
  const q = rawQuery.trim();
  if (!q) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx < 0) {
      parts.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), hit: false });
    parts.push({ text: text.slice(idx, idx + q.length), hit: true });
    i = idx + q.length;
  }
  return parts;
}
