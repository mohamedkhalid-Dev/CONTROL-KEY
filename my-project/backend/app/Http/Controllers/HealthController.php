<?php

namespace App\Http\Controllers;

/**
 * Health check — GET /api/health returns {ok:true}.
 * No auth, no secrets. Used by Stage 1 deploy gate.
 */
class HealthController extends Controller
{
    public function show()
    {
        return response()->json([
            'ok' => true,
            'service' => 'control-key-backend',
            'version' => '1.0.0-stage1',
        ]);
    }
}
