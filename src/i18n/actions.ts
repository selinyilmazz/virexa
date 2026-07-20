"use server";

import { cookies } from "next/headers";
import { isLocale, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/i18n/config";

/**
 * Sets the `virexa_locale` cookie from a Server Action - the piece that
 * makes a language change take effect for the CURRENT request cycle
 * without requiring a new sign-in ("dil değişikliği yeni bir girişe
 * gerek kalmadan anında güncellenmeli"). Called from
 * `LanguageSelect.tsx` right before `router.refresh()`, and also from
 * `SettingsForm.tsx`'s save flow alongside the existing
 * `saveSettings()` DB write - the cookie keeps anonymous/not-yet-synced
 * requests correct, `resolveServerLocale()`'s DB-first lookup is what
 * makes it durable across devices once signed in (see that file's doc
 * comment).
 *
 * A plain exported Server Action rather than a Route Handler: Next.js
 * Server Actions can set cookies directly (Route Handlers can too, but
 * this reads more naturally as "the client called a function," matching
 * every other client-facing write in this app, e.g. `saveSettings()`).
 * Deliberately does nothing else - no DB write, no redirect - so it's
 * safe to call from any client context, signed in or not.
 */
export async function setLocaleCookie(locale: Locale): Promise<void> {
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
}
