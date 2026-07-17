import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { BookmarksContent } from "@/components/bookmarks/BookmarksContent";

export const metadata: Metadata = {
  title: "Bookmarks | Virexa",
};

export default function BookmarksPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <BookmarksContent />
        </div>
      </main>
    </>
  );
}
