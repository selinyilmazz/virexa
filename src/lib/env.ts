import type { AIProviderId } from "@/types/ai";

/**
 * Central, typed access point for environment variables.
 *
 * None of these are set yet in this environment - this module exists so
 * app code has one place to read configuration from, instead of
 * scattering `process.env.X` calls throughout the codebase. All values
 * are optional on purpose: callers must handle the "not configured"
 * case gracefully rather than assuming a key exists.
 *
 * `supabase.url` / `supabase.anonKey` prefer the NEXT_PUBLIC_-prefixed
 * variables (required for the browser Supabase client to read them -
 * see `src/lib/supabase/client.ts`) and fall back to the plain names for
 * server-only contexts that only ever set those. `serviceRoleKey` is
 * never NEXT_PUBLIC_-prefixed - it must stay server-only.
 *
 * `news.*` and `ai.*` are server-only secrets and config and are
 * intentionally NOT prefixed with `NEXT_PUBLIC_`, so they're never
 * bundled into client JavaScript. Only import those from server
 * components, route handlers, middleware, or provider/service code.
 *
 * `site.url` (Production Readiness phase) is the canonical public
 * origin used for `metadataBase`, `robots.ts`, and `sitemap.ts` - see
 * those files. It must be NEXT_PUBLIC_-prefixed since Next.js reads
 * `metadataBase` during static generation of shared metadata. Falls
 * back to `http://localhost:3000` for local development only; every
 * deployed environment should set it explicitly (see `.env.example`
 * and the README's Deployment section).
 */

const VALID_AI_PROVIDERS: AIProviderId[] = ["openai", "anthropic", "openrouter"];

/** Falls back to "openai" for anything unset or unrecognized, rather than letting a typo silently disable AI. */
function resolveAiProvider(): AIProviderId {
  const raw = process.env.AI_PROVIDER;
  return (VALID_AI_PROVIDERS as string[]).includes(raw ?? "") ? (raw as AIProviderId) : "openai";
}

/** Sensible per-provider default model when AI_MODEL isn't set - each provider's own id namespace. */
const DEFAULT_AI_MODELS: Record<AIProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  openrouter: "openai/gpt-4o-mini",
};

function resolvePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

/** Strips a trailing slash so callers can safely do `${env.site.url}/path` without doubling slashes. */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const value = raw && raw.length > 0 ? raw : "http://localhost:3000";
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const aiProviderId = resolveAiProvider();

export const env = {
  site: {
    url: resolveSiteUrl(),
  },
  news: {
    newsApiKey: process.env.NEWS_API_KEY,
    gNewsApiKey: process.env.GNEWS_API_KEY,
    theNewsApiKey: process.env.THENEWS_API_KEY,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  ai: {
    /** Which provider `services/ai/ai-provider-instance.ts` constructs - the only place this is read besides here. */
    provider: aiProviderId,
    model: process.env.AI_MODEL || DEFAULT_AI_MODELS[aiProviderId],
    timeoutMs: resolvePositiveInt(process.env.AI_TIMEOUT, 15_000),
    maxTokens: resolvePositiveInt(process.env.AI_MAX_TOKENS, 700),
    /** How long an AI result stays cached in `AICache` before being regenerated - default 24h. */
    cacheTtlMs: resolvePositiveInt(process.env.AI_CACHE_TTL, 24 * 60 * 60 * 1000),
    openAiApiKey: process.env.OPENAI_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
  },
} as const;

export type Env = typeof env;

/**
 * Required-for-production environment variables (Deployment Readiness
 * phase). "Required" here means: the app still boots and serves pages
 * without them (nothing in this codebase crashes on missing env - see
 * this file's own doc comment), but core functionality is silently
 * degraded in a way that matters in production:
 *
 * - Supabase URL/Anon Key: without these, Auth, Bookmarks, Profile,
 *   Settings, and all real (non-cache) article reads stop working.
 * - Supabase Service Role Key: without this, the Runtime layer's
 *   persistence step, all Admin write routes, and Admin Users
 *   Management no-op or 503 (each already handles that gracefully -
 *   this just flags it up front instead of discovering it at click-time).
 * - Site URL: without this, canonical/OpenGraph URLs and the sitemap
 *   fall back to `http://localhost:3000`, which is wrong in any real
 *   deployment (silently harms SEO rather than erroring).
 *
 * News provider keys and AI provider keys are deliberately NOT in this
 * list - both layers are explicitly designed to no-op without them
 * (RSS-only ingestion, no AI enrichment), which is a valid, supported
 * configuration, not a misconfiguration.
 */
export function getMissingRequiredEnvVars(): string[] {
  const missing: string[] = [];
  if (!env.supabase.url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabase.anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!env.supabase.serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.NEXT_PUBLIC_SITE_URL) missing.push("NEXT_PUBLIC_SITE_URL");
  return missing;
}
