"use client";

import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { isRequired, isStrongEnoughPassword } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";
import { useTranslations } from "@/i18n/i18n-provider";

type SecurityErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function SecurityCard() {
  const t = useTranslations();
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SecurityErrors>({});
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function showToast(message: string, variant: AuthToastVariant, durationMs = 2500) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: SecurityErrors = {};
    if (!isRequired(currentPassword)) {
      nextErrors.currentPassword = t("profile.security.errors.currentPasswordRequired");
    }
    if (!isRequired(newPassword)) {
      nextErrors.newPassword = t("profile.security.errors.newPasswordRequired");
    } else if (!isStrongEnoughPassword(newPassword)) {
      nextErrors.newPassword = t("profile.security.errors.newPasswordTooShort");
    }
    if (!isRequired(confirmPassword)) {
      nextErrors.confirmPassword = t("profile.security.errors.confirmPasswordRequired");
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = t("profile.security.errors.passwordsMismatch");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!user?.email) {
      showToast(t("profile.security.sessionExpiredToast"), "error", 4000);
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    try {
      // Supabase's `updateUser` doesn't take a "current password" - it
      // trusts whoever holds the active session. Re-authenticating with
      // the current password first is what actually verifies it before
      // allowing the change.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (reauthError) {
        setErrors({ currentPassword: t("profile.security.errors.currentPasswordIncorrect") });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        showToast(getAuthErrorMessage(updateError), "error", 4000);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("profile.security.successToast"), "success");
    } catch {
      showToast(t("profile.security.networkErrorToast"), "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">{t("profile.security.heading")}</h2>
      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">{t("profile.security.subtitle")}</p>

      <div className="mt-6 space-y-5">
        <PasswordInput
          id="security-current-password"
          label={t("profile.security.currentPassword")}
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.currentPassword}
          autoComplete="current-password"
          placeholder={t("profile.security.currentPasswordPlaceholder")}
        />
        <PasswordInput
          id="security-new-password"
          label={t("profile.security.newPassword")}
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
          autoComplete="new-password"
          placeholder={t("profile.security.newPasswordPlaceholder")}
          helperText={t("profile.security.newPasswordHelper")}
          showStrengthMeter
        />
        <PasswordInput
          id="security-confirm-password"
          label={t("profile.security.confirmPassword")}
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder={t("profile.security.confirmPasswordPlaceholder")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#2f67e8] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? t("profile.security.changing") : t("profile.security.change")}
      </button>
    </form>
  );
}
