"use client";

import { useState } from "react";
import { ProfileEditForm } from "@/components/profile/ProfileEditForm";
import { ProfileBookmarksTab } from "@/components/profile/ProfileBookmarksTab";
import { ReadingHistoryList } from "@/components/profile/ReadingHistoryList";
import { SecurityCard } from "@/components/profile/SecurityCard";
import { DangerZoneCard } from "@/components/profile/DangerZoneCard";

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "history", label: "Reading History" },
  { id: "security", label: "Security" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Profile page's tabbed content area (product polishing phase, 2nd pass -
 * "içerikleri sekmelere ayır"), replacing the old single-column stack of
 * every profile card at once. A small, dependency-free tab switcher (no
 * new UI library) - each panel reuses an existing component untouched
 * (`ProfileEditForm`, `SecurityCard`, `DangerZoneCard`) or a light new
 * wrapper around already-existing data (`ProfileBookmarksTab`,
 * `ReadingHistoryList`).
 */
export function ProfileTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  return (
    <div>
      <div role="tablist" aria-label="Profile sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? "bg-[#2f67e8] text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "profile" && <ProfileEditForm />}
        {activeTab === "bookmarks" && <ProfileBookmarksTab />}
        {activeTab === "history" && <ReadingHistoryList />}
        {activeTab === "security" && (
          <div className="space-y-6">
            <SecurityCard />
            <DangerZoneCard />
          </div>
        )}
      </div>
    </div>
  );
}
