import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ReleaseDetailView } from "@/components/releases/ReleaseDetailView";
import { getAllTechnologySlugs, getTechnologyRelease } from "@/data/releases";
import { getRelatedNewsForTechnology } from "@/services/articles/article-read-service";

type ReleaseDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/** Pre-renders every known technology at build time - a fixed, curated set (`src/data/releases.ts`), not user-generated content, so static generation is safe and fast. An unknown slug still resolves correctly at request time via `notFound()` below. */
export function generateStaticParams() {
  return getAllTechnologySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ReleaseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = getTechnologyRelease(slug);
  if (!release) {
    return { title: "Technology Not Found | Virexa" };
  }
  return {
    title: `${release.name} ${release.version} | Developer Hub | Virexa`,
    description: release.description,
    alternates: { canonical: `/developer-hub/releases/${release.slug}` },
  };
}

/**
 * Developer Release Detail page - a documentation/release-overview page
 * for a single technology (React, Next.js, Docker, ...), NOT a news
 * article. Replaces the previous behavior where a "Developer Releases"
 * homepage row opened whichever real article happened to back it (a
 * category mismatch: a release overview isn't the same thing as a news
 * story about it). Fully data-driven via `getTechnologyRelease` - this
 * file has no technology-specific logic, only page wiring; the entire
 * reusable template lives in `ReleaseDetailView`.
 */
export default async function ReleaseDetailPage({ params }: ReleaseDetailPageProps) {
  const { slug } = await params;
  const release = getTechnologyRelease(slug);

  if (!release) {
    notFound();
  }

  const relatedNews = await getRelatedNewsForTechnology(release.relatedNewsSearchTerms ?? [release.name], 4);

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Developer Hub", href: "/developer-hub" },
    { label: "Releases", href: "/developer-hub/releases" },
    { label: release.name, href: `/developer-hub/releases/${release.slug}` },
  ];

  return (
    <>
      <Header />
      <main className="bg-[#f8fafc] px-5 py-8 sm:px-8">
        <div className="mx-auto max-w-[1820px]">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            {breadcrumb.map((crumb, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">›</span>}
                  {isLast ? (
                    <span className="font-medium text-slate-950">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="transition-colors hover:text-[#2f67e8]">
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })}
          </nav>

          <div className="mt-6">
            <ReleaseDetailView release={release} relatedNews={relatedNews} />
          </div>
        </div>
      </main>
    </>
  );
}
