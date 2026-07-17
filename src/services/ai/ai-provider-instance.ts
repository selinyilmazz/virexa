import { env } from "@/lib/env";
import { AnthropicProvider } from "@/services/ai/providers/anthropic-provider";
import { OpenAIProvider } from "@/services/ai/providers/openai-provider";
import { OpenRouterProvider } from "@/services/ai/providers/openrouter-provider";
import type { AIProvider } from "@/services/ai/ai-provider.interface";

/**
 * Resolves the configured `AIProvider` from environment
 * (`AI_PROVIDER`, `AI_MODEL`, `AI_TIMEOUT`, `AI_MAX_TOKENS` - see
 * `src/lib/env.ts` - plus that provider's own API key). Returns `null`
 * when no key is set for the selected provider; every caller (see
 * `AIService`) already treats "no provider" as a normal, safe state,
 * never an error ("API anahtarı yoksa sistem güvenli şekilde çalışmaya
 * devam etsin").
 *
 * This is the ONLY place that reads `AI_PROVIDER`/API keys and
 * constructs a provider instance - switching providers is purely a
 * configuration change here, never a code change anywhere else
 * ("Provider seçimi sadece configuration üzerinden değiştirilebilsin").
 */
function createConfiguredAIProvider(): AIProvider | null {
  const { provider, model, timeoutMs, maxTokens } = env.ai;
  const sharedConfig = { model, timeoutMs, maxTokens };

  switch (provider) {
    case "anthropic":
      if (!env.ai.anthropicApiKey) return null;
      return new AnthropicProvider({ ...sharedConfig, apiKey: env.ai.anthropicApiKey });

    case "openrouter":
      if (!env.ai.openRouterApiKey) return null;
      return new OpenRouterProvider({ ...sharedConfig, apiKey: env.ai.openRouterApiKey });

    case "openai":
    default:
      if (!env.ai.openAiApiKey) return null;
      return new OpenAIProvider({ ...sharedConfig, apiKey: env.ai.openAiApiKey });
  }
}

export const aiProvider: AIProvider | null = createConfiguredAIProvider();
