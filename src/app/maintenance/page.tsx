import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Under Maintenance | Virexa",
};

/**
 * Admin Panel: Settings - "Maintenance Mode" toggle (requirement 12).
 * Shown to every non-admin visitor while `site_settings.maintenance_mode`
 * is on (see `src/middleware.ts`'s redirect). A minimal, standalone page
 * - no `Header` import, since `Header` reads user/auth state that isn't
 * relevant here and every other route is currently unreachable anyway.
 * Visual language matches `app/error.tsx`'s centered-card pattern.
 */
export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex min-h-24 max-w-[1920px] items-center px-5 py-3 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[#2f67e8]" aria-label="Virexa home">
            <svg aria-hidden="true" viewBox="0 0 64 56" className="h-10 w-12 sm:h-11 sm:w-13" fill="none">
              <path d="M3 4h16l14 26L47 4h14L38 52H24L3 4Z" fill="currentColor" />
              <path d="m35 18 7-13h13l-8 13H35Z" fill="currentColor" />
              <path d="M48 17h10v10H48zM55 3h7v7h-7z" fill="currentColor" />
            </svg>
            <span className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Virexa</span>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            🛠️
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">We&apos;ll be right back</h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
            Virexa is currently undergoing scheduled maintenance. Please check back shortly.
          </p>
        </div>
      </div>
    </main>
  );
}
