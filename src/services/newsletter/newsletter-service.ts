import { createServiceClient } from "@/lib/supabase/service-client";
import { createNewsletterSubscriberRepository } from "@/repositories/newsletter-subscriber-repository";

/**
 * Business logic for the public "Stay updated with AI & Developer News"
 * signup (homepage `NewsletterSection`, `POST /api/newsletter/subscribe`).
 *
 * MVP scope boundary (explicit, disclosed): this only manages the
 * `newsletter_subscribers` list. No email is ever sent from this file or
 * anywhere else in the app yet - see the `TODO(newsletter-phase-2)` marker
 * below for exactly where that plugs in later (weekly/daily digest, AI
 * summaries, Top Stories, Developer Releases, GitHub Trending), without
 * requiring any change to the schema, repository, or this subscribe flow.
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

export async function subscribeToNewsletter(email: string): Promise<SubscribeToNewsletterResult> {
  try {
    const supabase = createServiceClient();
    if (!supabase) {
      console.warn("[newsletter-service] Service role not configured - cannot subscribe:", email);
      return { status: "error" };
    }

    const repository = createNewsletterSubscriberRepository(supabase);
    const existing = await repository.findByEmail(email);

    if (existing) {
      if (existing.is_active) {
        return { status: "already-subscribed" };
      }
      // A previously-unsubscribed address signing up again is a genuine
      // resubscribe, not a duplicate - reactivate the existing row instead
      // of leaving them permanently stuck as "already subscribed" with no
      // way back in.
      await repository.updateFields(existing.id, { is_active: true });
      return { status: "subscribed" };
    }

    await repository.subscribe(email);

    // TODO(newsletter-phase-2): trigger a "welcome" transactional email
    // here once an email-sending provider (Resend/SES/etc) is wired up.
    // Nothing to plug into yet in this MVP phase - subscribe() above only
    // persists the row.

    return { status: "subscribed" };
  } catch (error) {
    console.error("[newsletter-service] subscribeToNewsletter failed:", error);
    return { status: "error" };
  }
}

// TODO(newsletter-phase-2): this is the intended home for the future
// scheduled digest jobs - e.g. `getWeeklyDigestRecipients()` /
// `getDailyDigestRecipients()` (both would just call the repository's
// `list()` filtered to `is_active: true`, same data this file already
// reads), plus whatever composes each digest's content (AI summaries, Top
// Stories, Developer Releases, GitHub Trending) and hands it to an actual
// email-sending client. None of that exists yet - this MVP phase is
// subscriber collection and management only.
