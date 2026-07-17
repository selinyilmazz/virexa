import type { HealthCheckResult, HealthStatus } from "@/runtime/health/health-monitor";
import type { AdminStatus } from "@/components/admin/StatusBadge";

/**
 * Regroups the runtime layer's 7 raw checks (rss/newsapi/gnews/
 * ai-provider/database/cache/queue - see `runtime/health/health-monitor.ts`)
 * into the 5 admin-facing groups requirement 4 asks for: Database,
 * Runtime, News Pipeline, AI Providers, Cache. Reuses the EXISTING
 * health monitor rather than adding new checks ("Mevcut health
 * kontrolleri kullanılabiliyorsa onları yeniden kullan") - this module
 * only relabels/aggregates its output.
 */
export type HealthGroupId = "database" | "runtime" | "news-pipeline" | "ai-providers" | "cache";

export type HealthGroup = {
  id: HealthGroupId;
  label: string;
  status: AdminStatus;
  message: string;
};

/** "unconfigured" isn't a failure (a normal, safe state elsewhere in this app - see health-monitor.ts), but it's not a clean "healthy" either, so it maps to "warning" rather than being silently treated as ok. */
function toAdminStatus(status: HealthStatus): AdminStatus {
  switch (status) {
    case "ok":
      return "healthy";
    case "degraded":
    case "unconfigured":
      return "warning";
    case "down":
      return "offline";
  }
}

const STATUS_RANK: Record<AdminStatus, number> = { healthy: 0, warning: 1, unknown: 1, offline: 2 };

/** Worst-of-N merge for a group backed by more than one raw check (News Pipeline = rss + newsapi + gnews). */
function worstStatus(statuses: AdminStatus[]): AdminStatus {
  return statuses.reduce((worst, current) => (STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst), "healthy" as AdminStatus);
}

function findCheck(checks: HealthCheckResult[], id: HealthCheckResult["id"]): HealthCheckResult | undefined {
  return checks.find((check) => check.id === id);
}

export function buildHealthGroups(checks: HealthCheckResult[]): HealthGroup[] {
  const database = findCheck(checks, "database");
  const queue = findCheck(checks, "queue");
  const aiProvider = findCheck(checks, "ai-provider");
  const cache = findCheck(checks, "cache");
  const rss = findCheck(checks, "rss");
  const newsapi = findCheck(checks, "newsapi");
  const gnews = findCheck(checks, "gnews");

  const pipelineChecks = [rss, newsapi, gnews].filter((check): check is HealthCheckResult => Boolean(check));
  const pipelineStatus = worstStatus(pipelineChecks.map((check) => toAdminStatus(check.status)));
  const pipelineMessage = pipelineChecks.length > 0
    ? pipelineChecks.map((check) => `${check.id}: ${check.message}`).join(" · ")
    : "No news-source checks available.";

  return [
    {
      id: "database",
      label: "Database",
      status: database ? toAdminStatus(database.status) : "unknown",
      message: database?.message ?? "No database check available.",
    },
    {
      id: "runtime",
      label: "Runtime",
      status: queue ? toAdminStatus(queue.status) : "unknown",
      message: queue?.message ?? "No queue check available.",
    },
    {
      id: "news-pipeline",
      label: "News Pipeline",
      status: pipelineStatus,
      message: pipelineMessage,
    },
    {
      id: "ai-providers",
      label: "AI Providers",
      status: aiProvider ? toAdminStatus(aiProvider.status) : "unknown",
      message: aiProvider?.message ?? "No AI provider check available.",
    },
    {
      id: "cache",
      label: "Cache",
      status: cache ? toAdminStatus(cache.status) : "unknown",
      message: cache?.message ?? "No cache check available.",
    },
  ];
}
