"use client";

import { useEffect } from "react";
import { SectionCard } from "@/components/admin/SectionCard";

/**
 * Automatic Error Boundary fallback for every route under `/admin`
 * (Next.js's `error.tsx` convention - same one-file-covers-the-segment
 * behavior as `loading.tsx`). Must be a Client Component per Next.js's
 * requirements. `AdminSidebar`/`AdminHeader` stay mounted (they're part
 * of `layout.tsx`, outside this boundary) - only the page content area
 * is replaced, so navigation still works even after an error.
 *
 * In practice this should rarely fire: every admin data source
 * (`admin-dashboard-service.ts`, `HealthOverviewSection`,
 * `RuntimeStatusSection`) already catches its own errors and renders a
 * safe fallback. This exists as the last line of defense for anything
 * genuinely unexpected ("Hiçbir sayfa beyaz ekran göstermesin").
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  return (
    <SectionCard title="Something went wrong" description="This admin page hit an unexpected error.">
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-slate-500">{error.message || "An unknown error occurred."}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-[#2f67e8] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2556c9]"
        >
          Try again
        </button>
      </div>
    </SectionCard>
  );
}
