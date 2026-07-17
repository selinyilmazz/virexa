import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata: Metadata = {
  title: "Sign In | Virexa",
};

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel
          title="Welcome Back!"
          description="Sign in to your account and continue discovering the latest tech and gaming news with AI-powered summaries."
        />
        <AuthCard title="Sign In">
          <SignInForm redirectTo={redirect} />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
