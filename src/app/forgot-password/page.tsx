import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata: Metadata = {
  title: "Forgot Password | Virexa",
};

export default async function ForgotPasswordPage() {
  const { t } = await getServerTranslations();

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel
          title={t("auth.forgotPassword.heroTitle")}
          description={t("auth.forgotPassword.heroDescription")}
          t={t}
        />
        <AuthCard title={t("auth.forgotPassword.cardTitle")}>
          <ForgotPasswordForm />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
