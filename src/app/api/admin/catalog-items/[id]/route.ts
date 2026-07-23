import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createCatalogItemRepository } from "@/repositories/catalog-item-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import type { CatalogItemUpdate } from "@/types/database";

/**
 * Admin-only Developer Hub catalog item edit/delete. `[id]` is the
 * URL-encoded `resourceType:slug` id (see `route.ts`'s doc comment for
 * why) - decoded the same way `[id]/route.ts` for repositories does for
 * its own slash-containing ids.
 */

const bodySchema = z.object({
  title: z.string().trim().min(1).optional(),
  provider: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  price: z.enum(["free", "paid"]).nullable().optional(),
  url: z.string().trim().url().optional(),
  emoji: z.string().trim().optional(),
  featured: z.boolean().optional(),
  official: z.boolean().optional(),
  steps: z.array(z.string().trim().min(1)).optional(),
  estimatedTime: z.string().trim().nullable().optional(),
  fileType: z.string().trim().nullable().optional(),
  visible: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
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
    const repository = createCatalogItemRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Catalog item not found." }, { status: 404 });
    }

    const patch: CatalogItemUpdate = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.provider !== undefined) patch.provider = body.provider;
    if (body.description !== undefined) patch.description = body.description;
    if (body.difficulty !== undefined) patch.difficulty = body.difficulty;
    if (body.price !== undefined) patch.price = body.price;
    if (body.url !== undefined) patch.url = body.url;
    if (body.emoji !== undefined) patch.emoji = body.emoji;
    if (body.featured !== undefined) patch.featured = body.featured;
    if (body.official !== undefined) patch.official = body.official;
    if (body.steps !== undefined) patch.steps = body.steps;
    if (body.estimatedTime !== undefined) patch.estimated_time = body.estimatedTime;
    if (body.fileType !== undefined) patch.file_type = body.fileType;
    if (body.visible !== undefined) patch.visible = body.visible;
    if (body.displayOrder !== undefined) patch.display_order = body.displayOrder;

    await repository.update(id, patch);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "catalog_item.updated",
      targetType: "catalog_item",
      targetId: id,
      metadata: { patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/catalog-items] update failed:", error);
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
    const repository = createCatalogItemRepository(supabase);
    const existing = await repository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Catalog item not found." }, { status: 404 });
    }

    await repository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "catalog_item.deleted",
      targetType: "catalog_item",
      targetId: id,
      metadata: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/catalog-items] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
