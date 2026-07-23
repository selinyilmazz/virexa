"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { RepositoryRow } from "@/types/database";

export function AdminCollectionCreateForm({ repositories }: { repositories: RepositoryRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/admin/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, slug, repositoryIds: selected }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't create collection.");
      toast.success("Collection created."); setName(""); setSlug(""); setSelected([]); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Couldn't create collection."); } finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium text-slate-700">Name<input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#2f67e8] focus:bg-white" /></label>
      <label className="text-sm font-medium text-slate-700">Slug<input required value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="best-ai-coding-agents" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#2f67e8] focus:bg-white" /></label>
    </div>
    <fieldset><legend className="text-sm font-medium text-slate-700">Initial repositories <span className="font-normal text-slate-500">(optional)</span></legend><div className="mt-2 grid max-h-40 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2">{repositories.map((repository) => <label key={repository.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={selected.includes(repository.id)} onChange={() => toggle(repository.id)} className="size-4 rounded" />{repository.id}</label>)}</div></fieldset>
    <button type="submit" disabled={pending || !name.trim() || !slug.trim()} className="rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50">{pending ? "Creating…" : "Create Collection"}</button>
  </form>;
}
