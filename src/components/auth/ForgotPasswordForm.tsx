"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthFooter } from "@/components/auth/AuthFooter";
import { Spinner } from "@/components/auth/Spinner";
import { AuthToast } from "@/components/auth/AuthToast";
import { isRequired, isValidEmail } from "@/lib/validators";
import { useTranslations } from "@/i18n/i18n-provider";

type FormErrors = {
  email?: string;
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

export function ForgotPasswordForm() {
  const t = useTranslations();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!isRequired(email)) {
      nextErrors.email = t("auth.errors.emailRequired");
    } else if (!isValidEmail(email)) {
      nextErrors.email = t("auth.errors.emailInvalid");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    await wait(1000);
    setIsSubmitting(false);
    setToastMessage(t("auth.forgotPassword.successToast"));
    await wait(600);
    router.push("/");
  }

  return (
    <>
      {toastMessage && <AuthToast message={toastMessage} />}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthInput
          id="forgot-password-email"
          label={t("auth.fields.email")}
          type="email"
          value={email}
          onChange={setEmail}
          error={errors.email}
          autoComplete="email"
          placeholder={t("auth.fields.emailPlaceholder")}
          icon={emailIcon}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner className="size-5 text-white" />}
          {isSubmitting ? t("auth.forgotPassword.submitting") : t("auth.forgotPassword.submit")}
        </button>
      </form>

      <AuthFooter text={t("auth.forgotPassword.footerText")} linkLabel={t("auth.forgotPassword.footerLink")} href="/signin" />
    </>
  );
}
