import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createSourceRepository } from "@/repositories/source-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only source mutation endpoint - "Source Actions": toggling
 * Active/Inactive and updating Trust Score (requirement 6). No delete
 * support ("Silme yapılmayacak").
 *
 * Every write to `article_sources` requires the service-role client
 * (RLS grants anon/authenticated read-only - see
 * `supabase/migrations/0002_article_storage.sql`), which must never
 * reach the browser (requirement 10) - this route is the one place
 * that boundary is crossed, exactly like `/api/metrics/route.ts` does
 * for `article_metrics` writes. `getAdminUserOrNull()` re-checks admin
 * authorization here too (defense in depth, same reasoning as
 * `requireAdminUser()` in `lib/admin/authorization.ts`) since this is a
 * mutating endpoint, not a page middleware already covers.
 *
 * A successful update also records one `recordAuditEvent()` entry
 * (Operations phase, requirement 5) - additive, doesn't change this
 * route's existing request/response shape.
 */

const bodySchema = z
  .object({
    active: z.boolean().optional(),
    trustScore: z.number().int().min(0).max(100).optional(),
  })
  .refine((value) => value.active !== undefined || value.trustScore !== undefined, {
    message: "At least one of active/trustScore must be provided.",
  });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const sourceRepository = createSourceRepository(supabase);
    const existing = await sourceRepository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Source not found." }, { status: 404 });
    }

    await sourceRepository.updateFields(id, body);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: body.active !== undefined ? "source.active_toggled" : "source.trust_score_updated",
      targetType: "article_source",
      targetId: id,
      metadata: { sourceName: existing.name, before: { active: existing.active, trustScore: existing.trust_score }, patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/sources] update failed:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}
