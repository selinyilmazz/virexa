export type ArticleContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "list"; items: string[] };

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type RelatedArticleItem = {
  slug: string;
  image: string;
  title: string;
  source: string;
  publishedDate: string;
};

export type Article = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
  };
  publishedDate: string;
  readTime: string;
  content: ArticleContentBlock[];
  tags: string[];
  sourceLabel: string;
  sourceUrl: string;
  breadcrumb: BreadcrumbItem[];
  relatedArticles: RelatedArticleItem[];
};

export const articles: Article[] = [
  {
    slug: "openai-gpt5",
    category: "Technology",
    title:
      "OpenAI has officially announced GPT-5, introducing major improvements in reasoning, coding and multimodal understanding.",
    summary: "OpenAI has officially announced GPT-5, its most advanced AI model to date...",
    coverImage: "/images/article/gpt5-cover.jpg",
    author: {
      name: "OpenAI",
      avatar: "/images/article/authors/openai.svg",
    },
    publishedDate: "May 20, 2024",
    readTime: "5 min read",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Technology", href: "/category/technology" },
      { label: "OpenAI launches GPT-5", href: "/article/openai-gpt5" },
    ],
    content: [
      {
        type: "paragraph",
        text: "OpenAI has officially announced GPT-5, its most advanced language model to date. The new model introduces significant improvements in reasoning, coding, multimodal understanding, and overall accuracy, making it more capable across a wide range of real-world tasks.",
      },
      {
        type: "paragraph",
        text: "According to OpenAI, GPT-5 delivers faster responses, improved instruction following, and reduced hallucinations compared to previous generations. The model has been designed to provide more reliable outputs while maintaining a natural conversational experience.",
      },
      {
        type: "heading",
        text: "What's new in GPT-5",
      },
      {
        type: "list",
        items: [
          "Stronger multi-step reasoning across coding, math and research tasks",
          "Faster response times with lower latency across the API",
          "Improved multimodal understanding of text, images and structured data",
          "Reduced hallucination rate compared to GPT-4 class models",
        ],
      },
      {
        type: "paragraph",
        text: "The release will gradually roll out to ChatGPT users and developers through the OpenAI API. Enterprise customers are expected to gain access first, followed by Plus subscribers and additional public availability in the coming weeks.",
      },
      {
        type: "quote",
        text: "GPT-5 represents the biggest step change in capability since the original release of GPT-4. It changes what teams can realistically automate today.",
        attribution: "OpenAI engineering blog",
      },
      {
        type: "paragraph",
        text: "Industry experts believe GPT-5 could accelerate the adoption of AI across software development, education, healthcare, and business automation. The launch also intensifies competition with other leading AI companies developing next-generation language models.",
      },
      {
        type: "paragraph",
        text: "Beyond software development, OpenAI highlights stronger multimodal performance. Users can work with text, images, and structured data more naturally, enabling new use cases across education, research, healthcare, and business.",
      },
      {
        type: "paragraph",
        text: "Safety remains a key focus for the company. GPT-5 includes enhanced safeguards, more accurate responses, and improved resistance to harmful or misleading prompts. OpenAI states that responsible AI deployment continues to be a priority.",
      },
      {
        type: "paragraph",
        text: "Industry analysts believe GPT-5 will intensify competition among major AI companies such as Google, Anthropic, Microsoft, and Meta. The release is expected to accelerate innovation across the artificial intelligence ecosystem.",
      },
    ],
    tags: ["AI", "OpenAI", "GPT-5", "Machine Learning", "Technology"],
    sourceLabel: "OpenAI Official Blog",
    sourceUrl: "https://openai.com/blog",
    relatedArticles: [
      {
        slug: "openai-introduces-new-safety-measures",
        image: "/images/news/ai-city.jpg",
        title: "OpenAI introduces new safety measures",
        source: "TechCrunch",
        publishedDate: "May 18, 2024",
      },
      {
        slug: "nvidia-announces-blackwell-updates",
        image: "/images/news/gaming.jpg",
        title: "NVIDIA announces Blackwell updates",
        source: "Verge",
        publishedDate: "May 17, 2024",
      },
      {
        slug: "apple-expands-apple-intelligence",
        image: "/images/news/apple.jpg",
        title: "Apple expands Apple Intelligence",
        source: "9to5Mac",
        publishedDate: "May 16, 2024",
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
