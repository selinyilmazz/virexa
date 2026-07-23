import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import { slugify, buildArticleId } from "@/lib/news/slug";

/**
 * Admin-only Article creation (requirement 5: "New Article"). Every
 * write in the Articles CMS editor goes through the service-role client
 * - `articles` has no insert/update/delete RLS policy for anon/
 * authenticated (see `supabase/migrations/0002_article_storage.sql`),
 * same as every other admin write surface in this app.
 *
 * `id`/`slug` are derived the same way the ingestion pipeline derives
 * them (`buildArticleId(sourceId, slug)` - see `lib/news/slug.ts`) so an
 * admin-authored article looks structurally identical to a pipeline-
 * ingested one; a numeric suffix is appended on a collision.
 */

const bodySchema = z.object({
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  content: z.string().trim().optional(),
  imageUrl: z.string().trim().url().optional(),
  sourceId: z.string().trim().min(1),
  category: z.string().trim().min(1),
  tags: z.array(z.string().trim()).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
  language: z.string().trim().optional(),
  country: z.string().trim().optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export async function POST(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

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

  const repository = createArticleRepository(supabase);
  const baseSlug = slugify(body.title) || "article";

  let slug = baseSlug;
  let id = buildArticleId(body.sourceId, slug);
  let suffix = 2;
  while (await repository.getById(id)) {
    slug = `${baseSlug}-${suffix}`;
    id = buildArticleId(body.sourceId, slug);
    suffix += 1;
  }

  try {
    const now = new Date().toISOString();
    const created = await repository.create({
      id,
      slug,
      title: body.title,
      subtitle: body.subtitle ?? "",
      description: body.summary ?? "",
      content: body.content ?? null,
      url: "",
      image_url: body.imageUrl ?? "",
      published_at: now,
      language: body.language ?? "en",
      country: body.country ?? "",
      category: body.category,
      author: null,
      tags: body.tags ?? [],
      reading_time: body.readingTime ?? 3,
      trust_score: 50,
      trending_score: 0,
      source_id: body.sourceId,
      featured: body.featured ?? false,
      visible: body.visible ?? true,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "article.created",
      targetType: "article",
      targetId: created.id,
      metadata: { title: body.title },
    });

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (error) {
    console.error("[api/admin/articles] create failed:", error);
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 500 });
  }
}
