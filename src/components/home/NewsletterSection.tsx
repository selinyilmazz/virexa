"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { Spinner } from "@/components/auth/Spinner";
import { AuthToast, type AuthToastVariant } from "@/components/auth/AuthToast";
import { createNewsletterSubscribeSchema } from "@/lib/validation/newsletter-schema";
import { useTranslations } from "@/i18n/i18n-provider";

const TOAST_AUTO_DISMISS_MS = 4500;

type SubscribeApiResponse = { ok: boolean; status?: "subscribed" | "already-subscribed"; error?: string };

/**
 * Homepage newsletter signup - "Newsletter MVP" phase, requirement 1.
 * Deliberately the last section inside `<main>` on `src/app/page.tsx`, so
 * it renders directly above the global `Footer` (mounted once in the root
 * layout - see that file's doc comment) without this component needing to
 * know anything about the footer itself.
 *
 * Talks only to `POST /api/newsletter/subscribe`, which returns a
 * structured `status` (`"subscribed"` | `"already-subscribed"`) rather
 * than a message string - this component owns the exact, localized
 * wording for each outcome (en/tr/nl), matching the app-wide "no
 * hardcoded user-facing strings" convention. Client-side validation uses
 * the same `createNewsletterSubscribeSchema(t)` factory the API route's
 * own zod schema mirrors, so an invalid address is caught instantly
 * without a round trip in the common case.
 *
 * No toast *provider* here (that's admin-only, mounted in
 * `src/app/admin/layout.tsx`) - follows the same local-state +
 * `AuthToast` pattern every public-facing form uses (see
 * `ForgotPasswordForm.tsx`, `CatalogBookmarkButton.tsx`), with its own
 * auto-dismiss timer since, unlike those flows, the visitor stays on this
 * page afterward.
 *
 * Double-submit guard (production readiness audit): `isSubmitting` state
 * alone isn't quite enough to rule out a genuine double-click - React
 * batches the `setIsSubmitting(true)` update, and a fast enough second
 * `click`/`submit` event could in principle read the pre-update value of
 * `isSubmitting` before that render commits. `submittingRef` is a plain
 * ref, updated synchronously as the very first thing `handleSubmit` does,
 * so the guard itself can never race with React's render cycle.
 */
export function NewsletterSection() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: AuthToastVariant } | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  function showToast(message: string, variant: AuthToastVariant) {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast({ message, variant });
    dismissTimer.current = setTimeout(() => setToast(null), TOAST_AUTO_DISMISS_MS);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;

    const schema = createNewsletterSubscribeSchema(t);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? t("validation.genericError"));
      return;
    }
    setFieldError(null);

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });
      const json = (await response.json().catch(() => ({}))) as SubscribeApiResponse;

      if (response.status === 429) {
        showToast(t("home.newsletter.rateLimitedToast"), "error");
        return;
      }

      if (!response.ok || !json.ok) {
        showToast(t("home.newsletter.errorToast"), "error");
        return;
      }

      if (json.status === "already-subscribed") {
        showToast(t("home.newsletter.alreadySubscribedToast"), "info");
      } else {
        showToast(t("home.newsletter.successToast"), "success");
      }
      setEmail("");
    } catch {
      showToast(t("home.newsletter.errorToast"), "error");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const privacyTemplate = t("home.newsletter.privacyNotice");
  const [beforePrivacyLink, afterPrivacyLink] = privacyTemplate.split("{privacy}");

  return (
    <section
      aria-labelledby="newsletter-section-title"
      className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-white p-8 text-center shadow-sm sm:p-12"
    >
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      <span aria-hidden="true" className="mx-auto flex size-14 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
        📬
      </span>

      <h2 id="newsletter-section-title" className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
        {t("home.newsletter.heading")}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
        {t("home.newsletter.description")}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mx-auto mt-7 max-w-md">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <label htmlFor="newsletter-email" className="sr-only">
            {t("home.newsletter.emailLabel")}
          </label>
          <input
            id="newsletter-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("home.newsletter.emailPlaceholder")}
            disabled={isSubmitting}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "newsletter-email-error" : undefined}
            className="h-12 w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-2 focus:ring-[#2f67e8]/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2f67e8] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting && <Spinner className="size-4 text-white" />}
            {isSubmitting ? t("home.newsletter.submitting") : t("home.newsletter.submit")}
          </button>
        </div>
        {fieldError && (
          <p id="newsletter-email-error" role="alert" className="mt-2 text-left text-xs font-medium text-red-600">
            {fieldError}
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">
          {beforePrivacyLink}
          <Link href="/privacy" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
            {t("auth.privacyPolicy")}
          </Link>
          {afterPrivacyLink}
        </p>
      </form>

      <p className="mt-5 text-xs text-slate-500">{t("home.newsletter.disclaimer")}</p>
    </section>
  );
}
