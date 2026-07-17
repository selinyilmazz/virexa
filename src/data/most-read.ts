export type MostReadItem = {
  rank: number;
  title: string;
  views: string;
  slug: string;
  image: string;
  category: string;
  description: string;
  source: string;
  publishedDate: string;
};

export const mostReadItems: MostReadItem[] = [
  {
    rank: 1,
    title: "OpenAI unveils GPT-5",
    views: "18.4K views",
    slug: "openai-gpt5",
    image: "/images/article/gpt5-cover.jpg",
    category: "Technology",
    description:
      "OpenAI has officially announced GPT-5, introducing major improvements in reasoning, coding and multimodal understanding.",
    source: "OpenAI",
    publishedDate: "May 20, 2024",
  },
  {
    rank: 2,
    title: "NVIDIA breaks revenue record",
    views: "15.7K views",
    slug: "nvidia-breaks-revenue-record",
    image: "/images/news/ai-city.jpg",
    category: "Technology",
    description: "NVIDIA posts its strongest quarter yet, driven by soaring demand for AI data center chips.",
    source: "Bloomberg",
    publishedDate: "May 18, 2024",
  },
  {
    rank: 3,
    title: "Apple introduces AI Health",
    views: "13.2K views",
    slug: "apple-introduces-ai-health",
    image: "/images/news/apple.jpg",
    category: "Technology",
    description: "Apple unveils an AI-powered health companion that analyzes trends across all its devices.",
    source: "9to5Mac",
    publishedDate: "May 16, 2024",
  },
  {
    rank: 4,
    title: "SpaceX launches Starship Flight 5",
    views: "11.8K views",
    slug: "spacex-launches-starship-flight-5",
    image: "/images/news/funding.jpg",
    category: "World",
    description: "SpaceX successfully completes its fifth Starship test flight, a key milestone for deep space missions.",
    source: "Reuters",
    publishedDate: "May 14, 2024",
  },
  {
    rank: 5,
    title: "Microsoft invests $10B in AI",
    views: "10.1K views",
    slug: "microsoft-invests-10b-in-ai",
    image: "/images/news/gaming.jpg",
    category: "Business",
    description: "Microsoft commits another $10 billion to AI infrastructure, deepening its long-term AI strategy.",
    source: "CNBC",
    publishedDate: "May 11, 2024",
  },
];
