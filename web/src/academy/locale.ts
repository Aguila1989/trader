// Academy locale — now a thin adapter over the app-wide vue-i18n locale, so the
// whole app and the Academy always share one language. (Originally a standalone
// ref; this is the seam that was designed to delegate to global i18n once it
// existed.) The public shape — useLocale() -> { locale, setLocale } — is
// unchanged, so the Academy components did not need to change.
import { computed, type ComputedRef } from "vue";
import { i18nGlobal, setLocale as setAppLocale, SUPPORTED_LOCALES } from "../i18n";
import type { Locale } from "./types";

export function useLocale(): {
  locale: ComputedRef<Locale>;
  setLocale: (l: Locale) => void;
} {
  const locale = computed<Locale>(() => {
    const l = i18nGlobal.locale.value as Locale;
    return (SUPPORTED_LOCALES as string[]).includes(l) ? l : "en";
  });
  function setLocale(l: Locale): void {
    setAppLocale(l);
  }
  return { locale, setLocale };
}
