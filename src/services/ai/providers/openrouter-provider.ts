import { callOpenAICompatibleChat } from "@/lib/ai";
import { BaseAIProvider } from "@/services/ai/providers/base-ai-provider";

const OPENROUTER_CHAT_COMPLETIONS_URL = "https://openrouter.ai/api/v1/chat/completions";

export type OpenRouterProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
};

/**
 * OpenRouter integration (https://openrouter.ai/docs) - deliberately
 * OpenAI-compatible on the wire, so it reuses the same
 * `callOpenAICompatibleChat` client as `OpenAIProvider`. `model` here is
 * an OpenRouter model id (e.g. "openai/gpt-4o-mini",
 * "anthropic/claude-3.5-haiku") rather than a bare OpenAI model name.
 */
export class OpenRouterProvider extends BaseAIProvider {
  readonly id = "openrouter" as const;
  readonly name = "OpenRouter";

  constructor(private readonly config: OpenRouterProviderConfig) {
    super();
  }

  protected async chat(system: string, user: string): Promise<string> {
    return callOpenAICompatibleChat(
      {
        baseUrl: OPENROUTER_CHAT_COMPLETIONS_URL,
        apiKey: this.config.apiKey,
        model: this.config.model,
        timeoutMs: this.config.timeoutMs,
        maxTokens: this.config.maxTokens,
        // Optional per OpenRouter's docs (helps their leaderboard/rate
        // limiting attribute traffic) - harmless to omit but included
        // since Virexa is a concrete app, not an anonymous script.
        extraHeaders: {
          "HTTP-Referer": "https://virexa.app",
          "X-Title": "Virexa",
        },
      },
      system,
      user
    );
  }
}
