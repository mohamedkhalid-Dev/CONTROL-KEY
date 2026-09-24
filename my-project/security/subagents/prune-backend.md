# Sub-agent: PRUNE-BACKEND (stub routes + docs)

Scope: `my-project/backend` — research-only unless primary approves deletion.

## Watch list

1. `README-STUB.md` — docs only, never ships in container. Default: KEEP (holds `laravel new` rebuild steps).
2. Disabled `410 Gone` stubs (`/vault/store`, `/feedback`, `KeyController::store`, `FeedbackController`) — these are intentional API contract. Report safe-delete:no unless primary confirms no old clients need `Gone`.
3. Duplicate `/chat` + `/chat/proxy`, `ChatController` vault branch, empty `app/Models/` — code changes need PHP runtime to test. Report only; primary decides (default KEEP pre-deploy).
4. `.env` (presence only), `vendor/` — never delete locally; verify gitignored.

## Report to primary

`path - reason - evidence - safe-delete? yes/no`, max 10. Never print secret values.
