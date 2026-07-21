/**
 * Bounded-concurrency `map` - runs `worker` over `items` with at most
 * `limit` in flight at once, instead of either a fully sequential
 * `for...of` loop (too slow - see `ai-steps.ts`'s old per-capability
 * loops, the root cause of "news-fetch" hanging past Vercel's 300s
 * `maxDuration` once AI enrichment moved onto this codebase's
 * broad/narrow tiers) or an unbounded `Promise.all` (too many
 * simultaneous requests against a rate-limited AI provider, and no way
 * to reason about worst-case wall time).
 *
 * Deliberately hand-rolled instead of adding a `p-limit` dependency -
 * this package's `package.json` is kept deliberately small/curated
 * (nothing beyond Next.js/Supabase/Zod), and the pattern itself is
 * ~15 lines: a fixed pool of `limit` workers, each pulling the next
 * unclaimed index off a shared cursor until the queue is empty.
 *
 * Every item's outcome is captured independently (`status: "fulfilled"`
 * or `"rejected"`, mirroring `Promise.allSettled`'s shape) - one item's
 * rejection never stops the others from running or aborts the whole
 * batch, which is the same per-item isolation `AIService.runCached()`
 * already guarantees one level down (a single article's provider
 * timeout). This is what makes "bir AI görevi başarısız olursa diğerleri
 * devam etsin" true at the batch level, not just the article level.
 */
export type ConcurrencyResult<T, R> =
  | { item: T; index: number; status: "fulfilled"; value: R }
  | { item: T; index: number; status: "rejected"; reason: unknown };

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<ConcurrencyResult<T, R>[]> {
  const results: ConcurrencyResult<T, R>[] = new Array(items.length);
  let cursor = 0;

  async function runWorker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      try {
        const value = await worker(item, index);
        results[index] = { item, index, status: "fulfilled", value };
      } catch (reason) {
        results[index] = { item, index, status: "rejected", reason };
      }
    }
  }

  const poolSize = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => runWorker()));

  return results;
}
