-- Developer Hub / GitHub Explorer expansion - real-world resources pass.
--
-- Part 1: adds the 10 requested official AI learning platforms to the
-- Courses catalog (`catalog_items`, resource_type = 'course') - every URL
-- below was verified against the provider's own official domain, never
-- guessed. None of these 10 platforms existed in the catalog before this
-- migration (checked against every `catalog_items` insert, which all live
-- in 0022 - this table has had no other seed migration since).
--
-- Part 2: reviews the 10 requested repositories against the `repositories`
-- library. One (awesome-llm-apps) was already added in migration 0027 and
-- is left completely untouched here, per instruction. Of the remaining 9,
-- 7 were confirmed as real, existing GitHub repositories (fetched and
-- verified directly against github.com - not trusted from third-party
-- blog/aggregator star counts, two of which turned out to be significantly
-- inflated versus the real GitHub page). The other 2 ("Reserend AI",
-- "MCPCommander") could not be matched to any real repository under that
-- name after a genuine search, so - consistent with this project's "real
-- data only, never fabricated" rule - they are NOT included here rather
-- than invented.
--
-- Idempotent: every insert is ON CONFLICT DO NOTHING against a stable,
-- real id (repo `owner/repo` or `course:slug`), so re-running this is a
-- safe no-op.

-- ============================================================
-- Part 1: 10 official AI learning platforms (Courses)
-- ============================================================

insert into public.catalog_items (id, resource_type, slug, title, provider, description, difficulty, price, url, emoji, featured, official, display_order)
values
  ('course:anthropic-skilljar', 'course', 'anthropic-skilljar', 'Anthropic Courses', 'Anthropic', 'Official courses on building with Claude - the API, Claude Code, and Model Context Protocol servers, taught directly by Anthropic.', 'beginner', 'free', 'https://anthropic.skilljar.com/', '🤖', true, false, 10),
  ('course:google-ai-learning', 'course', 'google-ai-learning', 'Google AI: Learn AI Skills', 'Google AI', 'Google''s own hub for AI literacy and skills - foundational AI concepts, hands-on tools, and structured learning paths.', 'beginner', 'free', 'https://ai.google/learn-ai-skills/', '🔷', false, false, 11),
  ('course:meta-ai-resources', 'course', 'meta-ai-resources', 'Meta AI: Resources for Developers', 'Meta AI', 'Meta''s own hub for AI models, research, libraries and developer resources across its open-source AI ecosystem.', 'intermediate', 'free', 'https://ai.meta.com/resources/', '📘', false, false, 12),
  ('course:nvidia-deep-learning-institute', 'course', 'nvidia-deep-learning-institute', 'NVIDIA Deep Learning Institute', 'NVIDIA', 'Official NVIDIA training in CUDA, accelerated computing, and deep learning - hands-on labs on real GPU-accelerated cloud instances.', 'intermediate', 'paid', 'https://www.nvidia.com/en-us/training/', '🟩', false, false, 13),
  ('course:microsoft-learn-platform', 'course', 'microsoft-learn-platform', 'Microsoft Learn', 'Microsoft', 'Microsoft''s free, official learning platform - structured, hands-on modules across Azure, AI, Power Platform, and more.', 'beginner', 'free', 'https://learn.microsoft.com/', '🪟', true, false, 14),
  ('course:openai-academy', 'course', 'openai-academy', 'OpenAI Academy', 'OpenAI', 'OpenAI''s own hub for practical ChatGPT and AI guides - prompting, workflow automation, and applying AI at work.', 'beginner', 'free', 'https://academy.openai.com/', '🟢', false, false, 15),
  ('course:ibm-skillsbuild', 'course', 'ibm-skillsbuild', 'IBM SkillsBuild', 'IBM', 'IBM''s free global education program - over 1,000 courses spanning AI, cloud, cybersecurity, and data analytics with shareable credentials.', 'beginner', 'free', 'https://skillsbuild.org/', '🔵', false, false, 16),
  ('course:aws-skill-builder-platform', 'course', 'aws-skill-builder-platform', 'AWS Skill Builder', 'AWS Skill Builder', 'AWS''s own learning center - hundreds of free digital courses, hands-on labs, and certification exam prep built by AWS experts.', 'beginner', 'free', 'https://skillbuilder.aws/', '☁️', false, false, 17),
  ('course:deeplearning-ai', 'course', 'deeplearning-ai', 'DeepLearning.AI', 'DeepLearning.AI', 'Andrew Ng''s AI education platform - foundational and cutting-edge short courses on machine learning, deep learning, and generative AI.', 'intermediate', 'free', 'https://www.deeplearning.ai/', '🧠', true, false, 18),
  ('course:hugging-face-learn', 'course', 'hugging-face-learn', 'Hugging Face Learn', 'Hugging Face', 'Free, official courses from Hugging Face covering NLP, deep reinforcement learning, diffusion models, and the open-source ML ecosystem.', 'intermediate', 'free', 'https://huggingface.co/learn', '🤗', true, false, 19)
on conflict (id) do nothing;

-- ============================================================
-- Part 2: 7 verified-real repositories from the requested list
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('Graphify-Labs/graphify', 'Graphify-Labs', 'graphify', 'https://github.com/Graphify-Labs/graphify', 'ai-agents', 'intermediate', true, true, 90, 88, 85, true, false, '{"AI Related","Dev Tool"}', 'Developers using Claude Code, Cursor, Codex, or Gemini CLI who want their AI agent to understand a large codebase''s real structure, not just the files currently open.', 'Turns an entire codebase into a queryable knowledge graph for AI coding agents - genuinely changes how much context Claude Code or Cursor can hold about a large project instead of guessing from a handful of open files.', 'https://www.graphify.com', null, 320),
  ('Nutlope/hallmark', 'Nutlope', 'hallmark', 'https://github.com/Nutlope/hallmark', 'frontend', 'beginner', false, true, 78, 72, 35, false, true, '{"AI Related","Dev Tool","Template"}', 'Developers using AI coding agents for UI work who are tired of every AI-generated interface looking like the same generic template.', 'A design rule-set built specifically to stop AI-generated interfaces from looking AI-generated - the closest thing to hiring a real art director for every Claude Code or Cursor UI prompt.', 'https://www.usehallmark.com/', null, 321),
  ('HKUDS/Vibe-Trading', 'HKUDS', 'Vibe-Trading', 'https://github.com/HKUDS/Vibe-Trading', 'ai-agents', 'intermediate', true, true, 86, 85, 80, true, false, '{"AI Related","Framework"}', 'Developers and quants who want to describe a trading strategy in plain language and get a real, backtested implementation instead of hand-coding indicators.', 'Turns natural-language trading ideas into backtested, exportable strategies - a serious research tool from a respected data science lab, not another hype-driven trading bot.', null, null, 322),
  ('stablyai/orca', 'stablyai', 'orca', 'https://github.com/stablyai/orca', 'developer-productivity', 'beginner', true, true, 88, 87, 78, true, false, '{"AI Related","Dev Tool"}', 'Developers running multiple coding agents (Claude Code, Codex, Cursor CLI, etc.) who want a real interface for managing parallel agent work instead of juggling terminal tabs.', 'Runs several coding agents in parallel, each in its own isolated git worktree, so you can compare approaches and pick the best result instead of babysitting one agent at a time.', 'https://onorca.dev', 'https://www.onorca.dev/docs', 323),
  ('iOfficeAI/OfficeCLI', 'iOfficeAI', 'OfficeCLI', 'https://github.com/iOfficeAI/OfficeCLI', 'developer-productivity', 'intermediate', false, true, 82, 80, 62, false, true, '{"AI Related","CLI","Dev Tool"}', 'Developers building AI agents or automation pipelines that need to generate or edit real Office documents without installing Microsoft Office.', 'Gives AI agents a real way to read and edit Word, Excel, and PowerPoint files from the command line - no Office installation required, which quietly removes a whole category of document-automation pain.', 'https://officecli.ai', null, 324),
  ('diegosouzapw/OmniRoute', 'diegosouzapw', 'OmniRoute', 'https://github.com/diegosouzapw/OmniRoute', 'ai-agents', 'intermediate', false, true, 80, 78, 72, true, false, '{"AI Related","Dev Tool"}', 'Developers who use several different LLM providers and want one stable endpoint with automatic fallback instead of hardcoding a single provider''s SDK.', 'One endpoint in front of hundreds of LLM providers with automatic fallback - useful for squeezing real value out of free-tier quotas instead of hitting a wall mid-session.', 'https://omniroute.online', null, 325),
  ('bradautomates/claude-video', 'bradautomates', 'claude-video', 'https://github.com/bradautomates/claude-video', 'ai-agents', 'beginner', false, true, 81, 80, 58, false, true, '{"AI Related","Dev Tool"}', 'Developers who want Claude Code to analyze screen recordings, bug reports, or reference videos directly instead of describing them in text.', 'Gives Claude the ability to actually watch a video - extracting frames and transcript together - instead of guessing from a title or an incomplete transcript.', null, null, 326)
on conflict (id) do nothing;
