import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { ArticleUpdate } from "@/types/database";

/**
 * Admin-only Article edit/delete (requirement 5). `[id]` is URL-encoded
 * client-side (article ids look like `sourceId:slug` - see
 * `lib/news/slug.ts`'s `buildArticleId`) and decoded here, same
 * belt-and-suspenders convention as `/api/admin/repositories/[id]`.
 */

const bodySchema = z.object({
  title: z.string().trim().min(1).optional(),
  subtitle: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  content: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  sourceId: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim()).optional(),
  readingTime: z.number().int().min(1).max(60).optional(),
  featured: z.boolean().optional(),
  visible: z.boolean().optional(),
});

function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const id = decodeId((await params).id);

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
    const repository = createArticleRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }

    const patch: ArticleUpdate = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
    if (body.summary !== undefined) patch.description = body.summary;
    if (body.content !== undefined) patch.content = body.content;
    if (body.imageUrl !== undefined) patch.image_url = body.imageUrl;
    if (body.sourceId !== undefined) patch.source_id = body.sourceId;
    if (body.category !== undefined) patch.category = body.category;
    if (body.tags !== undefined) patch.tags = body.tags;
    if (body.readingTime !== undefined) patch.reading_time = body.readingTime;
    if (body.featured !== undefined) patch.featured = body.featured;
    if (body.visible !== undefined) patch.visible = body.visible;

    await repository.update(id, patch);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "article.updated",
      targetType: "article",
      targetId: id,
      metadata: { patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/articles] update failed:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const id = decodeId((await params).id);

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const repository = createArticleRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }

    await repository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "article.deleted",
      targetType: "article",
      targetId: id,
      metadata: { title: existing.title },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/articles] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
