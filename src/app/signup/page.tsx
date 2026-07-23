import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getServerTranslations } from "@/i18n/get-server-translations";
import { getSiteSettings } from "@/services/site-settings/site-settings-service";

export const metadata: Metadata = {
  title: "Sign Up | Virexa",
};

type SignUpPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

/**
 * Admin Panel: Settings - "Enable Registrations" toggle (requirement
 * 12). When disabled, this page shows a closed-state message instead of
 * `SignUpForm`, rather than rendering a form that would only fail on
 * submit - a real gate, not a cosmetic one. Reads via the public-safe
 * `getSiteSettings()` (site_settings has a public RLS select policy).
 */
export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { redirect } = await searchParams;
  const { t } = await getServerTranslations();
  const { enable_registrations: registrationsEnabled } = await getSiteSettings();

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel title={t("auth.signUp.heroTitle")} description={t("auth.signUp.heroDescription")} t={t} />
        <AuthCard title={t("auth.signUp.cardTitle")}>
          {registrationsEnabled ? (
            <SignUpForm redirectTo={redirect} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <p className="text-sm font-medium text-slate-950">New sign-ups are currently closed.</p>
              <p className="mt-1 text-sm text-slate-500">Please check back later, or sign in if you already have an account.</p>
              <Link
                href="/signin"
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </AuthCard>
      </AuthLayout>
    </>
  );
}
