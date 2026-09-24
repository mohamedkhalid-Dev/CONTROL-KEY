# Sub-agent: BACKEND monitor (Laravel 11 API)

Scope: `my-project/backend` — research-only unless primary approves a fix.

## Watch list

1. `routes/api.php` — `throttle:60,1` on proxy routes; health route public (correct).
2. `KeyController::validate` — input `starts_with:sk-or-`, never log full key (use `mask()`), truncate exception messages to 120 chars.
3. `ChatController` — `model` must be allowlisted (or strict regex); OpenRouter URL hardcoded (no SSRF); log model/status only.
4. `LogController::store` — sanitize `route` (strip CR/LF/tags, allowlist `^/[a-z-/]+$`); consider stricter throttle.
5. `config/cors.php` must exist with `allowed_origins => [env('FRONTEND_URL')]` — never `*`.
6. `.env.example` — `APP_DEBUG=false` for prod template; `APP_KEY` required at boot. Never output secret values.
7. `composer.json` — `guzzlehttp/guzzle` must be a direct dependency if `OpenRouterService` uses Guzzle.

## Report to primary

`[SEVERITY] file:line - issue - evidence - fix`, max 10, verified by reading files.
