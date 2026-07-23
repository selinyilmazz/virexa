import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminReleaseFilters } from "@/components/admin/AdminReleaseFilters";
import { AdminReleaseCreateForm } from "@/components/admin/AdminReleaseCreateForm";
import { AdminReleasesTable } from "@/components/admin/AdminReleasesTable";
import { AdminReleaseEditDrawer } from "@/components/admin/AdminReleaseEditDrawer";
import { getAdminReleasesList, getAdminReleasesPage } from "@/services/admin/admin-release-service";

export const metadata: Metadata = {
  title: "Developer Releases | Virexa Admin",
};

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminReleasesPageProps = {
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
 * Admin Developer Releases (requirement 8/10). Server Component, mirrors
 * `/admin/repositories` and `/admin/articles` exactly: searchParams-driven
 * search + pagination via `getAdminReleasesPage()` (small, bounded table -
 * see `paginate-array.ts`), the shared `AdminPagination` component, and an
 * edit drawer gated on `?edit=<id>`. The edit target is resolved against
 * the full unpaginated list (`getAdminReleasesList()`) since the row being
 * edited may live on a different page than the one currently shown.
 */
export default async function AdminReleasesPage({ searchParams }: AdminReleasesPageProps) {
  const params = await searchParams;
  const editId = toStringParam(params.edit);
  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const search = toStringParam(params.q);

  const [releasesPage, allReleases] = await Promise.all([
    getAdminReleasesPage(search, page, pageSize),
    editId ? getAdminReleasesList() : Promise.resolve([]),
  ]);
  const editingRelease = editId ? allReleases.find((release) => release.id === editId) ?? null : null;

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "edit") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/releases?${queryString}` : "/admin/releases";
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Developer Releases</h1>
        <p className="mt-1 text-sm text-slate-500">
          {releasesPage.total.toLocaleString()} release{releasesPage.total === 1 ? "" : "s"} tracked for the Developer Hub.
        </p>
      </div>

      <SectionCard title="Add Release" description="Track a new product release. Fill in the rest via Edit.">
        <AdminReleaseCreateForm />
      </SectionCard>

      <SectionCard title="All Releases">
        <div className="mb-5">
          <AdminReleaseFilters />
        </div>
        {releasesPage.items.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="No releases found"
            description="No releases match the current search, or none have been added yet."
          />
        ) : (
          <>
            <AdminReleasesTable items={releasesPage.items} />
            <AdminPagination
              page={releasesPage.page}
              pageSize={releasesPage.pageSize}
              totalItems={releasesPage.total}
              itemLabel="releases"
            />
          </>
        )}
      </SectionCard>

      {editingRelease && <AdminReleaseEditDrawer release={editingRelease} closeHref={closeDrawerHref} />}
    </div>
  );
}
