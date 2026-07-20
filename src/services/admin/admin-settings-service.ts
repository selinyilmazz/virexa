import packageJson from "../../../package.json";
import { env } from "@/lib/env";
import { runtimeConfig } from "@/runtime/config";
import { runtimeEngine } from "@/runtime/engine";
import { checkDatabaseHealth } from "@/runtime/health/health-monitor";
import { SOURCES } from "@/lib/news/sources";
import { FEED_SOURCES } from "@/lib/news";
import { getLiveArticlesCacheStatus } from "@/services/news";
import { aiCache, aiService } from "@/services/ai";

/**
 * Server-only, entirely read-only configuration/status surface for
 * `/admin/settings` (requirement 3) and its System Information block
 * (requirement 4). Every value here is either a boolean/count/label
 * derived from existing config, or a status string - never a raw
 * secret. `SUPABASE_SERVICE_ROLE_KEY`/`ANTHROPIC_API_KEY`/etc. are only
 * ever reported as "configured" / "not configured" booleans (requirement
 * 3: "Secrets istemciye gönderilmesin. Gerekirse sadece okunabilir
 * durum bilgisi göster."), matching the exact convention
 * `runtime/health/health-monitor.ts`'s checks already use.
 *
 * No new config surface is introduced - everything below is read
 * directly from `lib/env.ts`, `runtime/config.ts`, and the already-live
 * `runtimeEngine`/`aiService`/`aiCache`/live-articles cache singletons.
 * Nothing here can throw (every source is a plain in-memory read), so
 * this is a sync module, not an async service like the others.
 */

export type SettingItem = {
  label: string;
  value: string;
  status?: "ok" | "warning" | "unconfigured";
};

export type SettingsCategory = {
  id: string;
  label: string;
  description: string;
  items: SettingItem[];
};

function boolItem(label: string, configured: boolean, configuredLabel = "Configured", missingLabel = "Not Configured"): SettingItem {
  return { label, value: configured ? configuredLabel : missingLabel, status: configured ? "ok" : "unconfigured" };
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60_000)}min`;
}

/** Category-based, read-only settings overview (requirement 3): General / AI / News / Runtime / Cache / Environment / Feature Flags. */
export function getSettingsCategories(): SettingsCategory[] {
  const enabledFeeds = FEED_SOURCES.filter((feed) => feed.enabled).length;
  const liveCache = getLiveArticlesCacheStatus();

  const categories: SettingsCategory[] = [
    {
      id: "general",
      label: "General",
      description: "Application identity.",
      items: [
        { label: "App Name", value: "Virexa" },
        { label: "Version", value: packageJson.version },
        { label: "Environment", value: process.env.NODE_ENV ?? "unknown" },
      ],
    },
    {
      id: "ai",
      label: "AI",
      description: "AI provider configuration (read-only).",
      items: [
        { label: "Provider", value: env.ai.provider },
        { label: "Model", value: env.ai.model },
        boolItem("API Key", aiService.isConfigured),
        { label: "Timeout", value: formatMs(env.ai.timeoutMs) },
        { label: "Max Tokens", value: env.ai.maxTokens.toLocaleString() },
        { label: "Cache TTL", value: formatMs(env.ai.cacheTtlMs) },
      ],
    },
    {
      id: "news",
      label: "News",
      description: "News ingestion sources.",
      items: [
        { label: "Registered Sources", value: Object.keys(SOURCES).length.toLocaleString() },
        { label: "Enabled RSS Feeds", value: `${enabledFeeds} / ${FEED_SOURCES.length}` },
        boolItem("NewsAPI Key", Boolean(env.news.newsApiKey)),
        boolItem("GNews Key", Boolean(env.news.gNewsApiKey)),
      ],
    },
    {
      id: "runtime",
      label: "Runtime",
      description: "Background job engine configuration.",
      items: [
        boolItem("Runtime Enabled", runtimeConfig.enabled, "Enabled", "Disabled"),
        {
          label: "In-Process Scheduler",
          value: runtimeEngine.isRunning ? "Running" : "Stopped",
          status: runtimeEngine.isRunning ? "ok" : "warning",
        },
        boolItem(
          "Production Cron Trigger (CRON_SECRET)",
          Boolean(runtimeConfig.cronSecret),
          "Configured",
          "Not Configured - /api/cron/news-fetch will reject every request"
        ),
        { label: "Concurrency", value: String(runtimeConfig.concurrency) },
        { label: "Max Retry", value: String(runtimeConfig.maxRetry) },
        { label: "Job Timeout", value: formatMs(runtimeConfig.jobTimeoutMs) },
        { label: "RSS Interval", value: formatMs(runtimeConfig.intervals.rssMs) },
        { label: "NewsAPI Interval", value: formatMs(runtimeConfig.intervals.newsApiMs) },
        { label: "AI Interval", value: formatMs(runtimeConfig.intervals.aiMs) },
      ],
    },
    {
      id: "cache",
      label: "Cache",
      description: "In-memory caches.",
      items: [
        { label: "Live Articles Cached", value: liveCache.size.toLocaleString() },
        { label: "Live Articles Freshness", value: liveCache.isStale ? "Stale" : "Fresh", status: liveCache.isStale ? "warning" : "ok" },
        { label: "AI Cache Entries", value: aiCache.size.toLocaleString() },
        { label: "AI Cache TTL", value: formatMs(env.ai.cacheTtlMs) },
      ],
    },
    {
      id: "environment",
      label: "Environment",
      description: "Infrastructure configuration status (no secret values are ever shown).",
      items: [
        boolItem("Supabase URL", Boolean(env.supabase.url)),
        boolItem("Supabase Anon Key", Boolean(env.supabase.anonKey)),
        boolItem("Supabase Service Role Key", Boolean(env.supabase.serviceRoleKey)),
        boolItem("Site URL (NEXT_PUBLIC_SITE_URL)", Boolean(process.env.NEXT_PUBLIC_SITE_URL)),
      ],
    },
    {
      id: "feature-flags",
      label: "Feature Flags",
      description: "Virexa has no dedicated feature-flag system yet - this surfaces the one real environment-driven flag that exists today.",
      items: [boolItem("RUNTIME_ENABLED", runtimeConfig.enabled, "On", "Off")],
    },
  ];

  return categories;
}

export type SystemInfo = {
  environment: string;
  appVersion: string;
  /** Best-effort - see this file's top doc comment: no build-time injection is configured, so this is when the current server process started, not the actual build timestamp. */
  processStartedAt: string;
  nextVersion: string;
  nodeVersion: string;
  databaseStatus: "ok" | "degraded" | "down" | "unconfigured";
  databaseMessage: string;
  runtimeRunning: boolean;
};

/** Captured once, at first import, for the lifetime of this server process - see `SystemInfo.processStartedAt`'s doc comment. */
const PROCESS_STARTED_AT = new Date().toISOString();

/** System Information (requirement 4). The only async piece is the real database reachability check (reused from `runtime/health/health-monitor.ts`, not reimplemented). */
export async function getSystemInfo(): Promise<SystemInfo> {
  const database = await checkDatabaseHealth();

  return {
    environment: process.env.NODE_ENV ?? "unknown",
    appVersion: packageJson.version,
    processStartedAt: PROCESS_STARTED_AT,
    nextVersion: packageJson.dependencies.next,
    nodeVersion: process.version,
    databaseStatus: database.status,
    databaseMessage: database.message,
    runtimeRunning: runtimeEngine.isRunning,
  };
}
