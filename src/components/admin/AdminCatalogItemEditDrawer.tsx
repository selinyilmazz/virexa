"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { CatalogItemRow } from "@/types/database";

type AdminCatalogItemEditDrawerProps = {
  item: CatalogItemRow;
  closeHref: string;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white";
const labelClass = "text-sm font-medium text-slate-700";

const HAS_DIFFICULTY = ["certification", "course", "learning-path", "roadmap"];
const HAS_PRICE = ["certification", "course", "learning-path", "developer-tool"];

/** Full edit form for a single Developer Hub catalog item - mirrors `AdminRepositoryEditDrawer`, fields adapted to only what this item's `resource_type` actually uses. */
export function AdminCatalogItemEditDrawer({ item, closeHref }: AdminCatalogItemEditDrawerProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: item.title,
    provider: item.provider,
    description: item.description,
    url: item.url,
    emoji: item.emoji,
    difficulty: item.difficulty ?? "",
    price: item.price ?? "",
    official: item.official,
    estimatedTime: item.estimated_time ?? "",
    steps: item.steps.join(", "),
    fileType: item.file_type ?? "",
    displayOrder: String(item.display_order),
  });

  function close() {
    router.push(closeHref, { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch(`/api/admin/catalog-items/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          provider: form.provider,
          description: form.description,
          url: form.url,
          emoji: form.emoji,
          difficulty: HAS_DIFFICULTY.includes(item.resource_type) ? form.difficulty || null : null,
          price: HAS_PRICE.includes(item.resource_type) ? form.price || null : null,
          official: item.resource_type === "certification" ? form.official : false,
          estimatedTime: item.resource_type === "roadmap" ? form.estimatedTime || null : null,
          steps: item.resource_type === "roadmap" ? form.steps.split(",").map((s) => s.trim()).filter(Boolean) : [],
          fileType: item.resource_type === "cheat-sheet" ? form.fileType || null : null,
          displayOrder: Number(form.displayOrder) || 0,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save changes.");
      toast.success("Catalog item saved.");
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
          <h2 className="text-lg font-bold text-slate-950">Edit {item.title}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title</label>
              <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Provider</label>
              <input value={form.provider} onChange={(event) => setForm((prev) => ({ ...prev, provider: event.target.value }))} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              rows={3}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL</label>
              <input type="url" value={form.url} onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Emoji</label>
              <input value={form.emoji} onChange={(event) => setForm((prev) => ({ ...prev, emoji: event.target.value }))} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {HAS_DIFFICULTY.includes(item.resource_type) && (
              <div>
                <label className={labelClass}>Difficulty</label>
                <select value={form.difficulty} onChange={(event) => setForm((prev) => ({ ...prev, difficulty: event.target.value }))} className={inputClass}>
                  <option value="">—</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            )}
            {HAS_PRICE.includes(item.resource_type) && (
              <div>
                <label className={labelClass}>Price</label>
                <select value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} className={inputClass}>
                  <option value="">—</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            )}
          </div>

          {item.resource_type === "certification" && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={form.official} onChange={(event) => setForm((prev) => ({ ...prev, official: event.target.checked }))} className="size-4 rounded border-slate-300" />
              Official program
            </label>
          )}

          {item.resource_type === "roadmap" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Estimated Time</label>
                <input value={form.estimatedTime} onChange={(event) => setForm((prev) => ({ ...prev, estimatedTime: event.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Steps (comma-separated)</label>
                <input value={form.steps} onChange={(event) => setForm((prev) => ({ ...prev, steps: event.target.value }))} className={inputClass} />
              </div>
            </div>
          )}

          {item.resource_type === "cheat-sheet" && (
            <div>
              <label className={labelClass}>File Type</label>
              <input value={form.fileType} onChange={(event) => setForm((prev) => ({ ...prev, fileType: event.target.value }))} className={inputClass} />
            </div>
          )}

          <div>
            <label className={labelClass}>Display Order</label>
            <input
              type="number"
              value={form.displayOrder}
              onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: event.target.value }))}
              className={inputClass}
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
