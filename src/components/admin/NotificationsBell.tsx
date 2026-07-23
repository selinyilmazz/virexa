"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdminNotification } from "@/services/admin/admin-notifications-service";

const SEVERITY_DOT: Record<AdminNotification["severity"], string> = {
  warning: "bg-amber-500",
  offline: "bg-red-500",
  info: "bg-slate-400",
};

/** Every 90s while the panel/page is open - cheap enough (5 small reads, all already-cached-ish) that polling beats building a realtime channel for this. */
const POLL_MS = 90_000;

function formatRelativeTime(iso?: string): string | null {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/**
 * Real alerts bell for the Admin Header (requirement 3's topbar list).
 * Fetches `/api/admin/notifications` - real System Health / Runtime /
 * Audit Log signals (see `admin-notifications-service.ts`), never
 * fabricated placeholder items. Badge count is the number of
 * warning/offline entries specifically (informational audit entries
 * don't need to demand attention the way a degraded health check does).
 */
export function NotificationsBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/admin/notifications");
        if (!response.ok) return;
        const json = (await response.json()) as { notifications: AdminNotification[] };
        if (!cancelled) setNotifications(json.notifications);
      } catch {
        // Silent - a failed notification fetch shouldn't disrupt the rest of the admin UI.
      }
    }

    void load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const alertCount = notifications.filter((item) => item.severity !== "info").length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M6 8.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 12.5 6 8.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 18a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[85vw] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-slate-950">Notifications</p>
          </div>
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications right now. Everything looks healthy.</p>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
                >
                  <span aria-hidden="true" className={`mt-1.5 size-1.5 shrink-0 rounded-full ${SEVERITY_DOT[item.severity]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-950">{item.title}</span>
                    <span className="block truncate text-xs text-slate-500">{item.description}</span>
                  </span>
                  {item.createdAt && <span className="shrink-0 text-[11px] text-slate-400">{formatRelativeTime(item.createdAt)}</span>}
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
