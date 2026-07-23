import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { RepositoryUpdate } from "@/types/database";

/**
 * Admin-only repository edit/delete (requirement 7). `[id]` is the
 * URL-encoded `owner/repo` full name (contains a literal "/", so the
 * client must `encodeURIComponent()` it - Next.js decodes a `%2F`
 * segment back to "/" when populating `params.id`, same trick used
 * anywhere else in this app an id needs to travel through a single
 * dynamic route segment).
 *
 * Editing any of description/language/license/stars/forks/topics turns
 * `auto_sync` off automatically, so a later GitHub sync never silently
 * overwrites an admin's manual correction - see
 * `repository-sync-service.ts`'s doc comment.
 */

const AUTO_SYNC_FIELDS = ["description", "language", "license", "stars", "forks", "topics"] as const;

const bodySchema = z.object({
  description: z.string().trim().optional(),
  language: z.string().trim().nullable().optional(),
  license: z.string().trim().nullable().optional(),
  stars: z.number().int().min(0).optional(),
  forks: z.number().int().min(0).optional(),
  githubUrl: z.string().trim().url().optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  visible: z.boolean().optional(),
  archived: z.boolean().optional(),
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
    const repository = createRepositoryRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Repository not found." }, { status: 404 });
    }

    const patch: RepositoryUpdate = {};
    if (body.description !== undefined) patch.description = body.description;
    if (body.language !== undefined) patch.language = body.language;
    if (body.license !== undefined) patch.license = body.license;
    if (body.stars !== undefined) patch.stars = body.stars;
    if (body.forks !== undefined) patch.forks = body.forks;
    if (body.githubUrl !== undefined) patch.github_url = body.githubUrl;
    if (body.featured !== undefined) patch.featured = body.featured;
    if (body.trending !== undefined) patch.trending = body.trending;
    if (body.visible !== undefined) patch.visible = body.visible;
    if (body.archived !== undefined) patch.archived = body.archived;

    const touchedAutoSyncField = AUTO_SYNC_FIELDS.some((field) => field in body);
    if (touchedAutoSyncField) patch.auto_sync = false;

    await repository.update(id, patch);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "repository.updated",
      targetType: "repository",
      targetId: id,
      metadata: { patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/repositories] update failed:", error);
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
    const repository = createRepositoryRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Repository not found." }, { status: 404 });
    }

    await repository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "repository.deleted",
      targetType: "repository",
      targetId: id,
      metadata: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/repositories] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
