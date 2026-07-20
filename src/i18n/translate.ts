import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages";

export type TranslateValues = Record<string, string | number>;
export type TFunction = (key: string, values?: TranslateValues) => string;

function resolvePath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, source);
}

/** `{name}`-style placeholder substitution - the same convention both `en.json`/`tr.json`/`nl.json` and every call site use (e.g. `t("footer.copyright", { year })`). */
function interpolate(template: string, values?: TranslateValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/**
 * Builds a `t()` function bound to one locale's messages. Shared by both
 * the client provider (`i18n-provider.tsx`) and the server helper
 * (`get-server-translations.ts`) so the lookup/fallback/interpolation
 * logic exists exactly once.
 *
 * Missing keys never crash or render blank - they log a warning (dev
 * visibility into untranslated strings) and return the key itself, a
 * deliberately obvious placeholder that's easy to spot while auditing
 * ("hardcoded string kalmamalı") without breaking the page for a real
 * visitor the way a thrown error would.
 */
export function createTranslator(messages: Messages, locale: Locale): TFunction {
  return function t(key, values) {
    const found = resolvePath(messages, key);
    if (typeof found === "string") return interpolate(found, values);

    console.warn(`[i18n] Missing translation key "${key}" for locale "${locale}".`);
    return key;
  };
}
