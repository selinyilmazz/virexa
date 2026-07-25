import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { BookmarksContent } from "@/components/bookmarks/BookmarksContent";

export const metadata: Metadata = {
  title: "Bookmarks | Virexa",
};

/** Dark mode comes from the single global `ThemeScope` in the root layout (same mechanism the Home page uses) - this page no longer mounts its own theme wrapper. */
export default function BookmarksPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px]">
          <BookmarksContent />
        </div>
      </main>
    </>
  );
}
