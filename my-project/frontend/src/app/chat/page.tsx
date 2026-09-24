"use client";

import * as React from "react";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Menu, Shield, ShieldAlert, Download, Printer, Settings as SettingsIcon, X, CircleHelp } from "lucide-react";
import { toast } from "sonner";
import { Sidebar } from "@/components/chat/Sidebar";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatInput } from "@/components/chat/ChatInput";
import { ModelPicker } from "@/components/chat/ModelPicker";
import { SettingsModal } from "@/components/chat/SettingsModal";
import { ConfettiBurst } from "@/components/ConfettiBurst";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { awardSolve, looksLikeSelfSolve, randomCheer, recordChatDay } from "@/lib/discipline";
import { useSidebar } from "@/hooks/useSidebar";
import { useChats } from "@/hooks/useChats";
import { useRules } from "@/hooks/useRules";
import { RulesPanel } from "@/components/rules/RulesPanel";
import { keyStorage, modelStorage, profileStorage } from "@/lib/storage";
import { useAuth } from "@/lib/auth";
import { buildRefusal, buildSystemPrompt, looksLikeJailbreak } from "@/lib/promptBuilder";
import { askedForSolution, violatesStrictLock } from "@/lib/ruleGuard";
import {
  DEFAULT_MODEL,
  getDemoReply,
  streamChat,
  type StreamError,
} from "@/lib/openrouter";
import { profilesClient, EXAM_MODEL_CONFIG, DEFAULT_MODEL_CONFIG } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function ChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const welcomed = params.get("welcome") === "1";

  const [profile, setProfile] = React.useState(() => profileStorage.get());
  const [guardChecked, setGuardChecked] = React.useState(false);
  const { user: authUser, loading: authLoading } = useAuth();

  // Guard: logged-in users need a profile (name/age) → else onboarding.
  // Logged-OUT users → /login (not a silent empty screen).
  React.useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      router.replace("/login?next=/chat");
      return;
    }
    // Logged in but no local profile? Try cloud (name/age/email), then onboarding.
    if (!profile) {
      profilesClient
        .getProfile(authUser.id)
        .then((data) => {
          if (data) {
            const healed = {
              userId: data.user_id as string,
              displayName: (data.display_name as string) ?? "Student",
              age: (data.age as number) ?? 14,
              avatarColor: (data.avatar_color as string) ?? "#2563EB",
              email: (data.email as string | null) ?? authUser.email ?? null,
            };
            profileStorage.set(healed);
            setProfile(healed);
            setGuardChecked(true);
          } else {
            router.replace("/onboarding");
          }
        })
        .catch(() => router.replace("/onboarding"));
      return;
    }
    // Heal legacy mismatch (random local id → real auth id)
    if (profile.userId !== authUser.id) {
      const healed = { ...profile, userId: authUser.id };
      profileStorage.set(healed);
      setProfile(healed);
    }
    setGuardChecked(true);
  }, [profile, router, authUser, authLoading]);

  const { open, setOpen, mounted } = useSidebar();
  const chats = useChats();
  const rulesApi = useRules();

  const [model, setModel] = React.useState(DEFAULT_MODEL);
  const [streamingText, setStreamingText] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<StreamError | null>(null);
  const [lastUserText, setLastUserText] = React.useState<string>("");
  const [retryDraft, setRetryDraft] = React.useState<string | undefined>(undefined);
  const [jailbreakAsk, setJailbreakAsk] = React.useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [locksOpen, setLocksOpen] = React.useState(false);
  const [showTour, setShowTour] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  // Model memory
  React.useEffect(() => {
    setModel(modelStorage.get(DEFAULT_MODEL));
  }, []);
  function changeModel(id: string) {
    setModel(id);
    modelStorage.set(id);
    // History is localStorage-only: remember model per local session, no cloud write.
    if (chats.activeId) chats.setSessionModel(chats.activeId, id);
  }

  // Welcome tour (once) + confetti burst on first arrival
  React.useEffect(() => {
    if (welcomed && !localStorage.getItem("ck_tour_done")) setShowTour(true);
  }, [welcomed]);
  const [showConfetti, setShowConfetti] = React.useState(welcomed);

  // ACTIVE locks for system prompt — single source: useRules (Stage 5).
  // Sorted by priority (top = strongest), mapped to promptBuilder shape.
  const locks = React.useMemo(
    () =>
      rulesApi.activeRules.map((r, i) => ({
        title: r.title,
        instruction: r.instruction,
        strength: r.strength,
        priority: r.priority ?? i + 1,
      })),
    [rulesApi.activeRules]
  );
  const strictLocks = React.useMemo(() => rulesApi.activeRules.filter((r) => r.strength === "strict"), [rulesApi.activeRules]);

  const displayName = profile?.displayName ?? "";
  const age = profile?.age ?? 14;

  async function runAssistant(sessionId: string, userText: string) {
    setError(null);
    setStreamingText("");
    setIsStreaming(true);

    // No-key path: use the helpful local response until a key is added.
    // Behavior Contract holds here too: jailbreak + active lock → refusal.
    const key = keyStorage.get();
    if (!key) {
      const reply =
        looksLikeJailbreak(userText) && locks.length > 0
          ? buildRefusal(locks[0].title)
          : getDemoReply(userText);
      // Fake token stream for delight
      const words = reply.split(" ");
      let acc = "";
      for (let i = 0; i < words.length; i++) {
        if (abortRef.current?.signal.aborted) break;
        acc += (i === 0 ? "" : " ") + words[i];
        setStreamingText(acc);
        await new Promise((r) => setTimeout(r, 40));
      }
      setStreamingText("");
      setIsStreaming(false);
      if (!abortRef.current?.signal.aborted) chats.addMessage(sessionId, "assistant", reply, "demo");
      abortRef.current = null;
      return;
    }

    // Real path: OpenRouter streaming with un-overridable system prompt
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const system = buildSystemPrompt(displayName || "Student", age, locks);
    const history = chats.activeMessages
      .slice(-20)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    // Include the just-sent user message (added optimistically already, but ensure order)
    const fullHistory = [...history];
    if (fullHistory[fullHistory.length - 1]?.content !== userText) {
      fullHistory.push({ role: "user" as const, content: userText });
    }

    let acc = "";
    try {
      // Strict Exam Mode (§10): steadier quizzes at temperature 0.3.
      // Model config lives with the local session (history is localStorage-only).
      const examMode = strictLocks.some((r) => r.category === "Exams");
      const modelConfig = examMode ? EXAM_MODEL_CONFIG : DEFAULT_MODEL_CONFIG;
      chats.setSessionModel(sessionId, model, modelConfig);
      const { fullText } = await streamChat({
        key,
        model,
        systemPrompt: system,
        history: fullHistory,
        signal: ctrl.signal,
        temperature: modelConfig.temperature,
        onToken: (d) => {
          acc += d;
          setStreamingText(acc);
        },
      });
      setStreamingText("");
      setIsStreaming(false);
      abortRef.current = null;
      // Post-response guard (Error Matrix #13): Strict lock ON but reply looks
      // like a bare final solution → replace with refusal + log violation.
      const violated = violatesStrictLock(fullText || acc, strictLocks, askedForSolution(userText));
      if (violated) {
        rulesApi.incrementViolation(violated.id);
        const safe = buildRefusal(violated.title);
        chats.addMessage(sessionId, "assistant", safe, model);
        toast.success("Guard blocked a slip — lock held.", { duration: 3500 });
        return;
      }
      chats.addMessage(sessionId, "assistant", fullText || acc || "Empty reply — select Regenerate.", model);
    } catch (e) {
      setIsStreaming(false);
      abortRef.current = null;
      if ((e as Error)?.name === "AbortError") {
        // Stopped: keep partial as message if useful
        if (acc.trim()) chats.addMessage(sessionId, "assistant", acc + "\n\n*(stopped — hit Regenerate to continue)*", model);
        setStreamingText("");
        return;
      }
      const se = e as StreamError;
      setError(se ?? { kind: "unknown", message: "Something went wrong. Try again." });
      setStreamingText("");
      setRetryDraft(userText);
    }
  }

  function send(text: string) {
    const clean = text.trim();
    if (!clean || isStreaming) return;
    // Pre-flight jailbreak nudge (Stage 4 light — full refusal is Stage 5)
    if (looksLikeJailbreak(clean) && locks.length > 0) {
      setJailbreakAsk(clean);
      return;
    }
    doSend(clean);
  }

  function doSend(clean: string) {
    setJailbreakAsk(null);
    setRetryDraft(undefined);
    // Gamification: every chat day extends streak; self-solve earns +10.
    recordChatDay();
    if (looksLikeSelfSolve(clean) && locks.length > 0) {
      const d = awardSolve();
      toast.success(`${randomCheer()} (+10 · score ${d.score})`, { duration: 4000 });
    }
    let sid = chats.activeId;
    if (!sid) sid = chats.createChat(model);
    setLastUserText(clean);
    chats.addMessage(sid, "user", clean, model);
    runAssistant(sid, clean);
  }

  function stop() {
    abortRef.current?.abort();
  }
  function retry() {
    const text = retryDraft || lastUserText;
    if (!text) return;
    setError(null);
    // Re-run assistant without duplicating user bubble
    const sid = chats.activeId;
    if (!sid) return;
    runAssistant(sid, text);
  }
  function regenerate() {
    if (!lastUserText && chats.activeMessages.length === 0) return;
    const lastUser = [...chats.activeMessages].reverse().find((m) => m.role === "user");
    const text = lastUser?.content ?? lastUserText;
    if (!text || !chats.activeId) return;
    setError(null);
    runAssistant(chats.activeId, text);
  }
  function switchToFree() {
    changeModel(DEFAULT_MODEL);
    setError(null);
    toast.success("Switched to FREE model — select Retry.");
  }
  // Rate-limit auto-retry countdown (Error Matrix #4): 20s then retry alone.
  const [retryIn, setRetryIn] = React.useState<number | null>(null);
  const retryRef = React.useRef(() => {});
  retryRef.current = retry;
  React.useEffect(() => {
    if (error?.kind !== "rate_limit") {
      setRetryIn(null);
      return;
    }
    setRetryIn(20);
    const t = setInterval(() => {
      setRetryIn((v) => {
        if (v === null) return null;
        if (v <= 1) {
          clearInterval(t);
          setTimeout(() => retryRef.current(), 0);
          return null;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
  function feedback(good: boolean) {
    // Local-only tuning signal — feedback table was dropped (migration 0006)
    // as not required. No Supabase write, no key involved.
    toast.success(good ? "Thanks — glad it helped." : "Noted — I'll adjust next time.", { duration: 2500 });
  }

  if (!guardChecked) {
    return <main className="ck-container py-20 text-center">Opening your Control Room…</main>;
  }

  const activeTokens = chats.activeMessages.reduce((a, m) => a + m.tokens, 0);
  const isFreeModel = model.endsWith(":free");
  const shieldOn = rulesApi.activeCount > 0;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Welcome banner */}
      {welcomed && !!profile && (
        <p role="status" className="bg-[#F0FDF4] px-4 py-2 text-center text-sm font-bold text-[#16A34A]">
          Welcome, {displayName}! Your Control Room is ready.
        </p>
      )}

      {/* Header — Light Mode, circular logo, standard Lucide icons */}
      <header className="flex items-center gap-2 border-b border-[#E2E8F0] bg-white px-3 py-2">
        <Image src="/logo-circle.svg" alt="Control Key logo" width={30} height={30} className="hidden h-[30px] w-[30px] rounded-full object-cover sm:block" />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close sidebar" : "Open sidebar"}
          aria-expanded={open}
          title="Toggle sidebar (Ctrl+B)"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] lg:hidden"
        >
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          title="Collapse (Ctrl+B)"
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] lg:flex"
        >
          {open ? <ChevronsLeft size={20} aria-hidden /> : <ChevronsRight size={20} aria-hidden />}
        </button>

        {/* Shield — locks status */}
        <button
          type="button"
          onClick={() => setLocksOpen(true)}
          aria-label={`${rulesApi.activeCount} locks active out of ${rulesApi.total}. Open My Locks.`}
          title="My Locks — AI cannot cross these"
          className={`flex min-h-[44px] items-center gap-1.5 rounded-2xl border px-3 text-xs font-extrabold transition ${
            shieldOn
              ? "border-[#E2E8F0] bg-[#F0FDF4] text-[#16A34A]"
              : "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]"
          }`}
        >
          {shieldOn ? <Shield size={16} aria-hidden /> : <ShieldAlert size={16} aria-hidden />}
          {shieldOn ? `${rulesApi.activeCount} lock${rulesApi.activeCount > 1 ? "s" : ""} ON` : "Unprotected"}
        </button>

        <div className="min-w-0 flex-1">
          <ModelPicker value={model} onChange={changeModel} />
        </div>

        <button
          type="button"
          onClick={() => chats.exportChat("md")}
          aria-label="Export chat as markdown"
          title="Export .md"
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] sm:flex"
        >
          <Download size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Print chat"
          title="Print / PDF"
          className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] sm:flex"
        >
          <Printer size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setShowTour(true)}
          aria-label="Help and quick tour"
          title="Help — replay tour"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC]"
        >
          <CircleHelp size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC]"
        >
          {profile ? <Avatar name={displayName || "?"} size={32} /> : <SettingsIcon size={18} aria-hidden />}
        </button>
      </header>

      {/* Jailbreak pre-flight nudge */}
      {jailbreakAsk && (
        <div role="alert" className="border-b border-[#E2E8F0] bg-[#FFF7ED] px-4 py-3 text-sm text-[#111827]">
          <strong>This looks like you&apos;re asking to break your own lock.</strong>
          <br />
          Send anyway? The locked part will still be refused — see My Locks.
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => doSend(jailbreakAsk)}
              className="min-h-[40px] rounded-xl bg-yellow-600 px-4 text-xs font-bold text-white"
            >
              Send anyway
            </button>
            <button
              type="button"
              onClick={() => setJailbreakAsk(null)}
              className="min-h-[40px] rounded-xl border border-yellow-300 px-4 text-xs font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Body: sidebar + chat */}
      <div className="flex min-h-0 flex-1">
        {mounted && (
          <Sidebar
            open={open}
            onClose={() => setOpen(false)}
            onOpen={() => setOpen(true)}
            chats={chats}
            profile={profile}
            onSettings={() => setSettingsOpen(true)}
            onLocks={() => setLocksOpen(true)}
          />
        )}

        <main aria-label="Chat" className="flex min-h-0 min-w-0 flex-1 flex-col">
          {/* History is localStorage-only — no cloud load errors possible. */}
          {/* Chat title row */}
          <div className="flex items-center justify-between gap-2 px-4 pt-3 sm:px-6">
                <h1 className="font-heading truncate text-lg font-extrabold text-[#0F172A] dark:text-white">
                  {chats.activeSession?.title ?? "New chat"}
                </h1>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => chats.exportChat("md")}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:text-[#4F46E5]"
                  >
                    .md
                  </button>
                  <button
                    type="button"
                    onClick={() => chats.exportChat("txt")}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-slate-400 hover:text-[#4F46E5]"
                  >
                    .txt
                  </button>
                </div>
              </div>

              <ChatWindow
                messages={chats.activeMessages}
                streamingText={streamingText}
                isStreaming={isStreaming}
                onStop={stop}
                error={error}
                onRetry={retry}
                onSwitchFree={switchToFree}
                showFreeSwitch={!isFreeModel}
                retryCountdown={retryIn}
                onPickSuggestion={send}
                onRegenerate={regenerate}
                onFeedback={feedback}
              />

              <ChatInput
                onSend={send}
                streaming={isStreaming}
                initialDraft={retryDraft}
                disabled={false}
              />
              <p className="bg-white px-4 pb-2 text-center text-[11px] text-slate-400 dark:bg-slate-900">
                This chat ~{activeTokens.toLocaleString()} tokens ≈ {isFreeModel ? "$0.00 on free model" : "paid model"} · key masked, never logged
              </p>
        </main>
      </div>

      {showConfetti && <ConfettiBurst onDone={() => setShowConfetti(false)} />}
      {/* Tour (welcome=1, once) */}
      {showTour && (
        <div role="dialog" aria-label="Quick tour" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border bg-white p-5 shadow-2xl dark:bg-slate-900">
          <p className="font-heading font-extrabold">Quick tour</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Pick a FREE model up top.</li>
            <li>Ask anything — hints first, always.</li>
            <li>My Locks holds the rules AI can&apos;t cross.</li>
          </ol>
          <Link href="/guide/get-key" className="mt-2 inline-block text-sm font-bold text-[#4F46E5] underline">
            Need a key? 60-sec guide →
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem("ck_tour_done", "1");
              setShowTour(false);
            }}
            className="ck-btn-primary mt-4 w-full"
          >
            Got it
          </button>
        </div>
      )}

      {/* My Locks — full Rules Engine panel (Stage 5) */}
      <Modal
        open={locksOpen}
        onClose={() => setLocksOpen(false)}
        title={`My Locks ${rulesApi.activeCount}/${rulesApi.total || 0} ON`}
        wide
      >
        <RulesPanel
          rulesApi={rulesApi}
          studentName={displayName || "Student"}
          studentAge={Number.isFinite(age) ? age : 14}
          model={model}
        />
      </Modal>

      {/* Settings — full editor (Stage 6) */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        displayName={displayName || ""}
        age={Number.isFinite(age) ? age : 14}
        chats={chats}
        rulesApi={rulesApi}
        onProfileSaved={() => setProfile(profileStorage.get())}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="ck-container py-20 text-center">Opening your Control Room…</main>}>
      <ChatInner />
    </Suspense>
  );
}
