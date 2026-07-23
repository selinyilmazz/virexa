import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/**
 * Admin-only user mutation endpoint (requirement 1): role change (Admin
 * verme/alma) and Suspend/Reactivate. Both operate on `auth.users` via
 * the Supabase Admin API, which is only reachable through the
 * service-role client - never sent to the browser (requirement 10).
 *
 * Suspend/Reactivate uses Supabase Auth's own, already-supported `ban_duration`
 * field (`admin.updateUserById(id, { ban_duration })`) rather than a new
 * schema column - "Suspend / Reactivate (şema destekliyorsa)" and this
 * genuinely is schema-native GoTrue behavior, so no migration was needed
 * for it. `"876000h"` (~100 years) is Supabase's own documented example
 * for an effectively-indefinite ban; `"none"` lifts it.
 *
 * Safety guard: an admin can never suspend or demote their own account
 * through this endpoint - a deliberate, non-destructive safeguard so an
 * admin can't accidentally lock themselves out (not one of the
 * requirement's own asks, but squarely in the spirit of "sadece güvenli
 * işlemler ... yıkıcı işlemler ekleme").
 */

const bodySchema = z
  .object({
    role: z.enum(["admin", "user"]).optional(),
    suspended: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.suspended !== undefined, {
    message: "At least one of role/suspended must be provided.",
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

  if (id === admin.id && (body.role === "user" || body.suspended === true)) {
    return NextResponse.json({ ok: false, error: "You cannot suspend or demote your own account." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const { data: existingResponse, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !existingResponse.user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }
    const existing = existingResponse.user;

    const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
      ...(body.role !== undefined ? { app_metadata: { ...existing.app_metadata, role: body.role } } : {}),
      ...(body.suspended !== undefined ? { ban_duration: body.suspended ? "876000h" : "none" } : {}),
    });
    if (updateError) throw updateError;

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: body.role !== undefined ? "user.role_changed" : body.suspended ? "user.suspended" : "user.reactivated",
      targetType: "auth_user",
      targetId: id,
      metadata: { targetEmail: existing.email, before: { role: existing.app_metadata?.role ?? "user" }, patch: body },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/users] update failed:", error);
    return NextResponse.json({ ok: false, error: "Update failed." }, { status: 500 });
  }
}

/**
 * Deletes a user account via the Supabase Admin API
 * (`auth.admin.deleteUser`). `profiles`/`bookmarks`/`settings`/reading
 * history all reference `auth.users(id) on delete cascade` (see
 * `supabase/migrations/0001_production_schema.sql` and the reading
 * history migration), so this one call also cleans up every table this
 * app has ever attached to a user - no separate cleanup queries needed.
 * Same self-protection guard as PATCH: an admin can never delete their
 * own account through this endpoint.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json({ ok: false, error: "You cannot delete your own account." }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Storage is not configured." }, { status: 503 });
  }

  try {
    const { data: existingResponse, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !existingResponse.user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }
    const existing = existingResponse.user;

    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) throw deleteError;

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "user.deleted",
      targetType: "auth_user",
      targetId: id,
      metadata: { targetEmail: existing.email },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/users] delete failed:", error);
    return NextResponse.json({ ok: false, error: "Delete failed." }, { status: 500 });
  }
}
