import { NextResponse } from "next/server";
import { unsubscribeSubscriber } from "@/services/newsletter/newsletter-service";

/**
 * RFC 8058 one-click unsubscribe endpoint. Mail clients (Gmail, Yahoo,
 * Outlook) that support List-Unsubscribe=One-Click POST here
 * automatically when a recipient taps the provider-native "Unsubscribe"
 * button shown next to the sender name - see the `List-Unsubscribe` /
 * `List-Unsubscribe-Post` headers set in
 * `services/email/newsletter-emails.tsx`. This is NOT the link a human
 * clicks from inside the email body (that's the `/newsletter/unsubscribe`
 * page, a normal GET a browser can render) - both call the same
 * `unsubscribeSubscriber()` so the logic exists once.
 *
 * Always responds 200: a mail client never renders this response to the
 * recipient, and per RFC 8058 the endpoint should simply acknowledge the
 * request. No admin auth, no CSRF concern - this is intentionally a
 * public, unauthenticated endpoint (anyone with a valid signed token can
 * unsubscribe that one address, which is the entire point of a one-click
 * unsubscribe link), and unsubscribing is a fully reversible, idempotent
 * action (re-subscribing via the homepage form reactivates the same row).
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";

  await unsubscribeSubscriber(id, token);

  return NextResponse.json({ ok: true });
}
