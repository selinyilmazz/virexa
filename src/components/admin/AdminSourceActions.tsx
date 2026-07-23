"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminSourceActionsProps = {
  sourceId: string;
  trustScore: number;
};

/**
 * Inline Trust Score editor - the one Source control that's a real form
 * (numeric input + submit), not a single-click action, so it stays as its
 * own table cell rather than moving into the row's overflow menu
 * (requirement 12's overflow-menu pattern is for action *buttons*; this is
 * an editable field). The Active/Inactive toggle moved into
 * `AdminSourceRowActions`'s overflow menu alongside Sync/Delete - its
 * current state is still visible read-only via the table's "Active"
 * status badge column.
 */
export function AdminSourceActions({ sourceId, trustScore }: AdminSourceActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustInput, setTrustInput] = useState(String(trustScore));

  async function patchSource(body: { trustScore?: number }) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Update failed.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }

  function handleTrustSubmit() {
    const parsed = Number(trustInput);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
      setError("Trust score must be an integer between 0 and 100.");
      return;
    }
    void patchSource({ trustScore: parsed });
  }

  return (
    <div className="min-w-[180px] space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={100}
          value={trustInput}
          onChange={(event) => setTrustInput(event.target.value)}
          disabled={pending}
          className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-950 focus:border-[#2f67e8] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleTrustSubmit}
          disabled={pending}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Update Trust
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
