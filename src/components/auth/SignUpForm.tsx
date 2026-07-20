"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthDivider } from "@/components/auth/AuthDivider";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { AuthTermsNotice } from "@/components/auth/AuthTermsNotice";
import { Spinner } from "@/components/auth/Spinner";
import { AuthToast } from "@/components/auth/AuthToast";
import { isRequired, isStrongEnoughPassword, isValidEmail } from "@/lib/validators";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { useTranslations } from "@/i18n/i18n-provider";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
};

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

const nameIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.9 3.6-7 8-7s8 3.1 8 7" strokeLinecap="round" />
  </svg>
);

const emailIcon = (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m4 6.5 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type SignUpFormProps = {
  redirectTo?: string;
};

export function SignUpForm({ redirectTo }: SignUpFormProps) {
  const t = useTranslations();
  const router = useRouter();
  // Guards against open redirects: must be an internal path (starts with
  // "/") and NOT protocol-relative ("//evil.com" also starts with "/" but
  // browsers resolve it as an absolute URL to a different origin - a
  // well-known bypass of a naive `startsWith("/")` check).
  const safeRedirectTo = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  function showToast(message: string, variant: ToastState["variant"], durationMs = 3000) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!isRequired(name)) {
      nextErrors.name = t("auth.errors.nameRequired");
    }
    if (!isRequired(email)) {
      nextErrors.email = t("auth.errors.emailRequired");
    } else if (!isValidEmail(email)) {
      nextErrors.email = t("auth.errors.emailInvalid");
    }
    if (!isRequired(password)) {
      nextErrors.password = t("auth.errors.passwordRequired");
    } else if (!isStrongEnoughPassword(password)) {
      nextErrors.password = t("auth.errors.passwordTooShort");
    }
    if (!isRequired(confirmPassword)) {
      nextErrors.confirmPassword = t("auth.errors.confirmPasswordRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("auth.errors.passwordsDoNotMatch");
    }
    if (!agreeToTerms) {
      nextErrors.agreeToTerms = t("auth.errors.mustAgreeToTerms");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setIsSubmitting(false);

    if (error) {
      showToast(getAuthErrorMessage(error), "error", 4000);
      return;
    }

    if (!data.session) {
      // Email confirmation is required by the Supabase project settings -
      // there's no active session yet, so don't redirect into a
      // protected page. Send them to sign in once they've confirmed.
      showToast(t("auth.signUp.confirmEmailToast"), "info", 5000);
      router.push("/signin");
      return;
    }

    showToast(t("auth.signUp.successToast"), "success");
    router.push(safeRedirectTo);
    router.refresh();
  }

  function handleGoogleClick() {
    showToast(t("auth.googleUnavailable"), "info", 3500);
  }

  return (
    <>
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
        <AuthInput
          id="signup-name"
          label={t("auth.signUp.fullNameLabel")}
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
          placeholder={t("auth.signUp.fullNamePlaceholder")}
          icon={nameIcon}
        />
        <AuthInput
          id="signup-email"
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
          id="signup-password"
          label={t("auth.fields.password")}
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
          placeholder={t("auth.signUp.passwordHelper")}
          helperText={t("auth.signUp.passwordHelper")}
          showStrengthMeter
        />
        <PasswordInput
          id="signup-confirm-password"
          label={t("auth.signUp.confirmPasswordLabel")}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder={t("auth.signUp.confirmPasswordPlaceholder")}
        />

        <div>
          <label className="flex items-start gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(event) => setAgreeToTerms(event.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-[#2f67e8] focus:ring-[#2f67e8]"
            />
            <span>
              {(() => {
                // "I agree to the {terms} and {privacy}" - `terms`/`privacy`
                // are deliberately left unsubstituted by `t()` (no matching
                // `values` entry) so they can be swapped for styled spans
                // here, the same technique `AuthTermsNotice` uses for its
                // Link-embedded sentence.
                const template = t("auth.signUp.agreeToTerms");
                const [before, afterTerms] = template.split("{terms}");
                const [between, after] = (afterTerms ?? "").split("{privacy}");
                return (
                  <>
                    {before}
                    <span className="font-medium text-[#2f67e8]">{t("auth.termsOfService")}</span>
                    {between}
                    <span className="font-medium text-[#2f67e8]">{t("auth.privacyPolicy")}</span>
                    {after}
                  </>
                );
              })()}
            </span>
          </label>
          {errors.agreeToTerms && <p className="mt-1.5 text-sm text-red-600">{errors.agreeToTerms}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner className="size-5 text-white" />}
          {isSubmitting ? t("auth.signUp.submitting") : t("auth.signUp.submit")}
        </button>

        <AuthDivider />

        <SocialLoginButtons disabled={isSubmitting} onGoogleClick={handleGoogleClick} />
      </form>

      <AuthFooter text={t("auth.signUp.footerText")} linkLabel={t("auth.signUp.footerLink")} href="/signin" />

      <AuthTermsNotice actionLabelKey="auth.signUp.termsAction" />
    </>
  );
}
