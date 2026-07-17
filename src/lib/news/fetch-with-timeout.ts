/**
 * Shared HTTP plumbing for every provider that makes a real network call
 * (`RSSProvider`, `NewsAPIProvider`, `GNewsProvider`). Centralizing the
 * timeout/abort logic and status classification here means each
 * provider's `fetchArticles` only has to handle "did the request
 * succeed" and "what does a successful response look like" - not
 * reimplement `AbortController` bookkeeping three times.
 */

export type ProviderFailureKind = "timeout" | "network" | "rate_limit" | "server_error" | "client_error";

export class ProviderHttpError extends Error {
  readonly kind: ProviderFailureKind;

  constructor(message: string, kind: ProviderFailureKind) {
    super(message);
    this.name = "ProviderHttpError";
    this.kind = kind;
  }
}

/**
 * `fetch` with a hard timeout. Resolves normally for any HTTP response
 * (including 4xx/5xx - that's the caller's job to inspect via
 * `response.ok` / `classifyHttpStatus`); only throws for conditions
 * `fetch` itself can't turn into a `Response`, i.e. the request timing
 * out or the network being unavailable.
 */
export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ProviderHttpError(`Request timed out after ${timeoutMs}ms`, "timeout");
    }
    throw new ProviderHttpError(error instanceof Error ? error.message : String(error), "network");
  } finally {
    clearTimeout(timeout);
  }
}

/** Buckets a non-2xx HTTP status into the categories providers need to log/handle distinctly. */
export function classifyHttpStatus(status: number): ProviderFailureKind {
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server_error";
  return "client_error";
}
