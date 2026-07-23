import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createArticleRepository } from "@/repositories/article-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import { buildArticleId } from "@/lib/news/slug";

/**
 * Admin-only "Duplicate" action (requirement 5). Copies every editable
 * field of the source article into a new row with a fresh id/slug
 * (`-copy`, `-copy-2`, ... on repeat clicks) and `visible: false` so a
 * duplicate never silently goes live identical to its original - an
 * admin reviews and edits it, then publishes explicitly.
 */

function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const original = await repository.getById(id);
    if (!original) {
      return NextResponse.json({ ok: false, error: "Article not found." }, { status: 404 });
    }

    let slug = `${original.slug}-copy`;
    let newId = buildArticleId(original.source_id, slug);
    let suffix = 2;
    while (await repository.getById(newId)) {
      slug = `${original.slug}-copy-${suffix}`;
      newId = buildArticleId(original.source_id, slug);
      suffix += 1;
    }

    const created = await repository.create({
      id: newId,
      slug,
      title: `${original.title} (Copy)`,
      subtitle: original.subtitle,
      description: original.description,
      content: original.content,
      url: "",
      image_url: original.image_url,
      published_at: new Date().toISOString(),
      language: original.language,
      country: original.country,
      category: original.category,
      author: original.author,
      tags: original.tags,
      reading_time: original.reading_time,
      trust_score: original.trust_score,
      trending_score: 0,
      source_id: original.source_id,
      featured: false,
      visible: false,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "article.duplicated",
      targetType: "article",
      targetId: created.id,
      metadata: { fromId: id },
    });

    return NextResponse.json({ ok: true, id: created.id, message: `Duplicated as "${created.title}" (unpublished).` });
  } catch (error) {
    console.error("[api/admin/articles] duplicate failed:", error);
    return NextResponse.json({ ok: false, error: "Duplicate failed." }, { status: 500 });
  }
}
