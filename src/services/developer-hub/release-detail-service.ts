import { createServiceClient } from "@/lib/supabase/service-client";
import { createReleaseRepository } from "@/repositories/release-repository";
import { getTechnologyRelease, type TechnologyRelease } from "@/data/releases";
import type { DeveloperReleaseChannel, DeveloperReleaseRow } from "@/types/database";

/**
 * Admin Panel: Developer Releases - overlays the admin-managed
 * `developer_releases` table onto the curated static reference content
 * in `src/data/releases.tsx` for the public `/developer-hub/releases/
 * [slug]` detail page. This is the disclosed scope boundary from
 * `supabase/migrations/0019_developer_releases.sql`: version, release
 * date, channel/status, release notes, maintainer, license, platform,
 * and the website/docs/GitHub/download links are now genuinely
 * admin-editable and reflected here; the rich hand-written "What's New"
 * highlights, changelog, breaking changes, and install commands stay
 * defined in the static file (rebuilding that entire editorial model as
 * a CRUD form was out of scope for this pass).
 *
 * `visible = false` on the DB row makes the page 404, so the admin
 * "Visible" toggle is a real, working action rather than a no-op badge.
 * If an admin creates a release for a product with no matching static
 * entry, this still returns a real (if minimal) page built only from
 * the admin-provided fields - never a broken link.
 *
 * Uses the service-role client (not the public request-scoped one)
 * deliberately: the public RLS policy on `developer_releases` only
 * returns `visible = true` rows, which would make a hidden row
 * indistinguishable from "no row exists" and incorrectly fall back to
 * showing the static content anyway. Reading via service role lets this
 * function see the row's real `visible` value and enforce the 404
 * itself - no row fields are ever rendered when `visible` is false.
 */

const CHANNEL_TO_STATUS: Record<DeveloperReleaseChannel, TechnologyRelease["status"]> = {
  stable: "Stable",
  beta: "Beta",
  lts: "LTS",
  rc: "RC",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function buildMinimalRelease(row: DeveloperReleaseRow): TechnologyRelease {
  return {
    slug: row.slug,
    name: row.product,
    tagline: row.product,
    logo: { bg: "#e0e7ff", fg: "#4338ca", content: initials(row.product) },
    status: CHANNEL_TO_STATUS[row.channel],
    version: row.version,
    releaseDate: row.release_date,
    maintainer: row.maintainer || "—",
    type: "Tool",
    license: row.license || "—",
    platform: row.platform || "—",
    description: row.release_notes || `${row.product} ${row.version}.`,
    overview: row.release_notes || `${row.product} ${row.version}.`,
    website: row.website_url ?? undefined,
    docs: row.docs_url ?? undefined,
    github: row.github_url ?? undefined,
    install: [],
    whatsNew: {},
    gradient: ["#e0e7ff", "#c7d2fe"],
    relatedNewsSearchTerms: [row.product],
  };
}

function overlay(staticRelease: TechnologyRelease, row: DeveloperReleaseRow): TechnologyRelease {
  return {
    ...staticRelease,
    name: row.product || staticRelease.name,
    version: row.version || staticRelease.version,
    releaseDate: row.release_date || staticRelease.releaseDate,
    status: CHANNEL_TO_STATUS[row.channel] ?? staticRelease.status,
    maintainer: row.maintainer || staticRelease.maintainer,
    license: row.license || staticRelease.license,
    platform: row.platform || staticRelease.platform,
    overview: row.release_notes || staticRelease.overview,
    website: row.website_url ?? staticRelease.website,
    docs: row.docs_url ?? staticRelease.docs,
    github: row.github_url ?? staticRelease.github,
  };
}

export async function getReleaseDetail(slug: string): Promise<TechnologyRelease | null> {
  const staticRelease = getTechnologyRelease(slug);

  let row: DeveloperReleaseRow | null = null;
  try {
    const supabase = createServiceClient();
    if (supabase) {
      row = await createReleaseRepository(supabase).getBySlug(slug);
    }
  } catch (error) {
    console.error("[release-detail-service] getBySlug failed:", error);
  }

  // Strict `=== false` (same reasoning as `article-read-service.ts`'s
  // `getArticleDetail`): `visible` only exists because of a migration
  // (0015/0019). If that migration hasn't run yet in this environment,
  // Postgrest omits the column entirely and `row.visible` comes back
  // `undefined` - a plain `!row.visible` would then 404 every release
  // detail page. Only an explicit `false` should hide it.
  if (row && row.visible === false) return null;
  if (!staticRelease && !row) return null;
  if (staticRelease && !row) return staticRelease;
  if (!staticRelease && row) return buildMinimalRelease(row);
  return overlay(staticRelease!, row!);
}
