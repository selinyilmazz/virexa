"use client";

import { useRef } from "react";
import { FeaturedResourceCard } from "@/components/developer-hub/FeaturedResourceCard";
import type { CatalogItem } from "@/services/developer-hub/developer-hub-service";

type FeaturedResourcesCarouselProps = { items: CatalogItem[] };

const SCROLL_AMOUNT = 320;

/**
 * Netflix-style horizontal carousel for the Developer Hub landing page's
 * "Featured Resources" section (follow-up request: "3-4 büyük kart...
 * yatay kaydırılabilir... hover'da kart hafif büyüsün ve kısa açıklama
 * açılsın"). Roughly 3-4 cards are visible at once (each a fixed
 * ~300-320px `FeaturedResourceCard`, which owns its own hover-grow/
 * description-reveal behavior); the rest scroll into view via native
 * horizontal scroll (drag/swipe/trackpad) or the Prev/Next arrow buttons,
 * which only need `scrollBy` - no external carousel library. Scroll-snap
 * keeps cards aligned to the row's left edge after any scroll gesture.
 */
export function FeaturedResourcesCarousel({ items }: FeaturedResourcesCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByAmount(delta: number) {
    trackRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <div className="group/carousel relative">
      <div ref={trackRef} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2">
        {items.map((item) => (
          <div key={item.id} className="w-[280px] shrink-0 snap-start sm:w-[300px] lg:w-[320px]">
            <FeaturedResourceCard item={item} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollByAmount(-SCROLL_AMOUNT)}
        className="absolute left-0 top-[40%] hidden -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-md opacity-0 transition-all duration-200 hover:bg-slate-50 group-hover/carousel:opacity-100 lg:flex"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollByAmount(SCROLL_AMOUNT)}
        className="absolute right-0 top-[40%] hidden -translate-y-1/2 translate-x-3 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-md opacity-0 transition-all duration-200 hover:bg-slate-50 group-hover/carousel:opacity-100 lg:flex"
      >
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
