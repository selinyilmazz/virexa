import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-client";

/**
 * Settings/Privacy "Clear Reading History" (`lib/reading-history.ts`'s
 * `clearReadingHistory()`). A server route is required here - unlike
 * bookmarks, `reading_history` has no delete RLS policy for the
 * `authenticated` role (see migration `0011_reading_history.sql`'s doc
 * comment: every write goes through the service-role client from a
 * trusted server path). Authenticates the caller with the request-scoped
 * client first, then performs the actual delete with the service-role
 * client, scoped to that same user's id.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return NextResponse.json({ ok: false, error: "Not configured." }, { status: 503 });
  }

  try {
    const { error } = await serviceClient.from("reading_history").delete().eq("user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/reading-history/clear] failed:", error);
    return NextResponse.json({ ok: false, error: "Failed to clear reading history." }, { status: 500 });
  }
}
