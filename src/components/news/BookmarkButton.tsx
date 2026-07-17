"use client";

import { usePathname, useRouter } from "next/navigation";
import { toggleBookmark, useIsBookmarked, type BookmarkItem } from "@/lib/bookmarks";
import { useSession } from "@/lib/auth";

type BookmarkButtonProps = {
  item: BookmarkItem;
  variant?: "icon" | "pill";
  className?: string;
};

export function BookmarkButton({ item, variant = "icon", className = "" }: BookmarkButtonProps) {
  const storedBookmarked = useIsBookmarked(item.slug);
  const session = useSession();
  const bookmarked = session ? storedBookmarked : false;
  const router = useRouter();
  const pathname = usePathname();

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!session) {
      router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    toggleBookmark(item);
  }

  const icon = (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill={bookmarked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
    </svg>
  );

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={bookmarked}
        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-base font-medium transition-colors ${
          bookmarked
            ? "border-[#2f67e8] bg-blue-50 text-[#2f67e8]"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        } ${className}`}
      >
        {icon}
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      className={`relative z-10 transition-colors ${
        bookmarked ? "text-[#2f67e8]" : "text-slate-400 hover:text-slate-600"
      } ${className}`}
    >
      {icon}
    </button>
  );
}
