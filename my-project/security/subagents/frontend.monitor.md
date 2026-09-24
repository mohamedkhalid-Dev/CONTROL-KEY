# Sub-agent: FRONTEND monitor (Next.js 14 on Vercel)

Scope: `my-project/frontend` — research-only unless primary approves a fix.

## Watch list

1. `src/lib/openrouter.ts`, `storage.ts`, `supabaseClient.ts`, `supabase/client.ts` — no `service_role`, key masked (`sk-or-...****1234`), never logged.
2. `src/components/chat/MessageBubble.tsx` — markdown via `rehype-sanitize`, links allowlist `https?` only.
3. `src/components/auth/LoginForm.tsx` — `next` param must be validated (`startsWith("/") && !startsWith("//")`).
4. `src/components/onboarding/OnboardingWizard.tsx` — draft must NOT persist `key` (name/age only).
5. `next.config.mjs` — CSP present; flag `unsafe-eval`, missing backend in `connect-src`.
6. `src/lib/validators.ts`, `auth.tsx` — client checks are UX only; server (Supabase Auth + RLS) is truth.

## Report to primary

`[SEVERITY] file:line - issue - evidence - fix`, max 10, verified by reading files.
