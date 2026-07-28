import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createNewsletterSubscriberRepository } from "@/repositories/newsletter-subscriber-repository";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only single-subscriber mutation - Deactivate/Reactivate (`PATCH`)
 * and Delete (`DELETE`) from `/admin/newsletter`. Same shape as
 * `/api/admin/sources/[id]/route.ts`: `getAdminUserOrNull()` auth check,
 * service-role client (required - `newsletter_subscribers` has zero RLS
 * policies, see migration 0033), existence check before mutating, one
 * `recordAuditEvent()` call, and a generic error message on any repository
 * failure (never the raw Postgres error).
 */

const bodySchema = z.object({
  is_active: z.boolean(),
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
    const newsletterRepository = createNewsletterSubscriberRepository(supabase);
    const existing = await newsletterRepository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Subscriber not found." }, { status: 404 });
    }

    await newsletterRepository.updateFields(id, { is_active: body.is_active });

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: body.is_active ? "newsletter_subscriber.reactivated" : "newsletter_subscriber.deactivated",
      targetType: "newsletter_subscriber",
      targetId: id,
      metadata: { email: existing.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/newsletter] update failed:", error);
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
    const newsletterRepository = createNewsletterSubscriberRepository(supabase);
    const existing = await newsletterRepository.getById(id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Subscriber not found." }, { status: 404 });
    }

    await newsletterRepository.remove(id);

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "newsletter_subscriber.deleted",
      targetType: "newsletter_subscriber",
      targetId: id,
      metadata: { email: existing.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/newsletter] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
