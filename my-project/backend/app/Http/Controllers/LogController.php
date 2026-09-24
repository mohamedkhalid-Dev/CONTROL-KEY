<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Anonymous error log — stores error ID + route + code. NEVER PII or keys.
 */
class LogController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string', 'max:40'],
            'route' => ['required', 'string', 'max:200'],
            'code' => ['nullable', 'string', 'max:20'],
        ]);

        Log::info('client.error', $data);
        return response()->json(['ok' => true]);
    }
}
