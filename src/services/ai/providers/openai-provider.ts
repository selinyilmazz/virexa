import { callOpenAICompatibleChat } from "@/lib/ai";
import { BaseAIProvider } from "@/services/ai/providers/base-ai-provider";

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAIProviderConfig = {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
};

/**
 * OpenAI Chat Completions integration (https://platform.openai.com/docs/api-reference/chat).
 * All six `AIProvider` operations come from `BaseAIProvider` - this
 * class only knows how to send one chat request.
 */
export class OpenAIProvider extends BaseAIProvider {
  readonly id = "openai" as const;
  readonly name = "OpenAI";

  constructor(private readonly config: OpenAIProviderConfig) {
    super();
  }

  protected async chat(system: string, user: string): Promise<string> {
    return callOpenAICompatibleChat(
      {
        baseUrl: OPENAI_CHAT_COMPLETIONS_URL,
        apiKey: this.config.apiKey,
        model: this.config.model,
        timeoutMs: this.config.timeoutMs,
        maxTokens: this.config.maxTokens,
      },
      system,
      user
    );
  }
}
