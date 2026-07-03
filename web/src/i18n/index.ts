// App-wide i18n (vue-i18n). Message catalogs live in ./messages/<namespace>.ts,
// each default-exporting { en, nl, fr, es }. They are auto-merged here by
// filename, so adding a new namespace is just dropping a file in that folder —
// no edit to this file required.
import { createI18n } from "vue-i18n";

export type Locale = "en" | "nl" | "fr" | "es";
export const SUPPORTED_LOCALES: Locale[] = ["en", "nl", "fr", "es"];
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  nl: "Nederlands",
  fr: "Français",
  es: "Español",
};

// A nested catalog of strings (vue-i18n's message-tree shape).
type MessageTree = { [key: string]: string | MessageTree };
type Fragment = Record<Locale, MessageTree>;

const modules = import.meta.glob<{ default: Fragment }>("./messages/*.ts", {
  eager: true,
});

const messages: Record<Locale, MessageTree> = { en: {}, nl: {}, fr: {}, es: {} };
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.slice(path.lastIndexOf("/") + 1, -3); // "./messages/foo.ts" -> "foo"
  const frag = mod.default;
  for (const loc of SUPPORTED_LOCALES) {
    messages[loc][ns] = frag?.[loc] ?? {};
  }
}

const STORAGE_KEY = "app_locale";

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    /* private mode */
  }
  try {
    const nav = navigator.language?.slice(0, 2).toLowerCase() as Locale;
    if (SUPPORTED_LOCALES.includes(nav)) return nav;
  } catch {
    /* SSR / no navigator */
  }
  return "en";
}

const initialLocale = detectLocale();

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "en",
  messages,
});

// Reflect the initial locale on <html lang> (setLocale handles later changes).
try {
  document.documentElement.lang = initialLocale;
} catch {
  /* no document */
}

export default i18n;

// In composition mode i18n.global is a Composer whose `locale` is a writable
// ref, but the public type is a Composer|VueI18n union. Narrow it once here so
// reads (reactive .value) and writes are clean everywhere.
export const i18nGlobal = i18n.global as unknown as {
  locale: { value: string };
};

/** Set the active locale everywhere and persist it. */
export function setLocale(locale: Locale): void {
  if (!SUPPORTED_LOCALES.includes(locale)) return;
  i18nGlobal.locale.value = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* still works for the session */
  }
  try {
    document.documentElement.lang = locale;
  } catch {
    /* no document */
  }
}

// AUDIT-037: currentLocale() was removed — every call site reads
// i18nGlobal.locale.value directly (or uses the useI18n() composable).
