import type { ReactElement } from "react";
import { getResendClient } from "@/lib/email/resend-client";
import { env } from "@/lib/env";

/**
 * Generic, reusable email-sending infrastructure (Newsletter Phase 2,
 * requirement 3: "so future emails - weekly newsletters, announcements,
 * etc. - can reuse the same infrastructure"). This file knows nothing
 * about newsletters specifically - it's the one place that talks to
 * Resend, exactly like `lib/supabase/service-client.ts` is the one place
 * that talks to Supabase with the service role. Content-specific senders
 * (`services/email/newsletter-emails.tsx` today; a future
 * `weekly-digest-email.tsx`, `announcement-email.tsx`, etc.) build a
 * React Email element and call `sendEmail()` here - none of them touch
 * Resend directly.
 *
 * "Never throws" convention, same as `admin-audit-service.ts`'s
 * `recordAuditEvent()`: an email failure is a real, expected, recoverable
 * condition (bad address, provider outage, missing config), not a
 * exception a caller should have to wrap in its own try/catch. Every
 * failure is logged here, under one consistent `[email-service]` prefix -
 * "log email errors separately" (requirement 6) means exactly this:
 * distinguishable in server logs from `[newsletter-service]`'s
 * database-layer errors, not a separate log destination this app doesn't
 * otherwise have (see `lib/rate-limit.ts`/`admin-audit-service.ts` for the
 * same plain `console.error` + bracketed-prefix convention used
 * everywhere else).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  /** A React Email element, e.g. `<NewsletterWelcomeEmail ... />` - Resend renders this to HTML (and a text fallback) itself. */
  react: ReactElement;
  /** Optional plain-text fallback. Recommended for deliverability/accessibility but not required - Resend still sends successfully without it. */
  text?: string;
  /** Raw email headers, e.g. `List-Unsubscribe`/`List-Unsubscribe-Post` for one-click unsubscribe (RFC 8058) - see `services/email/newsletter-emails.tsx`. */
  headers?: Record<string, string>;
};

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Resend `error.name` values that map to HTTP 403 and specifically mean
 * "no verified sending domain" (confirmed root cause of the "other
 * users get no welcome email" report: Resend Dashboard -> Domains shows
 * "No domains yet", so `NEWSLETTER_FROM_EMAIL` is unverified - either
 * still the `onboarding@resend.dev` test sender or an unverified custom
 * domain). Resend's documented restriction: an unverified sender may
 * only send to the account's OWN verified email address - every other
 * recipient gets rejected with one of these codes. That's why the
 * account owner's own test subscriptions succeed while every other
 * subscriber's welcome email 403s. See the Resend SDK's own
 * `RESEND_ERROR_CODES_BY_KEY` (node_modules/resend/dist/index.d.ts) for
 * the full status-code mapping this list is drawn from.
 */
const DOMAIN_VERIFICATION_ERROR_NAMES = new Set(["validation_error", "invalid_from_address", "invalid_api_Key"]);

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const client = getResendClient();
    if (!client) {
      console.warn("[email-service] RESEND_API_KEY not configured - skipping send to:", input.to);
      return { ok: false, error: "not-configured" };
    }

    if (!env.email.fromAddress) {
      console.warn("[email-service] NEWSLETTER_FROM_EMAIL not configured - skipping send to:", input.to);
      return { ok: false, error: "not-configured" };
    }

    const { data, error } = await client.emails.send({
      from: env.email.fromAddress,
      to: input.to,
      subject: input.subject,
      react: input.react,
      text: input.text,
      headers: input.headers,
    });

    if (error) {
      // Full Resend error surfaced here - `error.name` is the SDK's error
      // code (e.g. "validation_error"), `error.message` is Resend's own
      // human-readable explanation (typically states outright that the
      // recipient isn't the account's verified test address). Logging the
      // whole object, not just `.message`, so nothing is lost if Resend's
      // wording changes.
      if (DOMAIN_VERIFICATION_ERROR_NAMES.has(error.name)) {
        console.error(
          "[email-service] Resend rejected the send - no verified sending domain (Resend Dashboard shows \"No domains yet\"). " +
            "An unverified sender can only deliver to the account's own verified email - this is expected for every " +
            "OTHER recipient until a domain is verified in the Resend dashboard and NEWSLETTER_FROM_EMAIL points at it. " +
            "Subscription still succeeded; only the welcome email was skipped.",
          { to: input.to, from: env.email.fromAddress, errorName: error.name, errorMessage: error.message }
        );
      } else {
        console.error("[email-service] Resend rejected the send:", { to: input.to, subject: input.subject, errorName: error.name, errorMessage: error.message });
      }
      return { ok: false, error: error.message || error.name || "send-failed" };
    }

    return { ok: true, id: data?.id ?? "" };
  } catch (error) {
    console.error("[email-service] sendEmail threw:", { to: input.to, subject: input.subject, error });
    return { ok: false, error: "exception" };
  }
}
