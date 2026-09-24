/**
 * OpenRouter helpers — validation + streaming chat (Stage 4).
 * Key never logged in full. All errors mapped to kid-friendly messages.
 */

export const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

export interface ChatModel {
  id: string;
  label: string;
  free: boolean;
}

export const CHAT_MODELS: ChatModel[] = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B", free: true },
  { id: "google/gemini-flash-1.5:free", label: "Gemini Flash 1.5", free: true },
  { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B", free: true },
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini", free: false },
];

/** Fallback list used when the live OpenRouter catalog can't be reached. */
export const FALLBACK_MODELS: ChatModel[] = CHAT_MODELS;

/** Back-compat for Stage 3 imports. */
export const FREE_MODELS = CHAT_MODELS.filter((m) => m.free);

export const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

/** Raw shape returned by GET /models (only fields we use). */
export interface OpenRouterApiModel {
  id: string;
  name?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

function isFreeApiModel(m: OpenRouterApiModel): boolean {
  if (m.id.endsWith(":free")) return true;
  const p = m.pricing?.prompt;
  const c = m.pricing?.completion;
  // OpenRouter marks free models with zero pricing ("0").
  if (p !== undefined && c !== undefined) return p === "0" && c === "0";
  return false;
}

let modelsCache: { at: number; models: ChatModel[] } | null = null;
const MODELS_CACHE_TTL = 60 * 60 * 1000; // 1h — catalog is large, avoid refetching

/**
 * Live OpenRouter catalog: GET https://openrouter.ai/api/v1/models
 * Sorted by name, mapped to { id, label, free }. Cached 1h in-memory.
 * Throws on network / non-2xx — callers fall back to FALLBACK_MODELS.
 */
export async function loadOpenRouterModels(signal?: AbortSignal): Promise<ChatModel[]> {
  if (modelsCache && Date.now() - modelsCache.at < MODELS_CACHE_TTL) {
    return modelsCache.models;
  }
  const res = await fetch(`${OPENROUTER_BASE}/models`, { signal });
  if (!res.ok) throw new Error(`Model list failed (${res.status})`);
  const json = await res.json().catch(() => ({}));
  const data: OpenRouterApiModel[] = Array.isArray(json?.data) ? json.data : [];
  const models: ChatModel[] = data
    .filter((m) => typeof m?.id === "string" && m.id.length > 0)
    .map((m) => ({
      id: m.id,
      label: m.name?.trim() || m.id,
      free: isFreeApiModel(m),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
  modelsCache = { at: Date.now(), models };
  return models;
}

/** Clears the in-memory model catalog (tests / manual refresh). */
export function clearOpenRouterModelsCache(): void {
  modelsCache = null;
}

export interface KeyCheck {
  valid: boolean;
  label?: string;
  message: string;
}

/** Validates a user key via OpenRouter auth/key. Masks key in any error. Cached 10 min per key. */
const keyCache = new Map<string, { at: number; result: KeyCheck }>();
export async function validateOpenRouterKey(key: string): Promise<KeyCheck> {
  const trimmed = key.trim();
  const cached = keyCache.get(trimmed);
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.result;
  try {
    const res = await fetch(`${OPENROUTER_BASE}/auth/key`, {
      headers: { Authorization: `Bearer ${trimmed}` },
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const result: KeyCheck = {
        valid: true,
        label: data?.data?.label ?? "My key",
        message: "Connected.",
      };
      keyCache.set(trimmed, { at: Date.now(), result });
      return result;
    }
    if (res.status === 401)
      return {
        valid: false,
        message: "That key didn't work. Check for extra spaces or create a new one.",
      };
    if (res.status === 402)
      return {
        valid: false,
        message: "This key needs credit. Free models still work!",
      };
    return { valid: false, message: `Key check failed (${res.status}). Try again.` };
  } catch {
    return {
      valid: false,
      message: "You're offline. Your draft is saved. Check connection and retry.",
    };
  }
}

/** Rough token estimate shown live in UI: ~chars/4. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface ChatHistoryMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

export type StreamErrorKind =
  | "invalid_key"
  | "needs_credit"
  | "rate_limit"
  | "model_issue"
  | "offline"
  | "timeout"
  | "unknown";

export interface StreamError {
  kind: StreamErrorKind;
  /** Kid-friendly message — render directly, never raw JSON. */
  message: string;
}

/**
 * Shown when the selected OpenRouter model itself is broken/unclear
 * (no endpoints, provider 5xx, unknown model, empty stream, SSE error).
 * Exact copy required by product — keep in sync with backend
 * OpenRouterService::MODEL_ISSUE_MESSAGE.
 */
export const MODEL_ISSUE_MESSAGE =
  "It appears there is currently an issue with this OpenRouter model; please select a different one.";

function modelIssue(): StreamError {
  return { kind: "model_issue", message: MODEL_ISSUE_MESSAGE };
}

/** Heuristic: does an upstream error string point at the model/provider (not key/credit)? */
function looksLikeModelIssue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("no endpoints") ||
    t.includes("no available") ||
    t.includes("model not found") ||
    t.includes("invalid model") ||
    t.includes("unknown model") ||
    t.includes("model is") ||
    t.includes("provider") ||
    t.includes("upstream") ||
    t.includes("overloaded") ||
    t.includes("temporarily") ||
    t.includes("not available") ||
    t.includes("disabled") ||
    t.includes("deprecated") ||
    t.includes("context length") ||
    t.includes("does not exist")
  );
}

function mapStatusToError(status: number, detail?: string): StreamError {
  if (status === 401 || status === 403)
    return {
      kind: "invalid_key",
      message:
        "That key didn't work. Check for extra spaces or create a new one. Your chats are safe.",
    };
  if (status === 402)
    return {
      kind: "needs_credit",
      message:
        "This model needs credit. Switch to a FREE model below — one tap and you're back.",
    };
  if (status === 429)
    return {
      kind: "rate_limit",
      message:
        "Rate limited. Wait 20 seconds. Your message is saved — retry shortly.",
    };
  // Unclear model/provider failures: bad model id, no endpoints, provider 5xx.
  if (
    status === 400 ||
    status === 404 ||
    status === 422 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    status === 529
  )
    return modelIssue();
  // Any other non-2xx carrying a model/provider hint is also a model issue,
  // otherwise callers treat it as unknown.
  if (detail && looksLikeModelIssue(detail)) return modelIssue();
  return {
    kind: "unknown",
    message: "Something went wrong. Try again — your message is saved.",
  };
}

/**
 * Streams a chat completion token-by-token via SSE.
 * Trims history to last 20 msgs (~6000 tokens) before sending.
 * Throws StreamError (friendly) — never raw stack.
 */
export async function streamChat(opts: {
  key: string;
  model: string;
  systemPrompt: string;
  history: ChatHistoryMsg[];
  signal: AbortSignal;
  onToken: (delta: string) => void;
  /** 0.7 default; 0.3 in Strict exam mode (§10) for steadier quizzes. */
  temperature?: number;
}): Promise<{ fullText: string }> {
  const { key, model, systemPrompt, history, signal, onToken, temperature = 0.7 } = opts;

  // Last-20 + ~6000 token cap (chars/4 approx)
  const trimmed: ChatHistoryMsg[] = [];
  let budget = 6000;
  for (let i = history.length - 1; i >= 0 && trimmed.length < 20; i--) {
    const m = history[i];
    const cost = estimateTokens(m.content);
    if (budget - cost < 0 && trimmed.length > 0) break;
    budget -= cost;
    trimmed.unshift(m);
  }

  let res: Response;
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 60000);
    // Link outer abort (Stop button) to inner fetch
    signal.addEventListener("abort", () => ctrl.abort(), { once: true });

    res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key.trim()}`,
        "HTTP-Referer": "https://controlkey.vercel.app",
        "X-Title": "Control Key",
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature,
        max_tokens: 800,
        messages: [{ role: "system", content: systemPrompt }, ...trimmed],
      }),
    });
    clearTimeout(timeout);
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e; // Stop button — caller handles silently
    if (!navigator.onLine)
      throw { kind: "offline", message: "You're offline. Your draft is saved. Reconnect and select Retry." } as StreamError;
    throw { kind: "timeout", message: "The response is taking too long. Select Stop, then Retry or a simpler model." } as StreamError;
  }

  if (!res.ok) {
    // Read the error payload (if any) to tell key/credit issues apart from
    // unclear model/provider failures. Never surface raw JSON to the user.
    let detail = "";
    try {
      const text = await res.text();
      detail = text.slice(0, 2000);
      try {
        const parsed = JSON.parse(text);
        const errMsg =
          parsed?.error?.message ?? parsed?.message ?? parsed?.error ?? "";
        if (typeof errMsg === "string" && errMsg) detail = errMsg.slice(0, 2000);
      } catch {
        // non-JSON error body — keep raw text for heuristic below
      }
    } catch {
      // body unreadable — fall back to status-only mapping
    }
    throw mapStatusToError(res.status, detail);
  }

  // SSE parse: "data: {choices:[{delta:{content}}]}" chunks
  const reader = res.body?.getReader();
  if (!reader) throw modelIssue();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  let gotToken = false;
  let lastBeat = Date.now();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data:")) continue;
      const payload = t.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        // OpenRouter can return 200 with an error envelope instead of tokens,
        // e.g. {"error":{"message":"No endpoints found...","code":404}}.
        // That is unclear to users — surface the model-issue notice.
        if (json?.error) {
          const msg =
            typeof json.error === "string"
              ? json.error
              : (json.error?.message ?? json.error?.code ?? "");
          reader.cancel().catch(() => {});
          const mapped = mapStatusToError(
            typeof json.error?.code === "number" ? json.error.code : 0,
            String(msg ?? "")
          );
          // An error envelope inside a 200 stream is inherently unclear —
          // default to the model-issue notice unless it's clearly key/credit/rate.
          throw mapped.kind === "unknown" ? modelIssue() : mapped;
        }
        const delta: string =
          json?.choices?.[0]?.delta?.content ??
          json?.choices?.[0]?.message?.content ??
          "";
        if (delta) {
          gotToken = true;
          lastBeat = Date.now();
          fullText += delta;
          onToken(delta);
        } else if (
          typeof json?.choices !== "undefined" &&
          (!Array.isArray(json.choices) || json.choices.length === 0)
        ) {
          // Well-formed SSE but no usable choice — provider/model misbehaving.
          reader.cancel().catch(() => {});
          throw modelIssue();
        }
      } catch (e) {
        // Re-throw friendly StreamErrors; ignore partial JSON only.
        const kind = (e as StreamError)?.kind;
        if (
          kind === "model_issue" ||
          kind === "invalid_key" ||
          kind === "needs_credit" ||
          kind === "rate_limit" ||
          kind === "offline" ||
          kind === "timeout" ||
          kind === "unknown"
        )
          throw e;
        // partial JSON chunk — wait for more
      }
    }
    // Stall guard: 15s without a token
    if (gotToken && Date.now() - lastBeat > 15000) {
      reader.cancel().catch(() => {});
      throw { kind: "timeout", message: "The response is taking too long. Select Stop, then Retry or a simpler model." } as StreamError;
    }
    if (signal.aborted) {
      reader.cancel().catch(() => {});
      throw new DOMException("Aborted", "AbortError");
    }
  }
  // Stream ended with zero tokens and no explicit error — the selected model
  // silently failed. Tell the user to pick a different model (not "retry").
  if (!gotToken || !fullText.trim()) throw modelIssue();
  return { fullText };
}

/** Demo-mode canned reply — no key needed, teaches with hints. */
export function getDemoReply(userText: string): string {
  const t = userText.toLowerCase();
  if (/photo|synth|hint 1/i.test(userText) || t.includes("photosynthesis"))
    return "**Hint 1:** Plants produce food with sunlight, water, and air.\n\n**Hint 2:** Chlorophyll captures the sunlight.\n\n**Your turn:** Which gas do you think plants take in? Try one guess.";
  if (/\d/.test(t) && (t.includes("solve") || t.includes("math") || t.includes("x=")))
    return "Your demo lock is ON, so I can't solve it directly — but here's **Hint 1:** try the first step alone.\n\nWhat do you get? Share it and I'll guide you further.";
  return "**Hint 1:** Break it into one small step first.\n\n**Your turn:** Tell me what you tried — I'll guide you from there. Add your key for full answers.";
}
