<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Thin OpenRouter forwarder — Stage 4 streams chat completions.
 * Never logs full keys or chat content unless user opts into improvement.
 */
class OpenRouterService
{
    public const BASE = 'https://openrouter.ai/api/v1';

    /**
     * Shown when the selected OpenRouter model itself is broken/unclear
     * (no endpoints, provider 5xx, unknown model, empty stream, SSE error).
     * Exact copy required by product — keep in sync with frontend
     * MODEL_ISSUE_MESSAGE in src/lib/openrouter.ts.
     */
    public const MODEL_ISSUE_MESSAGE = 'It appears there is currently an issue with this OpenRouter model; please select a different one.';

    public function chat(array $messages, string $model, string $userKey): array
    {
        $res = Http::withHeaders([
                'HTTP-Referer' => config('services.openrouter.referer', 'https://controlkey-gbqs40uak-show16.vercel.app'),
                'X-Title' => 'Control Key',
            ])
            ->withToken($userKey)
            ->timeout(60)
            ->post(self::BASE . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'stream' => false,
                'temperature' => 0.7,
                'max_tokens' => 800,
            ]);

        $status = $res->status();
        if ($status === 402) {
            return ['error' => 'credit', 'message' => 'This model needs credit. Switch to a FREE model?'];
        }
        if ($status === 429) {
            return ['error' => 'rate', 'message' => 'Rate limited. Wait 20 seconds.'];
        }
        if (in_array($status, [400, 404, 422, 500, 502, 503, 504, 529], true)) {
            return ['ok' => false, 'kind' => 'model_issue', 'error' => 'model_issue', 'message' => self::MODEL_ISSUE_MESSAGE];
        }
        if (!$res->successful()) {
            $detail = $this->extractDetail($res->json());
            if ($detail !== null && $this->looksLikeModelIssue($detail)) {
                return ['ok' => false, 'kind' => 'model_issue', 'error' => 'model_issue', 'message' => self::MODEL_ISSUE_MESSAGE];
            }
        }

        return $res->json() ?? ['error' => 'unknown'];
    }

    /**
     * Streams OpenRouter SSE straight through to the browser.
     * Called by ChatController after system prompt is prepended.
     * Maps upstream 401/402/429 to friendly JSON (not raw) when
     * the stream hasn't started yet. Unclear model/provider failures
     * (400/404/5xx, "No endpoints", empty stream) map to kind=model_issue
     * with the product-required notice.
     */
    public function stream(array $messages, string $model, string $userKey): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $referer = (string) config('services.openrouter.referer', 'https://controlkey-gbqs40uak-show16.vercel.app');

        // Use Guzzle directly so we can pipe SSE chunks without buffering.
        $client = new \GuzzleHttp\Client(['timeout' => 60, 'connect_timeout' => 10, 'stream' => true]);

        try {
            $upstream = $client->post(self::BASE . '/chat/completions', [
                'headers' => [
                    'Authorization' => 'Bearer ' . trim($userKey),
                    'Content-Type' => 'application/json',
                    'HTTP-Referer' => $referer,
                    'X-Title' => 'Control Key',
                ],
                'json' => [
                    'model' => $model,
                    'messages' => $messages,
                    'stream' => true,
                    'temperature' => 0.7,
                    'max_tokens' => 800,
                ],
            ]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $status = $e->getResponse()?->getStatusCode() ?? 500;
            $detail = $this->readGuzzleDetail($e);
            Log::info('chat.proxy.client_error', ['status' => $status, 'model' => $model]);
            return response()->json($this->friendlyError($status, $detail), $status >= 400 && $status < 500 ? $status : 200);
        } catch (\GuzzleHttp\Exception\ServerException $e) {
            $status = $e->getResponse()?->getStatusCode() ?? 502;
            $detail = $this->readGuzzleDetail($e);
            Log::warning('chat.proxy.model_issue', ['status' => $status, 'model' => $model]);
            return response()->json($this->friendlyError($status, $detail), 200);
        } catch (\GuzzleHttp\Exception\BadResponseException $e) {
            $status = $e->getResponse()?->getStatusCode() ?? 500;
            $detail = $this->readGuzzleDetail($e);
            Log::warning('chat.proxy.bad_response', ['status' => $status, 'model' => $model]);
            return response()->json($this->friendlyError($status, $detail), 200);
        } catch (\GuzzleHttp\Exception\ConnectException $e) {
            Log::warning('chat.proxy.connect', ['msg' => substr($e->getMessage(), 0, 120)]);
            return response()->json(['ok' => false, 'kind' => 'offline', 'message' => "You're offline. I saved your draft. Reconnect and hit Retry."], 200);
        } catch (\Throwable $e) {
            Log::warning('chat.proxy.error', ['msg' => substr($e->getMessage(), 0, 120)]);
            return response()->json(['ok' => false, 'kind' => 'unknown', 'message' => 'Something went wrong. Try again — your message is saved.'], 200);
        }

        if ($upstream->getStatusCode() !== 200) {
            return response()->json($this->friendlyError($upstream->getStatusCode()), 200);
        }

        $body = $upstream->getBody();
        return response()->stream(function () use ($body) {
            while (!$body->eof()) {
                echo $body->read(1024);
                if (ob_get_level() > 0) ob_flush();
                flush();
            }
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    /** Error map — never leaks upstream JSON. */
    private function friendlyError(int $status, ?string $detail = null): array
    {
        if ($status === 401 || $status === 403) {
            return ['ok' => false, 'kind' => 'invalid_key', 'message' => "That key didn't work. Check for extra spaces or create a new one. Your chats are safe."];
        }
        if ($status === 402) {
            return ['ok' => false, 'kind' => 'needs_credit', 'message' => 'This model needs credit. Switch to a FREE model below — one tap and you\'re back.'];
        }
        if ($status === 429) {
            return ['ok' => false, 'kind' => 'rate_limit', 'message' => 'Rate limited. Wait 20 seconds. Your message is saved — retry soon.'];
        }
        if (in_array($status, [400, 404, 422, 500, 502, 503, 504, 529], true)) {
            return ['ok' => false, 'kind' => 'model_issue', 'message' => self::MODEL_ISSUE_MESSAGE];
        }
        if ($detail !== null && $detail !== '' && $this->looksLikeModelIssue($detail)) {
            return ['ok' => false, 'kind' => 'model_issue', 'message' => self::MODEL_ISSUE_MESSAGE];
        }
        // Status 0 = error envelope inside a 200 SSE stream — inherently unclear.
        if ($status === 0) {
            return ['ok' => false, 'kind' => 'model_issue', 'message' => self::MODEL_ISSUE_MESSAGE];
        }
        return ['ok' => false, 'kind' => 'unknown', 'message' => 'Something went wrong. Try again — your message is saved.'];
    }

    /** Heuristic: upstream text points at the model/provider, not key/credit. */
    private function looksLikeModelIssue(string $text): bool
    {
        $t = strtolower($text);
        foreach (['no endpoints', 'no available', 'model not found', 'invalid model', 'unknown model', 'model is', 'provider', 'upstream', 'overloaded', 'temporarily', 'not available', 'disabled', 'deprecated', 'context length', 'does not exist'] as $needle) {
            if (str_contains($t, $needle)) return true;
        }
        return false;
    }

    /** Pulls a short error string out of a decoded JSON payload. */
    private function extractDetail(mixed $json): ?string
    {
        if (!is_array($json)) return null;
        $err = $json['error'] ?? $json['message'] ?? null;
        if (is_string($err) && $err !== '') return substr($err, 0, 2000);
        if (is_array($err)) {
            $msg = $err['message'] ?? $err['code'] ?? null;
            if (is_string($msg) && $msg !== '') return substr($msg, 0, 2000);
            if (is_numeric($msg)) return (string) $msg;
        }
        return null;
    }

    /** Reads up to 2KB of the upstream error body for classification only (never returned). */
    private function readGuzzleDetail(\GuzzleHttp\Exception\BadResponseException $e): ?string
    {
        try {
            $body = (string) $e->getResponse()?->getBody();
            if ($body === '') return null;
            $body = substr($body, 0, 2000);
            $decoded = json_decode($body, true);
            if (is_array($decoded)) {
                $detail = $this->extractDetail($decoded);
                if ($detail !== null) return $detail;
            }
            return $body;
        } catch (\Throwable) {
            return null;
        }
    }
}
