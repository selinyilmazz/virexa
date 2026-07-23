"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { DeveloperReleaseChannel, DeveloperReleaseRow } from "@/types/database";

type AdminReleaseEditDrawerProps = {
  release: DeveloperReleaseRow;
  closeHref: string;
};

const CHANNEL_OPTIONS: { value: DeveloperReleaseChannel; label: string }[] = [
  { value: "stable", label: "Stable" },
  { value: "beta", label: "Beta" },
  { value: "rc", label: "RC" },
  { value: "lts", label: "LTS" },
];

/**
 * Full edit form for a single Developer Release (requirement 8: Version/
 * Release Date/Stable-Beta/Release Notes/Documentation/GitHub/Download).
 * `slug` and `product` name are intentionally not editable here - the
 * slug is the join key onto `src/data/releases.tsx`'s static content
 * (see `release-detail-service.ts`), so changing it would silently
 * disconnect an existing release from its rich editorial content.
 */
export function AdminReleaseEditDrawer({ release, closeHref }: AdminReleaseEditDrawerProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    version: release.version,
    releaseDate: release.release_date,
    channel: release.channel,
    releaseNotes: release.release_notes,
    maintainer: release.maintainer,
    license: release.license,
    platform: release.platform,
    websiteUrl: release.website_url ?? "",
    docsUrl: release.docs_url ?? "",
    githubUrl: release.github_url ?? "",
    downloadUrl: release.download_url ?? "",
  });

  function close() {
    router.push(closeHref, { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/admin/releases/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version,
          releaseDate: form.releaseDate,
          channel: form.channel,
          releaseNotes: form.releaseNotes,
          maintainer: form.maintainer,
          license: form.license,
          platform: form.platform,
          websiteUrl: form.websiteUrl || null,
          docsUrl: form.docsUrl || null,
          githubUrl: form.githubUrl || null,
          downloadUrl: form.downloadUrl || null,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save changes.");
      toast.success("Release saved.");
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
          <h2 className="text-lg font-bold text-slate-950">Edit {release.product}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Version</label>
              <input
                value={form.version}
                onChange={(event) => setForm((prev) => ({ ...prev, version: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Release Date</label>
              <input
                type="date"
                value={form.releaseDate}
                onChange={(event) => setForm((prev) => ({ ...prev, releaseDate: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Channel</label>
            <select
              value={form.channel}
              onChange={(event) => setForm((prev) => ({ ...prev, channel: event.target.value as DeveloperReleaseChannel }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            >
              {CHANNEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Release Notes</label>
            <textarea
              value={form.releaseNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, releaseNotes: event.target.value }))}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Maintainer</label>
              <input
                value={form.maintainer}
                onChange={(event) => setForm((prev) => ({ ...prev, maintainer: event.target.value }))}
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
            <div>
              <label className="text-sm font-medium text-slate-700">Platform</label>
              <input
                value={form.platform}
                onChange={(event) => setForm((prev) => ({ ...prev, platform: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Website URL</label>
            <input
              type="url"
              value={form.websiteUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, websiteUrl: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Documentation URL</label>
            <input
              type="url"
              value={form.docsUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, docsUrl: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
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

          <div>
            <label className="text-sm font-medium text-slate-700">Download URL</label>
            <input
              type="url"
              value={form.downloadUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, downloadUrl: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
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
