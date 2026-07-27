import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createSettingsRepository } from "@/repositories/settings-repository";

/**
 * Server-side read of the signed-in visitor's Settings > General >
 * Content Preferences selection (`user_settings.preferred_categories`) -
 * the piece that makes "the Home page feed should prioritize articles
 * matching the user's preferred topics" a real, DB-driven behavior
 * instead of a setting that's saved but never consumed anywhere.
 *
 * Mirrors `resolveServerLocale()`'s exact shape (`i18n/resolve-locale.
 * server.ts`) for the same reasons: `cache()`-wrapped so this only runs
 * once per request no matter how many homepage sections end up reading
 * it, and never throws - an anonymous visitor (no session) or a
 * transient Supabase hiccup both fall back to the same honest empty
 * list, which callers treat as "no personalization for this request"
 * rather than an error.
 */
export const getServerPreferredCategories = cache(async (): Promise<string[]> => {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return [];

    const settings = await createSettingsRepository(supabase).get(session.user.id);
    return settings?.preferredCategories ?? [];
  } catch (error) {
    console.error("[preferred-categories.server] Failed to resolve preferred categories:", error);
    return [];
  }
});
