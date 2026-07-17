import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/ToastProvider";
import { requireAdminUser } from "@/lib/admin/authorization";

export const metadata: Metadata = {
  title: "Admin | Virexa",
  robots: { index: false, follow: false },
};

/**
 * Root layout for the whole `/admin` area. `requireAdminUser()` is the
 * server-side authorization gate (defense-in-depth alongside
 * `src/middleware.ts` - see that function's doc comment): a non-admin
 * or signed-out visitor is redirected before anything below this ever
 * renders, so there's no flash of admin UI.
 *
 * Deliberately its own layout, not a nested route under the public
 * site's `Header`/`Footer` shell - "Mevcut site tasarımını etkilemeden
 * ayrı bir layout kullansın." The root `app/layout.tsx` still wraps
 * everything (fonts, `AuthProvider`), but the public `Footer` is hidden
 * under `/admin` via `ConditionalFooter` so the admin area is visually
 * self-contained.
 *
 * `ToastProvider` is mounted once here (Operations phase, requirement
 * 7) so every admin page/component below can call `useToast()` without
 * re-wrapping itself - the one addition to this file this phase, purely
 * additive, no existing behavior changed.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminUser();

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
