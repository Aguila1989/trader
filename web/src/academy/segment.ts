// Splits lesson prose into plain-text and glossary-term segments so the lesson
// view can wrap the FIRST occurrence of each technical term in an expandable
// "What does this mean?" tooltip. Matching is whole-word, case-insensitive,
// longest-term-first, and first-occurrence-only per lesson (the caller threads a
// shared `used` set across all paragraphs + the example).
import type { Glossary } from "./glossary";

export type Segment =
  | { kind: "text"; text: string }
  | { kind: "term"; id: string; term: string; def: string };

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word, case-insensitive index of `term` in `text` (Unicode-aware). -1 if absent. */
function wholeWordIndex(text: string, term: string): number {
  try {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term)}(?![\\p{L}\\p{N}])`, "iu");
    const m = re.exec(text);
    return m ? m.index : -1;
  } catch {
    // Environments without lookbehind: fall back to a simple case-insensitive find.
    return text.toLowerCase().indexOf(term.toLowerCase());
  }
}

/**
 * Segment `text` against `glossary`, marking matched term ids in `used` so each
 * term is linked only once per lesson. Terms already in `used` are skipped.
 */
export function segmentText(text: string, glossary: Glossary, used: Set<string>): Segment[] {
  const entries = Object.entries(glossary)
    .map(([id, e]) => ({ id, term: e.term, def: e.def }))
    .sort((a, b) => b.term.length - a.term.length);

  const segs: Segment[] = [];
  let rest = text;
  // Cap iterations defensively (term count) to avoid any pathological loop.
  for (let guard = 0; guard < 200 && rest.length; guard++) {
    let best: { index: number; id: string; term: string; def: string } | null = null;
    for (const e of entries) {
      if (used.has(e.id)) continue;
      const idx = wholeWordIndex(rest, e.term);
      if (idx < 0) continue;
      if (
        best === null ||
        idx < best.index ||
        (idx === best.index && e.term.length > best.term.length)
      ) {
        best = { index: idx, id: e.id, term: rest.substr(idx, e.term.length), def: e.def };
      }
    }
    if (!best) {
      segs.push({ kind: "text", text: rest });
      return segs;
    }
    if (best.index > 0) segs.push({ kind: "text", text: rest.slice(0, best.index) });
    segs.push({ kind: "term", id: best.id, term: best.term, def: best.def });
    used.add(best.id);
    rest = rest.slice(best.index + best.term.length);
  }
  if (rest.length) segs.push({ kind: "text", text: rest });
  return segs;
}
