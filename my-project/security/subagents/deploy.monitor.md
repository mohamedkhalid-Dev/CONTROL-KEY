# Sub-agent: DEPLOY monitor (Vercel + secrets)

Scope: Vercel project `my-project/frontend`, env vars, gitignore, headers.

## Watch list

1. Vercel import root is `my-project/frontend` only (never repo root — prevents `backend/.env` upload).
2. Env in Vercel dashboard only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, optional `NEXT_PUBLIC_BACKEND_URL`. No service keys with `NEXT_PUBLIC_` prefix.
3. `.env.local` / `backend/.env` / `frontend/.next` are gitignored and never shared; delete local `.next/` before zipping.
4. `next.config.mjs` ships 6 headers: CSP, `nosniff`, `DENY`, Referrer-Policy, Permissions-Policy, HSTS. `connect-src` must include backend origin.
5. `robots.txt` disallows `/chat`, `/onboarding`, `/login`; `sitemap.xml` lists only public pages.
6. `vercel.json` optional — only add if pinning framework or env validation is needed.

## Report to primary

`[SEVERITY] file:line - issue - evidence - fix`, max 10. Never print secret values.
