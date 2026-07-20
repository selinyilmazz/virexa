import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata: Metadata = {
  title: "Sign Up | Virexa",
};

type SignUpPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { redirect } = await searchParams;
  const { t } = await getServerTranslations();

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel title={t("auth.signUp.heroTitle")} description={t("auth.signUp.heroDescription")} t={t} />
        <AuthCard title={t("auth.signUp.cardTitle")}>
          <SignUpForm redirectTo={redirect} />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
