<?php

/**
 * CORS — single-origin allowlist (Agent 4 hardening).
 * NEVER use '*' together with supports_credentials=true.
 * FRONTEND_URL is the only allowed origin (prod: https://controlkey.vercel.app,
 * local: http://localhost:3000). Wire in bootstrap/app.php (Laravel 11):
 *   ->withMiddleware(fn (Middleware $m) => $m->validateCsrfTokens()->prepend(\App\Http\Middleware\CorsAllowlist::class))
 * or install fruitcake/laravel-cors with 'allowed_origins' => [env('FRONTEND_URL')].
 */
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST'],
    'allowed_origins' => [env('FRONTEND_URL', 'https://controlkey.vercel.app')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Accept', 'Authorization'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
