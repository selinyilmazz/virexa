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
      console.error("[email-service] Resend rejected the send:", { to: input.to, subject: input.subject, error });
      return { ok: false, error: error.message || "send-failed" };
    }

    return { ok: true, id: data?.id ?? "" };
  } catch (error) {
    console.error("[email-service] sendEmail threw:", { to: input.to, subject: input.subject, error });
    return { ok: false, error: "exception" };
  }
}
