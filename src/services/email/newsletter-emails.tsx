import { sendEmail, type SendEmailResult } from "@/services/email/email-service";
import { NewsletterWelcomeEmail } from "@/emails/NewsletterWelcomeEmail";
import { createUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { env } from "@/lib/env";

/**
 * Newsletter-specific email senders - the content layer on top of the
 * generic `services/email/email-service.ts` infrastructure. This is
 * where a future `sendWeeklyDigestEmail()`/`sendAnnouncementEmail()`
 * would live alongside `sendNewsletterWelcomeEmail()` (requirement 3:
 * reusable infrastructure for future email types), each building its own
 * React Email element and its own `List-Unsubscribe` header, then
 * delegating the actual send to `sendEmail()`.
 */

/** Builds the RFC 8058 one-click unsubscribe headers - `List-Unsubscribe` (the HTTPS target mail clients show as an "Unsubscribe" button next to the sender) and `List-Unsubscribe-Post` (tells the client to POST rather than just open the link). Both point at `POST /api/newsletter/unsubscribe`, not the human-facing `/newsletter/unsubscribe` page - see that route's doc comment. */
function buildListUnsubscribeHeaders(apiUnsubscribeUrl: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${apiUnsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/**
 * Sends the Virexa welcome email to a newly-subscribed (or resubscribed)
 * address. Called from `newsletter-service.ts`'s `subscribeToNewsletter()`
 * right after a successful insert/reactivation - never for an
 * already-active duplicate (requirement 2: "Do NOT send another welcome
 * email if the user is already subscribed").
 *
 * Deliberately returns `SendEmailResult` instead of throwing - the caller
 * (`newsletter-service.ts`) wraps this in its own safety net too
 * (requirement 6: a welcome-email failure must never fail the
 * subscription), but `sendEmail()` itself already never throws, so this
 * function inherits that guarantee for free.
 */
export async function sendNewsletterWelcomeEmail(subscriberId: string, email: string): Promise<SendEmailResult> {
  const token = createUnsubscribeToken(subscriberId);
  if (!token) {
    console.error("[newsletter-emails] Cannot build an unsubscribe link - no signing secret configured (set NEWSLETTER_UNSUBSCRIBE_SECRET or SUPABASE_SERVICE_ROLE_KEY). Skipping welcome email for:", email);
    return { ok: false, error: "not-configured" };
  }

  const params = new URLSearchParams({ id: subscriberId, token });
  const pageUnsubscribeUrl = `${env.site.url}/newsletter/unsubscribe?${params.toString()}`;
  const apiUnsubscribeUrl = `${env.site.url}/api/newsletter/unsubscribe?${params.toString()}`;

  return sendEmail({
    to: email,
    subject: "Welcome to Virexa 🎉",
    react: <NewsletterWelcomeEmail siteUrl={env.site.url} unsubscribeUrl={pageUnsubscribeUrl} />,
    text: `Welcome to Virexa!\n\nThanks for subscribing - you'll now get the most important AI, programming, cloud, security, and developer news delivered to your inbox.\n\nStart reading: ${env.site.url}\n\nUnsubscribe any time: ${pageUnsubscribeUrl}`,
    headers: buildListUnsubscribeHeaders(apiUnsubscribeUrl),
  });
}
