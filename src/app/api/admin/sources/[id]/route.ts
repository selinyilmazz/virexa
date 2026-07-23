import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createSourceRepository } from "@/repositories/source-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only source mutation endpoint. Originally just "Source Actions"
 * (toggling Active/Inactive and updating Trust Score); now extended to
 * the full "Create/Edit/Delete/Enable-Disable/Manual Sync" set the
 * current Admin Panel spec requires - the earlier "Silme yapılmayacak"
 * (no delete) design note has been superseded by that explicit ask.
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
    name: z.string().trim().min(1).optional(),
    domain: z.string().trim().optional(),
    logo: z.string().trim().nullable().optional(),
    official: z.boolean().optional(),
    country: z.string().trim().optional(),
    active: z.boolean().optional(),
    trustScore: z.number().int().min(0).max(100).optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "At least one field must be provided.",
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

    const patch: Record<string, unknown> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.domain !== undefined) patch.domain = body.domain;
    if (body.logo !== undefined) patch.logo = body.logo || null;
    if (body.official !== undefined) patch.official = body.official;
    if (body.country !== undefined) patch.country = body.country;
    if (body.active !== undefined) patch.active = body.active;
    if (body.trustScore !== undefined) patch.trust_score = body.trustScore;

    await sourceRepository.updateAll(id, patch);

    const isSimpleToggle =
      Object.keys(patch).length === 1 && (body.active !== undefined || body.trustScore !== undefined);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: isSimpleToggle
        ? body.active !== undefined
          ? "source.active_toggled"
          : "source.trust_score_updated"
        : "source.updated",
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

/**
 * Deletes a source. `articles.source_id` cascades (see
 * `source-repository.ts`'s `remove()` doc comment), so this is a
 * genuinely destructive action - the confirm modal on
 * `AdminSourceRowActions` states the article count up front so an admin
 * can't be surprised by it.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;

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

    const articleRepository = createArticleRepository(supabase);
    const { total: articleCount } = await articleRepository.search({ sourceId: id, page: 1, pageSize: 1 });

    await sourceRepository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "source.deleted",
      targetType: "article_source",
      targetId: id,
      metadata: { sourceName: existing.name, cascadedArticleCount: articleCount },
    });

    return NextResponse.json({ ok: true, cascadedArticleCount: articleCount });
  } catch (error) {
    console.error("[api/admin/sources] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
