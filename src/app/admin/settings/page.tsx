import type { Metadata } from "next";
import { SectionCard } from "@/components/admin/SectionCard";
import { StatusBadge, type AdminStatus } from "@/components/admin/StatusBadge";
import { AdminSiteSettingsForm } from "@/components/admin/AdminSiteSettingsForm";
import { getSettingsCategories, getSystemInfo } from "@/services/admin/admin-settings-service";
import { getSiteSettings } from "@/services/site-settings/site-settings-service";

export const metadata: Metadata = {
  title: "Settings | Virexa Admin",
};

const HEALTH_STATUS_LABEL: Record<string, AdminStatus> = {
  ok: "healthy",
  degraded: "warning",
  unconfigured: "warning",
  down: "offline",
};

/**
 * Admin Settings + System Information (requirements 3-4 + 12). The
 * `site_settings` block at the top is a real, working edit form
 * (`AdminSiteSettingsForm` -> `PATCH /api/admin/settings`) - Site Name/
 * Logo/Primary Color/Homepage Featured Count/Articles Per Page/Enable
 * Registrations/Maintenance Mode/Default Language/Default Timezone are
 * all admin-editable and consumed elsewhere in the app (see that
 * route's doc comment). Everything below it (System Information,
 * category status cards) stays read-only status derived from
 * `admin-settings-service.ts`, by design ("Secrets istemciye
 * gönderilmesin. Gerekirse sadece okunabilir durum bilgisi göster.").
 */
export default async function AdminSettingsPage() {
  const [categories, systemInfo, siteSettings] = await Promise.all([
    Promise.resolve(getSettingsCategories()),
    getSystemInfo(),
    getSiteSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Site configuration, plus read-only environment and system status.</p>
      </div>

      <SectionCard title="Site Settings" description="Editable site-wide configuration.">
        <AdminSiteSettingsForm settings={siteSettings} />
      </SectionCard>

      <SectionCard title="System Information" description="Environment, versions, and live infrastructure status.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Environment</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{systemInfo.environment}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">App Version</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{systemInfo.appVersion}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next.js Version</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{systemInfo.nextVersion}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Node Version</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{systemInfo.nodeVersion}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Process Started</p>
            <p className="mt-1 text-sm font-medium text-slate-950">{new Date(systemInfo.processStartedAt).toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Database</p>
              <StatusBadge status={HEALTH_STATUS_LABEL[systemInfo.databaseStatus] ?? "unknown"} />
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{systemInfo.databaseMessage}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Runtime</p>
              <StatusBadge status={systemInfo.runtimeRunning ? "healthy" : "unknown"} label={systemInfo.runtimeRunning ? "Running" : "Stopped"} />
            </div>
          </div>
        </div>
      </SectionCard>

      {categories.map((category) => (
        <SectionCard key={category.id} title={category.label} description={category.description}>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                <dd className="mt-1 flex items-center gap-2">
                  {item.status ? (
                    <StatusBadge status={item.status === "ok" ? "healthy" : "warning"} label={item.value} />
                  ) : (
                    <span className="text-sm font-medium text-slate-950">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </SectionCard>
      ))}
    </div>
  );
}
