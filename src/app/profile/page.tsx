import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export const metadata: Metadata = {
  title: "Profile | Virexa",
};

/**
 * Profile page (product polishing phase, 2nd pass - "daha modern bir
 * kullanıcı profili"): a summary header (avatar, name, join date, saved/
 * read/top-category stats - `ProfileHeader`) above a tabbed content area
 * (Profile / Bookmarks / Reading History / Security - `ProfileTabs`),
 * replacing the old two-column "sidebar card stack next to a form stack"
 * layout that read like an admin panel.
 */
export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[900px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition-colors hover:text-[#2f67e8]">
              Home
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-950">Profile</span>
          </nav>

          <div className="mt-6 space-y-6">
            <ProfileHeader />
            <ProfileTabs />
          </div>
        </div>
      </main>
    </>
  );
}
