"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthTermsNotice } from "@/components/auth/AuthTermsNotice";
import { Spinner } from "@/components/auth/Spinner";
import { AuthToast } from "@/components/auth/AuthToast";
import { isRequired, isValidEmail } from "@/lib/validators";
import { deriveNameFromEmail, setSession } from "@/lib/auth";
import { mockUser } from "@/data/user";

type FormErrors = {
  email?: string;
  password?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const emailIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 6.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type SignInFormProps = {
  redirectTo?: string;
};

export function SignInForm({ redirectTo }: SignInFormProps) {
  const router = useRouter();
  const safeRedirectTo = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!isRequired(email)) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!isRequired(password)) {
      nextErrors.password = "Password is required.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function completeMockAuth(message: string, sessionEmail?: string) {
    setIsSubmitting(true);
    await wait(1000);
    setIsSubmitting(false);
    setSession({
      name: sessionEmail ? deriveNameFromEmail(sessionEmail) : mockUser.name,
      email: sessionEmail ?? mockUser.email,
      avatar: mockUser.avatar,
    });
    setToastMessage(message);
    await wait(600);
    router.push(safeRedirectTo);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;
    void completeMockAuth("Signed in successfully! Redirecting...", email);
  }

  return (
    <>
      {toastMessage && <AuthToast message={toastMessage} />}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthInput
          id="signin-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
          icon={emailIcon}
        />
        <PasswordInput
          id="signin-password"
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          placeholder="Enter your password"
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded border-slate-300 text-[#2f67e8] focus:ring-[#2f67e8]"
            />
            Remember me
          </label>
          <Link href="/forgot-password" className="font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner className="size-5 text-white" />}
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>

        <AuthDivider />

        <SocialLoginButtons
          disabled={isSubmitting}
          onGoogleClick={() => void completeMockAuth("Signed in with Google! Redirecting...")}
        />
      </form>

      <AuthFooter text="Don't have an account?" linkLabel="Sign Up" href="/signup" />

      <AuthTermsNotice actionLabel="signing in" />
    </>
  );
}
