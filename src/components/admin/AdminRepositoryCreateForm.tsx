"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";

/** "New Repository" form for `/admin/repositories` (requirement 7). Owner + repo name are the only required fields - everything else can be filled in via Edit or pulled in with Sync from GitHub right after creating. */
export function AdminRepositoryCreateForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [owner, setOwner] = useState("");
  const [repoName, setRepoName] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!owner.trim() || !repoName.trim()) return;

    setPending(true);
    try {
      const response = await fetch("/api/admin/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: owner.trim(), repoName: repoName.trim() }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't add repository.");
      toast.success(`Added ${json.id}. Click Sync to pull live GitHub data.`);
      setOwner("");
      setRepoName("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add repository.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Owner</label>
        <input
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="vercel"
          className="mt-1 h-11 w-40 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repository</label>
        <input
          value={repoName}
          onChange={(event) => setRepoName(event.target.value)}
          placeholder="next.js"
          className="mt-1 h-11 w-48 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !owner.trim() || !repoName.trim()}
        className="flex h-11 items-center justify-center rounded-xl bg-[#2f67e8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Repository"}
      </button>
    </form>
  );
}
