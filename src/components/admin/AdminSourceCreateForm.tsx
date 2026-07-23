"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";

/**
 * "New Source" form for `/admin/sources`. Id/Name are the only required
 * fields - domain/country/trust score/logo can be filled in later via
 * Edit. See `/api/admin/sources/route.ts`'s doc comment for the
 * disclosed scope boundary: this only adds attribution metadata, it
 * doesn't register a new RSS feed with the ingestion pipeline.
 */
export function AdminSourceCreateForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!id.trim() || !name.trim()) return;

    setPending(true);
    try {
      const response = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: id.trim(), name: name.trim(), domain: domain.trim() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't add source.");
      toast.success(`Added ${json.id}.`);
      setId("");
      setName("");
      setDomain("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add source.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Id</label>
        <input
          value={id}
          onChange={(event) => setId(event.target.value)}
          placeholder="techcrunch"
          className="mt-1 h-11 w-40 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</label>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="TechCrunch"
          className="mt-1 h-11 w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Domain</label>
        <input
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="techcrunch.com"
          className="mt-1 h-11 w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !id.trim() || !name.trim()}
        className="flex h-11 items-center justify-center rounded-xl bg-[#2f67e8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Source"}
      </button>
    </form>
  );
}
