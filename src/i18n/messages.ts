import en from "@/locales/en.json";
import nl from "@/locales/nl.json";
import tr from "@/locales/tr.json";
import { defaultLocale, type Locale } from "@/i18n/config";

/**
 * The raw, per-locale JSON trees, keyed by locale code - the single
 * place every other i18n module (client provider, server translations)
 * gets its messages from. English is the fallback source (see
 * `config.ts`'s doc comment), so every non-English tree is deep-merged
 * ON TOP of it in `getMessages()` below rather than used standalone -
 * that's what makes a key missing from `tr.json`/`nl.json` silently
 * render its English string instead of the raw key or blank text
 * ("Eğer bir çeviri eksikse, sistem otomatik olarak İngilizce'ye
 * fallback yapmalı").
 */
const rawMessages: Record<Locale, Messages> = { en, nl, tr };

/** Inferred from the English file, since it's the complete, authoritative key set every other locale is validated/merged against. */
export type Messages = typeof en;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Recursively overlays `override` onto `base`, keeping any `base` key `override` doesn't define - the fallback mechanism itself. Arrays and primitives in `override` fully replace `base`'s value (no attempt to merge arrays element-by-element). */
function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const overrideValue = override[key];
    const baseValue = base[key];
    result[key] = isPlainObject(baseValue) && isPlainObject(overrideValue) ? deepMerge(baseValue, overrideValue) : overrideValue;
  }
  return result as T;
}

const mergedCache = new Map<Locale, Messages>();

/** English-fallback-merged messages for one locale, computed once and cached (the JSON files are static per deploy, so this never needs to be recomputed after the first call). */
export function getMessages(locale: Locale): Messages {
  const cached = mergedCache.get(locale);
  if (cached) return cached;

  const merged = locale === defaultLocale ? rawMessages[defaultLocale] : deepMerge(rawMessages[defaultLocale], rawMessages[locale]);
  mergedCache.set(locale, merged);
  return merged;
}
