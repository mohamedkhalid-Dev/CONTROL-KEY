<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\KeyController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\LogController;

// Public health check
Route::get('/health', [HealthController::class, 'show']);

// AUTH DESIGN NOTE (Agent 3 — passwords & authentication):
// This API is stateless and stores NO passwords. All email/password auth is
// delegated to Supabase Auth, which hashes with bcrypt server-side (never
// MD5/SHA1, never plain-text; no password/hash column exists in public.*).
// Do NOT add a custom users/password column or log passwords.
// If a future Laravel login route is ever needed, it MUST use
// Hash::make (bcrypt/argon2id) + Hash::check and be wrapped in
// Route::middleware('throttle:5,1') for brute-force lockout.
// Supabase Auth already rate-limits sign-in attempts (429); the frontend
// honors Retry-After with a submit cooldown (see LoginForm + LoginStep).

// Rate-limited proxy routes (60/min/IP via throttle middleware)
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/validate-key', [KeyController::class, 'validate']);
    // REMOVED (minimal-store policy): /vault/store deleted — OpenRouter keys
    // stay in browser localStorage ONLY, never in Supabase (key_vault dropped
    // in migration 0006). Any call now returns 410 Gone (see KeyController::store).
    Route::post('/vault/store', [KeyController::class, 'store']);
    Route::post('/chat', [ChatController::class, 'chat']);
    Route::post('/chat/proxy', [ChatController::class, 'chat']);
    // REMOVED: /feedback deleted — feedback table dropped as not required
    // (migration 0006). Returns 410 Gone (see FeedbackController::store).
    Route::post('/feedback', [FeedbackController::class, 'store']);
    Route::post('/log', [LogController::class, 'store']);
});
