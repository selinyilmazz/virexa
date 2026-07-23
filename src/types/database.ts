/**
 * Row/Insert/Update types for every table in the production schema (see
 * `supabase/migrations/0001_production_schema.sql` and
 * `supabase/migrations/0002_article_storage.sql`), plus the `Database`
 * type used to parameterize the Supabase client (`SupabaseClient<Database>`)
 * so every `.from("table")` call is fully typed end to end.
 *
 * These are hand-written to match the SQL migrations. Once the project is
 * linked to a real Supabase instance, they can be regenerated from the
 * live schema with the Supabase CLI (`supabase gen types typescript`) and
 * this file replaced wholesale - until then, this is the source of truth
 * and must be kept in sync with the migrations by hand.
 */

export type SummaryLength = "short" | "medium" | "long";

export type NotificationSettings = {
  email: boolean;
  push: boolean;
  weeklyDigest: boolean;
  /** Notification category preferences (Settings redesign) - persisted for real, same "saved preference, delivery infra to follow" convention `emailPreferences` already established below. */
  breakingNews: boolean;
  developerReleases: boolean;
  securityAlerts: boolean;
  dailyDigest: boolean;
  /** Navigation/Profile/Settings UX update - see migration 0017. */
  bookmarkReminders: boolean;
  developerHubUpdates: boolean;
};

export type EmailPreferenceSettings = {
  productUpdates: boolean;
  accountActivity: boolean;
};

/**
 * Real Privacy category preferences (Navigation/Profile/Settings UX
 * update - see migration 0017's doc comment for why this replaces the
 * `privacy` column's original, never-wired-up placeholder shape).
 */
export type PrivacySettings = {
  profileVisibility: "public" | "private";
  analyticsConsent: boolean;
  personalizedRecommendations: boolean;
  trackSearchHistory: boolean;
  trackReadingHistory: boolean;
};

export type ProfileRow = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  country: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = Partial<Omit<ProfileRow, "id">> & { id: string };

export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;

/** Additive, forward-compatible - `tutorial`/`resource` have no producer yet (same convention as `ArticleContentBlock`'s image/table/code variants). See migration 0015. */
export type BookmarkItemType = "article" | "release" | "repository" | "tutorial" | "resource";

export type BookmarkRow = {
  id: string;
  user_id: string;
  article_slug: string;
  article_title: string;
  article_description: string;
  article_image: string;
  article_category: string;
  article_source: string;
  article_published_date: string;
  /** Defaults to `"article"` - every row created before migration 0015 is implicitly an article. */
  item_type: BookmarkItemType;
  /** Free-form extras for non-article types (a release's version, a repository's stars/language/url). Empty object for articles. */
  item_meta: Record<string, string>;
  created_at: string;
};

export type BookmarkInsert = Partial<Omit<BookmarkRow, "id" | "created_at">> & {
  user_id: string;
  article_slug: string;
};

export type BookmarkUpdate = Partial<Omit<BookmarkRow, "id" | "user_id" | "created_at">>;

export type ReadingHistoryRow = {
  id: string;
  user_id: string;
  article_id: string;
  article_slug: string;
  article_title: string;
  article_image: string;
  article_category: string;
  article_source: string;
  /** Denormalized display string (e.g. "5 min read") - see migration 0017. */
  article_reading_time: string;
  read_at: string;
};

export type ReadingHistoryInsert = Partial<Omit<ReadingHistoryRow, "id">> & {
  user_id: string;
  article_id: string;
};

export type ReadingHistoryUpdate = Partial<Omit<ReadingHistoryRow, "id" | "user_id" | "article_id">>;

export type ThemePreference = "light" | "dark" | "system";
export type ReadingWidthPreference = "comfortable" | "compact";

export type UserSettingsRow = {
  id: string;
  language: string;
  summary_length: SummaryLength;
  preferred_categories: string[];
  notifications: NotificationSettings;
  email_preferences: EmailPreferenceSettings;
  privacy: PrivacySettings;
  open_links_in_new_tab: boolean;
  /** Saved preference only - see migration 0015's column comment (no dark theme implemented app-wide yet). */
  theme: ThemePreference;
  reading_width: ReadingWidthPreference;
  reading_progress_bar: boolean;
  remember_scroll_position: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type UserSettingsInsert = Partial<Omit<UserSettingsRow, "id">> & { id: string };

export type UserSettingsUpdate = Partial<Omit<UserSettingsRow, "id" | "created_at" | "updated_at">>;

// ============================================================================
// Article Storage layer (supabase/migrations/0002_article_storage.sql)
// ============================================================================

export type ArticleSourceRow = {
  id: string;
  name: string;
  domain: string;
  logo: string | null;
  official: boolean;
  country: string;
  trust_score: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleSourceInsert = Partial<Omit<ArticleSourceRow, "id" | "created_at" | "updated_at">> & { id: string };

export type ArticleSourceUpdate = Partial<Omit<ArticleSourceRow, "id" | "created_at" | "updated_at">>;

export type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  /** Discussion/comments page URL, distinct from `url` - only ever set by HackerNewsProvider (see 0010_discussion_url_and_image_source.sql). Null for every other provider. */
  discussion_url: string | null;
  image_url: string;
  /** Which stage of the image pipeline supplied `image_url` - observability only, see lib/news/stock-image-provider.ts. */
  image_source: string | null;
  published_at: string;
  language: string;
  country: string;
  category: string;
  author: string | null;
  tags: string[];
  reading_time: number;
  trust_score: number;
  trending_score: number;
  source_id: string;
  /** Short standalone dek (Admin Panel: Articles CMS - 0021_articles_admin_fields.sql), distinct from `description`. */
  subtitle: string;
  /** Manual editorial override (Admin Panel: Articles CMS) - additive alongside the algorithmic `trending_score`, does not replace it. */
  featured: boolean;
  /** Publish/unpublish status (Admin Panel: Articles CMS). `false` hides the article from its own detail page; listing/search pages do not yet filter on this - see `getReleaseDetail`-style doc comment on the article detail page for the disclosed scope boundary. */
  visible: boolean;
  created_at: string;
  updated_at: string;
};

export type ArticleInsert = Partial<Omit<ArticleRow, "id" | "created_at" | "updated_at">> & {
  id: string;
  slug: string;
  title: string;
  url: string;
  published_at: string;
  category: string;
  source_id: string;
};

export type ArticleUpdate = Partial<Omit<ArticleRow, "id" | "created_at" | "updated_at">>;

/** Stored shape of `article_ai.tldr` (jsonb) - a slimmed-down `TLDRResult` (see `types/ai.ts`), without the redundant `generatedAt`/`provider`/`version` fields already held by this row's own columns. */
export type StoredTldr = { title: string; bullets: string[] };

/** Stored shape of `article_ai.sentiment` (jsonb) - a slimmed-down `SentimentResult`. */
export type StoredSentiment = { label: string; confidence: number };

/** Stored shape of `article_ai.bias` (jsonb) - a slimmed-down `BiasResult`. */
export type StoredBias = { level: string; confidence: number };

/**
 * Stored shape of `article_ai.long_summary` (jsonb) - a slimmed-down
 * `LongSummaryResult` (product polishing phase, 3rd pass: the article
 * detail page's structured "Overview / Key Points / Technical Details /
 * Why It Matters" fallback for thin-content articles).
 */
export type StoredLongSummary = { overview: string; keyPoints: string[]; technicalDetails: string; whyItMatters: string };

/**
 * Stored shape of `article_ai.rewritten_article` (jsonb) - a slimmed-down
 * `ArticleRewriteResult` (product polishing phase, 4th pass, items 6-7:
 * the full 700-1500 word structured rewrite that's now the article
 * detail page's PRIMARY reading content, not just a thin-content
 * fallback like `long_summary`).
 */
export type StoredArticleRewrite = {
  intro: string;
  mainContent: string;
  background: string;
  whyItMatters: string;
  technicalDetails: string | null;
  keyHighlights: string[];
  conclusion: string;
  wordCount: number;
};

/** Stored shape of `article_ai.entities` (jsonb) - a slimmed-down `ArticleEntitiesResult` (product polishing phase, 4th pass, item 8). */
export type StoredEntities = { companies: string[]; technologies: string[]; people: string[] };

/** Stored shape of `article_ai.key_takeaways` (jsonb) - a slimmed-down `KeyTakeawaysResult` (product polishing phase, 5th pass - the broad-tier "every article" counterpart to `rewritten_article`'s narrow trending-only tier). */
export type StoredKeyTakeaways = { points: string[] };

export type ArticleAIRow = {
  id: string;
  article_id: string;
  summary: string | null;
  tldr: StoredTldr | null;
  long_summary: StoredLongSummary | null;
  rewritten_article: StoredArticleRewrite | null;
  entities: StoredEntities | null;
  key_takeaways: StoredKeyTakeaways | null;
  tags: string[];
  sentiment: StoredSentiment | null;
  bias: StoredBias | null;
  provider: string;
  model: string;
  prompt_version: string;
  generated_at: string;
  cache_key: string;
  created_at: string;
};

export type ArticleAIInsert = Partial<Omit<ArticleAIRow, "id" | "created_at">> & {
  article_id: string;
  provider: string;
  cache_key: string;
};

export type ArticleAIUpdate = Partial<Omit<ArticleAIRow, "id" | "article_id" | "created_at">>;

export type ArticleMetricsRow = {
  article_id: string;
  view_count: number;
  bookmark_count: number;
  share_count: number;
  click_count: number;
  reading_time_avg: number;
  updated_at: string;
};

export type ArticleMetricsInsert = Partial<Omit<ArticleMetricsRow, "article_id" | "updated_at">> & {
  article_id: string;
};

export type ArticleMetricsUpdate = Partial<Omit<ArticleMetricsRow, "article_id" | "updated_at">>;

// ============================================================================
// Admin operations layer (supabase/migrations/0003_admin_audit_log.sql)
// ============================================================================

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AuditLogInsert = Partial<Omit<AuditLogRow, "id" | "created_at">> & {
  action: string;
};

// ============================================================================
// Runtime job run history (supabase/migrations/0006_runtime_job_runs.sql)
// ============================================================================

export type RuntimeJobRunStatus = "completed" | "failed" | "cancelled";

export type RuntimeJobRunRow = {
  id: string;
  job_type: string;
  status: RuntimeJobRunStatus;
  started_at: string | null;
  finished_at: string;
  duration_ms: number | null;
  attempts: number;
  error: string | null;
  created_at: string;
};

export type RuntimeJobRunInsert = Partial<Omit<RuntimeJobRunRow, "id" | "created_at">> & {
  job_type: string;
  status: RuntimeJobRunStatus;
  finished_at: string;
};

// ============================================================================
// Repositories (supabase/migrations/0018_repositories.sql)
// ============================================================================

/** Fixed category taxonomy for the GitHub Explorer "Featured Collections" quick-filter cards - see `supabase/migrations/0024_repositories_editorial_and_collections.sql`'s CHECK constraint (the single source of truth this type must stay in sync with). */
export type RepositoryCategory =
  | "ai-agents"
  | "developer-productivity"
  | "system-design"
  | "frontend"
  | "backend"
  | "devops"
  | "cyber-security"
  | "mobile-development"
  | "learning-resources";

export type RepositoryDifficulty = "beginner" | "intermediate" | "advanced";

export type RepositoryRow = {
  id: string;
  owner: string;
  repo_name: string;
  description: string;
  language: string | null;
  license: string | null;
  stars: number;
  forks: number;
  github_url: string;
  topics: string[];
  repo_created_at: string | null;
  featured: boolean;
  trending: boolean;
  visible: boolean;
  auto_sync: boolean;
  last_synced_at: string | null;
  /** Real GitHub `subscribers_count` (the modern "Watch" count, distinct from the legacy `watchers_count` which just mirrors stars) - see `supabase/migrations/0023_repositories_extended.sql`. */
  watchers: number;
  /** Real tag name from GitHub's `/releases/latest` endpoint, e.g. "v14.2.3". `null` when the repo has no GitHub Releases. */
  latest_release_tag: string | null;
  latest_release_published_at: string | null;
  /** Admin-only "soft remove from active management" flag, distinct from `visible` - see migration doc comment. */
  archived: boolean;
  // --- Editorial fields added by 0024 (GitHub Explorer "Developer
  // Knowledge Library" redesign) - see that migration's doc comments for
  // why each one is distinct from a similarly-named existing column.
  category: RepositoryCategory | null;
  editor_pick: boolean;
  hidden_gem: boolean;
  verified: boolean;
  maintained: boolean;
  difficulty: RepositoryDifficulty | null;
  recommendation_score: number;
  health_score: number;
  editor_notes: string;
  tags: string[];
  display_order: number;
  /** Admin-authored visual cover for the curated library card/detail hero. */
  cover_image_url: string | null;
  /** Editor-authored guidance for the detail page's "Who should use it?" section. */
  audience: string;
  created_at: string;
  updated_at: string;
};

export type RepositoryInsert = Partial<Omit<RepositoryRow, "id" | "created_at" | "updated_at">> & {
  id: string;
  owner: string;
  repo_name: string;
  github_url: string;
};

export type RepositoryUpdate = Partial<Omit<RepositoryRow, "id" | "created_at" | "updated_at">>;

// ============================================================================
// Collections (supabase/migrations/0024_repositories_editorial_and_collections.sql)
// ============================================================================

export type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  display_order: number;
  visible: boolean;
  /** Optional admin-provided visual cover for the public collection page. */
  cover_image_url: string | null;
  difficulty: RepositoryDifficulty | null;
  estimated_learning_time: string;
  created_at: string;
  updated_at: string;
};

export type CollectionInsert = Partial<Omit<CollectionRow, "id" | "created_at" | "updated_at">> & {
  slug: string;
  name: string;
};

export type CollectionUpdate = Partial<Omit<CollectionRow, "id" | "created_at" | "updated_at">>;

export type CollectionRepositoryRow = {
  collection_id: string;
  repository_id: string;
  display_order: number;
  added_at: string;
};

export type CollectionRepositoryInsert = Partial<Omit<CollectionRepositoryRow, "added_at">> & {
  collection_id: string;
  repository_id: string;
};

// ============================================================================
// Developer Releases (supabase/migrations/0019_developer_releases.sql)
// ============================================================================

export type DeveloperReleaseChannel = "stable" | "beta" | "lts" | "rc";

export type DeveloperReleaseRow = {
  id: string;
  slug: string;
  product: string;
  version: string;
  release_date: string;
  channel: DeveloperReleaseChannel;
  release_notes: string;
  maintainer: string;
  license: string;
  platform: string;
  website_url: string | null;
  docs_url: string | null;
  github_url: string | null;
  download_url: string | null;
  featured: boolean;
  trending: boolean;
  visible: boolean;
  created_at: string;
  updated_at: string;
};

export type DeveloperReleaseInsert = Partial<Omit<DeveloperReleaseRow, "id" | "created_at" | "updated_at">> & {
  slug: string;
  product: string;
  version: string;
  release_date: string;
};

export type DeveloperReleaseUpdate = Partial<Omit<DeveloperReleaseRow, "id" | "created_at" | "updated_at">>;

// ============================================================================
// Site Settings (supabase/migrations/0020_site_settings.sql)
// ============================================================================

export type SiteSettingsRow = {
  id: number;
  site_name: string;
  logo_url: string | null;
  primary_color: string;
  homepage_featured_count: number;
  articles_per_page: number;
  enable_registrations: boolean;
  maintenance_mode: boolean;
  default_language: string;
  default_timezone: string;
  updated_at: string;
  updated_by: string | null;
};

export type SiteSettingsUpdate = Partial<Omit<SiteSettingsRow, "id" | "updated_at">>;

// ============================================================================
// Developer Hub Catalog Items (supabase/migrations/0022_catalog_items.sql)
// ============================================================================

export type CatalogResourceTypeDb =
  | "certification"
  | "course"
  | "learning-path"
  | "developer-tool"
  | "roadmap"
  | "cheat-sheet";

export type CatalogDifficulty = "beginner" | "intermediate" | "advanced";
export type CatalogPrice = "free" | "paid";

export type CatalogItemRow = {
  id: string;
  resource_type: CatalogResourceTypeDb;
  slug: string;
  title: string;
  provider: string;
  description: string;
  difficulty: CatalogDifficulty | null;
  price: CatalogPrice | null;
  url: string;
  emoji: string;
  featured: boolean;
  official: boolean;
  steps: string[];
  estimated_time: string | null;
  file_type: string | null;
  visible: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CatalogItemInsert = Partial<Omit<CatalogItemRow, "id" | "created_at" | "updated_at">> & {
  id: string;
  resource_type: CatalogResourceTypeDb;
  slug: string;
  title: string;
  provider: string;
  url: string;
};

export type CatalogItemUpdate = Partial<Omit<CatalogItemRow, "id" | "created_at" | "updated_at">>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      bookmarks: {
        Row: BookmarkRow;
        Insert: BookmarkInsert;
        Update: BookmarkUpdate;
      };
      reading_history: {
        Row: ReadingHistoryRow;
        Insert: ReadingHistoryInsert;
        Update: ReadingHistoryUpdate;
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: UserSettingsInsert;
        Update: UserSettingsUpdate;
      };
      article_sources: {
        Row: ArticleSourceRow;
        Insert: ArticleSourceInsert;
        Update: ArticleSourceUpdate;
      };
      articles: {
        Row: ArticleRow;
        Insert: ArticleInsert;
        Update: ArticleUpdate;
      };
      article_ai: {
        Row: ArticleAIRow;
        Insert: ArticleAIInsert;
        Update: ArticleAIUpdate;
      };
      article_metrics: {
        Row: ArticleMetricsRow;
        Insert: ArticleMetricsInsert;
        Update: ArticleMetricsUpdate;
      };
      admin_audit_log: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: never;
      };
      runtime_job_runs: {
        Row: RuntimeJobRunRow;
        Insert: RuntimeJobRunInsert;
        Update: never;
      };
      repositories: {
        Row: RepositoryRow;
        Insert: RepositoryInsert;
        Update: RepositoryUpdate;
      };
      developer_releases: {
        Row: DeveloperReleaseRow;
        Insert: DeveloperReleaseInsert;
        Update: DeveloperReleaseUpdate;
      };
      site_settings: {
        Row: SiteSettingsRow;
        Insert: never;
        Update: SiteSettingsUpdate;
      };
      catalog_items: {
        Row: CatalogItemRow;
        Insert: CatalogItemInsert;
        Update: CatalogItemUpdate;
      };
      collections: {
        Row: CollectionRow;
        Insert: CollectionInsert;
        Update: CollectionUpdate;
      };
      collection_repositories: {
        Row: CollectionRepositoryRow;
        Insert: CollectionRepositoryInsert;
        Update: never;
      };
    };
  };
};
