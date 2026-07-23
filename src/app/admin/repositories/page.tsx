import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminRepositoriesSyncAllButton } from "@/components/admin/AdminRepositoriesSyncAllButton";
import { AdminRepositoryFilters } from "@/components/admin/AdminRepositoryFilters";
import { AdminRepositoryCreateForm } from "@/components/admin/AdminRepositoryCreateForm";
import { AdminRepositoriesTable } from "@/components/admin/AdminRepositoriesTable";
import { AdminRepositoryEditDrawer } from "@/components/admin/AdminRepositoryEditDrawer";
import { getAdminRepositoriesPage, getAdminRepositoryLanguages } from "@/services/admin/admin-repository-service";
import type { RepositoryListParams } from "@/repositories/repository-repository";

export const metadata: Metadata = {
  title: "Repositories | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminRepositoriesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toStringParam(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function toNumberParam(value: string | string[] | undefined): number | undefined {
  const raw = toStringParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toPageSizeParam(value: string | string[] | undefined): number {
  const parsed = toNumberParam(value);
  return parsed && ALLOWED_PAGE_SIZES.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
}

/**
 * Admin Repositories. Fixed a real runtime crash this session: the page
 * used to render `<AdminActionButton successMessage={(json) => ...} />`
 * directly from this Server Component, which Next.js rejects ("Functions
 * cannot be passed directly to Client Components") - the "Sync All"
 * button now lives in its own Client Component
 * (`AdminRepositoriesSyncAllButton`) instead.
 *
 * Also extended with real search/filter/sort/pagination (via
 * `getAdminRepositoriesPage`, mirroring `/admin/articles`'s
 * searchParams-driven convention) and Watchers/Latest Release/Status/
 * Health columns (`AdminRepositoriesTable`) - all backed by real GitHub
 * data pulled during sync (`repository-sync-service.ts`), never
 * fabricated.
 */
export default async function AdminRepositoriesPage({ searchParams }: AdminRepositoriesPageProps) {
  const params = await searchParams;
  const editId = toStringParam(params.edit);
  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const pageSize = toPageSizeParam(params.pageSize);

  const listParams: RepositoryListParams = {
    search: toStringParam(params.q),
    language: toStringParam(params.language),
    status: toStringParam(params.status) as RepositoryListParams["status"],
    sort: (toStringParam(params.sort) as RepositoryListParams["sort"]) ?? "stars",
    sortDirection: (toStringParam(params.dir) as RepositoryListParams["sortDirection"]) ?? "desc",
    page,
    pageSize,
  };

  const [repositoriesPage, languages] = await Promise.all([getAdminRepositoriesPage(listParams), getAdminRepositoryLanguages()]);

  const editingRepository = editId ? repositoriesPage.items.find((repo) => repo.id === editId) ?? null : null;

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "edit") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/repositories?${queryString}` : "/admin/repositories";
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Repositories</h1>
          <p className="mt-1 text-sm text-slate-500">
            {repositoriesPage.total.toLocaleString()} repositor{repositoriesPage.total === 1 ? "y" : "ies"} tracked for the Open
            Source Explorer.
          </p>
        </div>
        <AdminRepositoriesSyncAllButton />
      </div>

      <SectionCard title="Add Repository" description="Track a new GitHub repository. Sync afterward to pull live stats.">
        <AdminRepositoryCreateForm />
      </SectionCard>

      <SectionCard title="All Repositories">
        <div className="mb-5">
          <AdminRepositoryFilters languages={languages} />
        </div>
        {repositoriesPage.items.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No repositories found"
            description="No repositories match the current filters, or none have been added yet."
          />
        ) : (
          <>
            <AdminRepositoriesTable items={repositoriesPage.items} />
            <AdminPagination
              page={repositoriesPage.page}
              pageSize={repositoriesPage.pageSize}
              totalItems={repositoriesPage.total}
              itemLabel="repositories"
            />
          </>
        )}
      </SectionCard>

      {editingRepository && <AdminRepositoryEditDrawer repository={editingRepository} closeHref={closeDrawerHref} />}
    </div>
  );
}
