import { createServiceClient } from "@/lib/supabase/service-client";
import { createNewsletterSubscriberRepository } from "@/repositories/newsletter-subscriber-repository";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe-token";
import { sendNewsletterWelcomeEmail } from "@/services/email/newsletter-emails";

/**
 * Business logic for the public "Stay updated with AI & Developer News"
 * signup (homepage `NewsletterSection`, `POST /api/newsletter/subscribe`)
 * and for unsubscribing (`/newsletter/unsubscribe` page,
 * `POST /api/newsletter/unsubscribe`).
 *
 * Phase 2 (email sending): a successful subscribe/resubscribe now sends a
 * welcome email via `services/email/newsletter-emails.tsx` - see
 * `sendWelcomeEmailSafely()` below for why that can never turn a
 * successful database write into a reported failure. Still no *scheduled*
 * sending (weekly/daily digest, AI summaries, Top Stories, Developer
 * Releases, GitHub Trending) - see the `TODO(newsletter-phase-3)` marker
 * at the bottom of this file for where that plugs in later.
 *
 * Always uses the service-role client, same convention as
 * `admin-audit-service.ts`: `newsletter_subscribers` has zero RLS policies
 * (see migration 0033's doc comment) - there is no anon/authenticated
 * client path to this table at all, by design (subscriber emails are PII,
 * and only the admin-only management surface should ever read them back).
 */

export type SubscribeToNewsletterResult =
  | { status: "subscribed" }
  /** A given email already has an active row - the API route turns this into "You're already subscribed." (never a thrown error, per the MVP's explicit UI requirement). */
  | { status: "already-subscribed" }
  /** Storage isn't configured, or the insert itself failed - the API route turns this into one generic, friendly message. Never leaks the real Postgres error to the client. */
  | { status: "error" };

/**
 * Sends the welcome email and swallows any failure (requirement 6:
 * "Newsletter subscription should still succeed even if the welcome
 * email fails"). This is a SEPARATE try/catch from the one wrapping the
 * database work in `subscribeToNewsletter()` below, deliberately - if
 * this lived inside that same try block, a bug in the email path could
 * incorrectly turn an already-successful database insert into a reported
 * `{ status: "error" }`, which is exactly the failure mode this
 * requirement rules out. `sendNewsletterWelcomeEmail()` (and `sendEmail()`
 * underneath it) already never throw on their own, so this catch is
 * belt-and-suspenders against a genuinely unexpected bug, not the
 * primary safety mechanism.
 */
async function sendWelcomeEmailSafely(subscriberId: string, email: string): Promise<void> {
  // TEMPORARY DEBUG LOGGING - remove once the Resend delivery issue is confirmed fixed.
  console.log("[DEBUG][newsletter-service] sendWelcomeEmailSafely() called - about to call sendNewsletterWelcomeEmail()", { subscriberId, email });
  try {
    const result = await sendNewsletterWelcomeEmail(subscriberId, email);
    // TEMPORARY DEBUG LOGGING
    console.log("[DEBUG][newsletter-service] sendNewsletterWelcomeEmail() returned", { email, result });
    if (!result.ok) {
      console.error("[newsletter-service] Welcome email not sent (subscription still succeeded):", { email, error: result.error });
    }
  } catch (error) {
    console.error("[newsletter-service] Welcome email threw (subscription still succeeded):", { email, error });
  }
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeToNewsletterResult> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[newsletter-service] Service role not configured - cannot subscribe:", email);
      return { status: "error" };
    }

    const repository = createNewsletterSubscriberRepository(supabase);
    const existing = await repository.findByEmail(email);

    // TEMPORARY DEBUG LOGGING - remove once the Resend delivery issue is confirmed fixed.
    console.log("[DEBUG][newsletter-service] findByEmail() result", { email, existing: existing ? { id: existing.id, is_active: existing.is_active } : null });

    if (existing) {
      if (existing.is_active) {
        // Already actively subscribed - no email (requirement 2: "Do NOT
        // send another welcome email if the user is already subscribed").
        // TEMPORARY DEBUG LOGGING
        console.log("[DEBUG][newsletter-service] EARLY RETURN: already-subscribed - sendWelcomeEmailSafely() will NOT be called", { email, subscriberId: existing.id });
        return { status: "already-subscribed" };
      }
      // A previously-unsubscribed address signing up again is a genuine
      // resubscribe, not a duplicate - reactivate the existing row instead
      // of leaving them permanently stuck as "already subscribed" with no
      // way back in. This IS a fresh, successful subscribe event from the
      // visitor's perspective, so it gets the welcome email too.
      await repository.updateFields(existing.id, { is_active: true });
      // TEMPORARY DEBUG LOGGING
      console.log("[DEBUG][newsletter-service] resubscribe path - about to call sendWelcomeEmailSafely()", { email, subscriberId: existing.id });
      await sendWelcomeEmailSafely(existing.id, existing.email);
      return { status: "subscribed" };
    }

    const created = await repository.subscribe(email);
    // TEMPORARY DEBUG LOGGING
    console.log("[DEBUG][newsletter-service] fresh subscribe path - about to call sendWelcomeEmailSafely()", { email, subscriberId: created.id });
    await sendWelcomeEmailSafely(created.id, created.email);

    return { status: "subscribed" };
  } catch (error) {
    console.error("[newsletter-service] subscribeToNewsletter failed:", error);
    return { status: "error" };
  }
}

export type UnsubscribeResult = { status: "unsubscribed" | "already-unsubscribed" } | { status: "invalid" } | { status: "error" };

/**
 * Verifies a signed unsubscribe token and deactivates the matching
 * subscriber - the one function both the human-facing
 * `/newsletter/unsubscribe` page and the RFC 8058 one-click
 * `POST /api/newsletter/unsubscribe` route call through, so the actual
 * unsubscribe logic exists exactly once. Deliberately the same
 * `is_active: false` toggle the admin panel's Deactivate action uses
 * (`AdminNewsletterRowActions.tsx`) - unsubscribing is not a delete, and
 * an admin can already see/reactivate a self-unsubscribed row the same
 * way as any other deactivated one.
 */
export async function unsubscribeSubscriber(subscriberId: string, token: string): Promise<UnsubscribeResult> {
  if (!subscriberId || !token || !verifyUnsubscribeToken(subscriberId, token)) {
    return { status: "invalid" };
  }

  try {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[newsletter-service] Service role not configured - cannot unsubscribe:", subscriberId);
      return { status: "error" };
    }

    const repository = createNewsletterSubscriberRepository(supabase);
    const existing = await repository.getById(subscriberId);
    if (!existing) {
      // Token was valid but the row is gone (e.g. an admin already
      // deleted it) - treat as already-unsubscribed rather than an error,
      // since the end state the visitor wants (not receiving mail) is
      // already true.
      return { status: "already-unsubscribed" };
    }

    if (!existing.is_active) {
      return { status: "already-unsubscribed" };
    }

    await repository.updateFields(subscriberId, { is_active: false });
    return { status: "unsubscribed" };
  } catch (error) {
    console.error("[newsletter-service] unsubscribeSubscriber failed:", error);
    return { status: "error" };
  }
}

// TODO(newsletter-phase-3): this is the intended home for the future
// scheduled digest jobs - e.g. `getWeeklyDigestRecipients()` /
// `getDailyDigestRecipients()` (both would just call the repository's
// `list()` filtered to `is_active: true`, same data this file already
// reads), plus whatever composes each digest's content (AI summaries, Top
// Stories, Developer Releases, GitHub Trending) and hands it to
// `services/email/email-service.ts`'s `sendEmail()` - the same
// infrastructure the welcome email already uses. None of that exists yet;
// this phase is welcome-email-on-subscribe plus unsubscribe only.
