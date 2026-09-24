<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Validates + vaults OpenRouter keys.
 * NEVER logs full keys — masked as sk-or-...****1234.
 */
class KeyController extends Controller
{
    public function validate(Request $request)
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'starts_with:sk-or-', 'min:20', 'max:200'],
        ]);

        $key = trim($data['key']);

        try {
            $res = Http::withToken($key)
                ->timeout(15)
                ->get('https://openrouter.ai/api/v1/auth/key');

            if ($res->successful()) {
                return response()->json([
                    'valid' => true,
                    'label' => $res->json('data.label', 'My key'),
                ]);
            }

            Log::info('key.validate.fail', ['status' => $res->status()]);
            return response()->json([
                'valid' => false,
                'message' => $res->status() === 401
                    ? "Hmm, that key didn't work. Check for extra spaces."
                    : "Key check failed. Try again.",
            ], 200);
        } catch (\Throwable $e) {
            Log::warning('key.validate.error', ['msg' => $e->getMessage()]);
            return response()->json([
                'valid' => false,
                'message' => "You're offline. Check connection and retry.",
            ], 200);
        }
    }

    /**
     * DISABLED (minimal-store policy): keys stay in browser localStorage ONLY.
     * key_vault was dropped (migration 0006) — this endpoint always 410 Gone
     * so no key material can ever persist server-side. Frontend no longer calls it.
     */
    public function store(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('vault.store.disabled');
        return response()->json([
            'ok' => false,
            'kind' => 'vault_disabled',
            'message' => 'Cloud key vault is disabled — your key stays in this browser only.',
        ], 410);
    }

    /** Masks key for any log line. */
    public static function mask(string $key): string
    {
        if (strlen($key) < 8) return '••••';
        return 'sk-or-...****' . substr($key, -4);
    }
}
