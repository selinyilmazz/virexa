import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createReleaseRepository } from "@/repositories/release-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { DeveloperReleaseUpdate } from "@/types/database";

/**
 * Admin-only Developer Release edit/delete (requirement 8), mirrors
 * `/api/admin/repositories/[id]/route.ts`. `[id]` is the row's uuid
 * primary key (no slash-encoding trick needed - unlike a repository's
 * `owner/repo` id, a release id is a plain uuid).
 */

const bodySchema = z.object({
  product: z.string().trim().min(1).optional(),
  version: z.string().trim().min(1).optional(),
  releaseDate: z.string().trim().min(1).optional(),
  channel: z.enum(["stable", "beta", "lts", "rc"]).optional(),
  releaseNotes: z.string().trim().optional(),
  maintainer: z.string().trim().optional(),
  license: z.string().trim().optional(),
  platform: z.string().trim().optional(),
  websiteUrl: z.string().trim().url().nullable().optional(),
  docsUrl: z.string().trim().url().nullable().optional(),
  githubUrl: z.string().trim().url().nullable().optional(),
  downloadUrl: z.string().trim().url().nullable().optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  visible: z.boolean().optional(),
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
    const repository = createReleaseRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Release not found." }, { status: 404 });
    }

    const patch: DeveloperReleaseUpdate = {};
    if (body.product !== undefined) patch.product = body.product;
    if (body.version !== undefined) patch.version = body.version;
    if (body.releaseDate !== undefined) patch.release_date = body.releaseDate;
    if (body.channel !== undefined) patch.channel = body.channel;
    if (body.releaseNotes !== undefined) patch.release_notes = body.releaseNotes;
    if (body.maintainer !== undefined) patch.maintainer = body.maintainer;
    if (body.license !== undefined) patch.license = body.license;
    if (body.platform !== undefined) patch.platform = body.platform;
    if (body.websiteUrl !== undefined) patch.website_url = body.websiteUrl;
    if (body.docsUrl !== undefined) patch.docs_url = body.docsUrl;
    if (body.githubUrl !== undefined) patch.github_url = body.githubUrl;
    if (body.downloadUrl !== undefined) patch.download_url = body.downloadUrl;
    if (body.featured !== undefined) patch.featured = body.featured;
    if (body.trending !== undefined) patch.trending = body.trending;
    if (body.visible !== undefined) patch.visible = body.visible;

    await repository.update(id, patch);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "release.updated",
      targetType: "release",
      targetId: id,
      metadata: { patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/releases] update failed:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}

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
    const repository = createReleaseRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Release not found." }, { status: 404 });
    }

    await repository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "release.deleted",
      targetType: "release",
      targetId: id,
      metadata: { slug: existing.slug, product: existing.product },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/releases] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
