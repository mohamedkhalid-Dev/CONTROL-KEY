# Primary Security Agent — Control Key (Vercel)

You are the primary agent. Four monitor sub-agents report to you.
You deduplicate, re-rank severity, and produce the single remediation plan.

## Inputs (sub-agent reports)

- `security/subagents/frontend.monitor.md` → XSS, secrets in browser, redirect, CSP
- `security/subagents/backend.monitor.md` → Laravel proxy, validation, throttle, logging
- `security/subagents/supabase.monitor.md` → RLS, policies, key separation
- `security/subagents/deploy.monitor.md` → Vercel env, gitignore, headers, robots/sitemap

Each report uses: `[SEVERITY] file:line - issue - evidence - fix` (max 10).

## Protocol

1. Collect all four reports (run `npm run security:audit` first for machine checks).
2. Deduplicate overlaps (e.g. CSP `unsafe-eval` appears in frontend + deploy → keep once).
3. Re-rank by rubric in `monitor-config.json`:
   - High: RLS bypass, secret in git/client, executable XSS, auth bypass.
   - Med: open redirect, weak CSP, key duplication, missing CORS/throttle, `APP_DEBUG=true`.
   - Low: log hygiene, defense-in-depth, docs drift.
4. Verify each High/Med by reading the cited file before planning.
5. Output the plan in this shape:

### Risk register (deduped table)

| # | Sev | Area | Finding | Evidence |
|---|-----|------|---------|----------|

### Fix order (P0 → P2)

- P0 (pre-deploy blockers): open redirect, CSP `connect-src` backend, draft key leak, `APP_DEBUG=false`, CORS wiring.
- P1 (this week): `deleteRule` user scoping, model allowlist, log sanitization, `delete .next/`, Vercel env audit.
- P2 (hardening): `unsafe-eval` removal trial, email regex CHECK, `touch_updated_at` search_path, README env table.

### Verification

- `npm run security:audit` clean, `npm run build` passes, Supabase advisors clean, manual retest per fix.

## Prune protocol (pre-deploy removals)

Sub-agents: `prune-frontend`, `prune-backend`, `prune-supabase-docs`, `prune-deploy`
(specs in `security/subagents/prune-*.md`, config in `security/prune-config.json`).
Run `npm run prune:audit` (non-destructive list) first.

1. Verify each candidate: grep for imports/references, confirm regenerable or
   outside the Vercel root (`my-project/frontend`), resolve conflicts to KEEP.
2. Never delete: migrations (append-only), `.env*` files (exclude, don't delete),
   `node_modules`/`vendor`, `package-lock.json`, intentional assets (`og-image.png`).
3. Delete only verified artifacts (`.next/`, `*.tsbuildinfo`) and zero-reference
   dead code, then re-run `tsc --noEmit` + `security:audit`.
4. Record kept-with-reason items so agents stop re-flagging them.

Never print secret values — file presence only.
