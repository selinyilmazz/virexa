import { fetchRepo, fetchLatestRelease } from "@/lib/developer-hub/github";
import { createServiceClient } from "@/lib/supabase/service-client";
import { createRepositoryRepository } from "@/repositories/repository-repository";
import type { RepositoryUpdate } from "@/types/database";

/**
 * Refreshes a `repositories` row's live GitHub stats (stars, forks,
 * language, license, description, topics, repo_created_at) - reuses
 * `fetchRepo()` (the same GitHub REST call `getTrendingGithubRepos()`
 * already made, now exported for this purpose) rather than duplicating
 * any fetch/parsing logic.
 *
 * Respects `auto_sync`: if an admin has since hand-edited this repo, a
 * bulk/scheduled sync silently skips it so admin intent is never
 * clobbered. An explicit per-row "Sync from GitHub" click bypasses that
 * guard (`force: true`) - an admin asking for a fresh pull always wins.
 */
export async function syncRepositoryFromGithub(id: string, options?: { force?: boolean }): Promise<{ ok: boolean; message: string }> {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false, message: "Service role not configured." };

  const repository = createRepositoryRepository(supabase);
  const existing = await repository.getById(id);
  if (!existing) return { ok: false, message: "Repository not found." };

  if (!existing.auto_sync && !options?.force) {
    return { ok: false, message: "Auto-sync is off for this repository (it has manual edits) - use Sync from GitHub to override." };
  }

  const [live, latestRelease] = await Promise.all([fetchRepo(id), fetchLatestRelease(id)]);
  if (!live) return { ok: false, message: "Couldn't reach GitHub for this repository (rate-limited or not found)." };

  const patch: RepositoryUpdate = {
    description: live.description,
    language: live.language,
    license: live.license,
    stars: live.stars,
    forks: live.forks,
    watchers: live.watchers,
    topics: live.topics,
    repo_created_at: live.createdAt,
    github_url: live.url,
    latest_release_tag: latestRelease?.tag ?? null,
    latest_release_published_at: latestRelease?.publishedAt ?? null,
    last_synced_at: new Date().toISOString(),
  };

  await repository.update(id, patch);
  return { ok: true, message: `Synced ${id} from GitHub.` };
}

/** Syncs every `auto_sync` repository, one at a time is unnecessary here - GitHub calls run in parallel like `getTrendingGithubRepos()` already does. Manually-edited (`auto_sync = false`) rows are skipped, not forced. */
export async function syncAllRepositories(): Promise<{ synced: number; skipped: number; failed: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { synced: 0, skipped: 0, failed: 0 };

  const repository = createRepositoryRepository(supabase);
  const all = await repository.list();

  const results = await Promise.all(
    all.map(async (row) => {
      if (!row.auto_sync) return "skipped" as const;
      const result = await syncRepositoryFromGithub(row.id);
      return result.ok ? ("synced" as const) : ("failed" as const);
    })
  );

  return {
    synced: results.filter((r) => r === "synced").length,
    skipped: results.filter((r) => r === "skipped").length,
    failed: results.filter((r) => r === "failed").length,
  };
}
