/**
 * Shared types + the single `runPipelineStep` helper every step in
 * `runtime/pipeline/steps/*` is built on.
 *
 * Pipeline steps NEVER throw - `runPipelineStep` catches any error and
 * folds it into a `PipelineStepResult` instead, so a single failing
 * step (a provider down, an AI timeout) never stops the rest of the
 * pipeline from running ("Pipeline her adımı bağımsız çalışabilmeli").
 * Job wrappers (`runtime/jobs/*`) that need "did this actually fail"
 * semantics (to trigger the queue's retry) check `result.success`
 * themselves and throw a `RuntimeJobError` when it's `false` - see
 * `runtime/jobs/index.ts`.
 */

export type PipelineStepName =
  | "fetch-rss"
  | "fetch-newsapi"
  | "fetch-gnews"
  | "fetch-hn"
  | "normalize"
  | "duplicate-detection"
  | "trust-score"
  | "ai-summary"
  | "tldr"
  | "long-summary"
  | "tags"
  | "sentiment"
  | "bias"
  | "trending-score"
  | "database"
  | "cache-refresh";

export type PipelineStepResult<T> = {
  step: PipelineStepName;
  success: boolean;
  durationMs: number;
  /** Populated when `data` is an array or `Map` - a quick "how much did this step produce" signal for logging, without every caller re-deriving it. */
  itemCount?: number;
  error?: string;
  data: T | undefined;
};

function deriveItemCount(data: unknown): number | undefined {
  if (Array.isArray(data)) return data.length;
  if (data instanceof Map) return data.size;
  return undefined;
}

export async function runPipelineStep<T>(
  step: PipelineStepName,
  fn: () => Promise<T>
): Promise<PipelineStepResult<T>> {
  const startedAt = Date.now();

  try {
    const data = await fn();

    return {
      step,
      success: true,
      durationMs: Date.now() - startedAt,
      itemCount: deriveItemCount(data),
      data,
    };
  } catch (error) {
    console.error(`\n==============================`);
    console.error(`[pipeline:${step}] FAILED`);
    console.error(`==============================`);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:");
      console.error(error.stack);
    } else {
      console.dir(error, { depth: null });
    }

    console.error(`==============================\n`);

    return {
      step,
      success: false,
      durationMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? error.message
          : JSON.stringify(error, null, 2),
      data: undefined,
    };
  }
}
