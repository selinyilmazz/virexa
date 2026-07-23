"use client";

import { useBookmarkAction } from "@/hooks/useBookmarkAction";
import { AuthToast } from "@/components/auth/AuthToast";
import type { BookmarkItem } from "@/lib/bookmarks";

type BookmarkButtonProps = {
  item: BookmarkItem;
  variant?: "icon" | "pill";
  className?: string;
  /**
   * Called if the Supabase write fails, after the optimistic state has
   * already rolled back. Optional - if omitted, `useBookmarkAction`
   * surfaces the real error itself via a built-in toast (see below), so
   * a failure is never silent regardless of whether the caller wires
   * this up.
   */
  onError?: (message: string) => void;
};

export function BookmarkButton({ item, variant = "icon", className = "", onError }: BookmarkButtonProps) {
  const { bookmarked, trigger, error } = useBookmarkAction(item, { onError });

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    trigger(event);
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
      <>
        {error && <AuthToast message={error} variant="error" />}
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
      </>
    );
  }

  // No `position` utility here on purpose (product polishing phase, area
  // 4: bookmark icon regression). Every icon-variant caller supplies its
  // own `absolute right-*.5 top-*.5 ...` via `className` to pin this in a
  // card's top-right corner - but Tailwind's compiled stylesheet emits
  // `.relative` AFTER `.absolute` in its fixed utility-generation order,
  // so a hardcoded `relative` here would silently win the cascade
  // regardless of the HTML class order, leaving the button in normal
  // document flow next to the left-aligned category badge instead of
  // pinned to the corner. `z-10` alone is harmless without a position
  // set and becomes active once the caller's `absolute` applies.
  // Text color is deliberately owned entirely by this component (never
  // pass a `text-*` class from a caller's `className`) - the
  // bookmarked/unbookmarked color IS the "saved state should remain
  // visually obvious" signal, so it can't be left to chance against
  // whatever color class a caller's wrapper styling happens to also
  // carry. `hover:scale-110`/`active:scale-95` is the "hover animations
  // welcome" touch.
  return (
    <>
      {error && <AuthToast message={error} variant="error" />}
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
        className={`z-10 transition-all duration-150 hover:scale-110 active:scale-95 ${
          bookmarked ? "text-[#2f67e8]" : "text-slate-400 hover:text-slate-600"
        } ${className}`}
      >
        {icon}
      </button>
    </>
  );
}
