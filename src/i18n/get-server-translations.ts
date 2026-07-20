import { resolveServerLocale } from "@/i18n/resolve-locale.server";
import { getMessages } from "@/i18n/messages";
import { createTranslator, type TFunction } from "@/i18n/translate";
import type { Locale } from "@/i18n/config";

/**
 * The Server Component equivalent of `useTranslations()` - an async
 * Server Component calls `const { t } = await getServerTranslations();`
 * the same way it would call `getTranslations()` from a real i18n
 * library. Safe to call from many components on the same page:
 * `resolveServerLocale()` is `cache()`-wrapped, so the underlying
 * session/settings lookup only happens once per request regardless of
 * how many call sites there are.
 */
export async function getServerTranslations(): Promise<{ t: TFunction; locale: Locale }> {
  const locale = await resolveServerLocale();
  const messages = getMessages(locale);
  return { t: createTranslator(messages, locale), locale };
}
