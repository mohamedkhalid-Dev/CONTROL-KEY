"use client";

import * as React from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import { Check, Copy, RefreshCw, ThumbsDown, ThumbsUp, Volume2 } from "lucide-react";
import { timeAgo } from "@/lib/time";
import type { ChatMessage } from "@/hooks/useChats";

import "katex/dist/katex.min.css";

/** Single code block with language tag + Copy button. */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#E2E8F0]">
      <div className="flex items-center justify-between bg-[#F8FAFC] px-3 py-1.5 text-xs font-bold text-[#64748B]">
        <span>{lang || "code"}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 hover:bg-[#E2E8F0]"
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#111827] p-3 text-[13px] leading-relaxed text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * MessageBubble — user indigo right, AI white left + actions.
 * Markdown sanitized (rehype-sanitize), XSS rendered harmless.
 */
export function MessageBubble({
  message,
  streaming,
  onCopy,
  onRegenerate,
  onFeedback,
}: {
  message: ChatMessage;
  streaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onFeedback?: (good: boolean) => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const [voted, setVoted] = React.useState<"up" | "down" | null>(null);
  const isUser = message.role === "user";

  async function copyText() {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      /* clipboard blocked — ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    onCopy?.();
  }

  function speak() {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(message.content.slice(0, 500));
      u.rate = 1;
      window.speechSynthesis.speak(u);
    } catch {
      /* TTS unavailable — ignore */
    }
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div className="rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-3 text-[15px] leading-relaxed text-white">
            {message.content}
          </div>
          <p className="mt-1 text-right text-xs text-[#64748B]">{timeAgo(message.createdAt)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2.5">
      <Image
        src="/logo-circle.svg"
        alt="Control Key"
        width={32}
        height={32}
        className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover"
      />
      <div className="max-w-[88%] sm:max-w-[78%]">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-[0_1px_2px_rgba(17,24,39,0.06)]">
          <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[#111827]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeSanitize, rehypeKatex]}
              components={{
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                code(props: any) {
                  const { className, children } = props;
                  const text = String(children ?? "").replace(/\n$/, "");
                  // Inline code vs block: block has language class or newline
                  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "";
                  const isBlock = !!lang || text.includes("\n");
                  if (!isBlock)
                    return (
                      <code className="rounded bg-[#F8FAFC] px-1.5 py-0.5 text-[13px] text-[#111827]">
                        {text}
                      </code>
                    );
                  return <CodeBlock lang={lang} code={text} />;
                },
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-[#2563EB] underline">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
            {streaming && (
              <span aria-label="AI is typing" className="ml-1 inline-block h-4 w-2 animate-pulse rounded bg-[#2563EB]" />
            )}
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-[#64748B]">{timeAgo(message.createdAt)}</span>
          {!streaming && (
            <>
              <button type="button" onClick={copyText} aria-label="Copy answer" className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#2563EB]">
                {copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
              </button>
              {onRegenerate && (
                <button type="button" onClick={onRegenerate} aria-label="Regenerate answer" className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#2563EB]">
                  <RefreshCw size={15} aria-hidden />
                </button>
              )}
              <button type="button" onClick={speak} aria-label="Read answer aloud" className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#2563EB]">
                <Volume2 size={15} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Good answer"
                aria-pressed={voted === "up"}
                onClick={() => {
                  setVoted("up");
                  onFeedback?.(true);
                }}
                className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg hover:bg-[#F8FAFC] ${voted === "up" ? "text-[#16A34A]" : "text-[#64748B]"}`}
              >
                <ThumbsUp size={15} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Bad answer"
                aria-pressed={voted === "down"}
                onClick={() => {
                  setVoted("down");
                  onFeedback?.(false);
                }}
                className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg hover:bg-[#F8FAFC] ${voted === "down" ? "text-[#DC2626]" : "text-[#64748B]"}`}
              >
                <ThumbsDown size={15} aria-hidden />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
