"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ToggleSwitch } from "@/components/settings/ToggleSwitch";

type AdminSourceActionsProps = {
  sourceId: string;
  active: boolean;
  trustScore: number;
};

/**
 * The only two Source write actions allowed this phase (requirement 6):
 * Active/Inactive toggle and Trust Score update. No deletion ("Silme
 * yapılmayacak"). Calls the dedicated `/api/admin/sources/[id]` PATCH
 * route (service-role write, admin-checked server-side) and then
 * `router.refresh()` to re-pull the Server Component list - no local
 * optimistic state duplicating what the server already owns.
 */
export function AdminSourceActions({ sourceId, active, trustScore }: AdminSourceActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trustInput, setTrustInput] = useState(String(trustScore));

  async function patchSource(body: { active?: boolean; trustScore?: number }) {
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
    <div className="min-w-[220px] space-y-2">
      <ToggleSwitch
        label={active ? "Active" : "Inactive"}
        checked={active}
        onChange={(checked) => void patchSource({ active: checked })}
      />
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
