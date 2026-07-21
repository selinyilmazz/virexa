import { hashArticleContent } from "@/lib/ai/content-hash";
import { createServiceClient } from "@/lib/supabase/service-client";
import type { ArticleAIInput } from "@/lib/validation/article-storage-schema";
import { logErrorFully } from "@/runtime/errors";
import { mapWithConcurrency } from "@/runtime/pipeline/concurrency";
import { createArticleAIRepository } from "@/repositories/article-ai-repository";
import { createArticleRepository } from "@/repositories/article-repository";
import { createSourceRepository } from "@/repositories/source-repository";
import { aiService } from "@/services/ai";
import type { ArticleAIRow, ArticleRow } from "@/types/database";

/**
 * The single, shared engine behind every AI capability's independent
 * job/queue ("Summary, Key Takeaways, Tags, Entities, Sentiment, Rewrite
 * birbirinden bağımsız queue olsun") AND the Admin Runtime "Backfill AI
 * Enrichment" button (goal 7 - "kod tekrarı olmasın"). Both callers
 * (`runtime/jobs/ai-jobs.ts` and `admin-runtime-ops-service.ts`) call
 * `runAIEnrichmentCapability()` below - neither has its own copy of the
 * candidate-selection/generation/merge/persist logic.
 *
 * Architectural split from the OLD `news-fetch` pipeline (see
 * `runtime/pipeline/steps/ai-steps.ts`, now AI-free): that pipeline used
 * to run all 9 AI capabilities inline, sequentially, over up to 60
 * articles each, directly inside the same serverless invocation that
 * also had to fetch/normalize/persist articles - the actual cause of
 * "provider timeout" logs with no "completed"/"failed" ever appearing
 * (worst case ~5100s of AI calls inside one 300s-capped Vercel function).
 *
 * This module decouples AI enrichment from `news-fetch` entirely:
 *  - `news-fetch` now only fetches/normalizes/persists articles (fast,
 *    bounded, unrelated to AI provider latency).
 *  - Each AI capability is its own job/queue that independently selects
 *    a SMALL, BOUNDED batch of already-persisted articles still missing
 *    that one field, generates them with controlled concurrency (not
 *    sequential, not unbounded `Promise.all`), and persists just that
 *    field. One capability's failure (or one article's timeout within a
 *    capability) never affects any other capability or article.
 *  - Every job invocation is small enough to comfortably finish well
 *    under Vercel's `maxDuration` (see `runtime/jobs/ai-jobs.ts`'s
 *    `timeoutMs`/`maxAttempts` on each job) - the backlog clears
 *    gradually across repeated cron ticks / admin clicks, not all at
 *    once ("AI işlemlerinin arka planda kademeli olarak bitmesi").
 */

/** How many AI provider calls one capability's job run makes at once - the "p-limit, örn. 5 eşzamanlı istek" requirement. Kept modest and shared across every capability rather than tuned per-capability, so total concurrent load stays predictable when multiple capability jobs run at the same time (see the AI enrichment cron route). */
export const AI_ENRICHMENT_CONCURRENCY = 5;

/** How many missing-field articles one capability's job run processes. At `AI_ENRICHMENT_CONCURRENCY=5` and the AI layer's default 15s per-call timeout (`AI_TIMEOUT`), this bounds one job attempt to roughly `ceil(20/5) * 15s = 60s` in the worst case (every single call timing out) - comfortable margin under both this job's own `timeoutMs` (90s, see `ai-jobs.ts`) and Vercel's 300s `maxDuration`. */
export const AI_ENRICHMENT_BATCH_SIZE = 20;

/** Scan window multiplier: how many top-trending articles to read (and check for a missing field) before capping the actual work batch at `AI_ENRICHMENT_BATCH_SIZE` - mirrors `admin-runtime-ops-service.ts`'s pre-existing `listNeedingContentBackfill`/old `backfillArticleAIEnrichment` "scan wide, cap the result" pattern, since there's no cheap SQL-side "jsonb column is null" filter through the shimmed query builder. */
const SCAN_WINDOW_MULTIPLIER = 6;
const MIN_SCAN_WINDOW = 150;

export type AICapabilityKey =
  | "summary"
  | "tldr"
  | "keyTakeaways"
  | "longSummary"
  | "rewrite"
  | "entities"
  | "tags"
  | "sentiment"
  | "bias";

export const AI_CAPABILITY_KEYS: readonly AICapabilityKey[] = [
  "summary",
  "tldr",
  "keyTakeaways",
  "longSummary",
  "rewrite",
  "entities",
  "tags",
  "sentiment",
  "bias",
];

export type AIEnrichmentResult = {
  capability: AICapabilityKey;
  checked: number;
  updated: number;
  failed: number;
};

/** The subset of `ArticleAIInput` one capability's generation actually produces - merged with the article's existing row (carry-forward) before the upsert. */
type CapabilityFields = Partial<
  Pick<
    ArticleAIInput,
    "summary" | "tldr" | "longSummary" | "rewrittenArticle" | "entities" | "keyTakeaways" | "tags" | "sentiment" | "bias"
  >
>;

type CapabilityGenerateResult = {
  fields: CapabilityFields;
  provider: string;
  version: string;
};

type CapabilityDescriptor = {
  key: AICapabilityKey;
  label: string;
  /** Whether this capability's field is still missing on an article's latest `article_ai` row - the candidate filter. */
  isMissing: (row: ArticleAIRow | undefined) => boolean;
  generate: (article: ArticleRow, sourceName: string | undefined) => Promise<CapabilityGenerateResult | null>;
};

function articleText(row: ArticleRow): string {
  return row.content ?? row.description;
}

const CAPABILITIES: Record<AICapabilityKey, CapabilityDescriptor> = {
  summary: {
    key: "summary",
    label: "Summary",
    isMissing: (row) => !row?.summary,
    generate: async (article) => {
      const result = await aiService.getSummary({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return { fields: { summary: result.summary }, provider: result.provider, version: result.version };
    },
  },
  tldr: {
    key: "tldr",
    label: "TL;DR",
    isMissing: (row) => !row?.tldr,
    generate: async (article) => {
      const result = await aiService.getTLDR({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return {
        fields: { tldr: { title: result.title, bullets: result.bullets } },
        provider: result.provider,
        version: result.version,
      };
    },
  },
  keyTakeaways: {
    key: "keyTakeaways",
    label: "Key Takeaways",
    isMissing: (row) => !row?.key_takeaways,
    generate: async (article) => {
      const result = await aiService.getKeyTakeaways({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return { fields: { keyTakeaways: { points: result.points } }, provider: result.provider, version: result.version };
    },
  },
  longSummary: {
    key: "longSummary",
    label: "Long Summary",
    isMissing: (row) => !row?.long_summary,
    generate: async (article) => {
      const result = await aiService.getLongSummary({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return {
        fields: {
          longSummary: {
            overview: result.overview,
            keyPoints: result.keyPoints,
            technicalDetails: result.technicalDetails,
            whyItMatters: result.whyItMatters,
          },
        },
        provider: result.provider,
        version: result.version,
      };
    },
  },
  rewrite: {
    key: "rewrite",
    label: "Article Rewrite",
    isMissing: (row) => !row?.rewritten_article,
    generate: async (article, sourceName) => {
      const result = await aiService.getArticleRewrite({
        id: article.id,
        title: article.title,
        content: articleText(article),
        source: sourceName,
      });
      if (!result) return null;
      return {
        fields: {
          rewrittenArticle: {
            intro: result.intro,
            mainContent: result.mainContent,
            background: result.background,
            whyItMatters: result.whyItMatters,
            technicalDetails: result.technicalDetails,
            keyHighlights: result.keyHighlights,
            conclusion: result.conclusion,
            wordCount: result.wordCount,
          },
        },
        provider: result.provider,
        version: result.version,
      };
    },
  },
  entities: {
    key: "entities",
    label: "Entities",
    isMissing: (row) => !row?.entities,
    generate: async (article) => {
      const result = await aiService.getEntities({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return {
        fields: { entities: { companies: result.companies, technologies: result.technologies, people: result.people } },
        provider: result.provider,
        version: result.version,
      };
    },
  },
  tags: {
    key: "tags",
    label: "Tags",
    isMissing: (row) => !row?.tags || row.tags.length === 0,
    generate: async (article) => {
      const result = await aiService.getTags({
        id: article.id,
        title: article.title,
        content: articleText(article),
        category: article.category,
      });
      if (!result) return null;
      return { fields: { tags: result.tags }, provider: result.provider, version: result.version };
    },
  },
  sentiment: {
    key: "sentiment",
    label: "Sentiment",
    isMissing: (row) => !row?.sentiment,
    generate: async (article) => {
      const result = await aiService.getSentiment({ id: article.id, title: article.title, content: articleText(article) });
      if (!result) return null;
      return {
        fields: { sentiment: { label: result.label, confidence: result.confidence } },
        provider: result.provider,
        version: result.version,
      };
    },
  },
  bias: {
    key: "bias",
    label: "Bias",
    isMissing: (row) => !row?.bias,
    generate: async (article, sourceName) => {
      const result = await aiService.getBias({
        id: article.id,
        title: article.title,
        content: articleText(article),
        source: sourceName,
      });
      if (!result) return null;
      return { fields: { bias: { level: result.level, confidence: result.confidence } }, provider: result.provider, version: result.version };
    },
  },
};

/**
 * Runs ONE AI capability over a small, bounded batch of already-persisted
 * articles still missing that field. Never throws for an individual
 * article's or the whole batch's generation failures (goal 5 - "Bir AI
 * görevi başarısız olursa diğer görevler devam etsin", applied at both
 * the article level via `mapWithConcurrency` and the capability level
 * since capabilities never call each other). DOES throw if the DB
 * itself is unreachable/misconfigured mid-run (candidate query, final
 * upsert) - that's a real infrastructure failure the job/queue's retry
 * and Admin "Last Error" reporting should see, not something to swallow.
 */
export async function runAIEnrichmentCapability(
  capability: AICapabilityKey,
  batchSize: number = AI_ENRICHMENT_BATCH_SIZE
): Promise<AIEnrichmentResult> {
  const descriptor = CAPABILITIES[capability];

  const supabase = createServiceClient();
  if (!supabase) {
    // Same "unconfigured is a normal, safe state" convention as every
    // other optional-integration path in this app.
    return { capability, checked: 0, updated: 0, failed: 0 };
  }

  const articleRepository = createArticleRepository(supabase);
  const aiRepository = createArticleAIRepository(supabase);
  const sourceRepository = createSourceRepository(supabase);

  const scanWindow = Math.max(batchSize * SCAN_WINDOW_MULTIPLIER, MIN_SCAN_WINDOW);
  const [pool, sources] = await Promise.all([articleRepository.listTopByTrending(scanWindow), sourceRepository.list()]);
  if (pool.length === 0) {
    return { capability, checked: 0, updated: 0, failed: 0 };
  }

  const sourceNameById = new Map(sources.map((source) => [source.id, source.name]));
  const existingAI = await aiRepository.getLatestManyByArticleIds(pool.map((article) => article.id));

  const candidates = pool.filter((article) => descriptor.isMissing(existingAI.get(article.id))).slice(0, batchSize);
  if (candidates.length === 0) {
    return { capability, checked: pool.length, updated: 0, failed: 0 };
  }

  const results = await mapWithConcurrency(candidates, AI_ENRICHMENT_CONCURRENCY, async (article) => {
    const sourceName = sourceNameById.get(article.source_id);
    return descriptor.generate(article, sourceName);
  });

  const inputs: ArticleAIInput[] = [];
  let failed = 0;

  for (const result of results) {
    if (result.status === "rejected") {
      failed += 1;
      // Was `console.error(..., result.reason)` alone - no stack/cause/
      // inspect breakdown. This is a likely real origin of the "[object
      // Object]" bug: a Supabase repository call inside `descriptor.generate`
      // (via `aiService.get*`) or a provider error can reject with a
      // plain object, not an `Error` instance. `logErrorFully()` prints
      // the raw value, its stack (if any), its `.cause` (if any), and a
      // full `util.inspect` dump instead.
      logErrorFully(`[ai-enrichment:${capability}] article "${result.item.id}" failed`, result.reason);
      continue;
    }

    const generated = result.value;
    if (!generated) continue; // no provider configured, or the provider call itself returned nothing (already logged by AIService.runCached)

    const article = result.item;
    const content = articleText(article);
    const cacheKey = hashArticleContent(article.title, content);
    const existing = existingAI.get(article.id);
    const sameVersion = existing?.cache_key === cacheKey;

    // Carry forward every OTHER capability's already-generated field from
    // the existing row when this article's content hasn't changed since
    // that row was written - otherwise this capability's upsert (keyed on
    // `article_id, provider, cache_key`) would silently overwrite and
    // lose whatever the other 8 independent capability jobs already
    // produced for this same article/version. If content HAS changed,
    // nothing carries forward (a stale version's fields don't belong on
    // a new one) - a fresh row starts with just this capability's field,
    // exactly like every other capability job hitting this article next
    // will also do until each has re-run for the new content.
    inputs.push({
      articleId: article.id,
      summary: generated.fields.summary ?? (sameVersion ? existing?.summary ?? null : null),
      tldr: generated.fields.tldr ?? (sameVersion ? existing?.tldr ?? null : null),
      longSummary: generated.fields.longSummary ?? (sameVersion ? existing?.long_summary ?? null : null),
      rewrittenArticle: generated.fields.rewrittenArticle ?? (sameVersion ? existing?.rewritten_article ?? null : null),
      entities: generated.fields.entities ?? (sameVersion ? existing?.entities ?? null : null),
      keyTakeaways: generated.fields.keyTakeaways ?? (sameVersion ? existing?.key_takeaways ?? null : null),
      tags: generated.fields.tags ?? (sameVersion ? existing?.tags ?? [] : []),
      sentiment: generated.fields.sentiment ?? (sameVersion ? existing?.sentiment ?? null : null),
      bias: generated.fields.bias ?? (sameVersion ? existing?.bias ?? null : null),
      provider: generated.provider,
      model: existing?.model ?? "",
      promptVersion: generated.version,
      cacheKey,
    });
  }

  if (inputs.length > 0) {
    await aiRepository.bulkUpsert(inputs);
  }

  return { capability, checked: candidates.length, updated: inputs.length, failed };
}

/** Runs every AI capability's bounded batch concurrently (not sequentially) - used by the Admin "Backfill AI Enrichment" button and available to any caller that wants one combined summary across all 9 capabilities in a single call. Each capability is fully independent here too: one capability throwing (DB error) is caught and reported per-capability, never aborting the others. */
export async function runAllAIEnrichmentCapabilities(batchSize: number = AI_ENRICHMENT_BATCH_SIZE): Promise<AIEnrichmentResult[]> {
  const settled = await Promise.allSettled(
    AI_CAPABILITY_KEYS.map((capability) => runAIEnrichmentCapability(capability, batchSize))
  );

  return settled.map((result, index) => {
    const capability = AI_CAPABILITY_KEYS[index];
    if (result.status === "fulfilled") return result.value;
    logErrorFully(`[ai-enrichment:${capability}] capability run failed`, result.reason);
    return { capability, checked: 0, updated: 0, failed: 0 };
  });
}
