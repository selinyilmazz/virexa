import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { BookmarksContent } from "@/components/bookmarks/BookmarksContent";
import { AuthedThemeScope } from "@/components/providers/AuthedThemeScope";

export const metadata: Metadata = {
  title: "Bookmarks | Virexa",
};

export default function BookmarksPage() {
  return (
    <AuthedThemeScope>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1440px]">
          <BookmarksContent />
        </div>
      </main>
    </AuthedThemeScope>
  );
}
