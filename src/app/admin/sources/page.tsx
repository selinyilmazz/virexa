import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminSourceFilters } from "@/components/admin/AdminSourceFilters";
import { AdminSourcesTable } from "@/components/admin/AdminSourcesTable";
import { AdminSourceCreateForm } from "@/components/admin/AdminSourceCreateForm";
import { AdminSourceEditDrawer } from "@/components/admin/AdminSourceEditDrawer";
import { getAdminSourcesPage, getAdminSourceById } from "@/services/admin/admin-source-service";

export const metadata: Metadata = {
  title: "Sources | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminSourcesPageProps = {
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
 * Admin Sources Management (requirements 5-6, 10). Server Component -
 * search + pagination now mirror `/admin/releases`/`/admin/repositories`
 * exactly via `getAdminSourcesPage()` and the shared `AdminPagination`.
 */
export default async function AdminSourcesPage({ searchParams }: AdminSourcesPageProps) {
  const params = await searchParams;
  const editId = toStringParam(params.edit);
  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const search = toStringParam(params.q);

  const [sourcesPage, editingSource] = await Promise.all([
    getAdminSourcesPage(search, page, pageSize),
    editId ? getAdminSourceById(editId) : Promise.resolve(null),
  ]);

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "edit") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/sources?${queryString}` : "/admin/sources";
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Sources</h1>
        <p className="mt-1 text-sm text-slate-500">
          {sourcesPage.total.toLocaleString()} registered source{sourcesPage.total === 1 ? "" : "s"}.
        </p>
      </div>

      <SectionCard title="Add Source" description="Registers a new source id for attribution and Articles filtering.">
        <AdminSourceCreateForm />
      </SectionCard>

      <SectionCard title="All Sources">
        <div className="mb-5">
          <AdminSourceFilters />
        </div>
        {sourcesPage.items.length === 0 ? (
          <EmptyState
            icon="📡"
            title="No sources found"
            description="No sources match the current search, or none are registered yet."
          />
        ) : (
          <>
            <AdminSourcesTable items={sourcesPage.items} />
            <AdminPagination
              page={sourcesPage.page}
              pageSize={sourcesPage.pageSize}
              totalItems={sourcesPage.total}
              itemLabel="sources"
            />
          </>
        )}
      </SectionCard>

      {editId && (editingSource ? <AdminSourceEditDrawer source={editingSource} closeHref={closeDrawerHref} /> : null)}
    </div>
  );
}
