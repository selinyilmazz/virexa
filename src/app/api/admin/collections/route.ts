import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createCollectionRepository } from "@/repositories/collection-repository";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

const bodySchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  icon: z.string().trim().max(32).optional(),
  displayOrder: z.number().int().optional(),
  visible: z.boolean().optional(),
  repositoryIds: z.array(z.string().trim().min(1)).optional(),
});

export async function POST(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  let body: z.infer<typeof bodySchema>;
  try { body = bodySchema.parse(await request.json()); } catch { return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 }); }
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  try {
    const collections = createCollectionRepository(supabase);
    if (await collections.getBySlug(body.slug)) return NextResponse.json({ ok: false, error: "That collection slug already exists." }, { status: 409 });
    const repositoryIds = [...new Set(body.repositoryIds ?? [])];
    const repositories = await createRepositoryRepository(supabase).list();
    const validIds = new Set(repositories.map((repository) => repository.id));
    if (repositoryIds.some((id) => !validIds.has(id))) return NextResponse.json({ ok: false, error: "One or more selected repositories no longer exist." }, { status: 400 });
    const collection = await collections.create({ slug: body.slug, name: body.name, description: body.description ?? "", icon: body.icon ?? "", display_order: body.displayOrder ?? 0, visible: body.visible ?? true });
    await collections.setMembers(collection.id, repositoryIds);
    await recordAuditEvent({ actor: { id: admin.id, email: admin.email }, action: "collection.created", targetType: "collection", targetId: collection.id, metadata: { slug: collection.slug, repositoryIds } });
    return NextResponse.json({ ok: true, id: collection.id });
  } catch (error) {
    console.error("[api/admin/collections] create failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't create collection." }, { status: 500 });
  }
}
