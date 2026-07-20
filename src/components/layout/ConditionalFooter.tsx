"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public site's `Footer` everywhere under `/admin` - the admin
 * area has its own, deliberately separate layout shell
 * (`app/admin/layout.tsx`) and showing the public marketing footer
 * (legal links/etc.) underneath it would break that separation.
 *
 * Takes the already-rendered `<Footer />` as `children` rather than
 * importing and rendering `Footer` itself: `Footer` is now an async
 * Server Component (it resolves the request's locale via
 * `getServerTranslations()`, which reads cookies through `next/headers`),
 * and Server Components using server-only APIs cannot be imported into a
 * Client Component's module graph. `RootLayout` (a Server Component)
 * renders `<Footer />` and passes the result in here as `children` -
 * the standard Server-Component-inside-Client-Component composition
 * pattern - so this file only ever needs the client-only `usePathname()`
 * to decide whether to show what was already rendered.
 */
export function ConditionalFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }
  return <>{children}</>;
}
