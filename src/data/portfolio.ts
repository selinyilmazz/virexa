/**
 * Personal portfolio content (`/portfolio` route). Plain, framework-free
 * typed data module - same convention as `article.ts`/`categories.ts`.
 * No CMS/Supabase table: this is personal, rarely-changing content owned
 * by one person, not something the admin panel needs to manage.
 *
 * `personalInfo`, `aboutText`, `languages`, `interests`, and `skills`
 * are real content, transcribed from the CV at
 * `public/documents/cv.pdf`. `personalInfo.title`/`.tagline` use the
 * CV's own identity line ("Computer Engineering Student | Aspiring
 * Software Developer") - a previous pass had these as "Software
 * Engineer" with an "AI-powered solutions" tagline, which the CV does
 * not support (no professional work experience, no web/AI framework in
 * Skills); corrected to match the CV's actual claims. `skills`'s every
 * category/item traces back to the "TECHNICAL SKILLS" section, nothing
 * added. The CV's "ADDITIONAL QUALIFICATION" (UAV Pilot License) is
 * deliberately not modeled - it doesn't reinforce the developer
 * narrative and was judged not to add value here.
 *
 * `experience` is intentionally empty: the CV has no Work Experience or
 * Internship Experience section at all (verified by reading the whole
 * document) - do not backfill this with placeholder/invented roles: an
 * empty state is more honest than a fabricated one. Fill it in only
 * once real experience content is provided.
 *
 * `projects` is real content, verified against each project's actual
 * files (README, docker-compose.yml, requirements.txt, source, model
 * architecture) and `git remote -v` for GitHub URLs - no invented tech,
 * feature, or metric. `market-price-comparison` has no `githubUrl`
 * because that local project was never pushed to a remote (verified: no
 * `.git` directory) - do not add one. VIT_ETL/EnergyZero ETL was
 * evaluated as a candidate and explicitly excluded per instruction; do
 * not re-add it here.
 *
 * `education` is real content, transcribed from the CV's "EDUCATION"
 * section only - no start date, degree title, GPA, or location is
 * invented for either record where the CV doesn't state one (verified
 * with `pdftotext -enc UTF-8` against the raw file). The CV's
 * "IT TRAINING" section (We'R HERE programme) is a course, not a
 * degree, and belongs in `certifications` instead - not included here.
 *
 * `certifications` is real content, transcribed from the CV's
 * "IT TRAINING" and "CERTIFICATIONS & TRAINING" sections - the We'R
 * HERE programme is included here (not in `education`) since it's a
 * completed training programme, not a degree. The 4 BTK Akademi / ICT
 * Authority entries are kept as individual records because the CV
 * states no per-item type/status beyond a name + date - do not label
 * them "Certificate" or invent a status for them. AI4ResilientYouth has
 * no `date` because the CV states none.
 */

export type PersonalInfo = {
  name: string;
  title: string;
  tagline: string;
  location: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  /** Public path under `public/`, e.g. "/documents/cv.pdf". */
  cvUrl: string;
};

export type SkillCategory = {
  category: string;
  items: string[];
};

export type ExperienceItem = {
  company: string;
  role: string;
  startDate: string;
  /** "Present" for an ongoing role. */
  endDate: string;
  location?: string;
  summary: string;
  responsibilities: string[];
  technologies: string[];
};

export type Project = {
  slug: string;
  name: string;
  description: string;
  problem?: string;
  solution?: string;
  /** Concrete, verified capabilities - not marketing claims. */
  features?: string[];
  techStack: string[];
  /** Omit entirely (don't render a link) when no repo/remote was verified. */
  githubUrl?: string;
  liveUrl?: string;
  /** Public path under `public/images/portfolio/projects/`. */
  image?: string;
};

export type EducationItem = {
  institution: string;
  /** CV's exact degree/program-type wording (e.g. "2-year degree"). Omit entirely when the CV doesn't state one - never infer "Bachelor's"/"Lisans" etc. */
  degree?: string;
  field: string;
  startDate?: string;
  endDate?: string;
  /** The CV's own status wording (e.g. "4th-year student", "Graduated") - not a normalized/invented term like "Present" or "Ongoing". */
  status?: string;
  location?: string;
  gpa?: string;
};

export type Certification = {
  name: string;
  issuer: string;
  /** CV's exact date wording. Omit entirely when the CV doesn't state one - never infer one. */
  date?: string;
  /** The CV's own status wording (e.g. "Completed", "Successfully completed"). */
  status?: string;
  /** Extra CV-sourced detail (curriculum, duration, supporting org) that doesn't fit the other fields. */
  description?: string;
  location?: string;
  url?: string;
};

export const personalInfo: PersonalInfo = {
  name: "Selin Yılmaz",
  // CV's own identity line, verbatim - not a claimed "Software Engineer"
  // title the CV doesn't support (no professional work/internship
  // experience, no framework/language beyond the Skills section).
  title: "Computer Engineering Student | Aspiring Software Developer",
  // Close paraphrase of the CV's "PROFESSIONAL PROFILE" closing sentence
  // - same claims, no added technology or achievement.
  tagline:
    "Motivated, fast-learning Computer Engineering student with a multidisciplinary background, committed to building a career in IT and software development.",
  location: "Netherlands",
  email: "sselinyilmazz01@gmail.com",
  githubUrl: "https://github.com/selinyilmazz",
  linkedinUrl: "https://www.linkedin.com/in/selin-yılmaz-589461209",
  cvUrl: "/documents/cv.pdf",
};

// Verbatim from the CV's "PROFESSIONAL PROFILE" paragraph.
export const aboutText =
  "4th-year Computer Engineering student at Kahramanmaraş Sütçü İmam University, and graduate of a 2-year Child Development program. Completed IT training in the Netherlands covering Python, SQL databases, networking and Microsoft Azure fundamentals. A motivated, fast-learning entry-level IT candidate with a multidisciplinary educational background, adaptable to multicultural and international environments and committed to building a career in IT and software development.";

export type Language = {
  name: string;
  /** CV's own proficiency wording (e.g. "Native", "A2+") - not a normalized/invented scale. */
  level: string;
};

// Transcribed as-is from the CV's "LANGUAGES" section.
export const languages: Language[] = [
  { name: "Turkish", level: "Native" },
  { name: "Dutch", level: "A2+" },
  { name: "English", level: "A2" },
];

// Transcribed as-is from the CV's "INTERESTS" section - used sparingly
// (a single small line in About), not as a full section, per instruction
// to only include it where it genuinely adds value.
export const interests: string[] = [
  "Travel & Cultural Exploration",
  "AI & Emerging Technology",
  "Digital Design",
  "Swimming & Sports",
  "Equestrian Activities",
];

// Transcribed as-is from the CV's "TECHNICAL SKILLS" list - grouped
// into categories for presentation, no item renamed or added.
export const skills: SkillCategory[] = [
  {
    category: "Programming Languages",
    items: ["Python"],
  },
  {
    category: "Databases",
    items: ["SQL / SQL Databases", "Database Fundamentals"],
  },
  {
    category: "Cloud & Networking",
    items: ["Microsoft Azure Fundamentals", "Networking Fundamentals"],
  },
  {
    category: "Software Development",
    items: ["Basic Software Development", "Capstone Project Experience"],
  },
  {
    category: "Project Management",
    items: ["Project Management Fundamentals"],
  },
];

// Intentionally empty - see the module doc comment above. The CV has no
// Work Experience or Internship Experience section; do not add
// placeholder roles here.
export const experience: ExperienceItem[] = [];

export const projects: Project[] = [
  {
    slug: "market-price-comparison",
    name: "Market Price Comparison",
    description:
      "A full-stack web application for comparing grocery prices across multiple markets and finding the cheapest basket.",
    problem:
      "Comparing prices for the same products across different markets is slow and manual, making it hard to actually find savings.",
    solution:
      "A FastAPI backend exposes market, product, and price data through a REST API, with a dedicated basket-comparison endpoint that calculates the cheapest market for a selected list of products; a React + Tailwind CSS frontend consumes it.",
    features: [
      "Market, product, and price management endpoints",
      "Basket comparison endpoint that finds the cheapest market for a selected product list",
      "Swagger / ReDoc API documentation",
      "Seed script covering 5 markets × 15 products × 75 prices",
    ],
    techStack: [
      "FastAPI",
      "SQLAlchemy",
      "PostgreSQL",
      "Uvicorn",
      "React",
      "Vite",
      "Tailwind CSS",
      "Axios",
      "Docker",
      "Docker Compose",
    ],
    // No `githubUrl` - this project was never pushed to a remote (verified: no `.git` directory).
  },
  {
    slug: "lichfield-heart-disease-prediction",
    name: "Lichfield Heart Disease Dataset",
    description:
      "A deep learning model that predicts an individual's heart disease risk from health data, trained on the Lichfield Heart Disease Dataset.",
    problem:
      "Heart disease is one of the leading causes of death worldwide; identifying at-risk individuals early from their health metrics requires a trained predictive model, not manual inspection.",
    solution:
      "A Keras/TensorFlow Sequential neural network (128→64→32→16→1 Dense layers, ReLU activations, sigmoid output) trained with the Adam optimizer and binary cross-entropy loss, evaluated with scikit-learn's classification report.",
    features: [
      "Dedicated data preprocessing pipeline",
      "Sequential Dense neural network with 4 hidden layers",
      "Model evaluation via scikit-learn's classification_report",
      "Separate Jupyter notebooks for data processing and model training",
      "Trained model artifact saved and versioned (heart_model.h5)",
    ],
    techStack: ["Python", "Pandas", "NumPy", "Scikit-learn", "TensorFlow / Keras", "Matplotlib", "Seaborn"],
    githubUrl: "https://github.com/selinyilmazz/heart-disease-prediction",
  },
  {
    slug: "virexa-ai-news",
    name: "Virexa / AI News",
    description:
      "A Next.js 16 AI-powered news aggregation and newsletter platform covering technology, business, AI, games, and world news.",
    problem:
      "Keeping up with technology and AI news means checking dozens of scattered sources every day, with no consistent categorization or reading experience.",
    solution:
      "A full-stack platform (Next.js App Router + Supabase) that aggregates live RSS feeds, runs them through a cron-triggered AI enrichment pipeline, and organizes them by category with search, bookmarks, reading history, and a newsletter.",
    features: [
      "Supabase authentication (sign in/up, OAuth) with protected routes",
      "Full admin panel (articles, sources, users, newsletter, analytics, runtime)",
      "Live RSS-based news aggregation from 5 active sources",
      "Cron-triggered AI enrichment pipeline",
      "Newsletter with Resend welcome email + unsubscribe flow",
      "Search, multi-language (i18n) support, and a dark/light theme system",
    ],
    techStack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS v4", "Supabase", "Resend"],
    githubUrl: "https://github.com/selinyilmazz/virexa",
  },
];

export const education: EducationItem[] = [
  {
    institution: "Kahramanmaraş Sütçü İmam University",
    field: "Computer Engineering — Faculty of Engineering and Architecture",
    status: "4th-year student",
    location: "Turkey",
    // No `degree` (CV states no degree title - "4th-year student" is a
    // status, not a degree) and no `startDate`/`endDate` (CV states neither).
  },
  {
    institution: "Istanbul University – AUZEF (Open and Distance Education Faculty)",
    degree: "2-year degree",
    field: "Child Development",
    endDate: "December 2022",
    status: "Graduated",
    gpa: "3.41 / 4.00",
    // No `startDate` - the CV states only the graduation date.
  },
];

export const certifications: Certification[] = [
  {
    name: "Voorbereiding IT Programme",
    issuer: "We'R HERE",
    date: "26 July 2025",
    status: "Completed",
    location: "Netherlands",
    description: "Curriculum: Python, SQL Databases, Networking, Azure Fundamentals, Capstone Project",
  },
  {
    name: "Project Management Fundamentals",
    issuer: "BTK Akademi / ICT Authority",
    date: "Nov 2023",
  },
  {
    name: "Communication & Network Management",
    issuer: "BTK Akademi / ICT Authority",
    date: "Mar 2024",
  },
  {
    name: "Team Building and Management",
    issuer: "BTK Akademi / ICT Authority",
    date: "Mar 2024",
  },
  {
    name: "Public Speaking & Effective Presentation",
    issuer: "BTK Akademi / ICT Authority",
    date: "Mar 2024",
  },
  {
    name: "AI4ResilientYouth Program",
    issuer: "Kodluyoruz",
    status: "Successfully completed",
    description: "51-hour programme supported by Australian Aid / Australian Embassy in Ankara, delivered by Kodluyoruz.",
    // No `date` - the CV states none for this entry.
  },
];
