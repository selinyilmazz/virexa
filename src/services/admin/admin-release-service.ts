import { createServiceClient } from "@/lib/supabase/service-client";
import { createReleaseRepository } from "@/repositories/release-repository";
import { paginateArray, type PagedArrayResult } from "@/lib/admin/paginate-array";
import type { DeveloperReleaseRow } from "@/types/database";

/**
 * Server-only read access for `/admin/developer-releases` - mirrors
 * `admin-repository-service.ts`. Uses the service-role client so the
 * admin table can see hidden (`visible = false`) rows too - the public
 * RLS policy on `developer_releases` only allows `visible = true` (see
 * `supabase/migrations/0019_developer_releases.sql`).
 */
export async function getAdminReleasesList(): Promise<DeveloperReleaseRow[]> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return [];
    return await createReleaseRepository(supabase).list();
  } catch (error) {
    console.error("[admin-release-service] getAdminReleasesList failed:", error);
    return [];
  }
}

/** Search + paginated releases list for `/admin/releases` (requirement 10: unified pagination). Small, bounded table - fetches everything once, then filters/paginates in application code (see `paginate-array.ts`'s doc comment). */
export async function getAdminReleasesPage(search: string | undefined, page: number, pageSize: number): Promise<PagedArrayResult<DeveloperReleaseRow>> {
  const all = await getAdminReleasesList();
  const needle = search?.trim().toLowerCase();
  const filtered = needle
    ? all.filter((release) => `${release.product} ${release.version} ${release.maintainer}`.toLowerCase().includes(needle))
    : all;
  return paginateArray(filtered, page, pageSize);
}

export async function getAdminReleaseCount(): Promise<number> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return 0;
    return await createReleaseRepository(supabase).count();
  } catch (error) {
    console.error("[admin-release-service] getAdminReleaseCount failed:", error);
    return 0;
  }
}
