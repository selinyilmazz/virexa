"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { AdminArticleDetail } from "@/services/admin/admin-article-service";

type AdminArticleEditFormProps = {
  /** `null` for "New Article" mode; a full detail object for editing an existing article. */
  article: AdminArticleDetail | null;
  sources: { id: string; name: string }[];
  categories: string[];
  closeHref: string;
};

/**
 * Full Articles CMS editor form (requirement 5): Title/Subtitle/Summary/
 * Content/Hero Image/Source/Tags/Category/Reading Time/Featured/
 * Publish Status/Save/Cancel. Doubles as both the "New Article" and
 * "Edit Article" form depending on whether `article` is provided -
 * same POST/PATCH split every other admin CRUD drawer in this app uses
 * (`AdminRepositoryEditDrawer`/`AdminReleaseEditDrawer` don't handle
 * create, but `AdminRepositoryCreateForm`-style POST logic is folded in
 * here rather than as a second component, since New/Edit share nearly
 * every field for Articles).
 */
export function AdminArticleEditForm({ article, sources, categories, closeHref }: AdminArticleEditFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const isNew = article === null;

  const [form, setForm] = useState({
    title: article?.title ?? "",
    subtitle: article?.subtitle ?? "",
    summary: article?.description ?? "",
    content: article?.content ?? "",
    imageUrl: article?.image ?? "",
    sourceId: article?.sourceId ?? sources[0]?.id ?? "",
    category: article?.category ?? categories[0] ?? "",
    tags: (article?.tags ?? []).join(", "),
    readingTime: String(article?.readingTime ?? 3),
    featured: article?.featured ?? false,
    visible: article?.visible ?? true,
  });

  function close() {
    router.push(closeHref, { scroll: false });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);

    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      summary: form.summary,
      content: form.content,
      imageUrl: form.imageUrl || undefined,
      sourceId: form.sourceId,
      category: form.category,
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      readingTime: Number(form.readingTime) || 3,
      featured: form.featured,
      visible: form.visible,
    };

    try {
      const response = isNew
        ? await fetch("/api/admin/articles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save article.");
      toast.success(isNew ? "Article created." : "Article saved.");
      router.refresh();
      close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save article.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl sm:rounded-l-3xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-bold text-slate-950">{isNew ? "New Article" : "Edit Article"}</h2>
          <button type="button" onClick={close} aria-label="Close" className="flex size-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 px-6 py-6">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Subtitle</label>
            <input
              value={form.subtitle}
              onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Summary</label>
            <textarea
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              rows={2}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Content</label>
            <textarea
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              rows={8}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Hero Image URL</label>
            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="https://…"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Source</label>
              <select
                value={form.sourceId}
                onChange={(event) => setForm((prev) => ({ ...prev, sourceId: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              >
                {sources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                placeholder="ai, funding, startups"
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reading Time (min)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.readingTime}
                onChange={(event) => setForm((prev) => ({ ...prev, readingTime: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <span className="text-sm font-semibold text-slate-950">Featured</span>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(event) => setForm((prev) => ({ ...prev, featured: event.target.checked }))}
                className="size-5 shrink-0 rounded accent-[#2f67e8]"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
              <span>
                <span className="block text-sm font-semibold text-slate-950">Published</span>
                <span className="block text-xs text-slate-500">Off removes the article's own detail page.</span>
              </span>
              <input
                type="checkbox"
                checked={form.visible}
                onChange={(event) => setForm((prev) => ({ ...prev, visible: event.target.checked }))}
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
              {pending ? "Saving…" : isNew ? "Create Article" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
