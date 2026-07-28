import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeToNewsletter } from "@/services/newsletter/newsletter-service";

/**
 * Public newsletter signup endpoint (homepage `NewsletterSection`). No
 * admin auth required - this is the one public-facing write path onto
 * `newsletter_subscribers` (see migration 0033's RLS doc comment).
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
 */

const bodySchema = z.object({
  email: z.string().trim().min(1).max(254).email(),
});

export async function POST(request: Request) {
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
