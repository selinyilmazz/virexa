import type { FetchArticlesParams, NewsProviderId, ProviderNewsItem } from "@/types/news";
import type { NewsProvider } from "@/services/news/providers/news-provider.interface";

/**
 * A small, hand-curated set of articles used as placeholder data for the
 * aggregation pipeline while some real feeds aren't wired up yet. This is
 * intentionally separate from the UI mock data in `src/data/*` — those
 * files drive the current pages directly; this list only exercises
 * `NewsAggregator`, category normalization, and duplicate detection end
 * to end, and — once merged in via `src/lib/news/ui-adapter.ts` — shows
 * up in Search/Category alongside the RSS-sourced articles as one more
 * always-available source.
 */
const MANUAL_ARTICLES: ProviderNewsItem[] = [
  {
    title: "OpenAI Unveils GPT-5",
    summary: "OpenAI has officially announced GPT-5, its most advanced language model to date.",
    url: "https://openai.com/blog/gpt-5",
    category: "Generative AI",
    tags: ["OpenAI", "GPT-5"],
    sourceId: "openai",
    publishedAt: "2024-05-20T09:00:00.000Z",
  },
  {
    title: "OpenAI Unveils GPT-5",
    summary: "OpenAI's newest model brings major gains in reasoning and coding, TechCrunch reports.",
    url: "https://techcrunch.com/2024/05/20/openai-gpt-5",
    category: "Artificial Intelligence",
    tags: ["OpenAI", "GPT-5"],
    sourceId: "techcrunch",
    publishedAt: "2024-05-20T10:30:00.000Z",
  },
  {
    title: "NVIDIA Announces Blackwell Updates",
    summary: "NVIDIA detailed new Blackwell platform updates aimed at large-scale AI training.",
    url: "https://blogs.nvidia.com/blog/blackwell-updates",
    category: "AI",
    tags: ["NVIDIA", "Hardware"],
    sourceId: "nvidia",
    publishedAt: "2024-05-17T08:00:00.000Z",
  },
  {
    title: "Microsoft Invests $10B in AI",
    summary: "Microsoft commits another $10 billion to AI infrastructure and data centers.",
    url: "https://www.cnbc.com/2024/05/11/microsoft-invests-10b-ai.html",
    category: "Business",
    tags: ["Microsoft", "Funding"],
    sourceId: "cnbc",
    publishedAt: "2024-05-11T14:00:00.000Z",
  },
  {
    title: "Anthropic Raises $2.6 Billion in Funding",
    summary: "Anthropic closes a new funding round to scale Claude model training and safety research.",
    url: "https://www.anthropic.com/news/series-funding",
    category: "Startup",
    tags: ["Anthropic", "Funding"],
    sourceId: "anthropic",
    publishedAt: "2024-05-15T11:00:00.000Z",
  },
];

export class ManualProvider implements NewsProvider {
  readonly id: NewsProviderId = "manual";
  readonly name = "Manual";

  async fetchArticles(params?: FetchArticlesParams): Promise<ProviderNewsItem[]> {
    let items = MANUAL_ARTICLES;

    if (params?.category) {
      const category = params.category.toLowerCase();
      items = items.filter((item) => item.category.toLowerCase() === category);
    }

    if (params?.limit) {
      items = items.slice(0, params.limit);
    }

    return items;
  }
}
