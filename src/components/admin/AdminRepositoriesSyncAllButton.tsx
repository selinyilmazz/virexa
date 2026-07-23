"use client";

import { AdminActionButton } from "@/components/admin/AdminActionButton";

/**
 * Extracted from `/admin/repositories/page.tsx` (a Server Component) to
 * fix a real runtime crash: "Functions cannot be passed directly to
 * Client Components... {successMessage: function successMessage}". The
 * page was passing an inline arrow function as `AdminActionButton`'s
 * `successMessage` prop directly from a Server Component - React Server
 * Components can't serialize a plain closure across that boundary. Every
 * other `AdminActionButton` usage with a function prop already lived
 * inside a `"use client"` file (client-to-client function props are
 * fine); this component gives Repositories the same shape by moving the
 * function here, inside a Client Component, and having the Server
 * Component render this instead.
 */
export function AdminRepositoriesSyncAllButton() {
  return (
    <AdminActionButton
      label="Sync All"
      pendingLabel="Syncing…"
      endpoint="/api/admin/repositories/sync-all"
      successMessage={(json) => (typeof json.message === "string" ? json.message : "Sync complete.")}
    />
  );
}
