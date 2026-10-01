<?php

/**
 * Session/cookie hardening (Agent 4).
 * Cookies are HttpOnly + Secure + SameSite=Lax in every environment so a
 * production misconfiguration can never downgrade them. Secure is forced
 * true here (not env-gated) because Vercel/Render always serve HTTPS;
 * local http://localhost testing still sends Secure cookies from localhost
 * in modern browsers when set via HTTPS — for plain-http local work set
 * SESSION_SECURE_COOKIE=false in backend/.env ONLY (never committed).
 */
return [
    'driver' => env('SESSION_DRIVER', 'cookie'),
    'lifetime' => 120,
    'expire_on_close' => true,
    'encrypt' => true,
    'http_only' => true,
    'same_site' => 'lax',
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN', null),
];
