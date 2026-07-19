-- Product polishing phase, 4th pass, items 6-8: the full AI
-- article-rewrite capability (a 700-1500 word structured rewrite that
-- becomes the article detail page's PRIMARY reading content, replacing
-- the raw RSS description as anything shown directly to a reader) and
-- named-entity extraction (companies/technologies/people actually
-- mentioned, for the expanded AI Insights card). Additive-only - two new
-- nullable jsonb columns, same precedent as `long_summary` in
-- 0012_long_summary.sql, no other schema changes.
alter table article_ai
  add column if not exists rewritten_article jsonb,
  add column if not exists entities jsonb;

comment on column article_ai.rewritten_article is
  'Full structured article rewrite: {intro, mainContent, background, whyItMatters, technicalDetails, keyHighlights[], conclusion, wordCount}. Grounded strictly in the article''s extracted content - see lib/ai/prompts/article-rewrite.prompt.ts and runtime/pipeline/steps/ai-steps.ts''s articleRewriteStep. This is the article detail page''s primary reading content, not a thin-content-only fallback like long_summary.';

comment on column article_ai.entities is
  'Named entities actually mentioned in the article: {companies[], technologies[], people[]}. See lib/ai/prompts/entities.prompt.ts and runtime/pipeline/steps/ai-steps.ts''s entitiesStep.';
