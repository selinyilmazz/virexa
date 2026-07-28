import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * Stateless, signed one-click-unsubscribe tokens (Newsletter Phase 2).
 * Avoids a schema change (no `unsubscribe_token` column on
 * `newsletter_subscribers`) - a token is just
 * `HMAC-SHA256(secret, subscriberId)`, recomputed and compared on
 * unsubscribe rather than looked up. Used by both the human-facing
 * `/newsletter/unsubscribe` page and the RFC 8058 one-click
 * `POST /api/newsletter/unsubscribe` route - see
 * `services/newsletter/newsletter-service.ts`'s `unsubscribeSubscriber()`,
 * the one place both call through.
 *
 * Server-only - never import this from a "use client" component.
 */

/** Falls back to the Supabase service-role key when `NEWSLETTER_UNSUBSCRIBE_SECRET` isn't set - see `env.email.unsubscribeSecret`'s doc comment for why that's an acceptable, still-secure default rather than a hard failure. Returns `null` only when neither is configured (no Supabase at all), in which case unsubscribe links can't be verified. */
function resolveSecret(): string | null {
  return env.email.unsubscribeSecret || env.supabase.serviceRoleKey || null;
}

export function createUnsubscribeToken(subscriberId: string): string | null {
  const secret = resolveSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(subscriberId).digest("hex");
}

/**
 * Timing-safe comparison (`timingSafeEqual`, not `===`) so an attacker
 * probing tokens can't use response-time differences to guess a valid one
 * byte-by-byte. Returns `false` (never throws) for a malformed token or
 * a length mismatch - `timingSafeEqual` itself throws on mismatched
 * buffer lengths, which is exactly the "not equal" case here.
 */
export function verifyUnsubscribeToken(subscriberId: string, token: string): boolean {
  const expected = createUnsubscribeToken(subscriberId);
  if (!expected || !token) return false;

  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(token, "hex");
  if (expectedBuffer.length !== providedBuffer.length) return false;

  try {
    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}
