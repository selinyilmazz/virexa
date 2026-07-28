import { TrackedResourceLink } from "@/components/developer-hub/TrackedResourceLink";
import { CatalogBookmarkButton } from "@/components/developer-hub/CatalogBookmarkButton";
import { resolveBrandVisual } from "@/components/developer-hub/brand-icons";
// `RESOURCE_TYPE_BADGE_CLASSES` comes from the plain, dependency-free
// `shared.ts` (not `developer-hub-service.ts`, which transitively
// imports the Supabase *server* client) - this module is also pulled
// into client bundles (e.g. `GithubHero.tsx` imports `LANGUAGE_DOT_COLORS`/
// `formatStat` from here), so nothing it imports can depend on
// `next/headers`. Labels themselves now come from `t()` (passed in as a
// prop), never a static English map. See `shared.ts`'s doc comment.
import { RESOURCE_TYPE_BADGE_CLASSES } from "@/lib/developer-hub/shared";
import type { CatalogItem } from "@/services/developer-hub/developer-hub-service";
import type { TFunction } from "@/i18n/translate";

/** Exported for reuse by `FeaturedResourceCard` on the Developer Hub landing page, so both cards render identical badge styling. */
export const DIFFICULTY_CLASSES: Record<string, string> = {
  beginner: "bg-emerald-50 text-emerald-700",
  intermediate: "bg-blue-50 text-blue-700",
  advanced: "bg-violet-50 text-violet-700",
};

export const PRICE_CLASSES: Record<string, string> = {
  free: "bg-emerald-50 text-emerald-700",
  paid: "bg-slate-100 text-slate-600",
};

/** A rough but real, recognizable color per common GitHub language - matches how GitHub itself shows a language dot on repo cards. Exported for reuse by the Developer Hub landing page's Trending GitHub Repositories preview cards. */
export const LANGUAGE_DOT_COLORS: Record<string, string> = {
  TypeScript: "#3178C6",
  JavaScript: "#F1E05A",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Shell: "#89E051",
  Ruby: "#701516",
  Zig: "#EC915C",
};

/** Compact "107k"-style formatting for repo star/fork counts, matching the user's requested example format. Exported for reuse by the Developer Hub landing page's Trending GitHub Repositories preview cards. */
export function formatStat(value: number | undefined): string {
  if (value === undefined) return "";
  return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function StarIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.1 6.6-5.8-3.1-5.8 3.1 1.1-6.6-4.8-4.6 6.6-.9Z" />
    </svg>
  );
}

function ForkIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="5" r="2" />
      <circle cx="17" cy="5" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M7 7v2a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7M12 12v5" />
    </svg>
  );
}

function OfficialBadgeIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

type CatalogCardProps = { item: CatalogItem; t: TFunction };

/**
 * Developer Hub's catalog item card (card-quality pass) - same shell
 * (rounded-2xl, border, soft shadow, hover lift) as `NewsExplorerCard`,
 * so the two content domains still feel like one product, but the tile
 * is now a real brand mark (`resolveBrandVisual`, keyed by provider or,
 * for GitHub repos, the repo's own `owner/repo` - see `brand-icons.tsx`)
 * instead of a plain emoji. Three resource types get a further
 * specialized treatment below the standard title/description: GitHub
 * repos show a real owner/repo split + language dot + star/fork counts
 * (a proper "repo card" meta row instead of a generic string),
 * certifications show a small "Official" badge, and roadmaps show a
 * tiny step-chain preview of their real subject sequence.
 */
export function CatalogCard({ item, t }: CatalogCardProps) {
  const visual = resolveBrandVisual(item.brandKey);
  const isGithubRepo = item.resourceType === "github-repo" && item.owner && item.repoName;

  return (
    <article className="group relative flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-md sm:p-5">
      {(item.resourceType === "course" || item.resourceType === "certification") && (
        <CatalogBookmarkButton
          item={{
            id: item.id,
            title: item.title,
            description: item.description,
            provider: item.provider,
            url: item.url,
            resourceType: item.resourceType,
            difficulty: item.difficulty,
            price: item.price,
          }}
        />
      )}

      <span
        aria-hidden="true"
        className={`flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 sm:size-16 ${visual.bg} ${visual.fg}`}
      >
        {visual.content}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${RESOURCE_TYPE_BADGE_CLASSES[item.resourceType]}`}>
            {t(`developerHub.resourceType.${item.resourceType}`)}
          </span>
          {item.official && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
              <OfficialBadgeIcon className="size-3" />
              {t("developerHub.card.official")}
            </span>
          )}
          {item.difficulty && (
            <span className={`rounded-full px-2.5 py-1 font-medium ${DIFFICULTY_CLASSES[item.difficulty]}`}>
              {t(`developerHub.difficulty.${item.difficulty}`)}
            </span>
          )}
          {item.price && (
            <span className={`rounded-full px-2.5 py-1 font-medium ${PRICE_CLASSES[item.price]}`}>{t(`developerHub.price.${item.price}`)}</span>
          )}
          {item.tag && !isGithubRepo && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{item.tag}</span>}
        </div>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug tracking-tight text-slate-950">
          <TrackedResourceLink
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0"
            item={{ id: item.id, title: item.title, provider: item.provider, resourceType: item.resourceType, brandKey: item.brandKey }}
          >
            {isGithubRepo ? (
              <>
                <span className="text-slate-400">{item.owner}/</span>
                {item.repoName}
              </>
            ) : (
              item.title
            )}
            <span aria-hidden="true" className="ml-1 text-sm font-normal text-slate-400">
              ↗
            </span>
          </TrackedResourceLink>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">{item.description}</p>

        {!isGithubRepo && item.editorNotes && (
          <p className="mt-2 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-xs italic leading-relaxed text-slate-600">
            &ldquo;{item.editorNotes}&rdquo;
          </p>
        )}

        {isGithubRepo ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {item.tag && (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: LANGUAGE_DOT_COLORS[item.tag] ?? "#9CA3AF" }}
                />
                {item.tag}
              </span>
            )}
            {item.license && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                {t("developerHub.card.license", { license: item.license })}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <StarIcon />
              {formatStat(item.stars)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ForkIcon />
              {formatStat(item.forks)}
            </span>
            <span>{t("developerHub.card.updated", { relative: item.updatedRelative })}</span>
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{item.provider}</span>
            {item.metaLine && item.resourceType !== "roadmap" && (
              <>
                <span aria-hidden="true">·</span>
                <span>{item.metaLine}</span>
              </>
            )}
          </div>
        )}

        {!isGithubRepo && item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        )}

        {item.resourceType === "roadmap" && item.steps && item.steps.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            {item.steps.map((step, index) => (
              <span key={step} className="flex items-center gap-1.5">
                <span className="rounded-full bg-rose-50 px-2 py-1 font-medium text-rose-700">{step}</span>
                {index < item.steps!.length - 1 && (
                  <span aria-hidden="true" className="text-slate-300">
                    →
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
