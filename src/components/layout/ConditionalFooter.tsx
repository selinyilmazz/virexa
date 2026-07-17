"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";

/**
 * Renders the public site's `Footer` everywhere except `/admin` - the
 * admin area has its own, deliberately separate layout shell
 * (`app/admin/layout.tsx`) and showing the public marketing footer
 * (newsletter/legal links/etc.) underneath it would break that
 * separation. This is the only thing that changes about `Footer` or
 * the root layout for non-admin routes - every existing page still
 * renders exactly the same `<Footer />` it did before.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }
  return <Footer />;
}
