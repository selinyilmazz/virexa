"use client";

import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { isRequired, isStrongEnoughPassword } from "@/lib/validators";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";

type SecurityErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function SecurityCard() {
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
      nextErrors.currentPassword = "Current password is required.";
    }
    if (!isRequired(newPassword)) {
      nextErrors.newPassword = "New password is required.";
    } else if (!isStrongEnoughPassword(newPassword)) {
      nextErrors.newPassword = "Password must be at least 8 characters.";
    }
    if (!isRequired(confirmPassword)) {
      nextErrors.confirmPassword = "Please confirm your new password.";
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!user?.email) {
      showToast("Your session looks signed out. Please sign in again.", "error", 4000);
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
        setErrors({ currentPassword: "Current password is incorrect." });
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
      showToast("Password changed successfully!", "success");
    } catch {
      showToast("Network error. Please check your connection and try again.", "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm sm:p-8">
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Security</h2>
      <p className="mt-1 text-base text-slate-500 dark:text-slate-400">Change your password to keep your account secure.</p>

      <div className="mt-6 space-y-5">
        <PasswordInput
          id="security-current-password"
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          error={errors.currentPassword}
          autoComplete="current-password"
          placeholder="Enter current password"
        />
        <PasswordInput
          id="security-new-password"
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          error={errors.newPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          helperText="At least 8 characters"
          showStrengthMeter
        />
        <PasswordInput
          id="security-confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="Re-enter new password"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#2f67e8] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Changing..." : "Change Password"}
      </button>
    </form>
  );
}
