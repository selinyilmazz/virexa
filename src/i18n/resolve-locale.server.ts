import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSettingsRepository } from "@/repositories/settings-repository";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/config";

/**
 * Server-side locale resolution for the current request - the one
 * function every Server Component's translations ultimately come from
 * (`get-server-translations.ts`) and what the root layout uses for
 * `<html lang>`.
 *
 * Priority order, matching the requirement "Kullanıcının kaydedilmiş
 * dil tercihi giriş yapıldığında veya sayfa yenilendiğinde otomatik
 * yüklenmeli":
 *
 *  1. The signed-in user's `user_settings.language` (durable, synced
 *     across every device/browser they sign into - no cookie required,
 *     no stale-cache edge cases, works the instant they log in
 *     anywhere).
 *  2. The `virexa_locale` cookie (anonymous visitors, or a brief window
 *     before a freshly-changed preference has round-tripped to the DB -
 *     see `actions.ts`, which sets both together).
 *  3. `defaultLocale` ("en") if neither is available/valid.
 *
 * Wrapped in React's `cache()` so this only runs ONCE per request no
 * matter how many Server Components call `getServerTranslations()` -
 * without this, a page like the homepage (Hero, BreakingNews,
 * LatestNews, TrendingTopics, CompanyTicker, MostRead, ...) would issue
 * a separate `user_settings` query per section. Never throws - a
 * transient Supabase hiccup here must not take down the page, same
 * "defensive try/catch, fall back to a safe default" convention
 * `app/layout.tsx`'s own session resolution already uses.
 */
export const resolveServerLocale = cache(async (): Promise<Locale> => {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const settings = await createSettingsRepository(supabase).get(session.user.id);
      if (isLocale(settings?.language)) return settings.language;
    }
  } catch (error) {
    console.error("[i18n] Failed to resolve locale from user settings:", error);
  }

  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) return cookieLocale;
  } catch (error) {
    console.error("[i18n] Failed to read locale cookie:", error);
  }

  return defaultLocale;
});
