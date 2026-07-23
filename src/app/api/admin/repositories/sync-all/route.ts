import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { syncAllRepositories } from "@/services/open-source/repository-sync-service";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

/** Bulk "Sync from GitHub" for every auto-sync-enabled repository (requirement 7). */
export async function POST() {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const result = await syncAllRepositories();

  await recordAuditEvent({
    actor: { id: admin.id, email: admin.email },
    action: "repository.bulk_synced",
    targetType: "repository",
    metadata: result,
  });

  return NextResponse.json({
    ok: true,
    ...result,
    message: `Synced ${result.synced}, skipped ${result.skipped} (manual edits), ${result.failed} failed.`,
  });
}
