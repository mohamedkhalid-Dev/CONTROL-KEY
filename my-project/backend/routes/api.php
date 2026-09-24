<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\KeyController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\LogController;

// Public health check
Route::get('/health', [HealthController::class, 'show']);

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
