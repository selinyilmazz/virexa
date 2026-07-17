import { AIProviderError, classifyHttpStatus, fetchWithTimeout } from "@/lib/ai";
import { BaseAIProvider } from "@/services/ai/providers/base-ai-provider";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";

export type AnthropicProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
};

type AnthropicMessagesResponse = {
  content?: { type: string; text?: string }[];
};

/**
 * Anthropic Messages API integration
 * (https://docs.anthropic.com/en/api/messages). Anthropic's wire format
 * differs from the OpenAI-compatible shape (`system` is a top-level
 * field rather than a message, auth is `x-api-key` not `Authorization`,
 * responses use a `content` block array) - so unlike `OpenAIProvider`/
 * `OpenRouterProvider`, this implements `chat()` directly rather than
 * going through `callOpenAICompatibleChat`. All six `AIProvider`
 * operations still come from `BaseAIProvider`.
 */
export class AnthropicProvider extends BaseAIProvider {
  readonly id = "anthropic" as const;
  readonly name = "Anthropic";

  constructor(private readonly config: AnthropicProviderConfig) {
    super();
  }

  protected async chat(system: string, user: string): Promise<string> {
    const response = await fetchWithTimeout(
      ANTHROPIC_MESSAGES_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: 0.3,
          system,
          messages: [{ role: "user", content: user }],
        }),
      },
      this.config.timeoutMs
    );

    if (!response.ok) {
      const kind = classifyHttpStatus(response.status);
      const body = await response.text().catch(() => "");
      throw new AIProviderError(`Anthropic request failed (HTTP ${response.status}): ${body.slice(0, 300)}`, kind);
    }

    let data: AnthropicMessagesResponse;
    try {
      data = (await response.json()) as AnthropicMessagesResponse;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new AIProviderError(`Anthropic response was not valid JSON: ${reason}`, "invalid_json");
    }

    const text = data.content?.find((block) => block.type === "text")?.text;
    if (!text) {
      throw new AIProviderError("Anthropic response had no text content.", "invalid_response");
    }

    return text;
  }
}
