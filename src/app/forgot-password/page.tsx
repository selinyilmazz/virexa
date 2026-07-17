import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthHeroPanel } from "@/components/auth/AuthHeroPanel";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password | Virexa",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <AuthLayout>
        <AuthHeroPanel
          title="Reset Your Password"
          description="Enter your email and we'll help you get back into your account with a secure reset link."
        />
        <AuthCard title="Forgot Password?">
          <ForgotPasswordForm />
        </AuthCard>
      </AuthLayout>
    </>
  );
}
