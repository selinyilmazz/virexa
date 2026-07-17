import { AIProviderError, classifyHttpStatus, fetchWithTimeout } from "@/lib/ai/http";

/**
 * Shared HTTP client for any provider that speaks the OpenAI Chat
 * Completions wire format - which is both OpenAI itself and OpenRouter
 * (an explicit compatibility goal of OpenRouter's API). Used by
 * `providers/openai-provider.ts` and `providers/openrouter-provider.ts`
 * so the request/response handling for that shape is written once.
 */
export type OpenAICompatibleConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  extraHeaders?: Record<string, string>;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
};

export async function callOpenAICompatibleChat(
  config: OpenAICompatibleConfig,
  system: string,
  user: string
): Promise<string> {
  const response = await fetchWithTimeout(
    config.baseUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
    config.timeoutMs
  );

  if (!response.ok) {
    const kind = classifyHttpStatus(response.status);
    const body = await response.text().catch(() => "");
    throw new AIProviderError(`Request failed (HTTP ${response.status}): ${body.slice(0, 300)}`, kind);
  }

  let data: ChatCompletionResponse;
  try {
    data = (await response.json()) as ChatCompletionResponse;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new AIProviderError(`Response was not valid JSON: ${reason}`, "invalid_json");
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIProviderError("Response had no content.", "invalid_response");
  }

  return content;
}
