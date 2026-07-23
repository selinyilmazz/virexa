"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { ArticleSourceRow } from "@/types/database";

type AdminSourceEditDrawerProps = {
  source: ArticleSourceRow;
  closeHref: string;
};

/** Full edit form for a single source: Name/Domain/Logo/Official/Country/Trust Score/Active. */
export function AdminSourceEditDrawer({ source, closeHref }: AdminSourceEditDrawerProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: source.name,
    domain: source.domain,
    logo: source.logo ?? "",
    official: source.official,
    country: source.country,
    trustScore: String(source.trust_score),
    active: source.active,
  });

  function close() {
    router.push(closeHref, { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/admin/sources/${encodeURIComponent(source.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          domain: form.domain,
          logo: form.logo || null,
          official: form.official,
          country: form.country,
          trustScore: Number(form.trustScore) || 0,
          active: form.active,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save changes.");
      toast.success("Source saved.");
      router.refresh();
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save changes.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl sm:rounded-l-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-950">Edit {source.id}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Domain</label>
              <input
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
                placeholder="example.com"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Country</label>
              <input
                value={form.country}
                onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
                placeholder="US"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Logo URL</label>
            <input
              type="url"
              value={form.logo}
              onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))}
              placeholder="https://…"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Trust Score (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.trustScore}
              onChange={(event) => setForm((prev) => ({ ...prev, trustScore: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <span className="text-sm font-semibold text-slate-950">Official</span>
              <input
                type="checkbox"
                checked={form.official}
                onChange={(event) => setForm((prev) => ({ ...prev, official: event.target.checked }))}
                className="size-5 shrink-0 rounded accent-[#2f67e8]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <span className="text-sm font-semibold text-slate-950">Active</span>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                className="size-5 shrink-0 rounded accent-[#2f67e8]"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={close} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-[#2f67e8] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
