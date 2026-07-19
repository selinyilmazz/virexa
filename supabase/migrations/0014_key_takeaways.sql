-- Product polishing phase, 5th pass, reliability & content-depth
-- upgrade: "en azından her haber için AI Summary + Key Takeaways
-- üret." Wires the long-existing-but-never-wired `getKeyTakeaways`
-- capability (see services/ai/ai-service.ts) into the pipeline as a
-- broad-tier enrichment - every article a run touches gets this, not
-- just the top-20-per-run "trending" tier `rewritten_article` is
-- limited to. Additive-only - one new nullable jsonb column, same
-- precedent as `long_summary`/`rewritten_article`/`entities`.
alter table article_ai
  add column if not exists key_takeaways jsonb;

comment on column article_ai.key_takeaways is
  'Standalone key-takeaways bullet list: {points: string[]}. Generated for every article a pipeline run touches (broad tier), independent of whether that article also got a full rewritten_article (narrow, trending-only tier) - see runtime/pipeline/steps/ai-steps.ts''s keyTakeawaysStep.';
