"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";

/** "New Release" form for `/admin/releases` (requirement 8). Product/version/date are required; everything else can be filled in via Edit. */
export function AdminReleaseCreateForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [product, setProduct] = useState("");
  const [version, setVersion] = useState("");
  const [releaseDate, setReleaseDate] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!product.trim() || !version.trim() || !releaseDate) return;

    setPending(true);
    try {
      const response = await fetch("/api/admin/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: product.trim(), version: version.trim(), releaseDate }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't add release.");
      toast.success(`Added ${product.trim()} ${version.trim()}.`);
      setProduct("");
      setVersion("");
      setReleaseDate("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add release.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Product</label>
        <input
          value={product}
          onChange={(event) => setProduct(event.target.value)}
          placeholder="Next.js"
          className="mt-1 h-11 w-44 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Version</label>
        <input
          value={version}
          onChange={(event) => setVersion(event.target.value)}
          placeholder="15.1.0"
          className="mt-1 h-11 w-32 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release Date</label>
        <input
          type="date"
          value={releaseDate}
          onChange={(event) => setReleaseDate(event.target.value)}
          className="mt-1 h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending || !product.trim() || !version.trim() || !releaseDate}
        className="flex h-11 items-center justify-center rounded-xl bg-[#2f67e8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Release"}
      </button>
    </form>
  );
}
