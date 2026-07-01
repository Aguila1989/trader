// Curriculum index — assembles the statically-authored chapter files, per
// locale, into the ordered lists the Academy renders. Each chapter lives in its
// own file under ./content/<locale>/ so authoring and translation stay isolated.
//
// English is the source language and the fallback: any locale missing a chapter
// falls back to English so the app always renders something.
import type { Chapter, Level, Locale } from "./types";
import { LEVELS } from "./types";

// --- English (source) -------------------------------------------------------
import { chapter01 as en01 } from "./content/en/chapter01";
import { chapter02 as en02 } from "./content/en/chapter02";
import { chapter03 as en03 } from "./content/en/chapter03";
import { chapter04 as en04 } from "./content/en/chapter04";
import { chapter05 as en05 } from "./content/en/chapter05";
import { chapter06 as en06 } from "./content/en/chapter06";
import { chapter07 as en07 } from "./content/en/chapter07";
import { chapter08 as en08 } from "./content/en/chapter08";
import { chapter09 as en09 } from "./content/en/chapter09";
import { chapter10 as en10 } from "./content/en/chapter10";
import { chapter11 as en11 } from "./content/en/chapter11";
import { chapter12 as en12 } from "./content/en/chapter12";
import { chapter13 as en13 } from "./content/en/chapter13";
import { chapter14 as en14 } from "./content/en/chapter14";
import { chapter15 as en15 } from "./content/en/chapter15";
import { chapter16 as en16 } from "./content/en/chapter16";
import { chapter17 as en17 } from "./content/en/chapter17";
import { chapter18 as en18 } from "./content/en/chapter18";
import { chapter19 as en19 } from "./content/en/chapter19";
import { chapter20 as en20 } from "./content/en/chapter20";
import { chapter21 as en21 } from "./content/en/chapter21";

// --- Dutch ------------------------------------------------------------------
import { chapter01 as nl01 } from "./content/nl/chapter01";
import { chapter02 as nl02 } from "./content/nl/chapter02";
import { chapter03 as nl03 } from "./content/nl/chapter03";
import { chapter04 as nl04 } from "./content/nl/chapter04";
import { chapter05 as nl05 } from "./content/nl/chapter05";
import { chapter06 as nl06 } from "./content/nl/chapter06";
import { chapter07 as nl07 } from "./content/nl/chapter07";
import { chapter08 as nl08 } from "./content/nl/chapter08";
import { chapter09 as nl09 } from "./content/nl/chapter09";
import { chapter10 as nl10 } from "./content/nl/chapter10";
import { chapter11 as nl11 } from "./content/nl/chapter11";
import { chapter12 as nl12 } from "./content/nl/chapter12";
import { chapter13 as nl13 } from "./content/nl/chapter13";
import { chapter14 as nl14 } from "./content/nl/chapter14";
import { chapter15 as nl15 } from "./content/nl/chapter15";
import { chapter16 as nl16 } from "./content/nl/chapter16";
import { chapter17 as nl17 } from "./content/nl/chapter17";
import { chapter18 as nl18 } from "./content/nl/chapter18";
import { chapter19 as nl19 } from "./content/nl/chapter19";
import { chapter20 as nl20 } from "./content/nl/chapter20";
import { chapter21 as nl21 } from "./content/nl/chapter21";

// --- French -----------------------------------------------------------------
import { chapter01 as fr01 } from "./content/fr/chapter01";
import { chapter02 as fr02 } from "./content/fr/chapter02";
import { chapter03 as fr03 } from "./content/fr/chapter03";
import { chapter04 as fr04 } from "./content/fr/chapter04";
import { chapter05 as fr05 } from "./content/fr/chapter05";
import { chapter06 as fr06 } from "./content/fr/chapter06";
import { chapter07 as fr07 } from "./content/fr/chapter07";
import { chapter08 as fr08 } from "./content/fr/chapter08";
import { chapter09 as fr09 } from "./content/fr/chapter09";
import { chapter10 as fr10 } from "./content/fr/chapter10";
import { chapter11 as fr11 } from "./content/fr/chapter11";
import { chapter12 as fr12 } from "./content/fr/chapter12";
import { chapter13 as fr13 } from "./content/fr/chapter13";
import { chapter14 as fr14 } from "./content/fr/chapter14";
import { chapter15 as fr15 } from "./content/fr/chapter15";
import { chapter16 as fr16 } from "./content/fr/chapter16";
import { chapter17 as fr17 } from "./content/fr/chapter17";
import { chapter18 as fr18 } from "./content/fr/chapter18";
import { chapter19 as fr19 } from "./content/fr/chapter19";
import { chapter20 as fr20 } from "./content/fr/chapter20";
import { chapter21 as fr21 } from "./content/fr/chapter21";

// --- Spanish ----------------------------------------------------------------
import { chapter01 as es01 } from "./content/es/chapter01";
import { chapter02 as es02 } from "./content/es/chapter02";
import { chapter03 as es03 } from "./content/es/chapter03";
import { chapter04 as es04 } from "./content/es/chapter04";
import { chapter05 as es05 } from "./content/es/chapter05";
import { chapter06 as es06 } from "./content/es/chapter06";
import { chapter07 as es07 } from "./content/es/chapter07";
import { chapter08 as es08 } from "./content/es/chapter08";
import { chapter09 as es09 } from "./content/es/chapter09";
import { chapter10 as es10 } from "./content/es/chapter10";
import { chapter11 as es11 } from "./content/es/chapter11";
import { chapter12 as es12 } from "./content/es/chapter12";
import { chapter13 as es13 } from "./content/es/chapter13";
import { chapter14 as es14 } from "./content/es/chapter14";
import { chapter15 as es15 } from "./content/es/chapter15";
import { chapter16 as es16 } from "./content/es/chapter16";
import { chapter17 as es17 } from "./content/es/chapter17";
import { chapter18 as es18 } from "./content/es/chapter18";
import { chapter19 as es19 } from "./content/es/chapter19";
import { chapter20 as es20 } from "./content/es/chapter20";
import { chapter21 as es21 } from "./content/es/chapter21";

// Academy content expansion (chapters 22–37 + the Chapter-12 microstructure
// extension), authored under ./content/<locale>/pending/ and aggregated in
// ./pending. New chapters append to the end of each locale list (so they land at
// the tail of their level group); the C12 extension is spliced onto chapter 12.
import {
  PENDING_EN,
  PENDING_NL,
  PENDING_FR,
  PENDING_ES,
  C12_EXT_LESSONS,
  C12_EXT_QUIZ,
} from "./pending";

/** Splice the C12 microstructure lessons/quiz onto the Advanced Stellar Features
 *  chapter for a locale, without editing the chapter12 source files. */
function withC12Ext(ch12: Chapter, loc: "en" | "nl" | "fr" | "es"): Chapter {
  return {
    ...ch12,
    lessons: [...ch12.lessons, ...C12_EXT_LESSONS[loc]],
    quiz: [...ch12.quiz, ...C12_EXT_QUIZ[loc]],
  };
}

const EN: Chapter[] = [en01, en02, en03, en04, en05, en06, en07, en08, en09, en10, en11, withC12Ext(en12, "en"), en13, en14, en15, en16, en17, en18, en19, en20, en21, ...PENDING_EN];
const NL: Chapter[] = [nl01, nl02, nl03, nl04, nl05, nl06, nl07, nl08, nl09, nl10, nl11, withC12Ext(nl12, "nl"), nl13, nl14, nl15, nl16, nl17, nl18, nl19, nl20, nl21, ...PENDING_NL];
const FR: Chapter[] = [fr01, fr02, fr03, fr04, fr05, fr06, fr07, fr08, fr09, fr10, fr11, withC12Ext(fr12, "fr"), fr13, fr14, fr15, fr16, fr17, fr18, fr19, fr20, fr21, ...PENDING_FR];
const ES: Chapter[] = [es01, es02, es03, es04, es05, es06, es07, es08, es09, es10, es11, withC12Ext(es12, "es"), es13, es14, es15, es16, es17, es18, es19, es20, es21, ...PENDING_ES];

// Any locale missing (or with an incomplete) list falls back to English.
const BY_LOCALE: Partial<Record<Locale, Chapter[]>> = {
  en: EN,
  nl: NL,
  fr: FR,
  es: ES,
};

/** Chapters for a locale, in curriculum order (English fallback). */
export function getChapters(locale: Locale): Chapter[] {
  const list = BY_LOCALE[locale];
  return list && list.length ? list : EN;
}

/** One chapter by id for a locale (English fallback). */
export function getChapterById(locale: Locale, id: string): Chapter | null {
  return getChapters(locale).find((c) => c.id === id) ?? null;
}

/** Levels paired with their chapters for a locale — drives the grouped landing. */
export function getChapterGroups(
  locale: Locale,
): { level: Level; chapters: Chapter[] }[] {
  const chapters = getChapters(locale);
  return LEVELS.map((level) => ({
    level,
    chapters: chapters.filter((c) => c.level === level),
  }));
}

/**
 * Locale-independent structural index (ids, levels, lesson counts are identical
 * across translations). Progress gating and per-level stats use THIS so that a
 * quiz passed in one language stays passed in every language.
 */
export const CHAPTER_INDEX: { id: string; level: Level; lessonCount: number }[] =
  EN.map((c) => ({ id: c.id, level: c.level, lessonCount: c.lessons.length }));
