import type { Metadata } from "next";
import Link from "next/link";
import { SectionCard } from "@/components/admin/SectionCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { searchAdmin, type AdminSearchResult } from "@/services/admin/admin-search-service";

export const metadata: Metadata = {
  title: "Search | Virexa Admin",
};

type AdminSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const GROUPS: { key: "article" | "user" | "source" | "repository" | "release"; label: string; icon: string }[] = [
  { key: "article", label: "Articles", icon: "📰" },
  { key: "user", label: "Users", icon: "👤" },
  { key: "source", label: "Sources", icon: "📡" },
  { key: "repository", label: "Repositories", icon: "📦" },
  { key: "release", label: "Developer Releases", icon: "🚀" },
];

function ResultRow({ result }: { result: AdminSearchResult }) {
  return (
    <Link
      href={result.href}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-950">{result.title}</span>
        <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-slate-300">
        →
      </span>
    </Link>
  );
}

/**
 * Global admin search results (requirement 14) - one query string,
 * grouped results across every manageable content type: Articles, Users,
 * Sources, Repositories, and Developer Releases. Renders generically off
 * whatever groups have results.
 */
export default async function AdminSearchPage({ searchParams }: AdminSearchPageProps) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchAdmin(query) : null;
  const totalResults = results ? Object.values(results).reduce((sum, group) => sum + group.length, 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Search</h1>
        <p className="mt-1 text-sm text-slate-500">
          {query ? `${totalResults.toLocaleString()} result${totalResults === 1 ? "" : "s"} for "${query}"` : "Search across articles, users, and sources."}
        </p>
      </div>

      {!query ? (
        <SectionCard title="Search Virexa Admin">
          <EmptyState icon="🔍" title="Start typing to search" description="Use the search box in the top bar to find articles, users, repositories, releases, or sources." />
        </SectionCard>
      ) : totalResults === 0 ? (
        <SectionCard title="No results">
          <EmptyState icon="🔍" title="Nothing found" description={`Nothing matched "${query}" across articles, users, sources, repositories, or releases.`} />
        </SectionCard>
      ) : (
        GROUPS.map((group) => {
          const items = results?.[group.key] ?? [];
          if (items.length === 0) return null;
          return (
            <SectionCard key={group.key} title={`${group.icon} ${group.label}`}>
              <div className="space-y-2">
                {items.map((result) => (
                  <ResultRow key={result.id} result={result} />
                ))}
              </div>
            </SectionCard>
          );
        })
      )}
    </div>
  );
}
