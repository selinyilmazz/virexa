-- GitHub Explorer - "discovery, not obvious repos" curation pass
--
-- The library was accurate but still leaned on famous, everyone-already-
-- knows-it repositories (React, Vue, Angular, Tailwind, Next.js, Node,
-- Express, VS Code) for its curation signals (Editor's Pick, Featured,
-- top Recommendation Score) - so the Hero carousel and default sort kept
-- surfacing the same well-known names instead of genuinely surprising,
-- high-value finds. This migration does two things:
--
-- 1) De-emphasizes those 8 already-famous repos: turns off `editor_pick`
--    and `featured` and lowers `recommendation_score` (their `stars`/
--    `health_score`/`community_score` are untouched - they're honestly
--    still excellent, widely-used projects, just no longer the curation
--    spotlight). They are NOT removed or hidden - per the brief, they
--    may stay, they just shouldn't dominate.
-- 2) Adds ~65 real, high-value, less-obvious repositories across every
--    existing category (AI/LLM tooling, terminal & developer
--    productivity, cloud & DevOps, security, backend, frontend tooling,
--    databases, system design, learning resources) with full editorial
--    curation - category, difficulty, verified/maintained, recommendation/
--    health/community scores, tags, audience, and an original "why it's
--    recommended" blurb written in Virexa's own editorial voice (never
--    copied from a README). Every score reflects genuine, considered
--    judgment - not filler to inflate the count.
--
-- Idempotent: every column this relies on already exists (0018/0023/0024/
-- 0025/0026); every INSERT is ON CONFLICT DO NOTHING; every UPDATE is a
-- plain `where id = '...'`, a safe no-op if that id isn't present.

-- ============================================================
-- 1) De-emphasize the already-famous repos (kept, not spotlighted)
-- ============================================================

update public.repositories set editor_pick = false, featured = false, recommendation_score = 76 where id = 'vercel/next.js';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 78 where id = 'facebook/react';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 75 where id = 'tailwindlabs/tailwindcss';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 74 where id = 'nodejs/node';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 73 where id = 'microsoft/vscode';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 72 where id = 'vuejs/vue';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 70 where id = 'angular/angular';
update public.repositories set editor_pick = false, featured = false, recommendation_score = 70 where id = 'expressjs/express';

-- ============================================================
-- 2) New curated repositories - AI Engineering / LLM Infrastructure / AI Agents
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('BerriAI/litellm', 'BerriAI', 'litellm', 'https://github.com/BerriAI/litellm', 'ai-agents', 'intermediate', true, true, 93, 90, 82, true, true, '{"AI Related","Dev Tool"}', 'Teams running multiple LLM providers who want one consistent API instead of juggling each provider''s SDK.', 'Unifies dozens of LLM providers behind a single API, making model switching almost effortless in production.', 'https://www.litellm.ai', 'https://docs.litellm.ai', 200),
  ('instructor-ai/instructor', 'instructor-ai', 'instructor', 'https://github.com/instructor-ai/instructor', 'ai-agents', 'beginner', true, true, 88, 87, 74, false, true, '{"AI Related","Library"}', 'Python developers who want reliable, typed structured output from LLMs instead of parsing brittle JSON by hand.', 'Turns unreliable LLM text output into validated Pydantic objects with a few lines of code, removing an entire category of prompt-parsing bugs.', 'https://python.useinstructor.com', 'https://python.useinstructor.com', 201),
  ('unclecode/crawl4ai', 'unclecode', 'crawl4ai', 'https://github.com/unclecode/crawl4ai', 'ai-agents', 'intermediate', false, true, 85, 85, 70, false, true, '{"AI Related","Dev Tool"}', 'Developers building RAG pipelines who need clean, LLM-ready markdown extracted from live web pages.', 'Purpose-built web crawler for feeding LLMs - it strips a page down to clean markdown instead of leaving you to parse raw HTML yourself.', null, 'https://docs.crawl4ai.com', 202),
  ('browser-use/browser-use', 'browser-use', 'browser-use', 'https://github.com/browser-use/browser-use', 'ai-agents', 'intermediate', false, true, 87, 86, 75, true, true, '{"AI Related","Framework"}', 'Developers building AI agents that need to actually operate a browser - clicking, filling forms, navigating - not just read static pages.', 'Gives an LLM agent real control of a browser instead of just reading its HTML, which is the difference between an agent that can describe a task and one that can finish it.', 'https://browser-use.com', 'https://docs.browser-use.com', 203),
  ('mem0ai/mem0', 'mem0ai', 'mem0', 'https://github.com/mem0ai/mem0', 'ai-agents', 'intermediate', false, true, 84, 84, 68, false, true, '{"AI Related","Library"}', 'Developers building AI agents or chatbots that need to remember facts about a user across sessions, not just within one context window.', 'Adds a proper long-term memory layer to LLM apps, so an assistant can recall what it learned about a user last week instead of starting from zero every session.', 'https://mem0.ai', 'https://docs.mem0.ai', 204),
  ('All-Hands-AI/OpenHands', 'All-Hands-AI', 'OpenHands', 'https://github.com/All-Hands-AI/OpenHands', 'ai-agents', 'advanced', false, true, 86, 83, 72, true, false, '{"AI Related","Framework"}', 'Developers curious about autonomous coding agents that can write, run, and debug code in a real sandboxed environment.', 'One of the most capable open autonomous coding agents available - it can plan, write, and actually execute code to verify its own work, not just suggest snippets.', 'https://www.all-hands.dev', 'https://docs.all-hands.dev', 205),
  ('VoltAgent/voltagent', 'VoltAgent', 'voltagent', 'https://github.com/VoltAgent/voltagent', 'ai-agents', 'intermediate', false, true, 79, 80, 55, false, true, '{"AI Related","Framework"}', 'TypeScript developers who want a structured, observable framework for building multi-step AI agents.', 'A TypeScript-first agent framework with built-in observability - genuinely useful for teams who need to see exactly why an agent made a decision, not just that it did.', 'https://voltagent.dev', 'https://voltagent.dev/docs', 206),
  ('pydantic/pydantic-ai', 'pydantic', 'pydantic-ai', 'https://github.com/pydantic/pydantic-ai', 'ai-agents', 'intermediate', true, true, 88, 88, 73, true, true, '{"AI Related","Framework"}', 'Python developers who already use Pydantic and want the same type-safety and validation discipline applied to agent building.', 'Brings the Pydantic team''s own type-safety philosophy to agent development - if you already trust Pydantic for data validation, this is the natural way to build agents.', 'https://ai.pydantic.dev', 'https://ai.pydantic.dev', 207),
  ('infiniflow/ragflow', 'infiniflow', 'ragflow', 'https://github.com/infiniflow/ragflow', 'ai-agents', 'advanced', false, true, 82, 81, 62, false, true, '{"AI Related","Framework"}', 'Teams building retrieval-augmented generation systems over complex documents (PDFs, tables, scanned files) rather than plain text.', 'Handles the messy part of RAG most tutorials skip - deep document understanding for PDFs, tables, and scanned files - not just chunking clean text.', 'https://ragflow.io', 'https://ragflow.io/docs', 208),
  ('FlowiseAI/Flowise', 'FlowiseAI', 'Flowise', 'https://github.com/FlowiseAI/Flowise', 'ai-agents', 'beginner', false, true, 83, 83, 71, false, false, '{"AI Related","Dev Tool","Template"}', 'Developers and non-developers alike who want to prototype an LLM chain or agent visually before writing custom code.', 'A drag-and-drop builder for LLM workflows - genuinely useful for prototyping an idea in minutes before committing to a hand-written implementation.', 'https://flowiseai.com', 'https://docs.flowiseai.com', 209),
  ('continuedev/continue', 'continuedev', 'continue', 'https://github.com/continuedev/continue', 'ai-agents', 'beginner', false, true, 85, 85, 74, false, true, '{"AI Related","Dev Tool"}', 'Developers who want an open, model-agnostic AI coding assistant in their editor instead of being locked into one vendor''s Copilot.', 'An open-source Copilot alternative that lets you plug in any model - genuinely useful if you want AI-assisted coding without being locked into a single provider.', 'https://continue.dev', 'https://docs.continue.dev', 210),
  ('open-webui/open-webui', 'open-webui', 'open-webui', 'https://github.com/open-webui/open-webui', 'ai-agents', 'beginner', false, true, 87, 87, 80, true, false, '{"AI Related","Dev Tool","Self-Hosted"}', 'Anyone running local LLMs (via Ollama or similar) who wants a clean, ChatGPT-style interface instead of a bare API.', 'The interface that makes self-hosted LLMs actually pleasant to use day to day - it''s what turns a local Ollama install into something that feels like a real product.', 'https://openwebui.com', 'https://docs.openwebui.com', 211),
  ('modelcontextprotocol/servers', 'modelcontextprotocol', 'servers', 'https://github.com/modelcontextprotocol/servers', 'ai-agents', 'intermediate', true, true, 89, 86, 65, true, true, '{"AI Related","Dev Tool"}', 'Developers building AI agents that need standardized, reusable connections to tools, files, and external services.', 'The reference collection of Model Context Protocol servers - worth knowing now, since MCP is quickly becoming the standard way agents connect to real tools and data.', 'https://modelcontextprotocol.io', 'https://modelcontextprotocol.io/introduction', 212)
on conflict (id) do nothing;

-- ============================================================
-- 3) New curated repositories - Developer Productivity & Terminal Utilities
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('jdx/mise', 'jdx', 'mise', 'https://github.com/jdx/mise', 'developer-productivity', 'beginner', false, true, 82, 85, 58, false, true, '{"CLI","Dev Tool"}', 'Developers juggling multiple language runtimes and versions across projects who are tired of nvm/pyenv/rbenv sprawl.', 'Replaces a pile of separate version managers (nvm, pyenv, rbenv...) with one fast tool - a small change that removes a surprising amount of daily friction.', 'https://mise.jdx.dev', 'https://mise.jdx.dev', 220),
  ('atuinsh/atuin', 'atuinsh', 'atuin', 'https://github.com/atuinsh/atuin', 'developer-productivity', 'beginner', false, true, 83, 84, 60, true, true, '{"CLI","Terminal"}', 'Anyone who''s ever lost a useful shell command because it scrolled out of history on another machine.', 'Replaces basic shell history with a searchable, syncable database of every command you''ve ever run - it''s the kind of tool you can''t go back from once you''ve used it.', 'https://atuin.sh', 'https://docs.atuin.sh', 221),
  ('ajeetdsouza/zoxide', 'ajeetdsouza', 'zoxide', 'https://github.com/ajeetdsouza/zoxide', 'developer-productivity', 'beginner', false, true, 85, 88, 64, true, true, '{"CLI","Terminal"}', 'Anyone who spends real time navigating directories in a terminal.', 'A smarter replacement for cd that learns your navigation habits and dramatically speeds up terminal workflows.', null, null, 222),
  ('sharkdp/bat', 'sharkdp', 'bat', 'https://github.com/sharkdp/bat', 'developer-productivity', 'beginner', false, true, 80, 86, 66, false, false, '{"CLI","Terminal"}', 'Anyone who reads source files in a terminal and wants syntax highlighting and git context without opening an editor.', 'A cat replacement that adds syntax highlighting, line numbers, and git diff markers - small upgrade, but you''ll notice it every single day.', null, null, 223),
  ('dandavison/delta', 'dandavison', 'delta', 'https://github.com/dandavison/delta', 'developer-productivity', 'beginner', false, true, 81, 84, 57, false, true, '{"CLI","Terminal"}', 'Developers who spend a lot of time reading git diffs in a terminal and find the default output hard to scan.', 'Turns git''s default diff output into something genuinely readable - side-by-side, syntax-highlighted - once you use it, plain git diff feels broken.', null, null, 224),
  ('jesseduffield/lazygit', 'jesseduffield', 'lazygit', 'https://github.com/jesseduffield/lazygit', 'developer-productivity', 'beginner', false, true, 88, 89, 76, true, false, '{"CLI","Terminal","Dev Tool"}', 'Developers who want the speed of git''s CLI with the visibility of a GUI, without leaving the terminal.', 'A terminal UI for git that makes staging, committing, and rebasing dramatically faster - most developers who try it stop using raw git commands for daily work.', null, null, 225),
  ('jesseduffield/lazydocker', 'jesseduffield', 'lazydocker', 'https://github.com/jesseduffield/lazydocker', 'developer-productivity', 'beginner', false, true, 78, 80, 52, false, true, '{"CLI","Terminal","Dev Tool"}', 'Developers running several Docker containers locally who are tired of typing docker ps/logs/exec by hand.', 'The same lazygit idea applied to Docker - a terminal dashboard for containers, logs, and images that beats memorizing docker CLI flags.', null, null, 226),
  ('casey/just', 'casey', 'just', 'https://github.com/casey/just', 'developer-productivity', 'beginner', false, true, 82, 86, 60, false, true, '{"CLI","Dev Tool"}', 'Teams who want a simple, readable command runner for project scripts without Makefile''s quirks.', 'A command runner that does what most teams actually use Make for, without inheriting Make''s tab-sensitivity and legacy baggage.', 'https://just.systems', 'https://just.systems', 227),
  ('watchexec/watchexec', 'watchexec', 'watchexec', 'https://github.com/watchexec/watchexec', 'developer-productivity', 'beginner', false, true, 76, 82, 48, false, true, '{"CLI","Dev Tool"}', 'Developers who want a language-agnostic way to re-run a command whenever files change.', 'A simple, reliable file-watcher that works the same way regardless of language or framework - useful glue for any workflow that needs a rebuild-on-save loop.', 'https://watchexec.github.io', 'https://watchexec.github.io', 228),
  ('sharkdp/fd', 'sharkdp', 'fd', 'https://github.com/sharkdp/fd', 'developer-productivity', 'beginner', false, true, 80, 86, 63, false, false, '{"CLI","Terminal"}', 'Anyone who reaches for find in a terminal and wishes the syntax were more forgiving and the defaults smarter.', 'A find replacement with sane defaults (respects .gitignore, colorized output) - faster to use correctly than remembering find''s flag syntax.', null, null, 229),
  ('ghostty-org/ghostty', 'ghostty-org', 'ghostty', 'https://github.com/ghostty-org/ghostty', 'developer-productivity', 'beginner', true, true, 84, 85, 70, false, true, '{"Terminal","Dev Tool"}', 'Developers who want a genuinely fast, GPU-accelerated terminal emulator with modern defaults out of the box.', 'A terminal emulator built from scratch for speed, with none of the configuration archaeology older terminal emulators tend to require.', 'https://ghostty.org', 'https://ghostty.org/docs', 230),
  ('wez/wezterm', 'wez', 'wezterm', 'https://github.com/wez/wezterm', 'developer-productivity', 'intermediate', false, true, 79, 82, 58, false, true, '{"Terminal","Dev Tool"}', 'Developers who want a cross-platform, GPU-accelerated terminal that''s deeply configurable via a real scripting language (Lua).', 'One of the few terminal emulators that''s both genuinely fast and deeply scriptable - worth it specifically if you want your terminal configured like code, not a settings menu.', 'https://wezterm.org', 'https://wezterm.org', 231),
  ('nushell/nushell', 'nushell', 'nushell', 'https://github.com/nushell/nushell', 'developer-productivity', 'intermediate', false, true, 83, 85, 62, true, true, '{"Terminal","CLI"}', 'Developers who want their shell to treat data as structured tables instead of plain text streams.', 'Rethinks the shell around structured data - piping the output of one command into the next as a real table, not text you have to re-parse with awk/sed.', 'https://www.nushell.sh', 'https://www.nushell.sh/book', 232),
  ('starship/starship', 'starship', 'starship', 'https://github.com/starship/starship', 'developer-productivity', 'beginner', false, true, 81, 87, 72, false, false, '{"Terminal","Dev Tool"}', 'Developers who want one fast, customizable shell prompt that works identically across bash, zsh, fish, and more.', 'The shell prompt most developers end up on eventually - fast, shows exactly the context you need (git branch, language versions), and works across every shell.', 'https://starship.rs', 'https://starship.rs', 233),
  ('sxyazi/yazi', 'sxyazi', 'yazi', 'https://github.com/sxyazi/yazi', 'developer-productivity', 'intermediate', false, true, 78, 82, 54, false, true, '{"Terminal","CLI"}', 'Developers who navigate large file trees often and want a fast, keyboard-driven file manager instead of clicking through a GUI.', 'A genuinely fast terminal file manager with image previews and async operations - the rare terminal file manager that doesn''t feel like a compromise.', 'https://yazi-rs.github.io', 'https://yazi-rs.github.io', 234),
  ('zellij-org/zellij', 'zellij-org', 'zellij', 'https://github.com/zellij-org/zellij', 'developer-productivity', 'intermediate', false, true, 80, 83, 60, false, true, '{"Terminal","Dev Tool"}', 'Developers who want a terminal multiplexer with more discoverable defaults than tmux, without giving up its power.', 'A tmux alternative with a much friendlier learning curve - built-in status bar hints mean you''re productive on day one instead of memorizing key-binding cheat sheets.', 'https://zellij.dev', 'https://zellij.dev', 235)
on conflict (id) do nothing;

-- ============================================================
-- 4) New curated repositories - Cloud
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('opentofu/opentofu', 'opentofu', 'opentofu', 'https://github.com/opentofu/opentofu', 'cloud', 'intermediate', true, true, 84, 85, 62, false, true, '{"Dev Tool"}', 'Terraform users who want an open-source, community-governed fork free of vendor licensing changes.', 'The community-governed, truly open-source continuation of Terraform''s original license - worth knowing if vendor lock-in on your infrastructure tooling is a real concern.', 'https://opentofu.org', 'https://opentofu.org/docs', 240),
  ('crossplane/crossplane', 'crossplane', 'crossplane', 'https://github.com/crossplane/crossplane', 'cloud', 'advanced', true, true, 82, 83, 58, false, true, '{"Dev Tool"}', 'Platform teams who want to manage cloud infrastructure as native Kubernetes resources instead of a separate IaC tool.', 'Turns cloud infrastructure into Kubernetes-native resources - powerful for platform teams building an internal developer platform on top of K8s.', 'https://www.crossplane.io', 'https://docs.crossplane.io', 241),
  ('cilium/cilium', 'cilium', 'cilium', 'https://github.com/cilium/cilium', 'cloud', 'advanced', true, true, 86, 87, 70, true, false, '{"Dev Tool"}', 'Platform engineers running Kubernetes at scale who need faster, more observable networking than the default CNI provides.', 'An eBPF-based networking layer for Kubernetes that''s become the default choice for teams that outgrow basic CNI plugins - genuinely changes what''s possible for cluster networking and security.', 'https://cilium.io', 'https://docs.cilium.io', 242)
on conflict (id) do nothing;

-- ============================================================
-- 5) New curated repositories - DevOps
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('coollabsio/coolify', 'coollabsio', 'coolify', 'https://github.com/coollabsio/coolify', 'devops', 'beginner', false, true, 87, 85, 74, true, true, '{"Dev Tool","Self-Hosted"}', 'Developers who want a self-hosted alternative to Heroku/Vercel for deploying their own apps on their own servers.', 'A self-hosted PaaS that gives you Heroku-style deploys on your own infrastructure - the fastest path from git push to a running app without a cloud platform bill.', 'https://coolify.io', 'https://coolify.io/docs', 250),
  ('Dokploy/dokploy', 'Dokploy', 'dokploy', 'https://github.com/Dokploy/dokploy', 'devops', 'beginner', false, true, 81, 81, 56, false, true, '{"Dev Tool","Self-Hosted"}', 'Small teams who want Docker-based self-hosted deployments with a real dashboard instead of hand-rolled compose scripts.', 'A newer, actively growing self-hosting platform that''s quickly becoming a real Coolify alternative - worth watching if you''re picking a self-hosted deploy tool today.', 'https://dokploy.com', 'https://docs.dokploy.com', 251),
  ('headlamp-k8s/headlamp', 'headlamp-k8s', 'headlamp', 'https://github.com/headlamp-k8s/headlamp', 'devops', 'intermediate', false, true, 76, 80, 48, false, true, '{"Dev Tool"}', 'Kubernetes users who want a general-purpose, extensible cluster dashboard beyond the default Kubernetes Dashboard.', 'A more actively developed, plugin-extensible alternative to the stock Kubernetes Dashboard - worth trying if you outgrew the default UI.', 'https://headlamp.dev', 'https://headlamp.dev', 252),
  ('kubeshark/kubeshark', 'kubeshark', 'kubeshark', 'https://github.com/kubeshark/kubeshark', 'devops', 'intermediate', false, true, 80, 81, 52, false, true, '{"Dev Tool"}', 'Developers debugging Kubernetes networking issues who need to see real API traffic between pods, not just logs.', 'Basically Wireshark for Kubernetes traffic - captures real API calls between services, which turns a guessing game of network debugging into an actual investigation.', 'https://kubeshark.co', 'https://docs.kubeshark.co', 253),
  ('argoproj/argo-cd', 'argoproj', 'argo-cd', 'https://github.com/argoproj/argo-cd', 'devops', 'intermediate', true, true, 88, 88, 78, true, false, '{"Dev Tool"}', 'Teams running Kubernetes who want git as the single source of truth for what''s actually deployed.', 'The standard GitOps tool for Kubernetes - once your cluster state is declared in git and reconciled automatically, manual kubectl apply deploys start to feel genuinely risky by comparison.', 'https://argoproj.github.io/cd', 'https://argo-cd.readthedocs.io', 254),
  ('derailed/k9s', 'derailed', 'k9s', 'https://github.com/derailed/k9s', 'devops', 'beginner', false, true, 87, 86, 75, true, false, '{"CLI","Dev Tool","Terminal"}', 'Anyone managing Kubernetes clusters who''s tired of typing long kubectl commands for routine tasks.', 'A terminal UI for Kubernetes that makes exploring pods, logs, and resources dramatically faster than raw kubectl - most Kubernetes users end up living inside this.', 'https://k9scli.io', 'https://k9scli.io', 255)
on conflict (id) do nothing;

-- ============================================================
-- 6) New curated repositories - Security
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('semgrep/semgrep', 'semgrep', 'semgrep', 'https://github.com/semgrep/semgrep', 'cyber-security', 'intermediate', true, true, 87, 87, 72, true, false, '{"Dev Tool","CLI"}', 'Teams who want fast, customizable static analysis in CI without the noise of a heavyweight legacy SAST tool.', 'Static analysis that''s actually fast enough to run on every pull request - the rule syntax is simple enough that teams write their own custom checks instead of just accepting defaults.', 'https://semgrep.dev', 'https://semgrep.dev/docs', 260),
  ('gitleaks/gitleaks', 'gitleaks', 'gitleaks', 'https://github.com/gitleaks/gitleaks', 'cyber-security', 'beginner', false, true, 83, 84, 63, false, true, '{"CLI","Dev Tool"}', 'Any team that wants to catch API keys and secrets before they''re committed to git history, not after.', 'Scans commits (and full git history) for leaked secrets - the cheapest insurance policy against an accidental key leak turning into an incident.', null, null, 261),
  ('wazuh/wazuh', 'wazuh', 'wazuh', 'https://github.com/wazuh/wazuh', 'cyber-security', 'advanced', true, true, 83, 83, 66, false, true, '{"Dev Tool"}', 'Security teams who want a free, open-source alternative to commercial SIEM/XDR platforms.', 'A genuinely full-featured open-source SIEM - threat detection, compliance, and log analysis without the licensing cost of commercial platforms.', 'https://wazuh.com', 'https://documentation.wazuh.com', 262),
  ('falcosecurity/falco', 'falcosecurity', 'falco', 'https://github.com/falcosecurity/falco', 'cyber-security', 'advanced', true, true, 84, 85, 64, false, true, '{"Dev Tool"}', 'Platform teams who need real-time runtime security detection for containers and Kubernetes, not just static scanning.', 'Watches system calls in real time to catch suspicious runtime behavior in containers - the detection layer static image scanning alone can''t provide.', 'https://falco.org', 'https://falco.org/docs', 263),
  ('cilium/tetragon', 'cilium', 'tetragon', 'https://github.com/cilium/tetragon', 'cyber-security', 'advanced', true, true, 79, 81, 50, false, true, '{"Dev Tool"}', 'Platform teams who want eBPF-based runtime security observability with minimal performance overhead.', 'eBPF-based runtime security enforcement from the Cilium team - it can observe and block risky behavior at the kernel level with a lighter footprint than traditional agents.', 'https://tetragon.io', 'https://tetragon.io', 264),
  ('juice-shop/juice-shop', 'juice-shop', 'juice-shop', 'https://github.com/juice-shop/juice-shop', 'cyber-security', 'beginner', true, true, 85, 86, 69, false, false, '{"Tutorial","Dev Tool"}', 'Developers who want to practice finding real web vulnerabilities hands-on instead of just reading about them.', 'A deliberately vulnerable web app for practicing security testing - the most effective way to actually understand OWASP Top 10 vulnerabilities is to exploit them yourself, safely.', 'https://owasp.org/www-project-juice-shop', 'https://pwning.owasp-juice.shop', 265)
on conflict (id) do nothing;

-- ============================================================
-- 7) New curated repositories - Frontend (component libraries & tooling, not more frameworks)
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('shadcn-ui/ui', 'shadcn-ui', 'ui', 'https://github.com/shadcn-ui/ui', 'frontend', 'beginner', false, true, 90, 89, 88, true, false, '{"Library","Template"}', 'React/Next.js developers who want beautifully designed, accessible components they can copy into their own codebase and fully own.', 'Changed how a generation of React developers think about component libraries - you copy the code into your own project instead of installing a black-box dependency, so you own and can modify every line.', 'https://ui.shadcn.com', 'https://ui.shadcn.com', 270),
  ('motiondivision/motion', 'motiondivision', 'motion', 'https://github.com/motiondivision/motion', 'frontend', 'intermediate', true, true, 85, 87, 76, false, false, '{"Library","Framework"}', 'Frontend developers who want production-quality animations without hand-rolling CSS transitions or a physics engine.', 'The animation library most serious React/JS projects reach for - handles gestures, layout animations, and spring physics with an API that stays readable even for complex sequences.', 'https://motion.dev', 'https://motion.dev', 271),
  ('chakra-ui/ark', 'chakra-ui', 'ark', 'https://github.com/chakra-ui/ark', 'frontend', 'intermediate', true, true, 79, 82, 48, false, true, '{"Library","Framework"}', 'Developers who want fully accessible, unstyled component primitives to build their own design system on top of.', 'Headless, accessible component primitives from the Chakra UI team - the right foundation when you want full design control without rebuilding accessibility from scratch.', 'https://ark-ui.com', 'https://ark-ui.com', 272),
  ('cschroeter/park-ui', 'cschroeter', 'park-ui', 'https://github.com/cschroeter/park-ui', 'frontend', 'beginner', false, true, 75, 78, 40, false, true, '{"Library","Template"}', 'Developers who like shadcn/ui''s copy-paste model but want it built on Ark UI''s accessible primitives instead.', 'Applies the shadcn/ui copy-paste philosophy on top of Ark UI''s accessible primitives - a genuinely underrated combination for teams that care about accessibility by default.', 'https://park-ui.com', 'https://park-ui.com', 273),
  ('davidhdev/react-bits', 'davidhdev', 'react-bits', 'https://github.com/davidhdev/react-bits', 'frontend', 'beginner', false, true, 77, 79, 52, false, true, '{"Library","Template"}', 'Developers who want polished, animated UI effects (backgrounds, text effects, buttons) without building them from scratch.', 'A library of ready-made animated UI effects - the fastest way to add a genuinely polished visual touch without spending an afternoon in a CSS/animation rabbit hole.', 'https://reactbits.dev', 'https://reactbits.dev', 274),
  ('magicuidesign/magicui', 'magicuidesign', 'magicui', 'https://github.com/magicuidesign/magicui', 'frontend', 'beginner', false, true, 78, 80, 58, false, true, '{"Library","Template"}', 'Developers building marketing sites/landing pages who want eye-catching animated components built on shadcn/ui and Motion.', 'Animated, marketing-site-ready components built on shadcn/ui and Motion - the shortcut from a plain landing page to one that actually feels designed.', 'https://magicui.design', 'https://magicui.design', 275)
on conflict (id) do nothing;

-- ============================================================
-- 8) New curated repositories - Backend
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('honojs/hono', 'honojs', 'hono', 'https://github.com/honojs/hono', 'backend', 'beginner', false, true, 87, 88, 74, true, false, '{"Framework"}', 'Developers building APIs that need to run anywhere - Node, Bun, Deno, Cloudflare Workers - from one codebase.', 'An ultra-fast web framework that runs identically across Node, Bun, Deno, and edge runtimes - genuinely useful if you don''t want to rewrite your API when you change where it''s deployed.', 'https://hono.dev', 'https://hono.dev', 280),
  ('elysiajs/elysia', 'elysiajs', 'elysia', 'https://github.com/elysiajs/elysia', 'backend', 'intermediate', false, true, 81, 83, 56, false, true, '{"Framework"}', 'Bun users who want end-to-end type safety between their backend and frontend without a separate schema tool.', 'A Bun-native framework with end-to-end type inference - your frontend gets fully-typed API calls without writing or generating a separate schema.', 'https://elysiajs.com', 'https://elysiajs.com', 281),
  ('encoredev/encore', 'encoredev', 'encore', 'https://github.com/encoredev/encore', 'backend', 'intermediate', false, true, 80, 81, 50, false, true, '{"Framework","Dev Tool"}', 'Backend teams who want built-in infrastructure provisioning (databases, queues, cron) instead of wiring it all up by hand.', 'A backend framework that provisions its own infrastructure from your code - databases, pub/sub, cron jobs - which removes a surprising amount of DevOps busywork for small teams.', 'https://encore.dev', 'https://encore.dev', 282),
  ('better-auth/better-auth', 'better-auth', 'better-auth', 'https://github.com/better-auth/better-auth', 'backend', 'beginner', false, true, 85, 85, 66, true, true, '{"Library","Framework"}', 'TypeScript developers who want a framework-agnostic, fully-owned auth solution instead of a hosted auth SaaS.', 'A comprehensive, self-hosted TypeScript auth library that''s rapidly becoming the default recommendation over paid auth-as-a-service - full control, no per-user pricing.', 'https://www.better-auth.com', 'https://www.better-auth.com', 283),
  ('lucia-auth/lucia', 'lucia-auth', 'lucia', 'https://github.com/lucia-auth/lucia', 'backend', 'intermediate', false, true, 74, 72, 55, false, true, '{"Library","Tutorial"}', 'Developers who want to understand how session-based auth actually works, not just install a black-box library.', 'Less a library now than a set of guides for rolling your own auth correctly - genuinely valuable for understanding what auth libraries are doing under the hood.', 'https://lucia-auth.com', 'https://lucia-auth.com', 284),
  ('kysely-org/kysely', 'kysely-org', 'kysely', 'https://github.com/kysely-org/kysely', 'backend', 'intermediate', false, true, 83, 85, 60, false, true, '{"Library","Dev Tool"}', 'TypeScript developers who want full SQL control with real autocomplete, without a full ORM''s abstraction overhead.', 'A type-safe SQL query builder that stays close to real SQL instead of hiding it behind ORM magic - the pick for developers who want types without giving up control.', 'https://kysely.dev', 'https://kysely.dev', 285)
on conflict (id) do nothing;

-- ============================================================
-- 9) New curated repositories - Databases
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('duckdb/duckdb', 'duckdb', 'duckdb', 'https://github.com/duckdb/duckdb', 'databases', 'beginner', true, true, 90, 90, 80, true, false, '{"Dev Tool","Library"}', 'Anyone doing local data analysis who wants SQL performance without spinning up a database server.', 'Brings analytical SQL performance to local development without requiring a separate database server.', 'https://duckdb.org', 'https://duckdb.org/docs', 290),
  ('lancedb/lancedb', 'lancedb', 'lancedb', 'https://github.com/lancedb/lancedb', 'databases', 'intermediate', false, true, 80, 81, 52, false, true, '{"AI Related","Dev Tool"}', 'Developers building AI applications who want an embedded vector database without running a separate service.', 'An embedded vector database that runs in-process like SQLite - no separate server to run, which makes it a genuinely easy first vector DB to reach for.', 'https://lancedb.com', 'https://lancedb.github.io/lancedb', 291),
  ('chroma-core/chroma', 'chroma-core', 'chroma', 'https://github.com/chroma-core/chroma', 'databases', 'beginner', false, true, 84, 83, 68, false, false, '{"AI Related","Dev Tool"}', 'Developers building their first RAG application who want the simplest possible vector database to get started with.', 'The vector database most RAG tutorials reach for first - simple enough to be running locally in minutes, which makes it the natural on-ramp before evaluating heavier options.', 'https://www.trychroma.com', 'https://docs.trychroma.com', 292),
  ('qdrant/qdrant', 'qdrant', 'qdrant', 'https://github.com/qdrant/qdrant', 'databases', 'intermediate', true, true, 87, 87, 70, true, false, '{"AI Related","Dev Tool"}', 'Teams that have outgrown a prototype vector database and need one built for real production filtering and scale.', 'A production-grade vector database with genuinely fast filtered search - the upgrade path once a prototype RAG app needs to handle real traffic and complex queries.', 'https://qdrant.tech', 'https://qdrant.tech/documentation', 293),
  ('weaviate/weaviate', 'weaviate', 'weaviate', 'https://github.com/weaviate/weaviate', 'databases', 'intermediate', true, true, 84, 85, 66, false, false, '{"AI Related","Dev Tool"}', 'Teams who want a vector database with built-in hybrid search (vector + keyword) and modules for common embedding models.', 'Combines vector and keyword search natively, which matters more than it sounds - pure vector search alone often misses exact-match queries a hybrid approach catches easily.', 'https://weaviate.io', 'https://weaviate.io/developers/weaviate', 294),
  ('pola-rs/polars', 'pola-rs', 'polars', 'https://github.com/pola-rs/polars', 'databases', 'intermediate', true, true, 88, 89, 75, true, false, '{"Library","Dev Tool"}', 'Python data developers hitting pandas'' performance ceiling on medium-to-large datasets.', 'A dramatically faster DataFrame library than pandas for anything beyond small datasets - the API is different enough to require some relearning, but the performance gap is real.', 'https://pola.rs', 'https://docs.pola.rs', 295)
on conflict (id) do nothing;

-- ============================================================
-- 10) New curated repositories - System Design & Learning Resources
-- ============================================================

insert into public.repositories (id, owner, repo_name, github_url, category, difficulty, verified, maintained, recommendation_score, health_score, community_score, editor_pick, hidden_gem, tags, audience, editor_notes, website_url, documentation_url, display_order)
values
  ('ashishps1/awesome-system-design-resources', 'ashishps1', 'awesome-system-design-resources', 'https://github.com/ashishps1/awesome-system-design-resources', 'system-design', 'intermediate', false, true, 80, 80, 55, false, true, '{"Tutorial"}', 'Developers preparing for system design interviews who want curated resources beyond a single primer.', 'A well-organized companion to system-design-primer - curated links, real case studies, and diagrams rather than just a Q&A format.', null, null, 300),
  ('awesome-selfhosted/awesome-selfhosted', 'awesome-selfhosted', 'awesome-selfhosted', 'https://github.com/awesome-selfhosted/awesome-selfhosted', 'learning-resources', 'beginner', false, true, 83, 84, 70, false, false, '{"Tutorial","Self-Hosted"}', 'Developers who want to self-host their own tools instead of paying for SaaS - a directory of real, maintained options.', 'The definitive directory of self-hostable software - the first stop before assuming you need to pay for a SaaS subscription for a common tool.', 'https://awesome-selfhosted.net', null, 310),
  ('steven2358/awesome-generative-ai', 'steven2358', 'awesome-generative-ai', 'https://github.com/steven2358/awesome-generative-ai', 'learning-resources', 'beginner', false, true, 76, 78, 58, false, true, '{"AI Related","Tutorial"}', 'Developers trying to keep up with the fast-moving generative AI tooling landscape.', 'A continuously updated map of the generative AI ecosystem - genuinely useful for orienting yourself in a space that changes every few weeks.', null, null, 311),
  ('Shubhamsaboo/awesome-llm-apps', 'Shubhamsaboo', 'awesome-llm-apps', 'https://github.com/Shubhamsaboo/awesome-llm-apps', 'learning-resources', 'beginner', false, true, 79, 80, 62, false, true, '{"AI Related","Tutorial"}', 'Developers who learn best from real, working example projects rather than documentation alone.', 'A collection of real, working LLM application examples with actual code - more useful for learning by example than most tutorials that stop at a toy demo.', null, null, 312),
  ('codecrafters-io/build-your-own-x', 'codecrafters-io', 'build-your-own-x', 'https://github.com/codecrafters-io/build-your-own-x', 'learning-resources', 'intermediate', false, true, 87, 85, 80, true, false, '{"Tutorial"}', 'Developers who learn best by building - recreating a database, shell, or Docker from scratch teaches more than reading about how they work.', 'A curated map of build-your-own-database/shell/Docker/etc. tutorials - the fastest way to actually understand a technology is still to rebuild a small version of it yourself.', null, null, 313)
on conflict (id) do nothing;

-- ============================================================
-- 11) New named collection: Terminal Power Tools
-- ============================================================
-- A focused grouping the fixed category grid can't express well on its
-- own - "Developer Productivity" mixes terminal tools with build tools
-- (pnpm, vite, eslint...); this pulls the terminal-specific picks into
-- one dedicated, admin-curated collection.

insert into public.collections (slug, name, description, icon, difficulty, estimated_learning_time, display_order, visible)
values
  ('terminal-power-tools', 'Terminal Power Tools', 'Modern replacements for classic command-line tools - faster, friendlier, and genuinely worth switching to.', '⌨️', 'beginner', '1-2 weeks', 12, true)
on conflict (slug) do nothing;

-- ============================================================
-- 12) Collection membership for new repos (existing + new collections)
-- ============================================================

do $$
declare
  col_id uuid;
begin
  select id into col_id from public.collections where slug = 'terminal-power-tools';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'ajeetdsouza/zoxide', 1), (col_id, 'atuinsh/atuin', 2), (col_id, 'sharkdp/bat', 3),
      (col_id, 'dandavison/delta', 4), (col_id, 'jesseduffield/lazygit', 5), (col_id, 'sharkdp/fd', 6),
      (col_id, 'starship/starship', 7), (col_id, 'sxyazi/yazi', 8), (col_id, 'zellij-org/zellij', 9),
      (col_id, 'nushell/nushell', 10)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'ai-agents-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'BerriAI/litellm', 10), (col_id, 'instructor-ai/instructor', 11), (col_id, 'browser-use/browser-use', 12),
      (col_id, 'mem0ai/mem0', 13), (col_id, 'All-Hands-AI/OpenHands', 14), (col_id, 'pydantic/pydantic-ai', 15),
      (col_id, 'open-webui/open-webui', 16), (col_id, 'modelcontextprotocol/servers', 17)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'developer-productivity-picks';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'jdx/mise', 10), (col_id, 'jesseduffield/lazydocker', 11), (col_id, 'casey/just', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'cloud-infrastructure';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'cilium/cilium', 10), (col_id, 'opentofu/opentofu', 11), (col_id, 'crossplane/crossplane', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'devops-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'coollabsio/coolify', 10), (col_id, 'argoproj/argo-cd', 11), (col_id, 'derailed/k9s', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'security-toolkit';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'semgrep/semgrep', 10), (col_id, 'gitleaks/gitleaks', 11), (col_id, 'falcosecurity/falco', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'database-essentials';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'duckdb/duckdb', 10), (col_id, 'qdrant/qdrant', 11), (col_id, 'pola-rs/polars', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'frontend-essentials';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'shadcn-ui/ui', 10), (col_id, 'motiondivision/motion', 11)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'backend-frameworks';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'honojs/hono', 10), (col_id, 'better-auth/better-auth', 11), (col_id, 'kysely-org/kysely', 12)
    on conflict do nothing;
  end if;

  select id into col_id from public.collections where slug = 'learning-resources';
  if col_id is not null then
    insert into public.collection_repositories (collection_id, repository_id, display_order)
    values
      (col_id, 'codecrafters-io/build-your-own-x', 10), (col_id, 'awesome-selfhosted/awesome-selfhosted', 11)
    on conflict do nothing;
  end if;
end $$;
