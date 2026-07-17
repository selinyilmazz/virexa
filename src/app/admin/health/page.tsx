import type { Metadata } from "next";
import { HealthOverviewSection } from "@/components/admin/HealthOverviewSection";

export const metadata: Metadata = {
  title: "Health | Virexa Admin",
};

export default function AdminHealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Health</h1>
        <p className="mt-1 text-sm text-slate-500">Database, Runtime, News Pipeline, AI Providers, and Cache status.</p>
      </div>

      <HealthOverviewSection />
    </div>
  );
}
