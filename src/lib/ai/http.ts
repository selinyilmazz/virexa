/**
 * Shared HTTP plumbing for AI provider implementations
 * (`src/services/ai/providers/*`). Deliberately separate from
 * `src/lib/news/fetch-with-timeout.ts` even though the logic is
 * similar - this task's brief is explicit that the news engine isn't to
 * be touched or depended on, so the AI layer owns its own copy rather
 * than importing across that boundary.
 */

export type AIFailureKind =
  | "timeout"
  | "network"
  | "rate_limit"
  | "server_error"
  | "client_error"
  | "invalid_json"
  | "invalid_response";

export class AIProviderError extends Error {
  readonly kind: AIFailureKind;

  constructor(message: string, kind: AIFailureKind) {
    super(message);
    this.name = "AIProviderError";
    this.kind = kind;
  }
}

/**
 * `fetch` with a hard timeout. Resolves normally for any HTTP response
 * (the caller inspects `response.ok` / `classifyHttpStatus`); only
 * throws `AIProviderError` for conditions `fetch` itself can't turn
 * into a `Response` - the request timing out or the network being
 * unavailable.
 */
export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AIProviderError(`Request timed out after ${timeoutMs}ms`, "timeout");
    }
    throw new AIProviderError(error instanceof Error ? error.message : String(error), "network");
  } finally {
    clearTimeout(timeout);
  }
}

/** Buckets a non-2xx HTTP status into the categories AI providers need to log/handle distinctly. */
export function classifyHttpStatus(status: number): AIFailureKind {
  if (status === 429) return "rate_limit";
  if (status >= 500) return "server_error";
  return "client_error";
}

/**
 * Parses a model's text response as JSON, tolerating the most common
 * "almost JSON" shape models return: a ```json ... ``` fenced code
 * block. Throws `AIProviderError("invalid_json")` on genuinely
 * unparseable output rather than letting a raw `SyntaxError` escape -
 * every caller in the AI layer treats this as just another provider
 * failure mode (see task: "Invalid JSON" error handling).
 */
export function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new AIProviderError(`Model response was not valid JSON: ${reason}`, "invalid_json");
  }
}
