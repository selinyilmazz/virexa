"use client";

import { createContext, useContext, useMemo } from "react";
import { getMessages } from "@/i18n/messages";
import { createTranslator, type TFunction } from "@/i18n/translate";
import type { Locale } from "@/i18n/config";

type I18nContextValue = {
  locale: Locale;
  t: TFunction;
};

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Client-side translation context - wraps the whole app from
 * `app/layout.tsx` (a Server Component, passing down the
 * `resolveServerLocale()`-resolved locale as a prop) so every Client
 * Component in the tree can call `useTranslations()`/`useLocale()`
 * without prop-drilling. Server Components can't consume this context
 * at all (they render before hydration) - they use
 * `getServerTranslations()` instead, which computes the exact same `t`
 * from the exact same `resolveServerLocale()` value independently. Both
 * paths are kept in sync because the initial `locale` passed here IS
 * that same server-resolved value - the client never re-resolves it out
 * of band.
 *
 * Re-computing `t`/`messages` only happens when `locale` itself changes
 * (`useMemo`), which in practice means: after a language change, once
 * `router.refresh()` re-renders `RootLayout` with the new
 * `resolveServerLocale()` result and that new `locale` prop flows back
 * down here.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18nContextValue>(() => {
    const messages = getMessages(locale);
    return { locale, t: createTranslator(messages, locale) };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function useI18nContext(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslations/useLocale must be used within <I18nProvider>.");
  return ctx;
}

/** Client Component translation hook - mirrors `getServerTranslations()`'s `t` for Server Components. */
export function useTranslations(): TFunction {
  return useI18nContext().t;
}

export function useLocale(): Locale {
  return useI18nContext().locale;
}
