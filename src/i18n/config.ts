/**
 * i18n configuration - the three languages Virexa supports today
 * (English default, Turkish, Dutch). Adding a fourth language later
 * means: add its code here, add `src/locales/<code>.json`, add it to
 * `localeLabels` - nothing else in the i18n system needs to change,
 * every consumer (`resolve-locale.server.ts`, `messages.ts`,
 * `LanguageSelect.tsx`) reads from this one file.
 */
export const locales = ["en", "tr", "nl"] as const;

export type Locale = (typeof locales)[number];

/** English is the source-of-truth locale: every other locale's messages are deep-merged ON TOP of English (see `messages.ts`), so a key missing from `tr.json`/`nl.json` silently falls back to its English string rather than rendering blank or a raw key. */
export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
  nl: "Nederlands",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  tr: "🇹🇷",
  nl: "🇳🇱",
};

/** Cookie the whole i18n system treats as the anonymous-visitor / fast-path locale signal. Signed-in users' `user_settings.language` (the durable, cross-device preference) always takes priority over this when both are available - see `resolve-locale.server.ts`. 1 year, readable by client JS (not httpOnly) so the language switcher can update it optimistically before the server round-trip completes. */
export const LOCALE_COOKIE = "virexa_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
