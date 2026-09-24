<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/** DISABLED: feedback table dropped as not required (migration 0006). */
class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        return response()->json([
            'ok' => false,
            'kind' => 'feedback_disabled',
            'message' => 'Feedback storage is disabled — reports stay on your device.',
        ], 410);
    }
}
