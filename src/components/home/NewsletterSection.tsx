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
    // TEMPORARY DEBUG LOGGING - remove once the missing-toast/mobile-crash issue is confirmed fixed.
    console.error("[DEBUG][NewsletterSection] showToast() called", { message, variant });
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setToast({ message, variant });
    dismissTimer.current = setTimeout(() => {
      // TEMPORARY DEBUG LOGGING - this callback runs in its OWN task, outside
      // handleSubmit's try/catch, so it's the one place a throw here would
      // NOT be caught by that block - logged separately for that reason.
      console.error("[DEBUG][NewsletterSection] auto-dismiss timer fired, clearing toast");
      setToast(null);
    }, TOAST_AUTO_DISMISS_MS);
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
      // TEMPORARY DEBUG LOGGING - remove once the missing-toast/mobile-crash issue is confirmed fixed.
      console.error("[DEBUG][NewsletterSection] step 1: calling fetch()", { email: parsed.data.email });

      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data.email }),
      });

      // TEMPORARY DEBUG LOGGING
      console.error("[DEBUG][NewsletterSection] step 2: fetch() resolved", { status: response.status, ok: response.ok });

      let json: SubscribeApiResponse;
      try {
        json = (await response.json()) as SubscribeApiResponse;
        // TEMPORARY DEBUG LOGGING
        console.error("[DEBUG][NewsletterSection] step 3: response.json() parsed", json);
      } catch (parseError) {
        // TEMPORARY DEBUG LOGGING - same fallback behavior as before
        // (`.json().catch(() => ({}))`), just now observable.
        console.error("[DEBUG][NewsletterSection] step 3 FAILED: response.json() threw", parseError);
        json = {} as SubscribeApiResponse;
      }

      if (response.status === 429) {
        // TEMPORARY DEBUG LOGGING
        console.error("[DEBUG][NewsletterSection] step 4: rate-limited (429) branch");
        showToast(t("home.newsletter.rateLimitedToast"), "error");
        return;
      }

      if (!response.ok || !json.ok) {
        // TEMPORARY DEBUG LOGGING
        console.error("[DEBUG][NewsletterSection] step 4: !response.ok || !json.ok branch", { responseOk: response.ok, jsonOk: json.ok, json });
        showToast(t("home.newsletter.errorToast"), "error");
        return;
      }

      // TEMPORARY DEBUG LOGGING
      console.error("[DEBUG][NewsletterSection] step 4: success branch, json.status =", json.status);

      if (json.status === "already-subscribed") {
        showToast(t("home.newsletter.alreadySubscribedToast"), "info");
      } else {
        showToast(t("home.newsletter.successToast"), "success");
      }

      // TEMPORARY DEBUG LOGGING
      console.error("[DEBUG][NewsletterSection] step 5: showToast() returned, about to setEmail('')");
      setEmail("");
      // TEMPORARY DEBUG LOGGING
      console.error("[DEBUG][NewsletterSection] step 6: setEmail('') done - handleSubmit success path complete");
    } catch (error) {
      // Logged so a real failure (network error, CSP block, an extension
      // intercepting the request, etc.) is visible in the console instead
      // of only ever surfacing as this one generic toast - see the
      // handler's investigation notes above.
      console.error("[NewsletterSection] subscribe request failed:", error);
      // TEMPORARY DEBUG LOGGING - if this fires, whatever's inside `error`
      // is the exact exception (and line, via its stack) breaking the flow.
      console.error("[DEBUG][NewsletterSection] CAUGHT exception in handleSubmit:", error);
      showToast(t("home.newsletter.errorToast"), "error");
    } finally {
      // TEMPORARY DEBUG LOGGING
      console.error("[DEBUG][NewsletterSection] finally: resetting submittingRef/isSubmitting");
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  const privacyTemplate = t("home.newsletter.privacyNotice");
  const [beforePrivacyLink, afterPrivacyLink] = privacyTemplate.split("{privacy}");
  const featureBadges = [t("home.newsletter.featureDigest"), t("home.newsletter.featureSummaries"), t("home.newsletter.featureNoSpam")];

  return (
    <section
      aria-labelledby="newsletter-section-title"
      className="relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-[#eef3ff] via-[#f8faff] to-white p-8 shadow-[0_10px_40px_-16px_rgba(47,103,232,0.28)] sm:p-12 lg:p-14"
    >
      {toast && <AuthToast message={toast.message} variant={toast.variant} />}

      {/* Subtle decorative glow - purely cosmetic, contained by the card's
          own overflow-hidden, no motion/animation (perf + "no flashy
          effects" requirement). */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[#2f67e8]/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 size-72 rounded-full bg-[#2f67e8]/5 blur-3xl" />

      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14">
        {/* Left: badge, heading, supporting copy, feature pills */}
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#2f67e8]/20 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f67e8]">
            {t("home.newsletter.badge")}
          </span>

          <h2 id="newsletter-section-title" className="mt-4 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
            {t("home.newsletter.heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600 lg:mx-0">
            {t("home.newsletter.description")}
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            {featureBadges.map((feature) => (
              <li
                key={feature}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <span aria-hidden="true" className="text-[#2f67e8]">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: email form */}
        <div className="mx-auto w-full max-w-md lg:mx-0">
          <form onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-3 sm:flex-row">
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
                className="h-14 w-full flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-[#2f67e8] focus:outline-none focus:ring-4 focus:ring-[#2f67e8]/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                aria-label={t("home.newsletter.submit")}
                className="group flex h-14 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#2f67e8] px-7 text-sm font-semibold text-white shadow-md shadow-[#2f67e8]/25 transition-all duration-200 hover:bg-[#2556c9] hover:shadow-lg hover:shadow-[#2f67e8]/30 disabled:cursor-not-allowed disabled:opacity-70 disabled:shadow-none"
              >
                {isSubmitting && <Spinner className="size-4 text-white" />}
                {isSubmitting ? t("home.newsletter.submitting") : t("home.newsletter.submit")}
                {!isSubmitting && (
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                )}
              </button>
            </div>
            {fieldError && (
              <p id="newsletter-email-error" role="alert" className="mt-2 text-left text-xs font-medium text-red-600">
                {fieldError}
              </p>
            )}
          </form>

          <div className="mt-4 flex flex-col items-center gap-1.5 text-center text-xs text-slate-500 lg:items-start lg:text-left">
            <p>
              {beforePrivacyLink}
              <Link href="/privacy" className="font-medium text-[#2f67e8] hover:text-[#2556c9]">
                {t("auth.privacyPolicy")}
              </Link>
              {afterPrivacyLink}
            </p>
            <p>{t("home.newsletter.disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
