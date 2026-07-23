import type { Metadata } from "next";
import Link from "next/link";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminCatalogItemFilters } from "@/components/admin/AdminCatalogItemFilters";
import { AdminCatalogItemCreateForm } from "@/components/admin/AdminCatalogItemCreateForm";
import { AdminCatalogItemsTable } from "@/components/admin/AdminCatalogItemsTable";
import { AdminCatalogItemEditDrawer } from "@/components/admin/AdminCatalogItemEditDrawer";
import { getAdminCatalogItemsPage, getAdminCatalogItemsList } from "@/services/admin/admin-catalog-service";
import { RESOURCE_TYPE_LABELS } from "@/lib/developer-hub/shared";
import type { CatalogResourceTypeDb } from "@/types/database";

export const metadata: Metadata = {
  title: "Developer Hub Catalog | Virexa Admin",
};

const RESOURCE_TYPES: CatalogResourceTypeDb[] = ["certification", "course", "learning-path", "developer-tool", "roadmap", "cheat-sheet"];

const DEFAULT_PAGE_SIZE = 25;
const ALLOWED_PAGE_SIZES = [10, 25, 50, 100];

type AdminCatalogItemsPageProps = {
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
 * Admin Developer Hub Catalog management - CRUD for certifications,
 * courses, learning paths, developer tools, roadmaps and cheat sheets
 * (everything in `CatalogResourceType` except "github-repo", which is
 * live GitHub data with its own `/admin/repositories` management). Now
 * extended with search + pagination (requirement 10), same
 * searchParams-driven convention as every other admin listing page. The
 * edit target is resolved against the full type-filtered list (not just
 * the current page) since it may live on a different page.
 */
export default async function AdminCatalogItemsPage({ searchParams }: AdminCatalogItemsPageProps) {
  const params = await searchParams;
  const editId = toStringParam(params.edit);
  const activeType = toStringParam(params.type) as CatalogResourceTypeDb | undefined;
  const page = Math.max(1, toNumberParam(params.page) ?? 1);
  const pageSize = toPageSizeParam(params.pageSize);
  const search = toStringParam(params.q);

  const [itemsPage, allOfType] = await Promise.all([
    getAdminCatalogItemsPage(activeType, search, page, pageSize),
    editId ? getAdminCatalogItemsList(activeType) : Promise.resolve([]),
  ]);
  const editingItem = editId ? allOfType.find((item) => item.id === editId) ?? null : null;

  const closeDrawerHref = (() => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "edit") continue;
      const raw = toStringParam(value);
      if (raw) query.set(key, raw);
    }
    const queryString = query.toString();
    return queryString ? `/admin/catalog-items?${queryString}` : "/admin/catalog-items";
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Developer Hub Catalog</h1>
        <p className="mt-1 text-sm text-slate-500">
          {itemsPage.total.toLocaleString()} item{itemsPage.total === 1 ? "" : "s"}
          {activeType ? ` in ${RESOURCE_TYPE_LABELS[activeType]}` : " across certifications, courses, learning paths, developer tools, roadmaps and cheat sheets"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/catalog-items"
          className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
            !activeType ? "border-[#2f67e8] bg-[#2f67e8]/10 text-[#2f67e8]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All
        </Link>
        {RESOURCE_TYPES.map((type) => (
          <Link
            key={type}
            href={`/admin/catalog-items?type=${type}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeType === type ? "border-[#2f67e8] bg-[#2f67e8]/10 text-[#2f67e8]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {RESOURCE_TYPE_LABELS[type]}
          </Link>
        ))}
      </div>

      <SectionCard title="Add Catalog Item" description="Add a certification, course, learning path, developer tool, roadmap or cheat sheet to the public Developer Hub.">
        <AdminCatalogItemCreateForm />
      </SectionCard>

      <SectionCard title={activeType ? RESOURCE_TYPE_LABELS[activeType] : "All Catalog Items"}>
        <div className="mb-5">
          <AdminCatalogItemFilters />
        </div>
        {itemsPage.items.length === 0 ? (
          <EmptyState
            icon="🎓"
            title="No catalog items found"
            description="No items match the current search, or none have been added yet."
          />
        ) : (
          <>
            <AdminCatalogItemsTable items={itemsPage.items} />
            <AdminPagination
              page={itemsPage.page}
              pageSize={itemsPage.pageSize}
              totalItems={itemsPage.total}
              itemLabel="items"
            />
          </>
        )}
      </SectionCard>

      {editingItem && <AdminCatalogItemEditDrawer item={editingItem} closeHref={closeDrawerHref} />}
    </div>
  );
}
