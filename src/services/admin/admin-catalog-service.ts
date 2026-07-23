import { createServiceClient } from "@/lib/supabase/service-client";
import { createCatalogItemRepository } from "@/repositories/catalog-item-repository";
import { paginateArray, type PagedArrayResult } from "@/lib/admin/paginate-array";
import type { CatalogItemRow, CatalogResourceTypeDb } from "@/types/database";

/**
 * Server-only read access for `/admin/catalog-items`. Uses the
 * service-role client (not the public request-scoped one) so the admin
 * table can see hidden (`visible = false`) rows too - the public RLS
 * policy on `catalog_items` only allows `visible = true` (see
 * `supabase/migrations/0022_catalog_items.sql`), same reasoning as
 * `admin-repository-service.ts` needing the service client for full
 * visibility.
 */
export async function getAdminCatalogItemsList(resourceType?: CatalogResourceTypeDb): Promise<CatalogItemRow[]> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return [];
    return await createCatalogItemRepository(supabase).list({ resourceType });
  } catch (error) {
    console.error("[admin-catalog-service] getAdminCatalogItemsList failed:", error);
    return [];
  }
}

/** Search + paginated catalog items list for `/admin/catalog-items` (requirement 10: unified pagination). Small, bounded table per resource type - fetches the (already type-filtered) list once, then filters by title/provider search and paginates in application code, same convention as `admin-release-service.ts`'s `getAdminReleasesPage`. */
export async function getAdminCatalogItemsPage(
  resourceType: CatalogResourceTypeDb | undefined,
  search: string | undefined,
  page: number,
  pageSize: number
): Promise<PagedArrayResult<CatalogItemRow>> {
  const all = await getAdminCatalogItemsList(resourceType);
  const needle = search?.trim().toLowerCase();
  const filtered = needle ? all.filter((item) => `${item.title} ${item.provider}`.toLowerCase().includes(needle)) : all;
  return paginateArray(filtered, page, pageSize);
}

export async function getAdminCatalogItemCount(): Promise<number> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return 0;
    return await createCatalogItemRepository(supabase).count();
  } catch (error) {
    console.error("[admin-catalog-service] getAdminCatalogItemCount failed:", error);
    return 0;
  }
}
