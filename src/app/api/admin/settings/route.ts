import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createSiteSettingsRepository } from "@/repositories/site-settings-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { SiteSettingsUpdate } from "@/types/database";

/**
 * Admin-only Settings write (requirement 12: Site Name/Logo/Primary
 * Color/Homepage Featured Count/Articles Per Page/Enable Registrations/
 * Maintenance Mode/Default Language/Default Timezone/Save Changes).
 * Writes the singleton `site_settings` row via the service-role client
 * (its RLS policy only grants public `select`, no `update` - see
 * `supabase/migrations/0020_site_settings.sql`). `maintenance_mode` is
 * read live by `src/middleware.ts` and `enable_registrations` by
 * `/signup`'s page, so this isn't a cosmetic-only form.
 */

const bodySchema = z.object({
  siteName: z.string().trim().min(1).optional(),
  logoUrl: z.string().trim().url().nullable().optional(),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #2f67e8")
    .optional(),
  homepageFeaturedCount: z.number().int().min(1).max(12).optional(),
  articlesPerPage: z.number().int().min(5).max(100).optional(),
  enableRegistrations: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  defaultLanguage: z.string().trim().min(2).max(10).optional(),
  defaultTimezone: z.string().trim().min(1).optional(),
});

export async function PATCH(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ ok: false, error: message ?? "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const patch: SiteSettingsUpdate = {};
    if (body.siteName !== undefined) patch.site_name = body.siteName;
    if (body.logoUrl !== undefined) patch.logo_url = body.logoUrl;
    if (body.primaryColor !== undefined) patch.primary_color = body.primaryColor;
    if (body.homepageFeaturedCount !== undefined) patch.homepage_featured_count = body.homepageFeaturedCount;
    if (body.articlesPerPage !== undefined) patch.articles_per_page = body.articlesPerPage;
    if (body.enableRegistrations !== undefined) patch.enable_registrations = body.enableRegistrations;
    if (body.maintenanceMode !== undefined) patch.maintenance_mode = body.maintenanceMode;
    if (body.defaultLanguage !== undefined) patch.default_language = body.defaultLanguage;
    if (body.defaultTimezone !== undefined) patch.default_timezone = body.defaultTimezone;

    await createSiteSettingsRepository(supabase).update(patch, admin.id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "settings.updated",
      targetType: "site_settings",
      targetId: "1",
      metadata: { patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/settings] update failed:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
