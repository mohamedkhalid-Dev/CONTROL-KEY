# Sub-agent: PRUNE-FRONTEND (dead code + artifacts)

Scope: `my-project/frontend` — research-only unless primary approves deletion.

## Watch list

1. `.next/`, `tsconfig.tsbuildinfo` — regenerable artifacts. Confirm gitignored, then report safe-delete:yes.
2. `src/components/ui/*` — grep each export; zero imports outside its own file = candidate.
3. `src/components/rules/CreateLockForm.tsx` — Stage-1 stub; candidate only if `RulesPanel` uses `RuleModal`/`TemplateGallery` and grep shows zero imports.
4. Duplicates (`supabaseClient` vs `supabase/client`, `buildRefusal` copies) — report KEEP unless one copy has zero imports AND parity script (`check-prompt-parity.mjs`) reads the other.

## Never report

- `node_modules/`, `.env.local`, `package-lock.json`, `public/og-image.png` (intentional SEO card), dev scripts Vercel ignores.

## Report to primary

`path - reason - evidence (grep hits) - safe-delete? yes/no`, max 10. No secret values.
