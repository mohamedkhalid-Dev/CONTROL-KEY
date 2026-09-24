"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ArrowDown, Square } from "lucide-react";
import { ChatEmptyState } from "@/components/chat/ChatEmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import type { ChatMessage } from "@/hooks/useChats";
import type { StreamError } from "@/lib/openrouter";

// Markdown + KaTeX are heavy — split into async chunk so /chat
// interactive shell (sidebar + input) paints first.
const MessageBubble = dynamic(
  () => import("@/components/chat/MessageBubble").then((m) => m.MessageBubble),
  {
    ssr: false,
    loading: () => (
      <div className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" aria-label="Loading message" />
    ),
  }
);

/** Short bold prefix per error kind — professional, plain language. */
function errorTitle(kind: StreamError["kind"]): string {
  if (kind === "invalid_key") return "Key didn't work";
  if (kind === "needs_credit") return "This model needs credit";
  if (kind === "rate_limit") return "Too fast — please wait";
  if (kind === "model_issue") return "Model issue";
  if (kind === "offline") return "You're offline";
  if (kind === "timeout") return "AI is taking too long";
  return "Something went wrong";
}

/**
 * ChatWindow — message list + auto-scroll + Jump pill + Stop + banners.
 * Pure UI: streaming state + send logic live in page.tsx.
 */
export function ChatWindow({
  messages,
  streamingText,
  isStreaming,
  onStop,
  error,
  onRetry,
  onSwitchFree,
  showFreeSwitch,
  retryCountdown,
  onPickSuggestion,
  onRegenerate,
  onFeedback,
}: {
  messages: ChatMessage[];
  streamingText: string;
  isStreaming: boolean;
  onStop: () => void;
  error: StreamError | null;
  onRetry: () => void;
  onSwitchFree: () => void;
  showFreeSwitch: boolean;
  /** Rate-limit auto-retry countdown seconds (Error Matrix #4). */
  retryCountdown?: number | null;
  onPickSuggestion: (text: string) => void;
  onRegenerate: () => void;
  onFeedback: (good: boolean, messageId: string) => void;
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [stuckUp, setStuckUp] = React.useState(false);

  // Auto-scroll while streaming or new message — unless user scrolled up
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || stuckUp) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, streamingText, stuckUp]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStuckUp(dist > 120);
  }
  function jumpLatest() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStuckUp(false);
  }

  const visibleStreaming = isStreaming && streamingText;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        aria-live="polite"
        aria-label="Messages"
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6"
      >
        {messages.length === 0 && !visibleStreaming ? (
          <ChatEmptyState onPick={onPickSuggestion} />
        ) : (
          <>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRegenerate={m.role === "assistant" ? onRegenerate : undefined}
                onFeedback={(good) => onFeedback(good, m.id)}
              />
            ))}
            {visibleStreaming && (
              <MessageBubble
                message={{
                  id: "streaming",
                  sessionId: "live",
                  role: "assistant",
                  content: streamingText || "Thinking…",
                  tokens: 0,
                  createdAt: new Date().toISOString(),
                }}
                streaming
              />
            )}
          </>
        )}

        {error && (
          <div className="mx-auto max-w-xl">
            <ErrorBanner
              message={`${errorTitle(error.kind)} — ${error.message}`}
              actionLabel={
                error.kind === "needs_credit" && showFreeSwitch
                  ? "Switch to FREE model"
                  : error.kind === "model_issue" && showFreeSwitch
                    ? "Switch to FREE model"
                    : "Retry"
              }
              onAction={
                (error.kind === "needs_credit" || error.kind === "model_issue") && showFreeSwitch
                  ? onSwitchFree
                  : onRetry
              }
            />
            {error.kind === "invalid_key" && (
              <a href="/guide/get-key" className="mt-2 block text-center text-sm font-bold text-[#2563EB] underline">
                Open key guide
              </a>
            )}
            {error.kind === "model_issue" && (
              <p role="status" className="mt-2 text-center text-sm font-bold text-[#64748B]">
                Open the model picker above to try another model.
              </p>
            )}
            {error.kind === "rate_limit" && retryCountdown !== null && retryCountdown !== undefined && (
              <p role="status" className="mt-2 text-center text-sm font-bold text-[#64748B]">
                Retrying in {retryCountdown}s… (draft saved)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Jump to latest */}
      {stuckUp && (
        <button
          type="button"
          onClick={jumpLatest}
          className="absolute bottom-4 left-1/2 flex min-h-[40px] -translate-x-1/2 items-center gap-1 rounded-full bg-[#111827] px-4 text-xs font-bold text-white shadow-lg"
        >
          <ArrowDown size={14} aria-hidden /> Jump to latest
        </button>
      )}

      {/* Stop */}
      {isStreaming && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            className="flex min-h-[48px] items-center gap-2 rounded-full bg-[#111827] px-6 text-sm font-bold text-white shadow-lg"
          >
            <Square size={14} aria-hidden /> Stop
          </button>
        </div>
      )}
    </div>
  );
}
