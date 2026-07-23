import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { createServiceClient } from "@/lib/supabase/service-client";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";
import { env } from "@/lib/env";

/**
 * Admin "Reset Password" action. Reuses the exact same Supabase Auth
 * mechanism the public `/forgot-password` flow uses -
 * `auth.resetPasswordForEmail()` - just triggered on the target user's
 * behalf instead of by the user themselves. This sends a real recovery
 * email (if the Supabase project's SMTP is configured) whose link lands
 * on `/update-password` via `/auth/callback` (see that page's doc
 * comment for the full round trip) - not a fabricated "email sent"
 * message with no real effect.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { data: existingResponse, error: fetchError } = await supabase.auth.admin.getUserById(id);
    if (fetchError || !existingResponse.user?.email) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }
    const targetEmail = existingResponse.user.email;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${env.site.url}/auth/callback?next=/update-password`,
    });
    if (resetError) throw resetError;

    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "user.password_reset_sent",
      targetType: "auth_user",
      targetId: id,
      metadata: { targetEmail },
    });

    return NextResponse.json({ ok: true, message: `Password reset email sent to ${targetEmail}.` });
  } catch (error) {
    console.error("[api/admin/users] reset-password failed:", error);
    return NextResponse.json({ ok: false, error: "Couldn't send the password reset email." }, { status: 500 });
  }
}
