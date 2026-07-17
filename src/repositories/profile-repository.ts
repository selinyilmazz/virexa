import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ProfileRow, ProfileUpdate } from "@/types/database";

/**
 * Data access for the `profiles` table. No React, no localStorage, no
 * knowledge of the app's `UserProfile` UI shape - just typed reads/writes
 * against Supabase. `src/lib/profile.ts` is the only caller; it maps
 * between this row shape and the UI-facing `UserProfile` type.
 *
 * Takes a `SupabaseClient` instance rather than importing one itself, so
 * the same repository works with either the browser client
 * (`src/lib/supabase/client.ts`) or a server client
 * (`src/lib/supabase/server.ts`) - and so it can be unit-tested with a
 * fake client with no Next.js/browser context required.
 */
export function createProfileRepository(supabase: SupabaseClient<Database>) {
  return {
    /** Returns `null` if no profile row exists yet (e.g. trigger hasn't run). */
    async getById(userId: string): Promise<ProfileRow | null> {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },

    /** Bulk lookup by id - one round trip regardless of batch size. Admin Users Management (`admin-user-service.ts`) uses this to cross-reference a page of `auth.users` results against their `profiles` row (display name, avatar) without an N+1 query per user. */
    async getByIds(userIds: string[]): Promise<ProfileRow[]> {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase.from("profiles").select("*").in("id", userIds);
      if (error) throw error;
      return data ?? [];
    },

    /**
     * Upserts (rather than a plain update) so this is resilient even if
     * the `on_auth_user_created` trigger hasn't created a row yet -
     * every write is also a "create if missing".
     */
    async upsert(userId: string, patch: ProfileUpdate): Promise<ProfileRow> {
      const { data, error } = await supabase
        .from("profiles")
        .upsert({ id: userId, ...patch }, { onConflict: "id" })
        .select("*")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Profile upsert returned no data.");
      return data;
    },

    /**
     * Total row count - one row per authenticated user (see the
     * `on_auth_user_created` trigger in `0001_production_schema.sql`),
     * so this doubles as "total users". `profiles_select_own` RLS means
     * a request-scoped client only ever counts the caller's own row
     * (0 or 1) - callers that need the real, site-wide total (the Admin
     * Dashboard's "Total Users" stat card) must pass a service-role
     * client (see `lib/supabase/service-client.ts`), which bypasses RLS.
     */
    async count(): Promise<number> {
      const { count, error } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  };
}

export type ProfileRepository = ReturnType<typeof createProfileRepository>;
