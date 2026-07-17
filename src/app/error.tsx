"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";

/**
 * Site-wide Error Boundary fallback (Production Readiness phase, Error
 * Handling requirement: "Hiçbir sayfa beyaz ekran göstermesin"). Next.js's
 * `error.tsx` convention, mirroring `app/admin/error.tsx`'s approach but
 * styled for the public site and rendering the public `Header` (the
 * admin one keeps its own sidebar/header shell mounted separately).
 * Must be a Client Component per Next.js's requirements. In practice this
 * should rarely fire - every service in `src/services/**` already
 * catches its own errors and returns a safe fallback - this is the last
 * line of defense for anything genuinely unexpected.
 */
export default function GlobalPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[app] page error:", error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center justify-center bg-[#f8fafc] px-5 py-16 sm:px-8">
        <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <span aria-hidden="true" className="flex size-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
            ⚠️
          </span>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">Something went wrong</h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-slate-500">
            An unexpected error occurred while loading this page. You can try again, or head back to the homepage.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#2f67e8]/40 hover:text-[#2f67e8]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
