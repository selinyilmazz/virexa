import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";
import { getServerTranslations } from "@/i18n/get-server-translations";

export const metadata: Metadata = {
  title: "Sign In | Virexa",
};

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;
  const { t } = await getServerTranslations();

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel title={t("auth.signIn.heroTitle")} description={t("auth.signIn.heroDescription")} t={t} />
        <AuthCard title={t("auth.signIn.cardTitle")}>
          <SignInForm redirectTo={redirect} />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
