"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { CatalogResourceTypeDb } from "@/types/database";

const RESOURCE_TYPES: { value: CatalogResourceTypeDb; label: string }[] = [
  { value: "certification", label: "Certification" },
  { value: "course", label: "Course" },
  { value: "learning-path", label: "Learning Path" },
  { value: "developer-tool", label: "Developer Tool" },
  { value: "roadmap", label: "Roadmap" },
  { value: "cheat-sheet", label: "Cheat Sheet" },
];

const HAS_DIFFICULTY: CatalogResourceTypeDb[] = ["certification", "course", "learning-path", "roadmap"];
const HAS_PRICE: CatalogResourceTypeDb[] = ["certification", "course", "learning-path", "developer-tool"];

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-slate-500";

/**
 * "New Catalog Item" form for `/admin/catalog-items`. Fields shown adapt
 * to the selected resource type (difficulty/price only apply to some
 * types, steps+estimated time are roadmap-only, file type is cheat-sheet-
 * only, official is certification-only) - mirrors the type-specific shape
 * already established in `src/data/developer-hub.ts`'s per-type item
 * interfaces.
 */
export function AdminCatalogItemCreateForm() {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [resourceType, setResourceType] = useState<CatalogResourceTypeDb>("certification");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [url, setUrl] = useState("");
  const [emoji, setEmoji] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [price, setPrice] = useState("");
  const [official, setOfficial] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState("");
  const [steps, setSteps] = useState("");
  const [fileType, setFileType] = useState("");

  const canSubmit = slug.trim() && title.trim() && provider.trim() && url.trim();

  function reset() {
    setSlug("");
    setTitle("");
    setProvider("");
    setUrl("");
    setEmoji("");
    setDescription("");
    setDifficulty("");
    setPrice("");
    setOfficial(false);
    setEstimatedTime("");
    setSteps("");
    setFileType("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    try {
      const response = await fetch("/api/admin/catalog-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          slug: slug.trim(),
          title: title.trim(),
          provider: provider.trim(),
          url: url.trim(),
          emoji: emoji.trim(),
          description: description.trim(),
          difficulty: HAS_DIFFICULTY.includes(resourceType) && difficulty ? difficulty : null,
          price: HAS_PRICE.includes(resourceType) && price ? price : null,
          official: resourceType === "certification" ? official : false,
          estimatedTime: resourceType === "roadmap" ? estimatedTime.trim() || null : null,
          steps: resourceType === "roadmap" ? steps.split(",").map((s) => s.trim()).filter(Boolean) : [],
          fileType: resourceType === "cheat-sheet" ? fileType.trim() || null : null,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't add catalog item.");
      toast.success(`Added ${json.id}.`);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't add catalog item.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Type</label>
          <select
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value as CatalogResourceTypeDb)}
            className={inputClass}
          >
            {RESOURCE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Slug</label>
          <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="aws-certified-developer" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Emoji</label>
          <input value={emoji} onChange={(event) => setEmoji(event.target.value)} placeholder="☁️" className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="AWS Certified Developer" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Provider</label>
          <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="Amazon Web Services" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
        />
      </div>

      <div>
        <label className={labelClass}>URL</label>
        <input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className={inputClass} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {HAS_DIFFICULTY.includes(resourceType) && (
          <div>
            <label className={labelClass}>Difficulty</label>
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        )}
        {HAS_PRICE.includes(resourceType) && (
          <div>
            <label className={labelClass}>Price</label>
            <select value={price} onChange={(event) => setPrice(event.target.value)} className={inputClass}>
              <option value="">—</option>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        )}
        {resourceType === "certification" && (
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={official} onChange={(event) => setOfficial(event.target.checked)} className="size-4 rounded border-slate-300" />
              Official program
            </label>
          </div>
        )}
        {resourceType === "cheat-sheet" && (
          <div>
            <label className={labelClass}>File Type</label>
            <input value={fileType} onChange={(event) => setFileType(event.target.value)} placeholder="PDF or Web" className={inputClass} />
          </div>
        )}
      </div>

      {resourceType === "roadmap" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Estimated Time</label>
            <input value={estimatedTime} onChange={(event) => setEstimatedTime(event.target.value)} placeholder="3-6 months" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Steps (comma-separated)</label>
            <input value={steps} onChange={(event) => setSteps(event.target.value)} placeholder="HTML, CSS, JavaScript" className={inputClass} />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !canSubmit}
        className="flex h-11 items-center justify-center rounded-xl bg-[#2f67e8] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add Catalog Item"}
      </button>
    </form>
  );
}
