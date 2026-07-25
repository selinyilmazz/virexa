import { ProfileAvatarUpload } from "@/components/profile/ProfileAvatarUpload";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { useTranslations } from "@/i18n/i18n-provider";

/**
 * Settings page "ACCOUNT" category (redesign): Profile Image, then
 * Name/Username/Email/Country/Bio, then Change Password - built by
 * reusing the existing, already-fully-working `ProfileAvatarUpload`,
 * `ProfileEditForm`, and `SecurityCard` components rather than
 * duplicating their save/validation/toast logic here. Each card keeps
 * its own save action, which is why the shared Settings "Save Changes"
 * button at the bottom of the page is hidden for this category (see
 * `SettingsForm.tsx`).
 */
export function AccountSettingsPanel() {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("settings.account.profileImageTitle")}</h2>
        <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("settings.account.profileImageDescription")}</p>
        <div className="mt-5">
          <ProfileAvatarUpload />
        </div>
      </section>

      <ProfileEditForm />
      <SecurityCard />
    </div>
  );
}
