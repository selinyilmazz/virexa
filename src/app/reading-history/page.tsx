import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ReadingHistoryList } from "@/components/profile/ReadingHistoryList";

export const metadata: Metadata = {
  title: "Reading History | Virexa",
};

/**
 * Standalone Reading History page (Navigation/Profile/Settings UX update)
 * - was `/profile?tab=history`; the Profile page now only shows
 * overview/stats, so this got its own real, top-level route the same way
 * `/bookmarks` already has one. Reuses `ReadingHistoryList` (Profile's
 * former tab content) unchanged - same loading/error/empty states, same
 * per-user Supabase-backed data. Protected by `src/middleware.ts`.
 */
export default function ReadingHistoryPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-[900px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2f67e8]">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-slate-700">Reading History</span>
          </nav>

          <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#2f67e8]">Reading History</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">Reading History</h1>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-500">
            Articles you've opened, most recent first.
          </p>

          <div className="mt-8">
            <ReadingHistoryList />
          </div>
        </div>
      </main>
    </>
  );
}
