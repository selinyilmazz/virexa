"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  className: "size-5",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
} as const;

const NAV_ITEMS: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.5" />
        <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.5" />
        <rect x="13" y="13" width="7.5" height="7.5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/admin/articles",
    label: "Articles",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 3.5h9L19 8v12.5H6z" strokeLinejoin="round" />
        <path d="M9 12h6M9 15.5h6M9 8.5h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/sources",
    label: "Sources",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 4.5c8 0 15.5 7.5 15.5 15.5" strokeLinecap="round" />
        <path d="M4 10.5c4.7 0 9 4.3 9 9" strokeLinecap="round" />
        <circle cx="5" cy="19" r="1.8" />
      </svg>
    ),
  },
  {
    href: "/admin/runtime",
    label: "Runtime",
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/ai",
    label: "AI",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="m12 3 1.8 4.6L18.5 9.5l-4.7 1.9L12 16l-1.8-4.6L5.5 9.5l4.7-1.9L12 3Z" strokeLinejoin="round" />
        <path d="M18.5 15.5 19.3 17.5 21.3 18.3 19.3 19.1 18.5 21.1 17.7 19.1 15.7 18.3 17.7 17.5 18.5 15.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" strokeLinecap="round" />
        <path d="M16 4.3a3.2 3.2 0 0 1 0 6.2M18.5 20c0-2.9-1.8-5.1-4.2-5.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.6 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/admin/audit",
    label: "Audit Log",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M6 3.5h9L19 8v12.5H6z" strokeLinejoin="round" />
        <path d="M9 12h6M9 15.5h4" strokeLinecap="round" />
        <circle cx="16.5" cy="16.5" r="3" />
        <path d="m18.5 18.5 1.5 1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 20V10M11 20V4M18 20v-7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/admin/health",
    label: "Health",
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3.5 12h4l2-5 3 10 2-7 1.5 2h4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function isActivePath(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Fixed sidebar for the whole `/admin` area ("Sidebar ve header
 * iskeleti oluştur"). Every listed item routes to a real page (some
 * placeholder-content this phase), so navigation genuinely works even
 * where the underlying section isn't built out yet.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-2 border-b border-slate-200 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[#2f67e8] text-sm font-bold text-white">
          V
        </span>
        <div>
          <p className="text-base font-bold leading-tight text-slate-950">Virexa</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>
      </div>

      <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-blue-50 text-[#2f67e8]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-950"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m4 11 8-7 8 7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 10v9.5h12V10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          View Site
        </Link>
      </div>
    </aside>
  );
}
