-- Admin Panel: Developer Hub Catalog Items management
--
-- The Developer Hub's catalog (Certifications, Courses, Learning Paths,
-- Developer Tools, Roadmaps, Cheat Sheets - everything in
-- `CatalogResourceType` except "github-repo", which is live GitHub data)
-- previously lived ONLY as hardcoded arrays in `src/data/developer-hub.ts`
-- - nothing an admin could add, edit, hide, or reorder from a UI. This
-- table becomes the new source of truth: the public Developer Hub catalog
-- (`developer-hub-service.ts`'s `buildCatalogPool()`) reads from here
-- (filtered to `visible = true`), and `/admin/catalog-items` gets real
-- CRUD - the same pattern already used for `repositories` (0018) and
-- `developer_releases` (0019).
--
-- One shared table across all six resource types (rather than six
-- separate tables) because they share almost every field and are already
-- modeled as a single discriminated `CatalogItem` union in application
-- code (`developer-hub-service.ts`) - a `resource_type` column plus a
-- handful of type-specific nullable columns (`difficulty`/`price` don't
-- apply to every type, `steps`/`estimated_time` are roadmap-only,
-- `file_type` is cheat-sheet-only) mirrors that shape directly instead of
-- fragmenting one admin screen into six near-identical ones.
--
-- `display_order` gives admins manual ordering within a resource type
-- (ascending, ties broken by `featured` then title - see
-- `admin-catalog-service.ts`) - a real, lightweight substitute for
-- drag-and-drop reordering without building a whole DnD UI.
--
-- Safe to re-run: guarded with IF NOT EXISTS / ON CONFLICT.

create table if not exists public.catalog_items (
  -- "resource_type:slug" - stable, unique, human-readable, matches the
  -- same `id` convention `developer-hub-service.ts` already builds at
  -- read time today (e.g. "certification:aws-certified-developer-associate").
  id text primary key,
  resource_type text not null check (
    resource_type in ('certification', 'course', 'learning-path', 'developer-tool', 'roadmap', 'cheat-sheet')
  ),
  slug text not null,
  title text not null,
  provider text not null,
  description text not null default '',
  -- Not every resource type uses every field - see the doc comment above.
  difficulty text check (difficulty is null or difficulty in ('beginner', 'intermediate', 'advanced')),
  price text check (price is null or price in ('free', 'paid')),
  url text not null,
  emoji text not null default '',
  featured boolean not null default false,
  -- Certifications only - every curated certification is a real, official
  -- provider program (see `data/developer-hub.ts`'s doc comment); kept as
  -- a column rather than hardcoded `true` so an admin can correct it if a
  -- future certification entry isn't from an official provider.
  official boolean not null default false,
  -- Roadmaps only - 4-5 real topic areas in learning order.
  steps text[] not null default '{}',
  -- Roadmaps only - an honest estimate range (e.g. "3-6 months").
  estimated_time text,
  -- Cheat sheets only - e.g. "PDF" or "Web".
  file_type text,
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists catalog_items_resource_type_slug_idx on public.catalog_items (resource_type, slug);
create index if not exists catalog_items_visible_idx on public.catalog_items (visible);
create index if not exists catalog_items_resource_type_idx on public.catalog_items (resource_type);
create index if not exists catalog_items_featured_idx on public.catalog_items (featured) where featured = true;
create index if not exists catalog_items_display_order_idx on public.catalog_items (resource_type, display_order);

comment on table public.catalog_items is 'Admin-managed Developer Hub catalog (certifications/courses/learning paths/developer tools/roadmaps/cheat sheets) - source of truth for the public /developer-hub catalog pages.';

drop trigger if exists set_updated_at on public.catalog_items;
create trigger set_updated_at
  before update on public.catalog_items
  for each row
  execute function public.set_updated_at();

alter table public.catalog_items enable row level security;

drop policy if exists "catalog_items_select_visible" on public.catalog_items;
create policy "catalog_items_select_visible"
  on public.catalog_items for select
  using (visible = true);

-- Seed: every real, hand-curated item from src/data/developer-hub.ts as of
-- this migration, so no existing content is lost when the public catalog
-- switches from the static file to this table. `display_order` seeded in
-- original array order (0-based) so the initial admin view and public
-- ordering match today's behavior exactly.

insert into public.catalog_items (id, resource_type, slug, title, provider, description, difficulty, price, url, emoji, featured, official, display_order)
values
  ('certification:aws-certified-developer-associate', 'certification', 'aws-certified-developer-associate', 'AWS Certified Developer – Associate', 'Amazon Web Services', 'Validates hands-on experience developing and maintaining applications on AWS.', 'intermediate', 'paid', 'https://aws.amazon.com/certification/certified-developer-associate/', '☁️', true, true, 0),
  ('certification:aws-certified-solutions-architect-associate', 'certification', 'aws-certified-solutions-architect-associate', 'AWS Certified Solutions Architect – Associate', 'Amazon Web Services', 'Covers designing available, cost-efficient, fault-tolerant systems on AWS.', 'intermediate', 'paid', 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', '🏗️', false, true, 1),
  ('certification:microsoft-azure-fundamentals', 'certification', 'microsoft-azure-fundamentals', 'Microsoft Certified: Azure Fundamentals (AZ-900)', 'Microsoft', 'An entry-level look at cloud concepts and core Azure services, pricing and support.', 'beginner', 'paid', 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/', '🪟', true, true, 2),
  ('certification:google-cloud-associate-cloud-engineer', 'certification', 'google-cloud-associate-cloud-engineer', 'Google Cloud Associate Cloud Engineer', 'Google Cloud', 'Deploying applications, monitoring operations and managing enterprise solutions on Google Cloud.', 'intermediate', 'paid', 'https://cloud.google.com/certification/cloud-engineer', '🌩️', false, true, 3),
  ('certification:certified-kubernetes-administrator', 'certification', 'certified-kubernetes-administrator', 'Certified Kubernetes Administrator (CKA)', 'The Linux Foundation / CNCF', 'Demonstrates the skills, knowledge and competence to perform the responsibilities of a Kubernetes administrator.', 'advanced', 'paid', 'https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/', '☸️', true, true, 4),
  ('certification:hashicorp-terraform-associate', 'certification', 'hashicorp-terraform-associate', 'HashiCorp Certified: Terraform Associate', 'HashiCorp', 'Validates the skills needed to use open-source HashiCorp Terraform for infrastructure as code.', 'intermediate', 'paid', 'https://www.hashicorp.com/certification/terraform-associate', '🧱', false, true, 5),
  ('certification:comptia-security-plus', 'certification', 'comptia-security-plus', 'CompTIA Security+', 'CompTIA', 'A vendor-neutral baseline certification covering core security functions and career skills.', 'beginner', 'paid', 'https://www.comptia.org/certifications/security', '🛡️', false, true, 6),
  ('certification:isc2-certified-in-cybersecurity', 'certification', 'isc2-certified-in-cybersecurity', '(ISC)² Certified in Cybersecurity (CC)', 'ISC2', 'An entry-level certification proving foundational cybersecurity knowledge and skills.', 'beginner', 'free', 'https://www.isc2.org/certifications/cc', '🔐', false, true, 7),
  ('certification:cisco-devnet-associate', 'certification', 'cisco-devnet-associate', 'Cisco Certified DevNet Associate', 'Cisco', 'Covers software development and design, APIs, Cisco platforms and automation.', 'intermediate', 'paid', 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/devnet/devnet-associate/index.html', '🔀', false, true, 8),
  ('certification:github-foundations', 'certification', 'github-foundations', 'GitHub Foundations', 'GitHub', 'Covers Git, GitHub, and best practices for collaboration - an entry point into the GitHub certification path.', 'beginner', 'paid', 'https://resources.github.com/learn/certifications/', '🐙', true, true, 9),

  ('course:freecodecamp-responsive-web-design', 'course', 'freecodecamp-responsive-web-design', 'Responsive Web Design', 'freeCodeCamp', 'HTML, CSS, Flexbox, CSS Grid and accessibility fundamentals, with a free certification on completion.', 'beginner', 'free', 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', '🎨', true, false, 0),
  ('course:freecodecamp-javascript-algorithms', 'course', 'freecodecamp-javascript-algorithms', 'JavaScript Algorithms and Data Structures', 'freeCodeCamp', 'Core JavaScript syntax, ES6, algorithmic thinking and data structures, free and self-paced.', 'intermediate', 'free', 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/', '🧮', false, false, 1),
  ('course:meta-front-end-developer', 'course', 'meta-front-end-developer', 'Meta Front-End Developer Professional Certificate', 'Coursera', 'React, JavaScript and UI/UX fundamentals from Meta''s own engineering curriculum.', 'intermediate', 'paid', 'https://www.coursera.org/professional-certificates/meta-front-end-developer', '⚛️', true, false, 2),
  ('course:google-it-automation-python', 'course', 'google-it-automation-python', 'Google IT Automation with Python', 'Coursera', 'Python scripting, Git/GitHub, automation and IT troubleshooting from Google''s own team.', 'beginner', 'paid', 'https://www.coursera.org/professional-certificates/google-it-automation', '🐍', false, false, 3),
  ('course:aws-cloud-practitioner-essentials', 'course', 'aws-cloud-practitioner-essentials', 'AWS Cloud Practitioner Essentials', 'AWS Skill Builder', 'A foundational overview of AWS Cloud concepts, services, security and pricing.', 'beginner', 'free', 'https://skillbuilder.aws/', '☁️', false, false, 4),
  ('course:microsoft-learn-azure-administrator', 'course', 'microsoft-learn-azure-administrator', 'Career Path: Azure Administrator', 'Microsoft Learn', 'A structured, free path of modules covering identity, storage, compute and networking on Azure.', 'intermediate', 'free', 'https://learn.microsoft.com/en-us/training/career-paths/az-administrator', '🪟', false, false, 5),
  ('course:cs50-intro-computer-science', 'course', 'cs50-intro-computer-science', 'CS50''s Introduction to Computer Science', 'Harvard University (edX)', 'Harvard''s legendary introduction to computer science and programming - algorithms, data structures and more.', 'beginner', 'free', 'https://www.edx.org/learn/computer-science/harvard-university-cs50-s-introduction-to-computer-science', '🎓', true, false, 6),

  ('learning-path:microsoft-learn-azure-fundamentals-path', 'learning-path', 'microsoft-learn-azure-fundamentals-path', 'Azure Fundamentals Learning Path', 'Microsoft Learn', 'The official, free module sequence that prepares you for the AZ-900 certification.', 'beginner', 'free', 'https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/', '🪟', true, false, 0),
  ('learning-path:google-cloud-skills-boost', 'learning-path', 'google-cloud-skills-boost', 'Google Cloud Skills Boost', 'Google Cloud', 'Hands-on labs and structured quests across Google Cloud''s core products and services.', 'intermediate', 'free', 'https://www.cloudskillsboost.google/', '🌩️', false, false, 1),
  ('learning-path:aws-skill-builder-cloud-architecting', 'learning-path', 'aws-skill-builder-cloud-architecting', 'AWS Cloud Architecting Learning Plan', 'AWS Skill Builder', 'A curated sequence of AWS Skill Builder courses building toward the Solutions Architect path.', 'intermediate', 'free', 'https://skillbuilder.aws/', '🏗️', false, false, 2),
  ('learning-path:mdn-learn-web-development', 'learning-path', 'mdn-learn-web-development', 'Learn Web Development', 'MDN Web Docs', 'Mozilla''s structured, free curriculum covering HTML, CSS, JavaScript and modern web tooling.', 'beginner', 'free', 'https://developer.mozilla.org/en-US/docs/Learn', '🦊', true, false, 3),
  ('learning-path:kubernetes-io-learning-paths', 'learning-path', 'kubernetes-io-learning-paths', 'Kubernetes Learning Paths', 'Kubernetes.io', 'The official Kubernetes documentation''s tutorials and concept guides, from basics to production operations.', 'advanced', 'free', 'https://kubernetes.io/docs/tutorials/', '☸️', false, false, 4),

  ('developer-tool:visual-studio-code', 'developer-tool', 'visual-studio-code', 'Visual Studio Code', 'Microsoft', 'A free, extensible source-code editor with rich support for nearly every language and framework.', null, 'free', 'https://code.visualstudio.com/', '🧩', true, false, 0),
  ('developer-tool:git', 'developer-tool', 'git', 'Git', 'Software Freedom Conservancy', 'The distributed version control system almost every modern development workflow is built on.', null, 'free', 'https://git-scm.com/', '🌿', false, false, 1),
  ('developer-tool:github-cli', 'developer-tool', 'github-cli', 'GitHub CLI', 'GitHub', 'Bring GitHub''s pull requests, issues and workflows to your terminal.', null, 'free', 'https://cli.github.com/', '🐙', false, false, 2),
  ('developer-tool:docker-desktop', 'developer-tool', 'docker-desktop', 'Docker Desktop', 'Docker', 'Build, share and run containerized applications and microservices locally.', null, 'free', 'https://www.docker.com/products/docker-desktop/', '🐳', true, false, 3),
  ('developer-tool:postman', 'developer-tool', 'postman', 'Postman', 'Postman, Inc.', 'Design, test and document APIs - one of the most widely used API development tools.', null, 'free', 'https://www.postman.com/', '📮', false, false, 4),
  ('developer-tool:figma', 'developer-tool', 'figma', 'Figma', 'Figma, Inc.', 'Collaborative interface design tool used across the software industry for UI/UX work.', null, 'free', 'https://www.figma.com/', '🎨', false, false, 5),
  ('developer-tool:dbeaver', 'developer-tool', 'dbeaver', 'DBeaver', 'DBeaver Corp', 'A free, universal database tool supporting virtually every major SQL and NoSQL database.', null, 'free', 'https://dbeaver.io/', '🗄️', false, false, 6),
  ('developer-tool:warp-terminal', 'developer-tool', 'warp-terminal', 'Warp', 'Warp', 'A modern, Rust-based terminal with AI command search and collaborative blocks.', null, 'free', 'https://www.warp.dev/', '⌨️', false, false, 7),

  ('cheat-sheet:git-cheat-sheet', 'cheat-sheet', 'git-cheat-sheet', 'Git Cheat Sheet', 'GitHub Education', 'The official quick-reference PDF for everyday Git commands.', null, null, 'https://education.github.com/git-cheat-sheet-education.pdf', '🌿', true, false, 0),
  ('cheat-sheet:docker-cheat-sheet', 'cheat-sheet', 'docker-cheat-sheet', 'Docker Cheat Sheet', 'Docker Docs', 'Official quick reference for the Docker CLI - images, containers, volumes and networks.', null, null, 'https://docs.docker.com/get-started/docker_cheatsheet.pdf', '🐳', true, false, 1),
  ('cheat-sheet:kubectl-cheat-sheet', 'cheat-sheet', 'kubectl-cheat-sheet', 'kubectl Cheat Sheet', 'Kubernetes.io', 'The official Kubernetes documentation''s command reference for kubectl.', null, null, 'https://kubernetes.io/docs/reference/kubectl/cheatsheet/', '☸️', false, false, 2),
  ('cheat-sheet:bash-cheat-sheet', 'cheat-sheet', 'bash-cheat-sheet', 'Bash / Linux Commands', 'devhints.io', 'A concise reference for everyday Bash scripting and Linux shell commands.', null, null, 'https://devhints.io/bash', '🖥️', false, false, 3),
  ('cheat-sheet:regex-cheat-sheet', 'cheat-sheet', 'regex-cheat-sheet', 'Regular Expressions', 'devhints.io', 'A compact reference for regex syntax - anchors, groups, lookaheads and common patterns.', null, null, 'https://devhints.io/regexp', '🔎', false, false, 4),
  ('cheat-sheet:python-cheat-sheet', 'cheat-sheet', 'python-cheat-sheet', 'Python', 'devhints.io', 'Core Python syntax, data structures and standard library quick reference.', null, null, 'https://devhints.io/python', '🐍', false, false, 5),
  ('cheat-sheet:postgresql-cheat-sheet', 'cheat-sheet', 'postgresql-cheat-sheet', 'PostgreSQL', 'PostgreSQL Tutorial', 'A practical reference for everyday PostgreSQL commands and SQL syntax.', null, null, 'https://www.postgresqltutorial.com/postgresql-cheat-sheet/', '🐘', false, false, 6)
on conflict (id) do nothing;

-- file_type for the cheat sheets seeded above (kept as a separate UPDATE
-- rather than a 15th insert column above, to keep the main insert's
-- column list identical to every other resource type's rows).
update public.catalog_items set file_type = 'PDF' where id in ('cheat-sheet:git-cheat-sheet', 'cheat-sheet:docker-cheat-sheet');
update public.catalog_items set file_type = 'Web' where id in ('cheat-sheet:kubectl-cheat-sheet', 'cheat-sheet:bash-cheat-sheet', 'cheat-sheet:regex-cheat-sheet', 'cheat-sheet:python-cheat-sheet', 'cheat-sheet:postgresql-cheat-sheet');

-- steps + estimated_time for the roadmaps (array literals don't fit
-- cleanly in the shared VALUES list above, same reasoning as file_type).
insert into public.catalog_items (id, resource_type, slug, title, provider, description, difficulty, url, emoji, featured, estimated_time, steps, display_order)
values
  ('roadmap:roadmap-frontend', 'roadmap', 'roadmap-frontend', 'Frontend Developer', 'roadmap.sh', 'Step-by-step guide covering HTML/CSS/JavaScript, frameworks, tooling and modern frontend practices.', 'beginner', 'https://roadmap.sh/frontend', '🎯', true, '3-6 months', array['HTML', 'CSS', 'JavaScript', 'React', 'Next.js'], 0),
  ('roadmap:roadmap-backend', 'roadmap', 'roadmap-backend', 'Backend Developer', 'roadmap.sh', 'Languages, databases, APIs, caching, authentication and everything else backend engineers need.', 'intermediate', 'https://roadmap.sh/backend', '🗄️', true, '4-8 months', array['Language', 'Databases', 'APIs', 'Auth', 'Deployment'], 1),
  ('roadmap:roadmap-devops', 'roadmap', 'roadmap-devops', 'DevOps Engineer', 'roadmap.sh', 'CI/CD, containers, orchestration, infrastructure as code, monitoring and cloud platforms.', 'advanced', 'https://roadmap.sh/devops', '🔄', false, '6-12 months', array['Linux', 'Docker', 'CI/CD', 'Kubernetes', 'Monitoring'], 2),
  ('roadmap:roadmap-ai-engineer', 'roadmap', 'roadmap-ai-engineer', 'AI Engineer', 'roadmap.sh', 'LLMs, embeddings, vector databases, prompt engineering and building production AI applications.', 'intermediate', 'https://roadmap.sh/ai-engineer', '🤖', true, '4-8 months', array['Python', 'LLMs', 'Prompting', 'Vector DBs', 'Production'], 3),
  ('roadmap:roadmap-cyber-security', 'roadmap', 'roadmap-cyber-security', 'Cyber Security', 'roadmap.sh', 'Networking fundamentals, threat modeling, offensive/defensive security and career specializations.', 'intermediate', 'https://roadmap.sh/cyber-security', '🛡️', false, '6-12 months', array['Networking', 'Linux', 'Threats', 'Tools', 'Specialization'], 4),
  ('roadmap:roadmap-aws', 'roadmap', 'roadmap-aws', 'AWS', 'roadmap.sh', 'A structured path through AWS''s core services - compute, storage, networking and IAM.', 'intermediate', 'https://roadmap.sh/aws', '☁️', false, '4-8 months', array['IAM', 'EC2', 'S3', 'Lambda', 'VPC'], 5)
on conflict (id) do nothing;
