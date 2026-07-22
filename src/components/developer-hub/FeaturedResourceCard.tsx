import { DIFFICULTY_CLASSES, DIFFICULTY_LABELS, PRICE_CLASSES, PRICE_LABELS } from "@/components/developer-hub/CatalogCard";
import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
import { TrackedResourceLink } from "@/components/developer-hub/TrackedResourceLink";
// This card is rendered inside the Client Component
// `FeaturedResourcesCarousel` (`FeaturedResourceCard` itself has no
// "use client", but importing/rendering it from a Client Component still
// pulls it into the client bundle), so `RESOURCE_TYPE_BADGE_CLASSES`/
// `RESOURCE_TYPE_LABELS`/`RESOURCE_TYPE_CTA_LABELS` must come from the
// dependency-free `shared.ts`, never from `developer-hub-service.ts` -
// see that file's doc comment.
import { RESOURCE_TYPE_BADGE_CLASSES, RESOURCE_TYPE_CTA_LABELS, RESOURCE_TYPE_LABELS } from "@/lib/developer-hub/shared";
import type { CatalogItem } from "@/services/developer-hub/developer-hub-service";

function ArrowRightIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

type FeaturedResourceCardProps = { item: CatalogItem };

/**
 * "Product card" for the Developer Hub landing page's Editor's Picks
 * carousel (`FeaturedResourcesCarousel`). The cover is a compact "banner"
 * rather than a single centered logo - a branded gradient-tinted header
 * with soft decorative blur accents, a badged brand mark, and the
 * provider's wordmark, so it reads like real per-provider artwork (AWS
 * Certification banner, Microsoft Learn banner, etc.) even though it's
 * built from the same hand-crafted brand icon system `CatalogCard` uses
 * (no external image hosting available in this sandbox). Kept
 * deliberately short (h-24/h-28) so the content area - title,
 * description, Provider/Difficulty/Price badges - gets the majority of
 * the card's real estate instead of the cover. Title and description
 * each reserve a fixed height (`min-h-*` / capped reveal) regardless of
 * actual text length, so every card in the row - including on hover -
 * stays the same height.
 *
 * Hover interaction pass: instead of a generic label, the cover now
 * reveals a contextual CTA keyed off the resource's real type ("View
 * Certification", "Start Course", "Open Repository", etc. - see
 * `RESOURCE_TYPE_CTA_LABELS`) under a subtle dark scrim, plus a slight
 * zoom on the cover's brand mark. The card's single click target stays
 * the stretched link on the title (`TrackedResourceLink`) - the CTA pill
 * is presentational, so this reveal never introduces a second, competing
 * click target.
 */
export function FeaturedResourceCard({ item }: FeaturedResourceCardProps) {
  const visual = resolveBrandVisual(item.brandKey);

  return (
    <article className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-[#2f67e8]/50 hover:shadow-lg">
      <div className={`relative flex h-24 shrink-0 items-center overflow-hidden border-b border-slate-100 px-5 sm:h-28 ${visual.bg} ${visual.fg}`}>
        <span aria-hidden="true" className="absolute -right-6 -top-8 size-24 rounded-full bg-white/15 blur-xl transition-transform duration-300 ease-out group-hover:scale-110" />
        <span aria-hidden="true" className="absolute -bottom-8 -left-6 size-20 rounded-full bg-black/10 blur-lg transition-transform duration-300 ease-out group-hover:scale-110" />
        <span
          aria-hidden="true"
          className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 shadow-sm transition-transform duration-300 ease-out group-hover:scale-110 sm:size-14"
        >
          <span className="scale-[1.1] sm:scale-[1.2]">{visual.content}</span>
        </span>
        <div className="relative ml-3 min-w-0 transition-transform duration-300 ease-out group-hover:scale-[1.03]">
          <p className="truncate text-sm font-bold tracking-tight">{item.provider}</p>
          <p className="truncate text-xs font-medium opacity-75">{RESOURCE_TYPE_LABELS[item.resourceType]}</p>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all duration-300 ease-out group-hover:bg-slate-950/55 group-hover:opacity-100">
          <span className="flex translate-y-1 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-md transition-transform duration-300 ease-out group-hover:translate-y-0">
            {RESOURCE_TYPE_CTA_LABELS[item.resourceType]}
            <ArrowRightIcon className="size-3.5" />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span
          className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${RESOURCE_TYPE_BADGE_CLASSES[item.resourceType]}`}
        >
          {RESOURCE_TYPE_LABELS[item.resourceType]}
        </span>
        <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-bold leading-snug tracking-tight text-slate-950">
          <TrackedResourceLink
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0"
            item={{ id: item.id, title: item.title, provider: item.provider, resourceType: item.resourceType, brandKey: item.brandKey }}
          >
            {item.title}
          </TrackedResourceLink>
        </h3>

        <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out group-hover:grid-rows-[1fr]">
          <p className="line-clamp-2 overflow-hidden text-sm leading-relaxed text-slate-500">{item.description}</p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2 text-sm">
          <span className="font-semibold text-slate-700">{item.provider}</span>
          {item.difficulty && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_CLASSES[item.difficulty]}`}>
              {DIFFICULTY_LABELS[item.difficulty]}
            </span>
          )}
          {item.price && (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PRICE_CLASSES[item.price]}`}>{PRICE_LABELS[item.price]}</span>
          )}
        </div>
      </div>
    </article>
  );
}
