# Sub-agent: PRUNE-SUPABASE-DOCS (migrations + docs)

Scope: `my-project/supabase/migrations` + repo docs — research-only.

## Rules

1. Migrations are append-only. Empty/patch files (`0002`, `0003`, `0005`) are SQUASH candidates ONLY on a confirmed-fresh remote. Default report: safe-delete:no.
2. `0001`/`0004`/`0006`/`0007` — never delete individually; only a full verified squash to one clean file.
3. Docs (`PROJECT MAP.md`, `frontend/README.md` boilerplate, `backend/README-STUB.md`) live outside the Vercel root or are harmless. Default: KEEP (archive later, not a deploy blocker).
4. `my-project/README.md` drift (migration list, missing roadmap ref) — report as FIX, not delete.

## Report to primary

`path - reason - evidence - safe-delete? yes/no`, max 10.
