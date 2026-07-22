"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

type ScrollToResultsOnPageChangeProps = {
  anchorId: string;
};

/**
 * Smoothly scrolls the article list back into view whenever the `page`
 * query param changes (Previous/Next/page-number clicks). Pairs with
 * `NewsExplorerPagination`'s `scroll={false}` links - Next's own default
 * navigation scroll is an instant jump to the top of the WHOLE page,
 * which would fight with (and visually precede) this smooth scroll to a
 * specific anchor, so it's disabled on those links and this effect owns
 * scrolling entirely. Skips the very first render so simply landing on
 * `/news` doesn't trigger an unwanted scroll.
 */
export function ScrollToResultsOnPageChange({ anchorId }: ScrollToResultsOnPageChangeProps) {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [page, anchorId]);

  return null;
}
