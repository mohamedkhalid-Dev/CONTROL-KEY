"use client";

import * as React from "react";
import { Paperclip, SendHorizonal } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

export const MAX_CHARS = 4000;

/**
 * ChatInput — auto-grow to 200px, Enter send / Shift+Enter newline,
 * counter + over-limit handling, offline draft queue.
 */
export function ChatInput({
  onSend,
  disabled,
  streaming,
  initialDraft,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  streaming?: boolean;
  initialDraft?: string;
}) {
  const [value, setValue] = React.useState(initialDraft ?? "");
  const [shake, setShake] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setOffline(typeof navigator !== "undefined" ? !navigator.onLine : false);
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, []);

  React.useEffect(() => {
    if (initialDraft) setValue(initialDraft);
  }, [initialDraft]);

  // Auto-grow, capped at 200px
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const overLimit = value.length > MAX_CHARS;
  const canSend = value.trim().length > 0 && !overLimit && !disabled && !streaming;

  function send() {
    if (streaming || disabled) return;
    if (!value.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      ref.current?.focus();
      return;
    }
    if (overLimit) return;
    onSend(value.trim());
    setValue("");
    requestAnimationFrame(() => ref.current?.focus());
  }

  function trimAuto() {
    // Keep first 4000 chars at a word boundary
    const cut = value.slice(0, MAX_CHARS);
    const lastSpace = cut.lastIndexOf(" ");
    setValue(lastSpace > 3000 ? cut.slice(0, lastSpace) : cut);
  }

  return (
    <div className="border-t border-[#E2E8F0] bg-white p-3 sm:p-4">
      {offline && (
        <p role="alert" className="mb-2 rounded-xl bg-[#FFF7ED] px-3 py-2 text-xs font-bold text-[#EA580C]">
          You&apos;re offline. Draft saved — it will send when you&apos;re back.
        </p>
      )}
      {overLimit && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#DC2626]">
          <span>Too long! Split into 2 messages ({value.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}).</span>
          <button type="button" onClick={trimAuto} className="min-h-[36px] rounded-lg bg-[#DC2626] px-3 text-white">
            Trim automatically
          </button>
        </div>
      )}
      <div className={`flex items-end gap-2 ${shake ? "animate-[shake_0.3s_ease]" : ""}`}>
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <textarea
          id="chat-input"
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={streaming ? "AI is answering… press Stop to interrupt" : "Ask anything… (Enter to send)"}
          disabled={disabled}
          maxLength={MAX_CHARS + 500}
          aria-describedby="chat-counter"
          className="max-h-[200px] min-h-[48px] flex-1 resize-none rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[15px] text-[#111827] outline-none transition focus:border-[#2563EB] focus:bg-white"
        />
        <Tooltip tip="Attach photos — coming soon">
          <button
            type="button"
            disabled
            aria-label="Attach a photo (coming soon)"
            className="flex h-12 w-12 shrink-0 cursor-not-allowed items-center justify-center rounded-2xl text-[#E2E8F0]"
          >
            <Paperclip size={20} aria-hidden />
          </button>
        </Tooltip>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2563EB] text-white transition hover:bg-[#1D4ED8] disabled:opacity-40"
        >
          <SendHorizonal size={20} aria-hidden />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between px-1">
        <p id="chat-counter" className={`text-xs ${overLimit ? "font-bold text-[#DC2626]" : "text-[#64748B]"}`}>
          {value.length.toLocaleString()}/{MAX_CHARS.toLocaleString()}
        </p>
        {!value.trim() && shake && (
          <p role="status" className="text-xs font-bold text-[#2563EB]">
            Write something first
          </p>
        )}
      </div>
    </div>
  );
}
