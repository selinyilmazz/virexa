"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage, getOAuthErrorMessage } from "@/lib/supabase/errors";
import { signInWithOAuthProvider } from "@/lib/supabase/oauth";
import { useTranslations } from "@/i18n/i18n-provider";

type FormErrors = {
  email?: string;
  password?: string;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

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
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Guards against open redirects: must be an internal path (starts with
  // "/") and NOT protocol-relative ("//evil.com" also starts with "/" but
  // browsers resolve it as an absolute URL to a different origin - a
  // well-known bypass of a naive `startsWith("/")` check).
  const safeRedirectTo = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, variant: ToastState["variant"], durationMs = 3000) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  useEffect(() => {
    // `/auth/callback` redirects here with `?authError=...` when the
    // Google OAuth flow fails (user cancelled consent, provider error,
    // or the code-exchange step failed) - see that route's doc comment.
    const message = getOAuthErrorMessage(searchParams.get("authError"));
    if (message) {
      showToast(message, "error", 5000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!isRequired(email)) {
      nextErrors.email = t("auth.errors.emailRequired");
    } else if (!isValidEmail(email)) {
      nextErrors.email = t("auth.errors.emailInvalid");
    }
    if (!isRequired(password)) {
      nextErrors.password = t("auth.errors.passwordRequired");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (error) {
      showToast(getAuthErrorMessage(error), "error", 4000);
      return;
    }

    showToast(t("auth.signIn.successToast"), "success");
    router.push(safeRedirectTo);
    router.refresh();
  }

  async function handleGoogleClick() {
    const result = await signInWithOAuthProvider("google", safeRedirectTo);
    if (!result.ok) {
      showToast(result.message, "error", 5000);
    }
    // On success the browser is already navigating to Google's consent
    // screen - there's nothing further to do here.
  }

  return (
    <>
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
        <AuthInput
          id="signin-email"
          label={t("auth.fields.email")}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          placeholder={t("auth.fields.emailPlaceholder")}
          icon={emailIcon}
        />
        <PasswordInput
          id="signin-password"
          label={t("auth.fields.password")}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="current-password"
          placeholder={t("auth.fields.passwordPlaceholder")}
        />

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded border-slate-300 text-[#2f67e8] focus:ring-[#2f67e8]"
            />
            {t("auth.signIn.rememberMe")}
          </label>
          <Link href="/forgot-password" className="font-medium text-[#2f67e8] transition-colors hover:text-[#2556c9]">
            {t("auth.signIn.forgotPassword")}
          </Link>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner className="size-5 text-white" />}
          {isSubmitting ? t("auth.signIn.submitting") : t("auth.signIn.submit")}
        </button>

        <AuthDivider />

        <SocialLoginButtons disabled={isSubmitting} onGoogleClick={handleGoogleClick} />
      </form>

      <AuthFooter text={t("auth.signIn.footerText")} linkLabel={t("auth.signIn.footerLink")} href="/signup" />

      <AuthTermsNotice actionLabelKey="auth.signIn.termsAction" />
    </>
  );
}
