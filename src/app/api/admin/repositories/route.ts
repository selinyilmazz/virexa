import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only repository creation (requirement 7). Accepts a GitHub
 * `owner/repo` full name plus the same admin-editable fields the
 * edit form exposes; `id` is always derived from `owner/repoName`
 * (matches the bookmark item id convention used throughout the public
 * Open Source Explorer - see `repository-repository.ts`'s doc comment).
 */

const bodySchema = z.object({
  owner: z.string().trim().min(1),
  repoName: z.string().trim().min(1),
  description: z.string().trim().optional(),
  language: z.string().trim().optional(),
  license: z.string().trim().optional(),
  githubUrl: z.string().trim().url().optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
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

  const id = `${body.owner}/${body.repoName}`;

  try {
    const repository = createRepositoryRepository(supabase);
    const existing = await repository.getById(id);
    if (existing) {
      return NextResponse.json({ ok: false, error: `${id} is already tracked.` }, { status: 409 });
    }

    await repository.create({
      id,
      owner: body.owner,
      repo_name: body.repoName,
      description: body.description ?? "",
      language: body.language ?? null,
      license: body.license ?? null,
      github_url: body.githubUrl ?? `https://github.com/${id}`,
      featured: body.featured ?? false,
      trending: body.trending ?? false,
      visible: body.visible ?? true,
      auto_sync: true,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "repository.created",
      targetType: "repository",
      targetId: id,
      metadata: { id },
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[api/admin/repositories] create failed:", error);
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 500 });
  }
}
