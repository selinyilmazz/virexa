import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";

/**
 * Site-wide 404 (Production Readiness phase - SEO Audit + Error
 * Handling: "Hiçbir sayfa beyaz ekran göstermesin"). Next.js's
 * `not-found.tsx` convention - rendered for any unmatched route, and for
 * any `notFound()` call from a Server Component. Only `/admin/*` has its
 * own separate shell (`app/admin/layout.tsx`); every other route falls
 * back to this one, styled like `EmptySearchState`/`EmptyState` (the
 * app's existing empty-state visual language) rather than a plain
 * Next.js default page.
 */

export const metadata: Metadata = {
  title: "Page Not Found | Virexa",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-[#f8fafc] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            🧭
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Page not found</h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
            The page you&apos;re looking for doesn&apos;t exist, or may have been moved.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </>
  );
}
