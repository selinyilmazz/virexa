import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { getAdminNotifications } from "@/services/admin/admin-notifications-service";

/**
 * Backs `NotificationsBell` (a Client Component, so it can't call the
 * server-only `admin-notifications-service.ts` directly). Same
 * `getAdminUserOrNull()` 403-on-non-admin guard as every other
 * `/api/admin/*` route, even though this endpoint only reads.
 */
export async function GET() {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const notifications = await getAdminNotifications();
  return NextResponse.json({ notifications });
}
