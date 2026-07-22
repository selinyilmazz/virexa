/**
 * Developer Hub's curated catalog data (Developer Hub redesign - renamed
 * from "Resources"). Unlike every other data source in this app, none of
 * this content can come from the real articles database - certifications,
 * courses, learning paths, developer tools, roadmaps and cheat sheets
 * aren't things the news pipeline ingests. Per this project's strict
 * "never fabricate data" convention (see `classifyContentType`/
 * `getNewsExplorerStats` and friends), the answer isn't to invent numbers
 * (ratings, "12.4K saves", "2,843 Certifications") - it's to hand-curate
 * a small, real, verifiable list: every title below is a real
 * certification/course/tool/roadmap/cheat sheet, every `url` is its real
 * official page. Stats shown in the UI (`getDeveloperHubStats`) are
 * computed as the real `.length` of these arrays, not styled to look like
 * a bigger platform than this actually is.
 *
 * What's deliberately NOT here: star ratings, enrollment/save counts, or
 * "most popular" rankings - Virexa has no real usage telemetry for
 * external resources, so those fields simply don`t exist on these types
 * (see `CatalogSortControl`'s doc comment for how sorting was adapted to
 * only use real fields as a result).
 */

export type Difficulty = "beginner" | "intermediate" | "advanced";
export type Price = "free" | "paid";

export type CertificationItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  difficulty: Difficulty;
  price: Price;
  url: string;
  /** Shown as a small accent tile on the card instead of a fabricated cover photo - see `CatalogCard`. */
  emoji: string;
  featured?: boolean;
  /** Every certification curated here is a real, official program run by its own provider (AWS/Microsoft/Google/CNCF/HashiCorp/CompTIA/ISC2/Cisco/GitHub) - `true` on every entry, not a fabricated trust signal. Powers the card's small "Official" badge. */
  official: true;
};

export type CourseItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  difficulty: Difficulty;
  price: Price;
  url: string;
  emoji: string;
  featured?: boolean;
};

export type LearningPathItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  difficulty: Difficulty;
  price: Price;
  url: string;
  emoji: string;
  featured?: boolean;
};

export type DeveloperToolItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  price: Price;
  url: string;
  emoji: string;
  featured?: boolean;
};

export type RoadmapItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  difficulty: Difficulty;
  /** A reasonable, honestly-labeled estimate range - never a fabricated precise figure. */
  estimatedTime: string;
  url: string;
  emoji: string;
  featured?: boolean;
  /** 4-5 real topic areas from this roadmap's own real curriculum (roadmap.sh), in a sensible learning order - powers the card's small step-preview instead of a plain icon. Illustrative of subject matter, not a fabricated metric. */
  steps: string[];
};

export type CheatSheetItem = {
  slug: string;
  title: string;
  provider: string;
  description: string;
  fileType: string;
  url: string;
  emoji: string;
  featured?: boolean;
};

export const CERTIFICATIONS: CertificationItem[] = [
  {
    slug: "aws-certified-developer-associate",
    title: "AWS Certified Developer – Associate",
    provider: "Amazon Web Services",
    description: "Validates hands-on experience developing and maintaining applications on AWS.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://aws.amazon.com/certification/certified-developer-associate/",
    emoji: "☁️",
    featured: true,
    official: true,
  },
  {
    slug: "aws-certified-solutions-architect-associate",
    title: "AWS Certified Solutions Architect – Associate",
    provider: "Amazon Web Services",
    description: "Covers designing available, cost-efficient, fault-tolerant systems on AWS.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
    emoji: "🏗️",
    official: true,
  },
  {
    slug: "microsoft-azure-fundamentals",
    title: "Microsoft Certified: Azure Fundamentals (AZ-900)",
    provider: "Microsoft",
    description: "An entry-level look at cloud concepts and core Azure services, pricing and support.",
    difficulty: "beginner",
    price: "paid",
    url: "https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/",
    emoji: "🪟",
    featured: true,
    official: true,
  },
  {
    slug: "google-cloud-associate-cloud-engineer",
    title: "Google Cloud Associate Cloud Engineer",
    provider: "Google Cloud",
    description: "Deploying applications, monitoring operations and managing enterprise solutions on Google Cloud.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://cloud.google.com/certification/cloud-engineer",
    emoji: "🌩️",
    official: true,
  },
  {
    slug: "certified-kubernetes-administrator",
    title: "Certified Kubernetes Administrator (CKA)",
    provider: "The Linux Foundation / CNCF",
    description: "Demonstrates the skills, knowledge and competence to perform the responsibilities of a Kubernetes administrator.",
    difficulty: "advanced",
    price: "paid",
    url: "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
    emoji: "☸️",
    featured: true,
    official: true,
  },
  {
    slug: "hashicorp-terraform-associate",
    title: "HashiCorp Certified: Terraform Associate",
    provider: "HashiCorp",
    description: "Validates the skills needed to use open-source HashiCorp Terraform for infrastructure as code.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://www.hashicorp.com/certification/terraform-associate",
    emoji: "🧱",
    official: true,
  },
  {
    slug: "comptia-security-plus",
    title: "CompTIA Security+",
    provider: "CompTIA",
    description: "A vendor-neutral baseline certification covering core security functions and career skills.",
    difficulty: "beginner",
    price: "paid",
    url: "https://www.comptia.org/certifications/security",
    emoji: "🛡️",
    official: true,
  },
  {
    slug: "isc2-certified-in-cybersecurity",
    title: "(ISC)² Certified in Cybersecurity (CC)",
    provider: "ISC2",
    description: "An entry-level certification proving foundational cybersecurity knowledge and skills.",
    difficulty: "beginner",
    price: "free",
    url: "https://www.isc2.org/certifications/cc",
    emoji: "🔐",
    official: true,
  },
  {
    slug: "cisco-devnet-associate",
    title: "Cisco Certified DevNet Associate",
    provider: "Cisco",
    description: "Covers software development and design, APIs, Cisco platforms and automation.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://www.cisco.com/site/us/en/learn/training-certifications/certifications/devnet/devnet-associate/index.html",
    emoji: "🔀",
    official: true,
  },
  {
    slug: "github-foundations",
    title: "GitHub Foundations",
    provider: "GitHub",
    description: "Covers Git, GitHub, and best practices for collaboration - an entry point into the GitHub certification path.",
    difficulty: "beginner",
    price: "paid",
    url: "https://resources.github.com/learn/certifications/",
    emoji: "🐙",
    featured: true,
    official: true,
  },
];

export const COURSES: CourseItem[] = [
  {
    slug: "freecodecamp-responsive-web-design",
    title: "Responsive Web Design",
    provider: "freeCodeCamp",
    description: "HTML, CSS, Flexbox, CSS Grid and accessibility fundamentals, with a free certification on completion.",
    difficulty: "beginner",
    price: "free",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    emoji: "🎨",
    featured: true,
  },
  {
    slug: "freecodecamp-javascript-algorithms",
    title: "JavaScript Algorithms and Data Structures",
    provider: "freeCodeCamp",
    description: "Core JavaScript syntax, ES6, algorithmic thinking and data structures, free and self-paced.",
    difficulty: "intermediate",
    price: "free",
    url: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/",
    emoji: "🧮",
  },
  {
    slug: "meta-front-end-developer",
    title: "Meta Front-End Developer Professional Certificate",
    provider: "Coursera",
    description: "React, JavaScript and UI/UX fundamentals from Meta's own engineering curriculum.",
    difficulty: "intermediate",
    price: "paid",
    url: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
    emoji: "⚛️",
    featured: true,
  },
  {
    slug: "google-it-automation-python",
    title: "Google IT Automation with Python",
    provider: "Coursera",
    description: "Python scripting, Git/GitHub, automation and IT troubleshooting from Google's own team.",
    difficulty: "beginner",
    price: "paid",
    url: "https://www.coursera.org/professional-certificates/google-it-automation",
    emoji: "🐍",
  },
  {
    slug: "aws-cloud-practitioner-essentials",
    title: "AWS Cloud Practitioner Essentials",
    provider: "AWS Skill Builder",
    description: "A foundational overview of AWS Cloud concepts, services, security and pricing.",
    difficulty: "beginner",
    price: "free",
    url: "https://skillbuilder.aws/",
    emoji: "☁️",
  },
  {
    slug: "microsoft-learn-azure-administrator",
    title: "Career Path: Azure Administrator",
    provider: "Microsoft Learn",
    description: "A structured, free path of modules covering identity, storage, compute and networking on Azure.",
    difficulty: "intermediate",
    price: "free",
    url: "https://learn.microsoft.com/en-us/training/career-paths/az-administrator",
    emoji: "🪟",
  },
  {
    slug: "cs50-intro-computer-science",
    title: "CS50's Introduction to Computer Science",
    provider: "Harvard University (edX)",
    description: "Harvard's legendary introduction to computer science and programming - algorithms, data structures and more.",
    difficulty: "beginner",
    price: "free",
    url: "https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science",
    emoji: "🎓",
    featured: true,
  },
];

export const LEARNING_PATHS: LearningPathItem[] = [
  {
    slug: "microsoft-learn-azure-fundamentals-path",
    title: "Azure Fundamentals Learning Path",
    provider: "Microsoft Learn",
    description: "The official, free module sequence that prepares you for the AZ-900 certification.",
    difficulty: "beginner",
    price: "free",
    url: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/",
    emoji: "🪟",
    featured: true,
  },
  {
    slug: "google-cloud-skills-boost",
    title: "Google Cloud Skills Boost",
    provider: "Google Cloud",
    description: "Hands-on labs and structured quests across Google Cloud's core products and services.",
    difficulty: "intermediate",
    price: "free",
    url: "https://www.cloudskillsboost.google/",
    emoji: "🌩️",
  },
  {
    slug: "aws-skill-builder-cloud-architecting",
    title: "AWS Cloud Architecting Learning Plan",
    provider: "AWS Skill Builder",
    description: "A curated sequence of AWS Skill Builder courses building toward the Solutions Architect path.",
    difficulty: "intermediate",
    price: "free",
    url: "https://skillbuilder.aws/",
    emoji: "🏗️",
  },
  {
    slug: "mdn-learn-web-development",
    title: "Learn Web Development",
    provider: "MDN Web Docs",
    description: "Mozilla's structured, free curriculum covering HTML, CSS, JavaScript and modern web tooling.",
    difficulty: "beginner",
    price: "free",
    url: "https://developer.mozilla.org/en-US/docs/Learn",
    emoji: "🦊",
    featured: true,
  },
  {
    slug: "kubernetes-io-learning-paths",
    title: "Kubernetes Learning Paths",
    provider: "Kubernetes.io",
    description: "The official Kubernetes documentation's tutorials and concept guides, from basics to production operations.",
    difficulty: "advanced",
    price: "free",
    url: "https://kubernetes.io/docs/tutorials/",
    emoji: "☸️",
  },
];

export const DEVELOPER_TOOLS: DeveloperToolItem[] = [
  {
    slug: "visual-studio-code",
    title: "Visual Studio Code",
    provider: "Microsoft",
    description: "A free, extensible source-code editor with rich support for nearly every language and framework.",
    price: "free",
    url: "https://code.visualstudio.com/",
    emoji: "🧩",
    featured: true,
  },
  {
    slug: "git",
    title: "Git",
    provider: "Software Freedom Conservancy",
    description: "The distributed version control system almost every modern development workflow is built on.",
    price: "free",
    url: "https://git-scm.com/",
    emoji: "🌿",
  },
  {
    slug: "github-cli",
    title: "GitHub CLI",
    provider: "GitHub",
    description: "Bring GitHub's pull requests, issues and workflows to your terminal.",
    price: "free",
    url: "https://cli.github.com/",
    emoji: "🐙",
  },
  {
    slug: "docker-desktop",
    title: "Docker Desktop",
    provider: "Docker",
    description: "Build, share and run containerized applications and microservices locally.",
    price: "free",
    url: "https://www.docker.com/products/docker-desktop/",
    emoji: "🐳",
    featured: true,
  },
  {
    slug: "postman",
    title: "Postman",
    provider: "Postman, Inc.",
    description: "Design, test and document APIs - one of the most widely used API development tools.",
    price: "free",
    url: "https://www.postman.com/",
    emoji: "📮",
  },
  {
    slug: "figma",
    title: "Figma",
    provider: "Figma, Inc.",
    description: "Collaborative interface design tool used across the software industry for UI/UX work.",
    price: "free",
    url: "https://www.figma.com/",
    emoji: "🎨",
  },
  {
    slug: "dbeaver",
    title: "DBeaver",
    provider: "DBeaver Corp",
    description: "A free, universal database tool supporting virtually every major SQL and NoSQL database.",
    price: "free",
    url: "https://dbeaver.io/",
    emoji: "🗄️",
  },
  {
    slug: "warp-terminal",
    title: "Warp",
    provider: "Warp",
    description: "A modern, Rust-based terminal with AI command search and collaborative blocks.",
    price: "free",
    url: "https://www.warp.dev/",
    emoji: "⌨️",
  },
];

export const ROADMAPS: RoadmapItem[] = [
  {
    slug: "roadmap-frontend",
    title: "Frontend Developer",
    provider: "roadmap.sh",
    description: "Step-by-step guide covering HTML/CSS/JavaScript, frameworks, tooling and modern frontend practices.",
    difficulty: "beginner",
    estimatedTime: "3-6 months",
    url: "https://roadmap.sh/frontend",
    emoji: "🎯",
    featured: true,
    steps: ["HTML", "CSS", "JavaScript", "React", "Next.js"],
  },
  {
    slug: "roadmap-backend",
    title: "Backend Developer",
    provider: "roadmap.sh",
    description: "Languages, databases, APIs, caching, authentication and everything else backend engineers need.",
    difficulty: "intermediate",
    estimatedTime: "4-8 months",
    url: "https://roadmap.sh/backend",
    emoji: "🗄️",
    featured: true,
    steps: ["Language", "Databases", "APIs", "Auth", "Deployment"],
  },
  {
    slug: "roadmap-devops",
    title: "DevOps Engineer",
    provider: "roadmap.sh",
    description: "CI/CD, containers, orchestration, infrastructure as code, monitoring and cloud platforms.",
    difficulty: "advanced",
    estimatedTime: "6-12 months",
    url: "https://roadmap.sh/devops",
    emoji: "🔄",
    steps: ["Linux", "Docker", "CI/CD", "Kubernetes", "Monitoring"],
  },
  {
    slug: "roadmap-ai-engineer",
    title: "AI Engineer",
    provider: "roadmap.sh",
    description: "LLMs, embeddings, vector databases, prompt engineering and building production AI applications.",
    difficulty: "intermediate",
    estimatedTime: "4-8 months",
    url: "https://roadmap.sh/ai-engineer",
    emoji: "🤖",
    featured: true,
    steps: ["Python", "LLMs", "Prompting", "Vector DBs", "Production"],
  },
  {
    slug: "roadmap-cyber-security",
    title: "Cyber Security",
    provider: "roadmap.sh",
    description: "Networking fundamentals, threat modeling, offensive/defensive security and career specializations.",
    difficulty: "intermediate",
    estimatedTime: "6-12 months",
    url: "https://roadmap.sh/cyber-security",
    emoji: "🛡️",
    steps: ["Networking", "Linux", "Threats", "Tools", "Specialization"],
  },
  {
    slug: "roadmap-aws",
    title: "AWS",
    provider: "roadmap.sh",
    description: "A structured path through AWS's core services - compute, storage, networking and IAM.",
    difficulty: "intermediate",
    estimatedTime: "4-8 months",
    url: "https://roadmap.sh/aws",
    emoji: "☁️",
    steps: ["IAM", "EC2", "S3", "Lambda", "VPC"],
  },
];

export const CHEAT_SHEETS: CheatSheetItem[] = [
  {
    slug: "git-cheat-sheet",
    title: "Git Cheat Sheet",
    provider: "GitHub Education",
    description: "The official quick-reference PDF for everyday Git commands.",
    fileType: "PDF",
    url: "https://education.github.com/git-cheat-sheet-education.pdf",
    emoji: "🌿",
    featured: true,
  },
  {
    slug: "docker-cheat-sheet",
    title: "Docker Cheat Sheet",
    provider: "Docker Docs",
    description: "Official quick reference for the Docker CLI - images, containers, volumes and networks.",
    fileType: "PDF",
    url: "https://docs.docker.com/get-started/docker_cheatsheet.pdf",
    emoji: "🐳",
    featured: true,
  },
  {
    slug: "kubectl-cheat-sheet",
    title: "kubectl Cheat Sheet",
    provider: "Kubernetes.io",
    description: "The official Kubernetes documentation's command reference for kubectl.",
    fileType: "Web",
    url: "https://kubernetes.io/docs/reference/kubectl/cheatsheet/",
    emoji: "☸️",
  },
  {
    slug: "bash-cheat-sheet",
    title: "Bash / Linux Commands",
    provider: "devhints.io",
    description: "A concise reference for everyday Bash scripting and Linux shell commands.",
    fileType: "Web",
    url: "https://devhints.io/bash",
    emoji: "🖥️",
  },
  {
    slug: "regex-cheat-sheet",
    title: "Regular Expressions",
    provider: "devhints.io",
    description: "A compact reference for regex syntax - anchors, groups, lookaheads and common patterns.",
    fileType: "Web",
    url: "https://devhints.io/regexp",
    emoji: "🔎",
  },
  {
    slug: "python-cheat-sheet",
    title: "Python",
    provider: "devhints.io",
    description: "Core Python syntax, data structures and standard library quick reference.",
    fileType: "Web",
    url: "https://devhints.io/python",
    emoji: "🐍",
  },
  {
    slug: "postgresql-cheat-sheet",
    title: "PostgreSQL",
    provider: "PostgreSQL Tutorial",
    description: "A practical reference for everyday PostgreSQL commands and SQL syntax.",
    fileType: "Web",
    url: "https://www.postgresqltutorial.com/postgresql-cheat-sheet/",
    emoji: "🐘",
  },
];
