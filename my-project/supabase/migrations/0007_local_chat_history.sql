-- CONTROL KEY — 0007_local_chat_history
-- Chat history is browser localStorage ONLY (ck_chats_v1 + ck_messages_v1).
-- Run after 0006. Paste into Supabase SQL Editor and Run, or: supabase db push
--
-- DROPPED (not required in Supabase):
--   messages      — full chat history lives on-device now. DROPPED.
--   chat_sessions — titles, model in use + model_config live on-device now. DROPPED.
--
-- KEPT in Supabase:
--   profiles      — display_name (name), age, email
--   control_rules — title, instruction, is_enabled (ON/OFF status)
--
-- Already dropped in 0006: key_vault, feedback, rule_templates.
-- Expected after this migration: profiles, control_rules (+ auth schema).

-- Order matters: messages references chat_sessions, so drop it first.
drop table if exists public.messages cascade;
drop table if exists public.chat_sessions cascade;

-- Re-assert owner-only RLS on the 2 surviving tables (idempotent).
alter table public.profiles enable row level security;
alter table public.control_rules enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own rules" on public.control_rules;
create policy "own rules" on public.control_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_profiles_user on public.profiles (user_id);
create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_rules_user on public.control_rules (user_id, priority asc);
create index if not exists idx_rules_enabled on public.control_rules (user_id, is_enabled);
