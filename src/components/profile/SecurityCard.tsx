"use client";

import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthToast } from "@/components/auth/AuthToast";
import { isRequired, isStrongEnoughPassword } from "@/lib/validators";

type SecurityErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export function SecurityCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<SecurityErrors>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setToastMessage("Password changed successfully!");
    setTimeout(() => setToastMessage(null), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {toastMessage && <AuthToast message={toastMessage} />}

      <h2 className="text-2xl font-bold tracking-tight text-slate-950">Security</h2>
      <p className="mt-1 text-base text-slate-500">Change your password to keep your account secure.</p>

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
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-[#2f67e8] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2556c9]"
      >
        Change Password
      </button>
    </form>
  );
}
