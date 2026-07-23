"use client";

import { useBookmarkAction } from "@/hooks/useBookmarkAction";
import { AuthToast } from "@/components/auth/AuthToast";
import type { BookmarkItem } from "@/lib/bookmarks";

export type RepoBookmarkInput = {
  /** `owner/repo`, e.g. "vercel/next.js" - unique and stable, used as the bookmark slug. */
  id: string;
  owner: string;
  repoName: string;
  description: string;
  stars: number;
  language: string | null;
  license: string | null;
  url: string;
  brandKey: string;
};

type RepoBookmarkButtonProps = {
  repo: RepoBookmarkInput;
};

function toBookmarkItem(repo: RepoBookmarkInput): BookmarkItem {
  return {
    slug: repo.id,
    image: "",
    category: repo.language ?? "Repository",
    title: `${repo.owner}/${repo.repoName}`,
    description: repo.description,
    source: repo.owner,
    publishedDate: "",
    type: "repository",
    meta: {
      owner: repo.owner,
      repoName: repo.repoName,
      stars: String(repo.stars),
      language: repo.language ?? "",
      license: repo.license ?? "",
      url: repo.url,
      brandKey: repo.brandKey,
    },
  };
}

/**
 * Small icon-only "Save" toggle for GitHub Explorer / Open Source
 * Explorer repo cards. Backed by the same shared `lib/bookmarks.ts`
 * Supabase service every other bookmark type uses (via
 * `useBookmarkAction`) instead of a separate localStorage store, so a
 * saved repo shows up in the real Bookmarks page, syncs across devices,
 * and survives logout/login like every other bookmark.
 */
export function RepoBookmarkButton({ repo }: RepoBookmarkButtonProps) {
  const item = toBookmarkItem(repo);
  const { bookmarked, trigger, error } = useBookmarkAction(item);

  return (
    <>
      {error && <AuthToast message={error} variant="error" />}
      <button
        type="button"
        onClick={trigger}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove from bookmarks" : "Save repository"}
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
          bookmarked ? "border-[#2f67e8] bg-blue-50 text-[#2f67e8]" : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
        </svg>
      </button>
    </>
  );
}
