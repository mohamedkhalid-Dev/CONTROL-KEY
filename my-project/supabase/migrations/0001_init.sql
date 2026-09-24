-- CONTROL KEY Stage 1 — 0001_init
-- Creates all tables with RLS. Service role bypasses RLS for seeding only.
-- Run: supabase db push (or paste into Supabase SQL editor)

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1) profiles: one row per student (no password; key NOT stored here by default)
create table if not exists public.profiles (
  user_id uuid primary key default gen_random_uuid(),
  display_name text not null check (char_length(display_name) between 2 and 30),
  age int not null check (age between 1 and 120),
  avatar_color text not null default '#4F46E5',
  theme text not null default 'auto' check (theme in ('light','dark','auto')),
  font_size text not null default 'm' check (font_size in ('s','m','l')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) chat_sessions: sidebar history
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null default 'New chat',
  model text not null default 'meta-llama/llama-3.1-8b-instruct:free',
  total_tokens int not null default 0,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) messages: full history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens int not null default 0,
  model text,
  created_at timestamptz not null default now()
);

-- 4) control_rules: the LOCKS — USER-CREATED FIRST.
-- Concept: the STUDENT writes their own rules from scratch (blank Title + Instruction).
-- Templates (table 5) are OPTIONAL ideas only — user can copy one into here,
-- but the app works perfectly with ZERO templates. No FK to templates on purpose.
create table if not exists public.control_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  title text not null,
  instruction varchar(500) not null check (char_length(instruction) between 10 and 500),
  is_enabled boolean not null default true,
  strength text not null default 'guide' check (strength in ('strict','guide')),
  category text not null default 'Custom',
  priority int not null default 0,
  violation_count int not null default 0,
  origin text not null default 'custom' check (origin in ('custom','from_template')),
  source_template_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5) rule_templates: OPTIONAL idea gallery (safe to leave empty).
-- The student is NEVER forced to pick from these. UI shows "Write your own lock"
-- first, templates collapsed under "Need ideas?". No RLS write for users.
create table if not exists public.rule_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  instruction text not null,
  category text not null default 'Custom',
  age_min int not null default 10,
  age_max int not null default 20,
  strength text not null default 'guide' check (strength in ('strict','guide')),
  uses_count int not null default 0
);

-- 6) feedback
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(user_id) on delete set null,
  session_id uuid references public.chat_sessions(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- 7) key_vault: ONLY if user opts into cloud (encrypted blob via Laravel)
create table if not exists public.key_vault (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  encrypted_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast sidebar load
create index if not exists idx_sessions_user_updated on public.chat_sessions (user_id, updated_at desc);
create index if not exists idx_messages_session on public.messages (session_id, created_at asc);
create index if not exists idx_rules_user on public.control_rules (user_id, priority asc);

-- Enable RLS on everything
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.control_rules enable row level security;
alter table public.rule_templates enable row level security;
alter table public.feedback enable row level security;
alter table public.key_vault enable row level security;

-- Owner-only policies (auth.uid() = user_id). Service role bypasses for admin/seed.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sessions" on public.chat_sessions;
create policy "own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- messages inherit ownership via parent session
drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages for all using (
  exists (select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);

drop policy if exists "own rules" on public.control_rules;
create policy "own rules" on public.control_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own feedback" on public.feedback;
create policy "own feedback" on public.feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own vault" on public.key_vault;
create policy "own vault" on public.key_vault
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Templates: public read, write via service role only
drop policy if exists "public read templates" on public.rule_templates;
create policy "public read templates" on public.rule_templates for select using (true);

-- Updated-at trigger helper
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_sessions_touch on public.chat_sessions;
create trigger trg_sessions_touch before update on public.chat_sessions
  for each row execute function public.touch_updated_at();
drop trigger if exists trg_rules_touch on public.control_rules;
create trigger trg_rules_touch before update on public.control_rules
  for each row execute function public.touch_updated_at();
