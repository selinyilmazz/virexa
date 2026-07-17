"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth";

export function HeaderBookmarkLink() {
  const session = useSession();
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!session) {
      event.preventDefault();
      router.push("/signin?redirect=/bookmarks");
    }
  }

  return (
    <Link
      href="/bookmarks"
      aria-label="Bookmarks"
      onClick={handleClick}
      className="hidden shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-[#2f67e8] md:flex"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.75L6 21V4.5Z" />
      </svg>
    </Link>
  );
}
