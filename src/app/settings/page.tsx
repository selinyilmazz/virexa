import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { SettingsPageHeader } from "@/components/settings/SettingsPageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Settings | Virexa",
};

/**
 * Settings page (redesign) - "Manage your Virexa experience.": page
 * header (breadcrumb/eyebrow/title/subtitle - `SettingsPageHeader`) above
 * the categorized settings form (General/Reading/Notifications/Privacy/
 * Appearance/Account - `SettingsForm`). Same 16px-radius/soft-shadow
 * language as the redesigned Bookmarks/Profile pages. Dark mode is
 * handled by the single global `ThemeScope` in the root layout (same
 * mechanism the Home page uses) - this page no longer mounts its own
 * theme wrapper, so it can never render dark independently of the rest
 * of the app.
 */
export default function SettingsPage() {
  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-10 sm:px-8 dark:bg-slate-950">
        <div className="mx-auto max-w-[1100px]">
          <SettingsPageHeader />

          <div className="mt-8">
            <SettingsForm />
          </div>
        </div>
      </main>
    </>
  );
}
