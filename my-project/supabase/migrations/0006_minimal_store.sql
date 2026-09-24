-- CONTROL KEY — 0006_minimal_store
-- Minimal required storage ONLY. Run after 0001 (+0004/0005 if already applied).
-- Paste into Supabase SQL Editor and Run, or: supabase db push
--
-- REQUIRED (per product spec):
--   profiles:      display_name (name), age, email
--   chat_sessions: title, model (model being used), model_config (temperature/max_tokens)
--   messages:      full chat history (for future use)
--   control_rules: title, instruction, is_enabled (which rules ON/OFF) + strength/priority
--
-- NEVER STORED IN DB:
--   OpenRouter API key (sk-or-...) — browser localStorage `ck_openrouter_key` ONLY.
--   This migration DROPS key_vault so no key material can ever persist server-side.
--
-- DELETED AS NOT REQUIRED:
--   key_vault     — violated "key in localStorage only" rule. DROPPED.
--   feedback      — ratings/comments not in required list. DROPPED.
--   rule_templates— empty by design (custom-only locks); not required. DROPPED.
--
-- NOTE (2026-09-23): applied via Supabase MCP as
-- minimal_store_profiles_email_age + drop_unneeded_vault_feedback_templates.
-- The chat_sessions.model_config step below was SKIPPED: chat history is
-- localStorage-only, so 0007 drops chat_sessions/messages entirely.
-- Verify with:
--   select table_name from information_schema.tables
--   where table_schema='public' order by 1;
-- Expected after 0006+0007: control_rules, profiles.

-- 1) profiles.email — mirror of auth.users.email for display/support.
-- Auth remains the source of truth; this column is convenience only.
alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  drop constraint if exists profiles_email_check;
alter table public.profiles
  add constraint profiles_email_check
  check (email is null or (char_length(email) between 5 and 254));

-- 2) chat_sessions.model_config — model configuration settings per session.
-- Example: {"temperature": 0.7, "max_tokens": 800}
-- Frontend sends temperature 0.3 in Strict Exam mode, else 0.7 (see chat/page.tsx).
alter table public.chat_sessions
  add column if not exists model_config jsonb not null default '{"temperature": 0.7, "max_tokens": 800}';

-- Backfill existing rows that predate the column default.
update public.chat_sessions
set model_config = '{"temperature": 0.7, "max_tokens": 800}'
where model_config is null;

-- 3) Guard: control_rules already has is_enabled (rule ON/OFF status) — assert it.
alter table public.control_rules
  alter column is_enabled set default true;

-- 4) Drop unneeded tables (CASCADE removes their RLS policies + indexes).
-- Order matters: feedback references chat_sessions, so drop it first.
drop table if exists public.feedback cascade;
drop table if exists public.key_vault cascade;
drop table if exists public.rule_templates cascade;

-- 5) Re-assert owner-only RLS on the 4 surviving tables
-- (drops above can't affect these policies, but keep idempotent).
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.control_rules enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own sessions" on public.chat_sessions;
create policy "own sessions" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own messages" on public.messages;
create policy "own messages" on public.messages for all using (
  exists (select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.chat_sessions s where s.id = messages.session_id and s.user_id = auth.uid())
);

drop policy if exists "own rules" on public.control_rules;
create policy "own rules" on public.control_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6) Helpful indexes (idempotent).
create index if not exists idx_profiles_user on public.profiles (user_id);
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_sessions_user_updated on public.chat_sessions (user_id, updated_at desc);
create index if not exists idx_messages_session on public.messages (session_id, created_at asc);
create index if not exists idx_rules_user on public.control_rules (user_id, priority asc);
create index if not exists idx_rules_enabled on public.control_rules (user_id, is_enabled);
