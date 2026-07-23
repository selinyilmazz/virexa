import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { ProfilePageHeader } from "@/components/profile/ProfilePageHeader";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStatsSection } from "@/components/profile/ProfileStatsSection";
import { ProfileOverviewTab } from "@/components/profile/ProfileOverviewTab";
import { AuthedThemeScope } from "@/components/providers/AuthedThemeScope";

export const metadata: Metadata = {
  title: "Profile | Virexa",
};

/**
 * Profile page (Navigation/Profile/Settings UX update): profile info,
 * statistics, and reading-activity overview only - no more Bookmarks/
 * Reading History/Settings tabs (those moved to their own standalone
 * routes: `/bookmarks`, `/reading-history`, `/settings`). Page header
 * (breadcrumb/eyebrow/title/subtitle - `ProfilePageHeader`), a hero card
 * (avatar/name/email/member since/country/Edit Profile - `ProfileHeader`),
 * a four-card statistics row (`ProfileStatsSection`), and the former
 * "Overview" tab's content (`ProfileOverviewTab`) rendered directly. Same
 * 16px-radius/soft-shadow/32px-section-spacing language as the rest of
 * the authenticated shell.
 */
export default function ProfilePage() {
  return (
    <AuthedThemeScope>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1100px]">
          <ProfilePageHeader />

          <div className="mt-8 space-y-8">
            <ProfileHeader />
            <ProfileStatsSection />
            <ProfileOverviewTab />
          </div>
        </div>
      </main>
    </AuthedThemeScope>
  );
}
