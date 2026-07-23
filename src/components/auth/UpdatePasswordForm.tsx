"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Spinner } from "@/components/auth/Spinner";
import { AuthToast } from "@/components/auth/AuthToast";
import { createClient } from "@/lib/supabase/client";
import { getAuthErrorMessage } from "@/lib/supabase/errors";

type ToastState = { message: string; variant: "success" | "error" | "info" };

/**
 * The landing page for both the public "Forgot Password" flow and the
 * Admin Panel's "Reset Password" action (`/api/admin/users/[id]/reset-
 * password` sends the same Supabase recovery email `resetPasswordForEmail`
 * would). Both routes point their recovery link at `/auth/callback?next=
 * /update-password` - that route already exchanges the one-time `code`
 * for a real session (see `src/app/auth/callback/route.ts`), so by the
 * time this page mounts, `supabase.auth.getSession()` should resolve to
 * an authenticated recovery session with no extra token-parsing needed
 * here. If it doesn't (direct navigation, expired link), this shows an
 * explicit error instead of a form that would just fail silently.
 */
export function UpdatePasswordForm() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  function showToast(message: string, variant: ToastState["variant"], durationMs = 3000) {
    setToast({ message, variant });
    setTimeout(() => setToast(null), durationMs);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      showToast(getAuthErrorMessage(updateError), "error", 4000);
      return;
    }

    showToast("Password updated. Redirecting to sign in…", "success");
    await supabase.auth.signOut();
    setTimeout(() => router.push("/signin"), 1200);
  }

  if (checkingSession) {
    return <p className="text-sm text-slate-500">Checking your reset link…</p>;
  }

  if (!hasSession) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          This password reset link is invalid or has expired. Request a new one from the sign-in page.
        </p>
        <button
          type="button"
          onClick={() => router.push("/forgot-password")}
          className="rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2556c9]"
        >
          Request a new link
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-5">
        <PasswordInput
          id="update-password-new"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <PasswordInput
          id="update-password-confirm"
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          error={error ?? undefined}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2f67e8] text-base font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner className="size-5 text-white" />}
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
