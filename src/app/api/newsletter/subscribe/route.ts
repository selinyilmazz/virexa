import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";

/**
 * Public newsletter signup endpoint (homepage `NewsletterSection`). No
 * admin auth required - this is the one public-facing write path onto
 * `newsletter_subscribers` (see migration 0033's RLS doc comment), and
 * (alongside `/api/metrics`) one of only two fully public, unauthenticated
 * write endpoints in the app - see `lib/rate-limit.ts`'s doc comment for
 * the scope/caveats of the rate limiter reused here.
 *
 * Deliberately returns a structured `status` on success rather than a raw
 * message string: `NewsletterSection` maps `status` to an already-localized
 * toast via `t()` (en/tr/nl) - the client, not this route, owns the exact
 * wording, matching this app's "translation system, no hardcoded
 * user-facing strings" convention. `error` (used only on `ok: false`) is
 * always one generic, safe sentence - the real Postgres/Supabase error is
 * logged server-side and never reaches the response body.
 *
 * Basic email-shape validation happens here too (defense in depth) even
 * though `NewsletterSection` already validates client-side with
 * `createNewsletterSubscribeSchema(t)` before ever calling this route.
 *
 * Production readiness audit - email enumeration (disclosed, accepted
 * trade-off): returning a distinct `"already-subscribed"` status lets a
 * caller learn whether a given address is on the list, which is a form of
 * enumeration. The MVP spec explicitly requires the friendly "You're
 * already subscribed." message instead of a generic error, and the data
 * being enumerated here is low-sensitivity (marketing-list membership, not
 * an account/auth signal - unlike a password-reset or login endpoint,
 * nothing security-sensitive is exposed). Rather than silently dropping
 * that explicit product requirement, the mitigation is the rate limit
 * below: `RATE_LIMIT` requests per `RATE_WINDOW_MS` per IP makes bulk
 * probing impractical while leaving normal signup (including an honest
 * mistake + retry) unaffected. Revisit if this list is ever used for
 * anything more sensitive than newsletter delivery.
 */

const RATE_LIMIT = 5; // requests
const RATE_WINDOW_MS = 10 * 60_000; // per 10 minutes, per client identifier - generous for a real visitor, restrictive for scripted probing/enumeration

const bodySchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
});

export async function POST(request: Request) {
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(`newsletter-subscribe:${clientId}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate-limited" },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))) } }
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-email" }, { status: 400 });
  }

  const result = await subscribeToNewsletter(body.email);

  if (result.status === "error") {
    return NextResponse.json({ ok: false, error: "subscribe-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
