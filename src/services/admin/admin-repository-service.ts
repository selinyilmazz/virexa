import { createServiceClient } from "@/lib/supabase/service-client";
import { createRepositoryRepository, type RepositoryListParams } from "@/repositories/repository-repository";
import type { RepositoryRow } from "@/types/database";

/**
 * Server-only read access for `/admin/repositories`. Uses the
 * service-role client (not the public request-scoped one) so the admin
 * table can see hidden (`visible = false`) and archived rows too - the
 * public RLS policy on `repositories` only allows `visible = true and
 * archived = false` (see `supabase/migrations/0018_repositories.sql` and
 * `0023_repositories_extended.sql`), same reasoning as
 * `admin-user-service.ts` needing the service client for full visibility.
 */
export async function getAdminRepositoriesList(): Promise<RepositoryRow[]> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return [];
    return await createRepositoryRepository(supabase).list();
  } catch (error) {
    console.error("[admin-repository-service] getAdminRepositoriesList failed:", error);
    return [];
  }
}

export type AdminRepositoriesPage = {
  items: RepositoryRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Filtered/sorted/paginated repositories list for `/admin/repositories` - the search/filter/sort/pagination counterpart to `getAdminRepositoriesList()` above. */
export async function getAdminRepositoriesPage(params: RepositoryListParams): Promise<AdminRepositoriesPage> {
  const pageSize = params.pageSize ?? 25;
  const page = Math.max(1, params.page ?? 1);
  try {
    const supabase = createServiceClient();
    if (!supabase) return { items: [], total: 0, page, pageSize, totalPages: 1 };
    const { items, total } = await createRepositoryRepository(supabase).listPage(params);
    return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  } catch (error) {
    console.error("[admin-repository-service] getAdminRepositoriesPage failed:", error);
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }
}

export async function getAdminRepositoryLanguages(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return [];
    return await createRepositoryRepository(supabase).listDistinctLanguages();
  } catch (error) {
    console.error("[admin-repository-service] getAdminRepositoryLanguages failed:", error);
    return [];
  }
}

export async function getAdminRepositoryCount(): Promise<number> {
  try {
    const supabase = createServiceClient();
    if (!supabase) return 0;
    return await createRepositoryRepository(supabase).count();
  } catch (error) {
    console.error("[admin-repository-service] getAdminRepositoryCount failed:", error);
    return 0;
  }
}
