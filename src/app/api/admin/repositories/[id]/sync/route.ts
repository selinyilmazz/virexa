import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { syncRepositoryFromGithub } from "@/services/open-source/repository-sync-service";
import { recordAuditEvent } from "@/services/admin/admin-audit-service";

function decodeId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Per-row "Sync from GitHub" (requirement 7) - forces a refresh even if the row has `auto_sync = false` (an explicit admin click always wins - see `repository-sync-service.ts`). */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const id = decodeId((await params).id);
  const result = await syncRepositoryFromGithub(id, { force: true });

  if (result.ok) {
    await recordAuditEvent({
      actor: { id: admin.id, email: admin.email },
      action: "repository.synced",
      targetType: "repository",
      targetId: id,
      metadata: {},
    });
  }

  return NextResponse.json({ ok: result.ok, error: result.ok ? undefined : result.message, message: result.message });
}
