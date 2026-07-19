import { parseJsonResponse } from "@/lib/ai/http";
import {
  buildArticleRewritePrompt,
  buildBiasPrompt,
  buildEntitiesPrompt,
  buildLongSummaryPrompt,
  buildSentimentPrompt,
  buildSummaryPrompt,
  buildTLDRPrompt,
  buildTagsPrompt,
  buildTakeawaysPrompt,
  type PromptPair,
} from "@/lib/ai/prompts";
import type { AIProvider } from "@/services/ai/ai-provider.interface";
import type {
  AIProviderId,
  AnalyzeBiasInput,
  AnalyzeSentimentInput,
  ArticleRewriteInput,
  BiasLevel,
  ExtractEntitiesInput,
  GenerateTagsInput,
  SentimentLabel,
  SummarizeInput,
} from "@/types/ai";

/**
 * Implements every `AIProvider` operation once, in terms of a single
 * abstract primitive - `chat(system, user)`, which sends a system+user
 * prompt to the underlying model and returns its raw text response.
 * Every concrete provider (`OpenAIProvider`, `AnthropicProvider`,
 * `OpenRouterProvider`) only has to implement `chat()` against its own
 * API shape; the six public methods below, their prompt selection, and
 * JSON-vs-plain-text response handling are shared and written exactly
 * once ("Tekrarlayan AI kodlarını kaldır").
 */
export abstract class BaseAIProvider implements AIProvider {
  abstract readonly id: AIProviderId;
  abstract readonly name: string;

  protected abstract chat(system: string, user: string): Promise<string>;

  private async runTextTask(prompt: PromptPair): Promise<string> {
    return (await this.chat(prompt.system, prompt.user)).trim();
  }

  private async runJsonTask<T>(prompt: PromptPair): Promise<T> {
    const text = await this.chat(prompt.system, prompt.user);
    return parseJsonResponse<T>(text);
  }

  async summarize(input: SummarizeInput): Promise<string> {
    return this.runTextTask(buildSummaryPrompt(input));
  }

  async generateTLDR(input: SummarizeInput): Promise<{ title: string; bullets: string[] }> {
    return this.runJsonTask(buildTLDRPrompt(input));
  }

  async generateKeyTakeaways(input: SummarizeInput): Promise<string[]> {
    return this.runJsonTask(buildTakeawaysPrompt(input));
  }

  async generateLongSummary(
    input: SummarizeInput
  ): Promise<{ overview: string; keyPoints: string[]; technicalDetails: string; whyItMatters: string }> {
    return this.runJsonTask(buildLongSummaryPrompt(input));
  }

  async generateArticleRewrite(input: ArticleRewriteInput): Promise<{
    intro: string;
    mainContent: string;
    background: string;
    whyItMatters: string;
    technicalDetails: string | null;
    keyHighlights: string[];
    conclusion: string;
  }> {
    return this.runJsonTask(buildArticleRewritePrompt(input));
  }

  async extractEntities(input: ExtractEntitiesInput): Promise<{
    companies: string[];
    technologies: string[];
    people: string[];
  }> {
    return this.runJsonTask(buildEntitiesPrompt(input));
  }

  async generateTags(input: GenerateTagsInput): Promise<string[]> {
    return this.runJsonTask(buildTagsPrompt(input));
  }

  async analyzeSentiment(input: AnalyzeSentimentInput): Promise<{ label: SentimentLabel; confidence: number }> {
    return this.runJsonTask(buildSentimentPrompt(input));
  }

  async analyzeBias(input: AnalyzeBiasInput): Promise<{ level: BiasLevel; confidence: number }> {
    return this.runJsonTask(buildBiasPrompt(input));
  }
}
