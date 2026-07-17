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
};

export type EmailPreferenceSettings = {
  productUpdates: boolean;
  marketingEmails: boolean;
  accountActivity: boolean;
};

export type PrivacySettings = {
  publicProfile: boolean;
  showReadingActivity: boolean;
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
  created_at: string;
};

export type BookmarkInsert = Partial<Omit<BookmarkRow, "id" | "created_at">> & {
  user_id: string;
  article_slug: string;
};

export type BookmarkUpdate = Partial<Omit<BookmarkRow, "id" | "user_id" | "created_at">>;

export type UserSettingsRow = {
  id: string;
  dark_mode: boolean;
  language: string;
  summary_length: SummaryLength;
  preferred_categories: string[];
  notifications: NotificationSettings;
  email_preferences: EmailPreferenceSettings;
  privacy: PrivacySettings;
  auto_play_videos: boolean;
  compact_view: boolean;
  open_links_in_new_tab: boolean;
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
  image_url: string;
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

export type ArticleAIRow = {
  id: string;
  article_id: string;
  summary: string | null;
  tldr: StoredTldr | null;
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
    };
  };
};
