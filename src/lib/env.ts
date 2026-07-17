/**
 * Central, typed access point for server-side environment variables.
 *
 * None of these are set yet — this module exists so provider and backend
 * code has one place to read configuration from, instead of scattering
 * `process.env.X` calls throughout the codebase. All values are optional
 * on purpose: providers must handle the "not configured" case gracefully
 * (see `src/services/news/providers`) rather than assuming a key exists.
 *
 * These are server-only secrets (API keys, service credentials) and are
 * intentionally NOT prefixed with `NEXT_PUBLIC_`, so they are never
 * bundled into client JavaScript. Only import this module from server
 * components, route handlers, or provider/service code.
 */
export const env = {
  news: {
    newsApiKey: process.env.NEWS_API_KEY,
    gNewsApiKey: process.env.GNEWS_API_KEY,
    theNewsApiKey: process.env.THENEWS_API_KEY,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  ai: {
    openAiApiKey: process.env.OPENAI_API_KEY,
  },
} as const;

export type Env = typeof env;
