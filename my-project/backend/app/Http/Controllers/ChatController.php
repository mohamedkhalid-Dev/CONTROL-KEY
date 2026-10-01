<?php

namespace App\Http\Controllers;

use App\Services\OpenRouterService;
use App\Services\PromptBuilderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Chat proxy — prepends un-overridable system prompt then streams OpenRouter.
 * Local-key mode (default): frontend calls OpenRouter directly, zero server cost.
 * Cloud-key mode: frontend POSTs here; we decrypt vault key server-side and stream SSE.
 * Never logs full keys or message content unless user opts into improvement.
 */
class ChatController extends Controller
{
    public function chat(Request $request, PromptBuilderService $prompts, OpenRouterService $openRouter)
    {
        $data = $request->validate([
            'messages' => ['required', 'array', 'min:1', 'max:41'],
            'messages.*.role' => ['required', 'in:user,assistant,system'],
            'messages.*.content' => ['required', 'string', 'max:8000'],
            'model' => ['required', 'string', 'max:120'],
            'name' => ['nullable', 'string', 'max:30'],
            'age' => ['nullable', 'integer', 'min:1', 'max:120'],
            'locks' => ['nullable', 'array', 'max:20'],
            'locks.*.title' => ['nullable', 'string', 'max:80'],
            'locks.*.instruction' => ['nullable', 'string', 'max:500'],
            'locks.*.strength' => ['nullable', 'in:strict,guide'],
            'locks.*.priority' => ['nullable', 'integer', 'min:1', 'max:50'],
            // Cloud-key mode REMOVED: keys stay in browser localStorage ONLY.
            // Access control: NEVER trust a client-supplied `user_id` (IDOR).
            // There is no vault lookup here (key_vault dropped, migration 0006),
            // so any `user_id` in the request is untrusted and must be ignored.
            // If a future endpoint needs per-user resources, require auth
            // (Sanctum) and enforce `$request->user()->id === $resource->user_id`
            // or `abort(403)` via OwnerPolicy — never a raw request ID.
            'key' => ['nullable', 'string', 'starts_with:sk-or-', 'min:20', 'max:200'],
        ]);

        $system = $prompts->build(
            $data['name'] ?? 'Student',
            $data['age'] ?? 14,
            $data['locks'] ?? []
        );

        // Platform rule: image generation is prohibited — reply locally, no OpenRouter cost.
        // AI is also aware via system prompt; this guard guarantees the reply.
        $lastUser = '';
        foreach (array_reverse($data['messages']) as $m) {
            if (($m['role'] ?? '') === 'user' && isset($m['content'])) {
                $lastUser = (string) $m['content'];
                break;
            }
        }
        if ($lastUser !== '' && $prompts->asksForImageGeneration($lastUser)) {
            return response()->json([
                'ok' => false,
                'kind' => 'image_blocked',
                'message' => $prompts->imageRefusal(),
            ], 200);
        }

        // QA hook: return built prompt without calling OpenRouter.
        if (config('app.env') === 'local' && $request->boolean('dry')) {
            return response()->json(['ok' => true, 'system' => $system, 'version' => 'v1']);
        }

        // Trim history: last 20, drop any client-sent system (we own the system prompt).
        $history = collect($data['messages'])
            ->where('role', '!=', 'system')
            ->slice(-20)
            ->values()
            ->all();
        $messages = array_merge(
            [['role' => 'system', 'content' => $system]],
            $history
        );

        $key = isset($data['key']) ? trim($data['key']) : null;

        // No vault fallback: keys stay in browser localStorage ONLY (key_vault
        // dropped in migration 0006). A `user_id` without auth proves nothing —
        // reject it explicitly so callers cannot probe other users' objects.
        if ($request->has('user_id')) {
            Log::warning('chat.proxy.user_id_rejected');
            return response()->json([
                'ok' => false,
                'kind' => 'forbidden',
                // Minimal response — no excess fields, no user enumeration.
                'message' => 'Forbidden.',
            ], 403);
        }
        if (!$key) {
            return response()->json([
                'ok' => false,
                'kind' => 'missing_key',
                'message' => 'Paste your key first. Need one? Get it in 2 min.',
            ], 200);
        }

        Log::info('chat.request', ['model' => $data['model']]);

        // 1 retry on 5xx / network blip (OpenRouterService maps 4xx to friendly JSON).
        try {
            return $openRouter->stream($messages, $data['model'], $key);
        } catch (\Throwable $e) {
            Log::warning('chat.proxy.retry', ['msg' => KeyController::redact($e->getMessage())]);
            try {
                return $openRouter->stream($messages, $data['model'], $key);
            } catch (\Throwable $e2) {
                return response()->json([
                    'ok' => false,
                    'kind' => 'unknown',
                    'message' => 'Something went wrong. Try again — your message is saved.',
                ], 200);
            }
        }
    }
}
