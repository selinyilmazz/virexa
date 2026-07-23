import Link from "next/link";
import type { ReactNode } from "react";

type AdminMenuLinkProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  target?: string;
};

/** Plain navigation menu row (e.g. "Edit", "View on GitHub") for use inside `AdminRowActionsMenu` - the Link-based counterpart to `AdminMenuActionButton` for items that don't need a fetch/confirm/toast lifecycle. */
export function AdminMenuLink({ href, children, icon, target }: AdminMenuLinkProps) {
  return (
    <Link
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      {icon}
      {children}
    </Link>
  );
}
