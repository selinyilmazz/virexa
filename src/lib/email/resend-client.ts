import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Server-only Resend client factory - same "missing config is a normal,
 * safe state" convention as `lib/supabase/service-client.ts`: returns
 * `null` instead of throwing when `RESEND_API_KEY` isn't set, so every
 * caller (currently just `services/email/email-service.ts`) can treat
 * "email sending isn't configured yet" as an ordinary, handled case
 * rather than a startup crash.
 *
 * NEVER import this from a "use client" component - `RESEND_API_KEY`
 * must stay server-only, exactly like the Supabase service-role key.
 *
 * Module-level singleton (not re-created per call, unlike
 * `createServiceClient()`) since the Resend SDK client is cheap to reuse
 * and holds no per-request state - there's no request-scoped reason to
 * rebuild it every call the way `lib/supabase/server.ts` must for cookies.
 */
let cachedClient: Resend | null | undefined;

export function getResendClient(): Resend | null {
  if (cachedClient !== undefined) return cachedClient;

  if (!env.email.resendApiKey) {
    cachedClient = null;
    return null;
  }

  cachedClient = new Resend(env.email.resendApiKey);
  return cachedClient;
}
