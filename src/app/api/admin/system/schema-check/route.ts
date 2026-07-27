import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { checkSettingsSchema } from "@/lib/startup/settings-schema-check.server";

/**
 * Admin-only diagnostic: "is the live database's `user_settings`/
 * `profiles` schema actually caught up to what the code expects?" - see
 * `settings-schema-check.server.ts` for why this needs to be a runtime
 * check rather than something inferred from the migration files alone.
 * GET (not POST) - read-only, no side effects, safe to hit repeatedly
 * from a health dashboard or on-call runbook.
 */
export async function GET() {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const result = await checkSettingsSchema();
  return NextResponse.json(result, { status: result.ok || result.skipped ? 200 : 503 });
}
