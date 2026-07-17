import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { AdminSourcesTable } from "@/components/admin/AdminSourcesTable";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";

export const metadata: Metadata = {
  title: "Sources | Virexa Admin",
};

/**
 * Admin Sources Management (requirements 5-6 from the Articles & Sources
 * phase, plus Bulk Operations from the Operations phase). Server
 * Component - list comes straight from `getAdminSourcesList()`, no
 * client fetch. `AdminSourcesTable` (client) now owns both the per-row
 * actions (Active toggle, Trust Score) and the new bulk-selection
 * toolbar (Bulk Activate/Deactivate/Trust Score) - deletion is still
 * intentionally absent.
 */
export default async function AdminSourcesPage() {
  const sources = await getAdminSourcesList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Sources</h1>
        <p className="mt-1 text-sm text-slate-500">
          {sources.length.toLocaleString()} registered source{sources.length === 1 ? "" : "s"}.
        </p>
      </div>

      <SectionCard title="All Sources">
        {sources.length === 0 ? (
          <EmptyState icon="📡" title="No sources found" description="No news sources are registered yet." />
        ) : (
          <AdminSourcesTable items={sources} />
        )}
      </SectionCard>
    </div>
  );
}
