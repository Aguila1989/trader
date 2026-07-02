// Academy expansion (chapters 22-37 + C12 extension) - integrated live via content.ts / glossary.ts / pending.ts.
// Drop-in registry for the Academy content expansion: 16 new chapters
// (c22–c37) across all four locales, plus a two-lesson extension to Chapter 12
// (c12-l6 maker/taker, c12-l7 price impact). NOTHING in the live app imports
// this file, so all of it stays dark until integration. At green-light, wire it
// in per the checklist (add the chapters to content.ts, merge glossary.pending
// into glossary.ts, and splice the C12 extension into chapter12.ts).
//
// Chapter files export `chapterNN: Chapter & { whoFor: string }` — the extra
// per-chapter `whoFor` one-liner is assignable to Chapter and simply carried at
// runtime until ChapterOverview renders it (see checklist step for whoFor).
import type { Chapter, Lesson, Locale, QuizQuestion } from "./types";

// --- English ----------------------------------------------------------------
import { chapter22 as en22 } from "./content/en/chapter22";
import { chapter23 as en23 } from "./content/en/chapter23";
import { chapter24 as en24 } from "./content/en/chapter24";
import { chapter25 as en25 } from "./content/en/chapter25";
import { chapter26 as en26 } from "./content/en/chapter26";
import { chapter27 as en27 } from "./content/en/chapter27";
import { chapter28 as en28 } from "./content/en/chapter28";
import { chapter29 as en29 } from "./content/en/chapter29";
import { chapter30 as en30 } from "./content/en/chapter30";
import { chapter31 as en31 } from "./content/en/chapter31";
import { chapter32 as en32 } from "./content/en/chapter32";
import { chapter33 as en33 } from "./content/en/chapter33";
import { chapter34 as en34 } from "./content/en/chapter34";
import { chapter35 as en35 } from "./content/en/chapter35";
import { chapter36 as en36 } from "./content/en/chapter36";
import { chapter37 as en37 } from "./content/en/chapter37";
import { c12ExtraLessons as en12L, c12ExtraQuiz as en12Q } from "./content/en/chapter12-ext";

// --- Dutch ------------------------------------------------------------------
import { chapter22 as nl22 } from "./content/nl/chapter22";
import { chapter23 as nl23 } from "./content/nl/chapter23";
import { chapter24 as nl24 } from "./content/nl/chapter24";
import { chapter25 as nl25 } from "./content/nl/chapter25";
import { chapter26 as nl26 } from "./content/nl/chapter26";
import { chapter27 as nl27 } from "./content/nl/chapter27";
import { chapter28 as nl28 } from "./content/nl/chapter28";
import { chapter29 as nl29 } from "./content/nl/chapter29";
import { chapter30 as nl30 } from "./content/nl/chapter30";
import { chapter31 as nl31 } from "./content/nl/chapter31";
import { chapter32 as nl32 } from "./content/nl/chapter32";
import { chapter33 as nl33 } from "./content/nl/chapter33";
import { chapter34 as nl34 } from "./content/nl/chapter34";
import { chapter35 as nl35 } from "./content/nl/chapter35";
import { chapter36 as nl36 } from "./content/nl/chapter36";
import { chapter37 as nl37 } from "./content/nl/chapter37";
import { c12ExtraLessons as nl12L, c12ExtraQuiz as nl12Q } from "./content/nl/chapter12-ext";

// --- French -----------------------------------------------------------------
import { chapter22 as fr22 } from "./content/fr/chapter22";
import { chapter23 as fr23 } from "./content/fr/chapter23";
import { chapter24 as fr24 } from "./content/fr/chapter24";
import { chapter25 as fr25 } from "./content/fr/chapter25";
import { chapter26 as fr26 } from "./content/fr/chapter26";
import { chapter27 as fr27 } from "./content/fr/chapter27";
import { chapter28 as fr28 } from "./content/fr/chapter28";
import { chapter29 as fr29 } from "./content/fr/chapter29";
import { chapter30 as fr30 } from "./content/fr/chapter30";
import { chapter31 as fr31 } from "./content/fr/chapter31";
import { chapter32 as fr32 } from "./content/fr/chapter32";
import { chapter33 as fr33 } from "./content/fr/chapter33";
import { chapter34 as fr34 } from "./content/fr/chapter34";
import { chapter35 as fr35 } from "./content/fr/chapter35";
import { chapter36 as fr36 } from "./content/fr/chapter36";
import { chapter37 as fr37 } from "./content/fr/chapter37";
import { c12ExtraLessons as fr12L, c12ExtraQuiz as fr12Q } from "./content/fr/chapter12-ext";

// --- Spanish ----------------------------------------------------------------
import { chapter22 as es22 } from "./content/es/chapter22";
import { chapter23 as es23 } from "./content/es/chapter23";
import { chapter24 as es24 } from "./content/es/chapter24";
import { chapter25 as es25 } from "./content/es/chapter25";
import { chapter26 as es26 } from "./content/es/chapter26";
import { chapter27 as es27 } from "./content/es/chapter27";
import { chapter28 as es28 } from "./content/es/chapter28";
import { chapter29 as es29 } from "./content/es/chapter29";
import { chapter30 as es30 } from "./content/es/chapter30";
import { chapter31 as es31 } from "./content/es/chapter31";
import { chapter32 as es32 } from "./content/es/chapter32";
import { chapter33 as es33 } from "./content/es/chapter33";
import { chapter34 as es34 } from "./content/es/chapter34";
import { chapter35 as es35 } from "./content/es/chapter35";
import { chapter36 as es36 } from "./content/es/chapter36";
import { chapter37 as es37 } from "./content/es/chapter37";
import { c12ExtraLessons as es12L, c12ExtraQuiz as es12Q } from "./content/es/chapter12-ext";

/** New chapters (c22–c37), in curriculum order, per locale. */
export const PENDING_EN: Chapter[] = [en22, en23, en24, en25, en26, en27, en28, en29, en30, en31, en32, en33, en34, en35, en36, en37];
export const PENDING_NL: Chapter[] = [nl22, nl23, nl24, nl25, nl26, nl27, nl28, nl29, nl30, nl31, nl32, nl33, nl34, nl35, nl36, nl37];
export const PENDING_FR: Chapter[] = [fr22, fr23, fr24, fr25, fr26, fr27, fr28, fr29, fr30, fr31, fr32, fr33, fr34, fr35, fr36, fr37];
export const PENDING_ES: Chapter[] = [es22, es23, es24, es25, es26, es27, es28, es29, es30, es31, es32, es33, es34, es35, es36, es37];

/** New chapters keyed by locale — append each to the matching array in content.ts. */
export const PENDING_BY_LOCALE: Partial<Record<Locale, Chapter[]>> = {
  en: PENDING_EN,
  nl: PENDING_NL,
  fr: PENDING_FR,
  es: PENDING_ES,
};

/** Chapter-12 extension: append these to chapter12.lessons[] (after c12-l5), per locale. */
export const C12_EXT_LESSONS: Record<"en" | "nl" | "fr" | "es", Lesson[]> = {
  en: en12L,
  nl: nl12L,
  fr: fr12L,
  es: es12L,
};

/** Chapter-12 extension: append these to chapter12.quiz[] (after c12-q5), per locale. */
export const C12_EXT_QUIZ: Record<"en" | "nl" | "fr" | "es", QuizQuestion[]> = {
  en: en12Q,
  nl: nl12Q,
  fr: fr12Q,
  es: es12Q,
};
