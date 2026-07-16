export type CategoryNewsItem = {
  id: string;
  image: string;
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
  isBookmarked: boolean;
};

export type CategoryTag = {
  label: string;
  count: number;
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  breadcrumb: BreadcrumbItem[];
  popularTags: CategoryTag[];
  news: CategoryNewsItem[];
};

const CARD_IMAGES = [
  "/images/news/ai-city.jpg",
  "/images/news/gaming.jpg",
  "/images/news/apple.jpg",
  "/images/news/funding.jpg",
];

const CARD_SOURCES = ["TechCrunch", "Reuters", "The Verge", "Bloomberg", "Wired", "BBC"];

const CARD_DATES = [
  "May 20, 2024",
  "May 19, 2024",
  "May 18, 2024",
  "May 17, 2024",
  "May 16, 2024",
  "May 15, 2024",
  "May 14, 2024",
  "May 13, 2024",
  "May 12, 2024",
  "May 11, 2024",
  "May 10, 2024",
  "May 9, 2024",
];

function buildCategoryNews(categoryName: string, slug: string, titles: string[]): CategoryNewsItem[] {
  return titles.map((title, index) => ({
    id: `${slug}-${index + 1}`,
    image: CARD_IMAGES[index % CARD_IMAGES.length],
    category: categoryName,
    title,
    description: `${title} — here's what it means for the ${categoryName.toLowerCase()} industry, according to our newsroom.`,
    source: CARD_SOURCES[index % CARD_SOURCES.length],
    publishedDate: CARD_DATES[index % CARD_DATES.length],
    isBookmarked: index % 4 === 0,
  }));
}

export const categories: Category[] = [
  {
    slug: "technology",
    name: "Technology",
    description:
      "The latest breakthroughs in software, hardware, and emerging tech shaping how the world builds and connects.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Technology", href: "/category/technology" },
    ],
    popularTags: [
      { label: "AI", count: 128 },
      { label: "Cloud", count: 84 },
      { label: "5G", count: 52 },
      { label: "Robotics", count: 47 },
      { label: "Cybersecurity", count: 63 },
      { label: "Wearables", count: 31 },
      { label: "AR/VR", count: 28 },
      { label: "Startups", count: 96 },
    ],
    news: buildCategoryNews("Technology", "technology", [
      "AI Revolutionizes City Transportation Systems",
      "Quantum Computing Reaches New Milestone",
      "5G Networks Expand to Rural Areas",
      "Wearable Tech Adoption Hits Record High",
      "Cybersecurity Threats Rise Across Enterprises",
      "Cloud Computing Costs Drop Industry-Wide",
      "Autonomous Vehicles Pass Safety Benchmarks",
      "Smart Home Devices See Surge in Sales",
      "Robotics Startups Attract Fresh Funding",
      "AR Glasses Enter Mainstream Market",
      "Chip Shortage Eases as Production Ramps Up",
      "Data Centers Shift Toward Renewable Energy",
    ]),
  },
  {
    slug: "business",
    name: "Business",
    description: "Markets, earnings, and the corporate moves driving the global economy forward.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Business", href: "/category/business" },
    ],
    popularTags: [
      { label: "Markets", count: 112 },
      { label: "Earnings", count: 74 },
      { label: "Startups", count: 96 },
      { label: "M&A", count: 38 },
      { label: "Retail", count: 45 },
      { label: "Banking", count: 51 },
      { label: "Trade", count: 29 },
      { label: "Venture Capital", count: 60 },
    ],
    news: buildCategoryNews("Business", "business", [
      "Apple Reports Record Quarterly Revenue",
      "Global Markets Rally on Rate Cut Hopes",
      "Retail Giants Report Strong Holiday Sales",
      "Startup Valuations Rebound in 2024",
      "Oil Prices Stabilize After Volatile Week",
      "Major Merger Reshapes Airline Industry",
      "Central Banks Signal Cautious Optimism",
      "E-commerce Growth Slows but Stays Positive",
      "Manufacturing Sector Shows Signs of Recovery",
      "Venture Capital Funding Rebounds Sharply",
      "Supply Chains Stabilize After Years of Disruption",
      "Corporate Earnings Beat Analyst Expectations",
    ]),
  },
  {
    slug: "ai",
    name: "AI",
    description:
      "Everything about artificial intelligence — new models, research breakthroughs, and how AI is reshaping industries.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "AI", href: "/category/ai" },
    ],
    popularTags: [
      { label: "GPT-5", count: 154 },
      { label: "OpenAI", count: 121 },
      { label: "Anthropic", count: 88 },
      { label: "Machine Learning", count: 102 },
      { label: "AI Agents", count: 67 },
      { label: "Regulation", count: 34 },
      { label: "Open Source", count: 41 },
      { label: "Enterprise AI", count: 58 },
    ],
    news: buildCategoryNews("AI", "ai", [
      "OpenAI Unveils GPT-5: Smarter, Faster, More Capable",
      "Anthropic Raises $2.6 Billion in Funding",
      "Google DeepMind Announces New Reasoning Model",
      "AI Regulation Talks Advance in the EU",
      "Enterprise AI Adoption Accelerates in 2024",
      "Meta Open-Sources New Language Model",
      "AI Agents Automate Complex Business Workflows",
      "Researchers Improve AI Model Efficiency by 40%",
      "AI-Generated Content Faces New Labeling Rules",
      "Healthcare AI Tools Gain Regulatory Approval",
      "AI Chip Demand Continues to Outpace Supply",
      "Open-Source AI Models Close the Gap with Giants",
    ]),
  },
  {
    slug: "games",
    name: "Games",
    description: "Console, PC, and mobile gaming news — releases, studios, esports, and the technology behind the games.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Games", href: "/category/games" },
    ],
    popularTags: [
      { label: "Esports", count: 71 },
      { label: "Cloud Gaming", count: 39 },
      { label: "Indie Games", count: 55 },
      { label: "VR Gaming", count: 33 },
      { label: "Mobile Gaming", count: 62 },
      { label: "Game Engines", count: 27 },
      { label: "Consoles", count: 48 },
      { label: "Live Service", count: 30 },
    ],
    news: buildCategoryNews("Games", "games", [
      "Next-Generation Gaming Takes Center Stage",
      "Major Studio Unveils Highly Anticipated Sequel",
      "Cloud Gaming Subscriptions Reach New High",
      "Esports Prize Pools Break Records This Year",
      "VR Gaming Sees Renewed Consumer Interest",
      "Indie Developers Thrive on New Platforms",
      "Game Engine Update Boosts Realistic Graphics",
      "Mobile Gaming Revenue Surpasses Console Sales",
      "Classic Franchise Returns After Decade-Long Hiatus",
      "Live-Service Games Face Player Retention Challenges",
      "AI-Powered NPCs Change How Games Are Built",
      "Gaming Hardware Sales Surge Ahead of Holidays",
    ]),
  },
  {
    slug: "world",
    name: "World",
    description: "Global affairs, diplomacy, and the events shaping communities and economies around the world.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "World", href: "/category/world" },
    ],
    popularTags: [
      { label: "Climate", count: 87 },
      { label: "Diplomacy", count: 42 },
      { label: "Elections", count: 66 },
      { label: "Trade", count: 29 },
      { label: "Humanitarian", count: 35 },
      { label: "Security", count: 40 },
      { label: "Health", count: 53 },
      { label: "Culture", count: 24 },
    ],
    news: buildCategoryNews("World", "world", [
      "Global Leaders Meet to Discuss Climate Action",
      "New Trade Agreement Signed Between Regions",
      "Humanitarian Efforts Expand in Crisis Areas",
      "Elections Draw Record Voter Turnout",
      "International Summit Addresses Economic Cooperation",
      "Scientists Warn of Accelerating Climate Trends",
      "Diplomatic Talks Ease Regional Tensions",
      "Global Health Initiative Expands Vaccine Access",
      "Infrastructure Investment Announced for Developing Nations",
      "Cultural Exchange Programs See Renewed Interest",
      "Natural Disaster Response Efforts Continue",
      "United Nations Convenes on Global Security",
    ]),
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug.toLowerCase());
}
