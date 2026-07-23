import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { AdminCollectionCreateForm } from "@/components/admin/AdminCollectionCreateForm";
import { AdminCollectionEditDrawer } from "@/components/admin/AdminCollectionEditDrawer";
import { AdminCollectionsTable } from "@/components/admin/AdminCollectionsTable";
import { getAdminCollections, getAdminCollectionEditorData } from "@/services/admin/admin-collection-service";

export const metadata: Metadata = { title: "Collections | Virexa Admin" };
type Props = { searchParams: Promise<{ edit?: string | string[] }> };

export default async function AdminCollectionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const editId = Array.isArray(params.edit) ? params.edit[0] : params.edit;
  const [collections, createData, editData] = await Promise.all([
    getAdminCollections(),
    getAdminCollectionEditorData(),
    editId ? getAdminCollectionEditorData(editId) : Promise.resolve(null),
  ]);
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold tracking-tight text-slate-950">GitHub Collections</h1><p className="mt-1 text-sm text-slate-500">Curate named repository groups for the GitHub Explorer.</p></div>
    <SectionCard title="Create Collection" description="Group repositories into a hand-picked, public-facing collection."><AdminCollectionCreateForm repositories={createData.repositories} /></SectionCard>
    <SectionCard title="All Collections"><AdminCollectionsTable collections={collections} /></SectionCard>
    {editData?.collection && <AdminCollectionEditDrawer collection={editData.collection} repositories={editData.repositories} memberIds={editData.memberIds} closeHref="/admin/collections" />}
  </div>;
}
