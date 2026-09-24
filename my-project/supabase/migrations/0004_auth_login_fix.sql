-- CONTROL KEY 0004 — Login fix (why DataStores looked "broken")
-- Root cause: all tables use RLS auth.uid() = user_id, but the app never
-- logged in (random local UUIDs) → every INSERT/SELECT was rejected.
-- Fix: frontend now uses Supabase Auth (email/password + anonymous) so
-- user_id ALWAYS equals auth.uid(). This migration is idempotent and safe
-- to run on fresh or existing DBs. No data loss.
--
-- AFTER running: in Supabase Dashboard → Authentication → Sign In / Sign Up:
--   1) Enable "Email" provider (ON by default, confirm email OFF for kids
--      or ON if you want verification).
--   2) Enable "Anonymous sign-ins" (for 1-click Guest login).
-- Then test: /login → create account → /onboarding → /chat writes succeed.

-- Re-assert owner-only policies (same as 0001, IF-recreated safely).
alter table public.profiles enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.control_rules enable row level security;
alter table public.feedback enable row level security;
alter table public.key_vault enable row level security;
alter table public.rule_templates enable row level security;

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

drop policy if exists "own feedback" on public.feedback;
create policy "own feedback" on public.feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own vault" on public.key_vault;
create policy "own vault" on public.key_vault
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public read templates" on public.rule_templates;
create policy "public read templates" on public.rule_templates for select using (true);

-- Helpful index for login-time profile lookup (chat guard does
-- profiles WHERE user_id = auth.uid()).
create index if not exists idx_profiles_user on public.profiles (user_id);
