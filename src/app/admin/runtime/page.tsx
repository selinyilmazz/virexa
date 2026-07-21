import type { Metadata } from "next";
import { RuntimeStatusSection } from "@/components/admin/RuntimeStatusSection";
import { SectionCard } from "@/components/admin/SectionCard";
import { RuntimeActionsPanel } from "@/components/admin/RuntimeActionsPanel";

export const metadata: Metadata = {
  title: "Runtime | Virexa Admin",
};

/**
 * Forces this page to always render fresh, per-request - defensive fix
 * alongside `RuntimeStatusSection`'s data-source fix (see that
 * component's doc comment): without this, Next.js/Vercel could still
 * statically cache the page at build time even though the underlying
 * data (`runtime_job_runs`) is fully dynamic and changes every time cron
 * runs a job.
 */
export const dynamic = "force-dynamic";

/**
 * `RuntimeStatusSection` (built in an earlier phase) is untouched - this
 * page adds one new section below it, "Operations" (requirement 2), so
 * `/admin/runtime` "artık sadece bilgi göstermesin" without changing
 * anything about the existing read-only status view.
 */
export default function AdminRuntimePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Runtime</h1>
        <p className="mt-1 text-sm text-slate-500">Background job engine status and safe manual operations.</p>
      </div>

      <RuntimeStatusSection />

      <SectionCard
        title="Operations"
        description="Safe, non-destructive actions. Each queues a background job or runs a bounded, targeted update - nothing here deletes data."
      >
        <RuntimeActionsPanel />
      </SectionCard>
    </div>
  );
}
