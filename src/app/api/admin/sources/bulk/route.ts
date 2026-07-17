import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createSourceRepository } from "@/repositories/source-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Bulk Sources operations (requirement 6): bulk Active/Inactive and
 * bulk Trust Score update. Same write path as the existing single-row
 * `/api/admin/sources/[id]` route (`SourceRepository.updateFields`,
 * service-role client, no delete support), just applied to a batch of
 * ids in parallel instead of one id. No destructive action - "Yıkıcı
 * işlemler ekleme."
 */

const bodySchema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1, "At least one source id is required.").max(200),
    action: z.enum(["activate", "deactivate", "set-trust-score"]),
    trustScore: z.number().int().min(0).max(100).optional(),
  })
  .refine((value) => value.action !== "set-trust-score" || value.trustScore !== undefined, {
    message: "trustScore is required for the set-trust-score action.",
  });

export async function POST(request: Request) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid request body.";
    return NextResponse.json({ ok: false, error: message ?? "Invalid request body." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const sourceRepository = createSourceRepository(supabase);
    const patch =
      body.action === "activate"
        ? { active: true }
        : body.action === "deactivate"
          ? { active: false }
          : { trustScore: body.trustScore as number };

    await Promise.all(body.ids.map((id) => sourceRepository.updateFields(id, patch)));

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: body.action === "set-trust-score" ? "source.bulk_trust_score_updated" : `source.bulk_${body.action}d`,
      targetType: "article_source",
      metadata: { count: body.ids.length, ids: body.ids, patch },
    });

    return NextResponse.json({ ok: true, updated: body.ids.length });
  } catch (error) {
    console.error("[api/admin/sources/bulk] update failed:", error);
    return NextResponse.json({ ok: false, error: "Bulk update failed." }, { status: 500 });
  }
}
