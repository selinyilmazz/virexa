"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { RepositoryRow } from "@/types/database";

type AdminRepositoryEditDrawerProps = {
  repository: RepositoryRow;
  closeHref: string;
};

/**
 * Full edit form for a single repository (requirement 7: "Allow editing:
 * Description, Stars, Language, License, GitHub URL"). Saving any of
 * description/language/license/stars/forks turns `auto_sync` off
 * server-side (see `/api/admin/repositories/[id]/route.ts`) so a later
 * GitHub sync never overwrites the admin's manual correction.
 */
export function AdminRepositoryEditDrawer({ repository, closeHref }: AdminRepositoryEditDrawerProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    description: repository.description,
    language: repository.language ?? "",
    license: repository.license ?? "",
    stars: String(repository.stars),
    forks: String(repository.forks),
    githubUrl: repository.github_url,
  });

  function close() {
    router.push(closeHref, { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/admin/repositories/${encodeURIComponent(repository.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          language: form.language || null,
          license: form.license || null,
          stars: Number(form.stars) || 0,
          forks: Number(form.forks) || 0,
          githubUrl: form.githubUrl,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save changes.");
      toast.success("Repository saved.");
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
          <h2 className="text-lg font-bold text-slate-950">Edit {repository.id}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Language</label>
              <input
                value={form.language}
                onChange={(event) => setForm((prev) => ({ ...prev, language: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">License</label>
              <input
                value={form.license}
                onChange={(event) => setForm((prev) => ({ ...prev, license: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Stars</label>
              <input
                type="number"
                min={0}
                value={form.stars}
                onChange={(event) => setForm((prev) => ({ ...prev, stars: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Forks</label>
              <input
                type="number"
                min={0}
                value={form.forks}
                onChange={(event) => setForm((prev) => ({ ...prev, forks: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">GitHub URL</label>
            <input
              type="url"
              value={form.githubUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, githubUrl: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <p className="text-xs text-slate-500">
            Saving turns off automatic GitHub syncing for this repository so your edits aren&apos;t overwritten - use &quot;Sync&quot; on the list to pull fresh data again later.
          </p>

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
