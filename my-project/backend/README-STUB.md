# Backend — STAGE 1 STUB (why `artisan` is missing)

This folder is an **API reference stub**, not yet a full `laravel new` project.
That's why `php artisan` says `Could not open input file: artisan` — the file
doesn't exist yet, and that's EXPECTED for Stage 1-2.

**You do NOT need backend to finish Stage 1.** Frontend + Supabase are enough.
Frontend calls OpenRouter directly (key in localStorage). Backend is only needed
from Stage 3 (vault) / Stage 4 (chat proxy).

### When you DO want the full backend (Stage 3+)

**Option A — full Laravel (recommended when you get there):**
```bash
# Git Bash (MINGW64):
cd ~/Desktop/Control\ key/my-project
mv backend backend-stub
composer create-project laravel/laravel:^11 backend
cp backend-stub/routes/api.php backend/routes/api.php
cp -r backend-stub/app/Http/Controllers/* backend/app/Http/Controllers/
cp -r backend-stub/app/Services/* backend/app/Services/
cd backend
cp .env.example .env
php artisan key:generate
php artisan serve --port=8000
# test: http://localhost:8000/api/health -> {"ok":true}
```

Also add Supabase + OpenRouter to `config/services.php` (for the encrypted cloud vault + proxy headers):
```php
'supabase' => [
    'url' => env('SUPABASE_URL'),
    'service_key' => env('SUPABASE_SERVICE_KEY'),
],
'openrouter' => [
    'referer' => env('OPENROUTER_REFERER', 'https://controlkey-gbqs40uak-show16.vercel.app'),
    'title' => env('OPENROUTER_TITLE', 'Control Key'),
],
```

**Option B — skip for now:**
Just continue to Stage 2 landing. No backend required.

### Git Bash vs PowerShell cheat-sheet

You ran PowerShell commands inside Git Bash — that's why they failed:

| You typed (PowerShell) | Use in Git Bash instead |
|------------------------|-------------------------|
| `Copy-Item .env.example .env` | `cp .env.example .env` |
| `composer` not found | Install first (below) |

**Install Composer (Windows):**
1. Install PHP 8.2: `winget install -e --id PHP.PHP.8.2` (in PowerShell as Admin, then reopen terminal)
2. Download `Composer-Setup.exe` from getcomposer.org, run it, tick "Add to PATH"
3. Reopen Git Bash: `composer --version` should print version
4. `php --version` should print 8.2+

Then use Git Bash commands above (cp, not Copy-Item).
