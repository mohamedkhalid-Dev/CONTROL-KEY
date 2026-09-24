# Sub-agent: SUPABASE monitor (Postgres + RLS)

Scope: `my-project/supabase/migrations` + `frontend/src/lib/supabase` + hooks.

## Watch list

1. Final tables are ONLY `profiles`, `control_rules` (0006 drops `messages`, `chat_sessions`, `key_vault`, `feedback`, `rule_templates`).
2. RLS enabled with owner-only policies `auth.uid() = user_id` on both tables; verify after every migration + via Dashboard advisors.
3. `rules.ts::deleteRule(id)` must scope `.eq("user_id", userId)` — defense-in-depth beyond RLS.
4. `upsertProfile` / `upsertRule` must assert `getUser().id === userId` before write.
5. No `service_role` in `frontend/src`; anon key only via `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. `touch_updated_at()` must use `security invoker set search_path=public`.

## Report to primary

`[SEVERITY] file:line - issue - evidence - fix`, max 10, verified by reading files.
