import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createSourceRepository } from "@/repositories/source-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only source creation ("Sources: Create/Edit/Delete/Enable-Disable/
 * Manual Sync" from the Admin Panel spec - supersedes the earlier,
 * narrower "Silme yapılmayacak" design that only supported Active/Trust
 * Score toggles, see `source-repository.ts`'s `updateFields` doc comment).
 *
 * Disclosed scope boundary: creating a source here only adds a metadata
 * row to `article_sources` (name/domain/logo/official/country/trust
 * score/active) - the same table the news pipeline's RSS/NewsAPI/GNews/
 * HN providers already write `source_id` against. It does NOT register a
 * new RSS feed URL with the pipeline (that registry is code-level, see
 * `src/lib/news/sources.ts` + `src/lib/news/feed-sources.ts`) - a
 * source created here will show up in Sources/Articles filters and can
 * be attributed to manually-created articles, but won't start being
 * ingested from automatically unless a matching feed is also added to
 * the feed registry. This mirrors the same disclosed boundary already
 * established for Repositories/Developer Releases syncing from GitHub.
 */

const bodySchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z0-9-]+$/, "Id must be lowercase letters, numbers, and hyphens only."),
  name: z.string().trim().min(1),
  domain: z.string().trim().default(""),
  logo: z.string().trim().optional(),
  official: z.boolean().optional(),
  country: z.string().trim().default(""),
  trustScore: z.number().int().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export async function POST(request: Request) {
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
    const sourceRepository = createSourceRepository(supabase);
    const existing = await sourceRepository.getById(body.id);
    if (existing) {
      return NextResponse.json({ ok: false, error: `A source with id "${body.id}" already exists.` }, { status: 409 });
    }

    const created = await sourceRepository.create({
      id: body.id,
      name: body.name,
      domain: body.domain ?? "",
      logo: body.logo || null,
      official: body.official ?? false,
      country: body.country ?? "",
      trustScore: body.trustScore ?? 50,
      active: body.active ?? true,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "source.created",
      targetType: "article_source",
      targetId: created.id,
      metadata: { name: created.name, domain: created.domain },
    });

    return NextResponse.json({ ok: true, id: created.id });
  } catch (error) {
    console.error("[api/admin/sources] create failed:", error);
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 500 });
  }
}
