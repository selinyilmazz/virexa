import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createReleaseRepository } from "@/repositories/release-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only Developer Release creation (requirement 8), mirrors
 * `/api/admin/repositories/route.ts`. `slug` is auto-derived from
 * `product` when not supplied - it's what joins this DB row onto the
 * curated static content in `src/data/releases.tsx` for the public
 * `/developer-hub/releases/[slug]` detail page (see
 * `release-detail-service.ts`). Creating a release for a brand-new
 * product (no matching static entry) still works - the detail page
 * falls back to a minimal, honest profile built only from these
 * admin-provided fields, never fabricated content.
 */

const bodySchema = z.object({
  product: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  version: z.string().trim().min(1),
  releaseDate: z.string().trim().min(1),
  channel: z.enum(["stable", "beta", "lts", "rc"]).optional(),
  releaseNotes: z.string().trim().optional(),
  maintainer: z.string().trim().optional(),
  license: z.string().trim().optional(),
  platform: z.string().trim().optional(),
  websiteUrl: z.string().trim().url().optional(),
  docsUrl: z.string().trim().url().optional(),
  githubUrl: z.string().trim().url().optional(),
  downloadUrl: z.string().trim().url().optional(),
  featured: z.boolean().optional(),
  trending: z.boolean().optional(),
  visible: z.boolean().optional(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  const slug = slugify(body.slug || body.product);
  if (!slug) {
    return NextResponse.json({ ok: false, error: "Couldn't derive a slug from that product name." }, { status: 400 });
  }

  try {
    const repository = createReleaseRepository(supabase);
    const existing = await repository.getBySlug(slug);
    if (existing) {
      return NextResponse.json({ ok: false, error: `A release with slug "${slug}" already exists.` }, { status: 409 });
    }

    const created = await repository.create({
      slug,
      product: body.product,
      version: body.version,
      release_date: body.releaseDate,
      channel: body.channel ?? "stable",
      release_notes: body.releaseNotes ?? "",
      maintainer: body.maintainer ?? "",
      license: body.license ?? "",
      platform: body.platform ?? "",
      website_url: body.websiteUrl ?? null,
      docs_url: body.docsUrl ?? null,
      github_url: body.githubUrl ?? null,
      download_url: body.downloadUrl ?? null,
      featured: body.featured ?? false,
      trending: body.trending ?? false,
      visible: body.visible ?? true,
    });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "release.created",
      targetType: "release",
      targetId: created.id,
      metadata: { slug, product: body.product },
    });

    return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
  } catch (error) {
    console.error("[api/admin/releases] create failed:", error);
    return NextResponse.json({ ok: false, error: "Create failed." }, { status: 500 });
  }
}
