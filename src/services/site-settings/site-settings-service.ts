import { createClient } from "@/lib/supabase/server";
import { createSiteSettingsRepository } from "@/repositories/site-settings-repository";
import type { SiteSettingsRow } from "@/types/database";

/**
 * Public-safe, request-scoped read of the singleton `site_settings` row
 * (supabase/migrations/0020_site_settings.sql) - used by both the admin
 * Settings page (to prefill the edit form) and public surfaces that need
 * to respect these settings (`/signup`'s registration gate,
 * `src/middleware.ts`'s maintenance-mode gate). The `site_settings`
 * table has a public `select` RLS policy, so the normal request-scoped
 * client is sufficient - no service-role client needed for reads, only
 * for the admin write in `/api/admin/settings`.
 *
 * "Never throws" convention: falls back to the same defaults the
 * migration seeds the row with, so a missing row or a transient DB
 * error never breaks the public site (e.g. never accidentally locks
 * everyone out via a false "maintenance mode" read).
 */

const DEFAULT_SITE_SETTINGS: SiteSettingsRow = {
  id: 1,
  site_name: "Virexa",
  logo_url: null,
  primary_color: "#2f67e8",
  homepage_featured_count: 4,
  articles_per_page: 20,
  enable_registrations: true,
  maintenance_mode: false,
  default_language: "en",
  default_timezone: "UTC",
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

export async function getSiteSettings(): Promise<SiteSettingsRow> {
  try {
    const supabase = await createClient();
    const row = await createSiteSettingsRepository(supabase).get();
    return row ?? DEFAULT_SITE_SETTINGS;
  } catch (error) {
    console.error("[site-settings-service] getSiteSettings failed:", error);
    return DEFAULT_SITE_SETTINGS;
  }
}
