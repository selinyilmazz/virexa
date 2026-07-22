import { toCategoryNewsItem } from "@/lib/news";
import { getLiveArticlesSync } from "@/services/news";

export type CategoryNewsItem = {
  slug: string;
  image: string;
  category: string;
  title: string;
  description: string;
  source: string;
  publishedDate: string;
  isBookmarked: boolean;
  /** "N min read", derived from the stored article's `reading_time` column (DB-backed listings only - see `article-read-service.ts`'s `toCategoryNewsItem`). `undefined` for the mock/in-memory adapter (`lib/news/ui-adapter.ts`), which has no equivalent column - callers that need this (Hero/Latest News/Most Read) always go through the DB-backed path. */
  readingTime?: string;
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
  icon: string;
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
    slug: `${slug}-${index + 1}`,
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
    icon: "💻",
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
    icon: "💼",
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
    icon: "🤖",
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
    icon: "🎮",
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
    icon: "🌍",
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
  {
    slug: "security",
    name: "Security",
    icon: "🔒",
    description: "Cybersecurity threats, data breaches, and the defenses protecting people and organizations online.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Security", href: "/category/security" },
    ],
    popularTags: [
      { label: "Cybersecurity", count: 89 },
      { label: "Data Breach", count: 54 },
      { label: "Ransomware", count: 46 },
      { label: "Encryption", count: 33 },
      { label: "Zero-Day", count: 28 },
      { label: "Phishing", count: 41 },
      { label: "Compliance", count: 25 },
      { label: "Bug Bounty", count: 19 },
    ],
    news: buildCategoryNews("Security", "security", [
      "Major Data Breach Exposes Millions of Records",
      "Zero-Day Vulnerability Patched Across Browsers",
      "Ransomware Attacks Target Healthcare Systems",
      "Multi-Factor Authentication Adoption Grows",
      "Nation-State Hackers Target Critical Infrastructure",
      "Password Manager Breach Prompts Security Review",
      "AI-Powered Phishing Attacks on the Rise",
      "Cloud Misconfigurations Lead to Data Leaks",
      "New Encryption Standard Gains Industry Support",
      "Bug Bounty Programs Pay Out Record Sums",
      "Supply Chain Attacks Target Open-Source Packages",
      "Governments Tighten Cybersecurity Regulations",
    ]),
  },
  {
    slug: "robotics",
    name: "Robotics",
    icon: "🦾",
    description: "Humanoid robots, automation, and the machines reshaping factories, warehouses, and daily life.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Robotics", href: "/category/robotics" },
    ],
    popularTags: [
      { label: "Humanoid Robots", count: 62 },
      { label: "Automation", count: 58 },
      { label: "Warehousing", count: 34 },
      { label: "Exoskeletons", count: 21 },
      { label: "Drones", count: 39 },
      { label: "Manufacturing", count: 47 },
      { label: "AI Robotics", count: 51 },
      { label: "Swarm Robotics", count: 17 },
    ],
    news: buildCategoryNews("Robotics", "robotics", [
      "Humanoid Robots Enter Commercial Warehouses",
      "Surgical Robots Achieve New Precision Milestone",
      "Agricultural Robots Automate Crop Harvesting",
      "Robot Dogs Deployed for Infrastructure Inspection",
      "Soft Robotics Advances Enable Delicate Handling",
      "Robotics Startups Raise Record Funding Round",
      "Autonomous Delivery Robots Expand to New Cities",
      "Swarm Robotics Shows Promise for Disaster Response",
      "Factory Automation Adoption Accelerates Worldwide",
      "Robotic Exoskeletons Aid Rehabilitation Patients",
      "Open-Source Robotics Platforms Gain Momentum",
      "Underwater Robots Map Ocean Floor Ecosystems",
    ]),
  },
  {
    slug: "mobile",
    name: "Mobile",
    icon: "📱",
    description: "Smartphones, mobile chipsets, and the apps and networks powering life on the go.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Mobile", href: "/category/mobile" },
    ],
    popularTags: [
      { label: "Smartphones", count: 91 },
      { label: "5G", count: 52 },
      { label: "Foldables", count: 36 },
      { label: "Wearables", count: 31 },
      { label: "App Stores", count: 28 },
      { label: "Mobile Gaming", count: 62 },
      { label: "Chipsets", count: 44 },
      { label: "Battery Tech", count: 22 },
    ],
    news: buildCategoryNews("Mobile", "mobile", [
      "Flagship Smartphones Unveil Foldable Displays",
      "Mobile Chipsets Push On-Device AI Performance",
      "5G Rollout Reaches New Milestone Globally",
      "Battery Technology Breakthrough Extends Phone Life",
      "App Stores Face New Regulatory Scrutiny",
      "Mobile Payments Adoption Surges Worldwide",
      "Camera Innovations Define Next Smartphone Generation",
      "Wearables Integrate Deeper with Mobile Ecosystems",
      "Budget Smartphones Gain Premium Features",
      "Mobile Gaming Performance Rivals Consoles",
      "Foldable Tablets Enter Mainstream Market",
      "On-Device AI Models Shrink Without Losing Accuracy",
    ]),
  },
  {
    slug: "programming",
    name: "Programming",
    icon: "👨‍💻",
    description: "Languages, frameworks, and developer tools shaping how software gets built.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Programming", href: "/category/programming" },
    ],
    popularTags: [
      { label: "Open Source", count: 78 },
      { label: "AI Coding", count: 64 },
      { label: "Frameworks", count: 49 },
      { label: "DevTools", count: 37 },
      { label: "Languages", count: 41 },
      { label: "Cloud Native", count: 33 },
      { label: "Serverless", count: 26 },
      { label: "Low-Code", count: 18 },
    ],
    news: buildCategoryNews("Programming", "programming", [
      "New Language Feature Simplifies Async Code",
      "Open-Source Framework Reaches Major Milestone",
      "AI Coding Assistants Reshape Developer Workflows",
      "Language Runtime Update Boosts Performance Significantly",
      "Developer Survey Reveals Shifting Tool Preferences",
      "Package Manager Adds Enhanced Security Scanning",
      "New IDE Features Speed Up Debugging",
      "Static Typing Adoption Grows Across Codebases",
      "Serverless Architectures Gain Developer Traction",
      "Open-Source Maintainers Call for More Funding",
      "Compiler Optimizations Cut Build Times in Half",
      "Low-Code Platforms Expand Enterprise Adoption",
    ]),
  },
  {
    // `name` is "Startup" (singular) - not "Startups" - because it's
    // used directly as the real DB category filter value
    // (`searchCategoryArticles(category.name, ...)`), and the real,
    // canonical `Category` value stored on `articles.category` /
    // `SEARCH_CATEGORY_SLUGS` has always been the singular "Startup".
    // The plural only ever lived here, in the display-only mock
    // taxonomy - so this page's DB query never matched a single real
    // row before this fix, no matter how many startup articles existed.
    slug: "startups",
    name: "Startup",
    icon: "🚀",
    description: "Funding rounds, founders, and the early-stage companies betting on what comes next.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Startups", href: "/category/startups" },
    ],
    popularTags: [
      { label: "Venture Capital", count: 88 },
      { label: "Seed Funding", count: 52 },
      { label: "Unicorns", count: 34 },
      { label: "Accelerators", count: 27 },
      { label: "M&A", count: 38 },
      { label: "Founders", count: 45 },
      { label: "Climate Tech", count: 29 },
      { label: "Bootstrapping", count: 16 },
    ],
    news: buildCategoryNews("Startups", "startups", [
      "Seed Funding Rounds Rebound After Slow Quarter",
      "AI Startup Reaches Unicorn Valuation",
      "Accelerator Program Announces New Cohort",
      "Climate Tech Startups Attract Fresh Capital",
      "Founders Navigate Tighter Fundraising Environment",
      "Startup Acquired in Major Industry Consolidation",
      "Early-Stage Investors Shift Focus to AI Infrastructure",
      "Bootstrapped Startup Reaches Profitability Milestone",
      "Startup Layoffs Slow as Market Stabilizes",
      "New Incubator Targets Underrepresented Founders",
      "Venture Debt Emerges as Popular Funding Alternative",
      "Startup Ecosystem Expands Beyond Major Hubs",
    ]),
  },
  {
    slug: "space",
    name: "Space",
    icon: "🛰️",
    description: "Rocket launches, space exploration, and the missions pushing beyond Earth's orbit.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Space", href: "/category/space" },
    ],
    popularTags: [
      { label: "SpaceX", count: 73 },
      { label: "NASA", count: 68 },
      { label: "Satellites", count: 41 },
      { label: "Mars", count: 36 },
      { label: "Rockets", count: 44 },
      { label: "Astronomy", count: 39 },
      { label: "Space Tourism", count: 22 },
      { label: "Exoplanets", count: 27 },
    ],
    news: buildCategoryNews("Space", "space", [
      "SpaceX Completes Successful Starship Test Flight",
      "NASA Confirms New Exoplanet Discovery",
      "Private Space Station Plans Move Forward",
      "Lunar Mission Prepares for Crewed Landing",
      "Satellite Constellation Expands Global Internet Coverage",
      "Space Telescope Captures Stunning Deep-Field Image",
      "Asteroid Mining Startup Secures New Funding",
      "Mars Rover Uncovers Evidence of Ancient Water",
      "Space Tourism Flights Resume After Safety Review",
      "International Partners Advance Space Station Plans",
      "Rocket Reusability Milestone Cuts Launch Costs",
      "Astronomers Detect Signals from Distant Galaxy",
    ]),
  },
  {
    slug: "science",
    name: "Science",
    icon: "🔬",
    description: "Research breakthroughs across physics, biology, climate, and the natural world.",
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Science", href: "/category/science" },
    ],
    popularTags: [
      { label: "Climate Science", count: 66 },
      { label: "Genetics", count: 44 },
      { label: "Physics", count: 37 },
      { label: "Renewable Energy", count: 51 },
      { label: "Health Research", count: 48 },
      { label: "Archaeology", count: 23 },
      { label: "Quantum", count: 31 },
      { label: "Biotech", count: 39 },
    ],
    news: buildCategoryNews("Science", "science", [
      "Researchers Achieve Breakthrough in Fusion Energy",
      "New Study Links Gut Health to Brain Function",
      "Scientists Map Uncharted Deep-Sea Ecosystem",
      "Gene Editing Trial Shows Promising Early Results",
      "Climate Researchers Warn of Accelerating Ice Loss",
      "Physicists Observe Rare Quantum Phenomenon",
      "New Vaccine Technology Shows Broad Protection",
      "Archaeologists Uncover Ancient Civilization Remains",
      "Renewable Energy Storage Reaches New Efficiency Record",
      "Study Reveals New Insights into Aging Process",
      "Researchers Develop Biodegradable Plastic Alternative",
      "Astronomers Refine Estimate of Universe's Age",
    ]),
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  const category = categories.find((candidate) => candidate.slug === slug.toLowerCase());
  if (!category) {
    return undefined;
  }

  // Merge in live (RSS/API-sourced) articles for this category, if any
  // are cached. Never mutates the static `categories` array - this
  // builds a fresh object per call so repeated lookups stay stable.
  // getLiveArticlesSync() is a synchronous, always-safe read (see
  // src/services/news/live-articles.ts): on a cold cache or any
  // provider failure it simply returns [], and this function falls
  // straight back to the existing mock-only behavior.
  const liveItems = getLiveArticlesSync()
    .filter((article) => article.category.toLowerCase() === category.name.toLowerCase())
    .map(toCategoryNewsItem);

  if (liveItems.length === 0) {
    return category;
  }

  const existingSlugs = new Set(category.news.map((item) => item.slug));
  const newLiveItems = liveItems.filter((item) => !existingSlugs.has(item.slug));

  return { ...category, news: [...category.news, ...newLiveItems] };
}
