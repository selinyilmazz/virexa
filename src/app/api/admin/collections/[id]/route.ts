import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createCollectionRepository } from "@/repositories/collection-repository";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { CollectionUpdate } from "@/types/database";

const bodySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), name: z.string().trim().min(1).optional(), description: z.string().trim().optional(), icon: z.string().trim().max(32).optional(), displayOrder: z.number().int().optional(), visible: z.boolean().optional(), repositoryIds: z.array(z.string().trim().min(1)).optional(),
});

async function authorized() { return getAdminUserOrNull(); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorized();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  let body: z.infer<typeof bodySchema>;
  try { body = bodySchema.parse(await request.json()); } catch { return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 }); }
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  try {
    const id = (await params).id;
    const collections = createCollectionRepository(supabase);
    const existing = await collections.getById(id);
    if (!existing) return NextResponse.json({ ok: false, error: "Collection not found." }, { status: 404 });
    if (body.slug && body.slug !== existing.slug) {
      const conflict = await collections.getBySlug(body.slug);
      if (conflict) return NextResponse.json({ ok: false, error: "That collection slug already exists." }, { status: 409 });
    }
    if (body.repositoryIds) {
      const ids = [...new Set(body.repositoryIds)];
      const validIds = new Set((await createRepositoryRepository(supabase).list()).map((repository) => repository.id));
      if (ids.some((repositoryId) => !validIds.has(repositoryId))) return NextResponse.json({ ok: false, error: "One or more selected repositories no longer exist." }, { status: 400 });
      await collections.setMembers(id, ids);
    }
    const patch: CollectionUpdate = {};
    if (body.slug !== undefined) patch.slug = body.slug;
    if (body.name !== undefined) patch.name = body.name;
    if (body.description !== undefined) patch.description = body.description;
    if (body.icon !== undefined) patch.icon = body.icon;
    if (body.displayOrder !== undefined) patch.display_order = body.displayOrder;
    if (body.visible !== undefined) patch.visible = body.visible;
    if (Object.keys(patch).length) await collections.update(id, patch);
    await recordAuditEvent({ actor: { id: admin.id, email: admin.email }, action: "collection.updated", targetType: "collection", targetId: id, metadata: { patch: body } });
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("[api/admin/collections] update failed:", error); return NextResponse.json({ ok: false, error: "Couldn't update collection." }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await authorized();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  try {
    const id = (await params).id;
    const collections = createCollectionRepository(supabase);
    if (!(await collections.getById(id))) return NextResponse.json({ ok: false, error: "Collection not found." }, { status: 404 });
    await collections.remove(id);
    await recordAuditEvent({ actor: { id: admin.id, email: admin.email }, action: "collection.deleted", targetType: "collection", targetId: id, metadata: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) { console.error("[api/admin/collections] delete failed:", error); return NextResponse.json({ ok: false, error: "Couldn't delete collection." }, { status: 500 }); }
}
