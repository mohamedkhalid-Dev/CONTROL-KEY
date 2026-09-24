# Sub-agent: PRUNE-DEPLOY (Vercel payload)

Scope: Vercel import root `my-project/frontend` — research-only.

## Watch list

1. `.next/` — safe-delete locally, excluded via gitignore, Vercel rebuilds.
2. `tsconfig.tsbuildinfo`, `*.log` — safe-delete + must be gitignored.
3. `node_modules/`, `backend/vendor/` — KEEP local, excluded from deploy (Vercel/`composer install` rebuild).
4. `.env.local`, `backend/.env` — NEVER delete local, never commit; Vercel/Render inject separately.
5. `package-lock.json` — KEEP, Vercel needs it. `vercel.json` — not needed with correct root directory.

## Report to primary

`path - reason - evidence - safe-delete vs exclude-from-deploy`, max 10. No secret values.
