-- Product polishing phase, 3rd pass: article detail page's structured
-- "Overview / Key Points / Technical Details / Why It Matters" fallback
-- for articles whose real content is too thin to read. Additive-only -
-- a new nullable jsonb column, same shape/precedent as the existing
-- `tldr` column (see 0002_article_storage.sql), no other schema changes.
alter table article_ai
  add column if not exists long_summary jsonb;

comment on column article_ai.long_summary is
  'Structured long-form fallback summary: {overview, keyPoints[], technicalDetails, whyItMatters}. Generated only for articles whose raw content is below the thin-content threshold - see lib/news/article-content.ts and runtime/pipeline/steps/ai-steps.ts''s longSummaryStep.';
