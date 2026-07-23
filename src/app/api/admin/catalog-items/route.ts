import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createCatalogItemRepository } from "@/repositories/catalog-item-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only Developer Hub catalog item creation. `id` is always derived
 * from `resourceType:slug` (matches the id convention
 * `developer-hub-service.ts` already builds at read time - see
 * `supabase/migrations/0022_catalog_items.sql`'s doc comment).
 */

const RESOURCE_TYPES = ["certification", "course", "learning-path", "developer-tool", "roadmap", "cheat-sheet"] as const;

const bodySchema = z.object({
  resourceType: z.enum(RESOURCE_TYPES),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only."),
  title: z.string().trim().min(1),
  provider: z.string().trim().min(1),
  description: z.string().trim().optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable().optional(),
  price: z.enum(["free", "paid"]).nullable().optional(),
  url: z.string().trim().url(),
  emoji: z.string().trim().optional(),
  featured: z.boolean().optional(),
  official: z.boolean().optional(),
  steps: z.array(z.string().trim().min(1)).optional(),
  estimatedTime: z.string().trim().nullable().optional(),
  fileType: z.string().trim().nullable().optional(),
  visible: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
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

  const id = `${body.resourceType}:${body.slug}`;

  try {
    const repository = createCatalogItemRepository(supabase);
    const existing = await repository.getById(id);
    if (existing) {
      return NextResponse.json({ ok: false, error: `${id} already exists.` }, { status: 409 });
    }

    await repository.create({
      id,
      resource_type: body.resourceType,
      slug: body.slug,
      title: body.title,
      provider: body.provider,
      description: body.description ?? "",
      difficulty: body.difficulty ?? null,
      price: body.price ?? null,
      url: body.url,
      emoji: body.emoji ?? "",
      featured: body.featured ?? false,
      official: body.official ?? false,
      steps: body.steps ?? [],
      estimated_time: body.estimatedTime ?? null,
      file_type: body.fileType ?? null,
      visible: body.visible ?? true,
      display_order: body.displayOrder ?? 0,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "catalog_item.created",
      targetType: "catalog_item",
      targetId: id,
      metadata: { id, resourceType: body.resourceType },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[api/admin/catalog-items] create failed:", error);
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 500 });
  }
}
