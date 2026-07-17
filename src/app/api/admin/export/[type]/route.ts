import { NextResponse } from "next/server";
import { getAdminUserOrNull } from "@/lib/admin/authorization";
import { toCsv } from "@/lib/admin/csv-export";
import { getAllArticlesForExport } from "@/services/admin/admin-article-service";
import { getAdminSourcesList } from "@/services/admin/admin-source-service";
import { getAnalyticsSummary } from "@/services/admin/admin-analytics-service";

const EXPORT_TYPES = ["articles", "sources", "summary"] as const;
type ExportType = (typeof EXPORT_TYPES)[number];

function isExportType(value: string): value is ExportType {
  return (EXPORT_TYPES as readonly string[]).includes(value);
}

async function buildArticlesCsv(): Promise<string> {
  const items = await getAllArticlesForExport();
  return toCsv(
    ["Title", "Source", "Category", "Language", "Published", "Trust Score", "Trending Score", "Views", "Bookmarks", "AI Status"],
    items.map((item) => [
      item.title,
      item.sourceName,
      item.category,
      item.language,
      item.publishedDate,
      item.trustScore,
      item.trendingScore,
      item.viewCount,
      item.bookmarkCount,
      item.aiStatus,
    ])
  );
}

async function buildSourcesCsv(): Promise<string> {
  const sources = await getAdminSourcesList();
  return toCsv(
    ["Name", "Domain", "Country", "Active", "Official", "Trust Score", "Total Articles"],
    sources.map((source) => [
      source.name,
      source.domain,
      source.country,
      source.active,
      source.official,
      source.trust_score,
      source.totalArticles,
    ])
  );
}

async function buildSummaryCsv(): Promise<string> {
  const summary = await getAnalyticsSummary();
  return toCsv(
    ["Metric", "Value"],
    [
      ["Total Articles", summary.totalArticles],
      ["Total Views", summary.totalViews],
      ["Total Bookmarks", summary.totalBookmarks],
      ["Total Shares", summary.totalShares],
      ["Active Sources", summary.activeSources],
      ["AI Enriched Articles", summary.aiEnrichedArticles],
    ]
  );
}

/**
 * CSV export for Admin Analytics (requirement 7): `/api/admin/export/articles`,
 * `/sources`, `/summary`. Admin-gated the same way as
 * `/api/admin/sources/[id]` - `getAdminUserOrNull()` returns a plain 403
 * instead of a redirect, since a Route Handler has no page to redirect
 * to. Every export reuses an existing, already-tested service read path
 * (`getAllArticlesForExport`, `getAdminSourcesList`,
 * `getAnalyticsSummary`) - this file only formats CSV and enforces the
 * auth gate, no new data-access logic. All three reads go through the
 * public, RLS-respecting request-scoped client (via those services) -
 * the service-role key never reaches this route (requirement 10).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const admin = await getAdminUserOrNull();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 403 });
  }

  const { type } = await params;
  if (!isExportType(type)) {
    return NextResponse.json({ ok: false, error: "Unknown export type." }, { status: 400 });
  }

  try {
    const csv = type === "articles" ? await buildArticlesCsv() : type === "sources" ? await buildSourcesCsv() : await buildSummaryCsv();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="virexa-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("[api/admin/export] export failed:", error);
    return NextResponse.json({ ok: false, error: "Export failed." }, { status: 500 });
  }
}
