"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "@/i18n/i18n-provider";

/**
 * Site-wide Error Boundary fallback (Production Readiness phase, Error
 * Handling requirement: "Hiçbir sayfa beyaz ekran göstermesin"). Next.js's
 * `error.tsx` convention, mirroring `app/admin/error.tsx`'s approach.
 * Must be a Client Component per Next.js's requirements - which is also
 * why it renders a minimal brand-only header inline instead of importing
 * the full `Header` component: `Header` is a Server Component that reads
 * the request's locale via `next/headers` (`getServerTranslations()`),
 * and Server Components using server-only APIs cannot be bundled into a
 * Client Component's module graph. This page still renders inside the
 * root layout's `<I18nProvider>`, so its own text uses the regular
 * client-side `useTranslations()` hook and stays fully localized. In
 * practice this should rarely fire - every service in `src/services/**`
 * already catches its own errors and returns a safe fallback - this is
 * the last line of defense for anything genuinely unexpected.
 */
export default function GlobalPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations();

  useEffect(() => {
    console.error("[app] page error:", error);
  }, [error]);

  return (
    <>
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-24 max-w-[1920px] items-center px-5 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[#2f67e8]" aria-label={t("nav.logoAria")}>
            <svg aria-hidden="true" viewBox="0 0 64 56" className="h-10 w-12 sm:h-11 sm:w-13" fill="none">
              <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
              <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
              <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
            </svg>
            <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Virexa</span>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center bg-[#f8fafc] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            ⚠️
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">{t("errors.pageTitle")}</h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">{t("errors.pageDescription")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
            >
              {t("errors.tryAgain")}
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              {t("errors.backToHome")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
