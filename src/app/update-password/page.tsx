import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata: Metadata = {
  title: "Update Password | Virexa",
};

/**
 * Landing page for the real password-recovery flow: both the public
 * "Forgot Password" email and the Admin Panel's "Reset Password" user
 * action point their Supabase recovery link at `/auth/callback?next=
 * /update-password`, which exchanges the link's one-time code for a
 * real session before redirecting here (see `UpdatePasswordForm`'s doc
 * comment). No hero panel/translations wired up here (unlike /signin,
 * /signup, /forgot-password) - this is reached only via a recovery
 * link, never linked to directly from the public nav.
 */
export default async function UpdatePasswordPage() {
  const { t } = await getServerTranslations();
  return (
    <>
      <Header />
      <AuthLayout>
        <div className="hidden lg:block" />
        <AuthCard title={t("auth.updatePassword.cardTitle")}>
          <UpdatePasswordForm />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
