import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server-only, non-request-scoped Supabase client authenticated with the
 * service role key - bypasses Row Level Security entirely. This is
 * deliberately separate from `server.ts` (which is request-scoped via
 * Next.js's `cookies()` and always acts as the signed-in user) and
 * `client.ts` (browser-only, anon key): background/Runtime jobs
 * (`src/runtime/*`) run outside any HTTP request or user session, so
 * there's no cookie jar to read a session from, and the Article Storage
 * tables are intentionally written only by the server, never by a user
 * (see the RLS policies in `supabase/migrations/0002_article_storage.sql`
 * - `anon`/`authenticated` get read-only access, so a user-session client
 * could never write these tables anyway).
 *
 * NEVER import this from a "use client" component or any code that could
 * end up in a browser bundle - `SUPABASE_SERVICE_ROLE_KEY` must stay
 * server-only. Nothing in `src/lib/supabase/client.ts` (the browser
 * client) or the Auth flow is touched by this file.
 *
 * Returns `null` when the service role key isn't configured, rather than
 * throwing - mirrors the rest of the app's "missing config is a normal,
 * safe state" convention (see `services/ai/ai-provider-instance.ts`).
 * Callers (the runtime `database` pipeline step) treat a `null` client
 * as "storage not configured yet" and skip persistence for that run
 * without failing the job.
 */
export function createServiceClient() {
  if (!env.supabase.url || !env.supabase.serviceRoleKey) {
    return null;
  }

  return createClient<Database>(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
