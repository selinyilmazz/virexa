"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/admin/ToastProvider";
import type { SiteSettingsRow } from "@/types/database";

type AdminSiteSettingsFormProps = {
  settings: SiteSettingsRow;
};

/**
 * Editable Site Settings form (requirement 12). Seeded from the current
 * `site_settings` row, PATCHes `/api/admin/settings` on save.
 * `enableRegistrations` and `maintenanceMode` are real, load-bearing
 * toggles - not cosmetic - see that route's doc comment for where
 * they're consumed.
 */
export function AdminSiteSettingsForm({ settings }: AdminSiteSettingsFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    siteName: settings.site_name,
    logoUrl: settings.logo_url ?? "",
    primaryColor: settings.primary_color,
    homepageFeaturedCount: String(settings.homepage_featured_count),
    articlesPerPage: String(settings.articles_per_page),
    enableRegistrations: settings.enable_registrations,
    maintenanceMode: settings.maintenance_mode,
    defaultLanguage: settings.default_language,
    defaultTimezone: settings.default_timezone,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: form.siteName,
          logoUrl: form.logoUrl || null,
          primaryColor: form.primaryColor,
          homepageFeaturedCount: Number(form.homepageFeaturedCount) || 4,
          articlesPerPage: Number(form.articlesPerPage) || 20,
          enableRegistrations: form.enableRegistrations,
          maintenanceMode: form.maintenanceMode,
          defaultLanguage: form.defaultLanguage,
          defaultTimezone: form.defaultTimezone,
        }),
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.ok === false) throw new Error(json.error ?? "Couldn't save settings.");
      toast.success("Settings saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save settings.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Site Name</label>
          <input
            value={form.siteName}
            onChange={(event) => setForm((prev) => ({ ...prev, siteName: event.target.value }))}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Logo URL</label>
          <input
            type="url"
            value={form.logoUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
            placeholder="https://…"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Primary Color</label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))}
              className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
            />
            <input
              value={form.primaryColor}
              onChange={(event) => setForm((prev) => ({ ...prev, primaryColor: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Homepage Featured Count</label>
          <input
            type="number"
            min={1}
            max={12}
            value={form.homepageFeaturedCount}
            onChange={(event) => setForm((prev) => ({ ...prev, homepageFeaturedCount: event.target.value }))}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Articles Per Page</label>
          <input
            type="number"
            min={5}
            max={100}
            value={form.articlesPerPage}
            onChange={(event) => setForm((prev) => ({ ...prev, articlesPerPage: event.target.value }))}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Default Language</label>
          <select
            value={form.defaultLanguage}
            onChange={(event) => setForm((prev) => ({ ...prev, defaultLanguage: event.target.value }))}
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          >
            <option value="en">English</option>
            <option value="tr">Türkçe</option>
            <option value="nl">Nederlands</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Default Timezone</label>
          <input
            value={form.defaultTimezone}
            onChange={(event) => setForm((prev) => ({ ...prev, defaultTimezone: event.target.value }))}
            placeholder="UTC"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#2f67e8] focus:bg-white"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-slate-950">Enable Registrations</span>
            <span className="block text-xs text-slate-500">Off hides the sign-up form site-wide.</span>
          </span>
          <input
            type="checkbox"
            checked={form.enableRegistrations}
            onChange={(event) => setForm((prev) => ({ ...prev, enableRegistrations: event.target.checked }))}
            className="size-5 shrink-0 rounded accent-[#2f67e8]"
          />
        </label>
        <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-slate-950">Maintenance Mode</span>
            <span className="block text-xs text-slate-500">On redirects non-admin visitors to a maintenance page.</span>
          </span>
          <input
            type="checkbox"
            checked={form.maintenanceMode}
            onChange={(event) => setForm((prev) => ({ ...prev, maintenanceMode: event.target.checked }))}
            className="size-5 shrink-0 rounded accent-[#2f67e8]"
          />
        </label>
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2556c9] disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
