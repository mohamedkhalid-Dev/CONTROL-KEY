-- CONTROL KEY — 0008_access_control_hardening
-- Access Control (Agent 2): re-assert owner-only RLS so no endpoint can
-- expose another user's rows by ID (IDOR). Idempotent — safe to re-run.
-- Final enforcer is the DB: USING (auth.uid() = user_id) WITH CHECK same.
-- App layer (frontend owner.ts assertOwner + Laravel OwnerPolicy) fails fast,
-- but RLS guarantees 403-equivalent even if a caller forgets the check.
--
-- Expected tables after 0006+0007: profiles, control_rules only.

alter table public.profiles enable row level security;
alter table public.control_rules enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Legacy alias seen on production ("own profile only") enforces the same
-- rule; drop it to keep a single canonical policy name.
drop policy if exists "own profile only" on public.profiles;

drop policy if exists "own rules" on public.control_rules;
create policy "own rules" on public.control_rules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
