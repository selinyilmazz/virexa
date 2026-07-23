"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { CollectionRow, RepositoryRow } from "@/types/database";

export function AdminCollectionEditDrawer({ collection, repositories, memberIds, closeHref }: { collection: CollectionRow; repositories: RepositoryRow[]; memberIds: string[]; closeHref: string }) {
  const router = useRouter(); const toast = useToast(); const [pending, setPending] = useState(false);
  const [form, setForm] = useState({ name: collection.name, slug: collection.slug, description: collection.description, icon: collection.icon, displayOrder: String(collection.display_order), visible: collection.visible, repositoryIds: memberIds });
  function close() { router.push(closeHref, { scroll: false }); }
  function toggle(id: string) { setForm((current) => ({ ...current, repositoryIds: current.repositoryIds.includes(id) ? current.repositoryIds.filter((value) => value !== id) : [...current.repositoryIds, id] })); }
  async function submit(event: React.FormEvent) { event.preventDefault(); setPending(true); try {
    const response = await fetch(`/api/admin/collections/${collection.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, displayOrder: Number(form.displayOrder) || 0 }) });
    const json = await response.json().catch(() => ({})); if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save collection."); toast.success("Collection saved."); router.refresh(); close();
  } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't save collection."); } finally { setPending(false); } }
  const input = "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white";
  return <div className="fixed inset-0 z-50 flex justify-end"><button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" /><div className="relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl sm:rounded-l-3xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><h2 className="text-lg font-bold text-slate-950">Edit Collection</h2><button type="button" onClick={close} className="text-slate-500 hover:text-slate-950">Close</button></div><form onSubmit={submit} className="space-y-4 px-6 py-6">
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={input} /></label><label className="text-sm font-medium text-slate-700">Slug<input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} className={input} /></label></div>
    <label className="block text-sm font-medium text-slate-700">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#2f67e8] focus:bg-white" /></label>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Icon<input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="📁" className={input} /></label><label className="text-sm font-medium text-slate-700">Display order<input type="number" value={form.displayOrder} onChange={(event) => setForm({ ...form, displayOrder: event.target.value })} className={input} /></label></div>
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.visible} onChange={(event) => setForm({ ...form, visible: event.target.checked })} className="size-4 rounded" />Visible on GitHub Explorer</label>
    <fieldset><legend className="text-sm font-medium text-slate-700">Repository membership</legend><div className="mt-2 grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2">{repositories.map((repository) => <label key={repository.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={form.repositoryIds.includes(repository.id)} onChange={() => toggle(repository.id)} className="size-4 rounded" />{repository.id}</label>)}</div></fieldset>
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={close} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600">Cancel</button><button type="submit" disabled={pending} className="rounded-xl bg-[#2f67e8] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Saving…" : "Save Changes"}</button></div>
  </form></div></div>;
}
