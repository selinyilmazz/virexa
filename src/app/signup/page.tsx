import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign Up | Virexa",
};

type SignUpPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { redirect } = await searchParams;

  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel
          title="Create Your Account!"
          description="Join Virexa and get access to the latest AI, technology and gaming news with smart summaries tailored for you."
        />
        <AuthCard title="Sign Up">
          <SignUpForm redirectTo={redirect} />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
