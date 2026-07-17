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
import { setSession } from "@/lib/auth";
import { mockUser } from "@/data/user";

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agreeToTerms?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const router = useRouter();
  const safeRedirectTo = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function validate(): boolean {
    const nextErrors: FormErrors = {};
    if (!isRequired(name)) {
      nextErrors.name = "Name is required.";
    }
    if (!isRequired(email)) {
      nextErrors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!isRequired(password)) {
      nextErrors.password = "Password is required.";
    } else if (!isStrongEnoughPassword(password)) {
      nextErrors.password = "Password must be at least 8 characters.";
    }
    if (!isRequired(confirmPassword)) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (!agreeToTerms) {
      nextErrors.agreeToTerms = "You must agree to the Terms of Service and Privacy Policy.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function completeMockAuth(message: string, sessionOverride?: { name: string; email: string }) {
    setIsSubmitting(true);
    await wait(1000);
    setIsSubmitting(false);
    setSession({
      name: sessionOverride?.name ?? mockUser.name,
      email: sessionOverride?.email ?? mockUser.email,
      avatar: mockUser.avatar,
    });
    setToastMessage(message);
    await wait(600);
    router.push(safeRedirectTo);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !validate()) return;
    void completeMockAuth("Account created successfully! Redirecting...", { name, email });
  }

  return (
    <>
      {toastMessage && <AuthToast message={toastMessage} />}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthInput
          id="signup-name"
          label="Full Name"
          value={name}
          onChange={setName}
          error={errors.name}
          autoComplete="name"
          placeholder="Your full name"
          icon={nameIcon}
        />
        <AuthInput
          id="signup-email"
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
          id="signup-password"
          label="Password"
          value={password}
          onChange={setPassword}
          error={errors.password}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          helperText="At least 8 characters"
          showStrengthMeter
        />
        <PasswordInput
          id="signup-confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="Re-enter your password"
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
              I agree to the{" "}
              <span className="font-medium text-[#2f67e8]">Terms of Service</span> and{" "}
              <span className="font-medium text-[#2f67e8]">Privacy Policy</span>
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>

        <AuthDivider />

        <SocialLoginButtons
          disabled={isSubmitting}
          onGoogleClick={() => void completeMockAuth("Signed up with Google! Redirecting...")}
        />
      </form>

      <AuthFooter text="Already have an account?" linkLabel="Sign In" href="/signin" />

      <AuthTermsNotice actionLabel="signing up" />
    </>
  );
}
