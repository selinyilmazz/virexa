import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { AuthedThemeScope } from "@/components/providers/AuthedThemeScope";

export const metadata: Metadata = {
  title: "Settings | Virexa",
};

/**
 * Settings page (redesign) - "Manage your Virexa experience.": page
 * header (breadcrumb/eyebrow/title/subtitle - `SettingsPageHeader`) above
 * the categorized settings form (General/Reading/Notifications/Privacy/
 * Appearance/Account - `SettingsForm`). Same 16px-radius/soft-shadow
 * language as the redesigned Bookmarks/Profile pages. Wrapped in
 * `AuthedThemeScope` (Navigation/Profile/Settings UX update) - real,
 * instant dark mode for this page and its Header.
 */
export default function SettingsPage() {
  return (
    <AuthedThemeScope>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1100px]">
          <SettingsPageHeader />

          <div className="mt-8">
            <SettingsForm />
          </div>
        </div>
      </main>
    </AuthedThemeScope>
  );
}
