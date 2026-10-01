"use client";

import * as React from "react";
import { DEFAULT_MODEL_CONFIG, type ModelConfig } from "@/lib/supabase";
import { estimateTokens } from "@/lib/openrouter";
import { downloadBlob, sanitizeDownloadName } from "@/lib/fileUpload";
import { dayGroup, type DayGroup } from "@/lib/time";
import { useAuth } from "@/lib/auth";

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  modelConfig?: ModelConfig;
  pinned: boolean;
  totalTokens: number;
  updatedAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  tokens: number;
  model?: string;
  createdAt: string;
}

const LS_SESSIONS = "ck_chats_v1";
const LS_MESSAGES = "ck_messages_v1";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
function nowIso(): string {
  return new Date().toISOString();
}
function readJson<T>(key: string, fallback: T): T {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, v: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode — ignore */
  }
}
function smartTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 42);
  return clean || "New chat";
}

/**
 * useChats — sidebar history + messages.
 * localStorage ONLY (ck_chats_v1 + ck_messages_v1). No Supabase reads/writes:
 * chat history stays on this device by design.
 */
export function useChats() {
  const { user: authUser } = useAuth();
  const authUserId = authUser?.id ?? null;
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [messagesBySession, setMessagesBySession] = React.useState<Record<string, ChatMessage[]>>({});
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  // Initial load: localStorage only (instant, works offline + demo).
  React.useEffect(() => {
    const localSessions = readJson<ChatSession[]>(LS_SESSIONS, []);
    const localMsgs = readJson<Record<string, ChatMessage[]>>(LS_MESSAGES, {});
    setSessions(localSessions);
    setMessagesBySession(localMsgs);
    setActiveId((prev) => prev ?? localSessions[0]?.id ?? null);
    setLoading(false);
  }, []);

  // Persist locally on every change.
  React.useEffect(() => {
    if (loading) return;
    writeJson(LS_SESSIONS, sessions);
    writeJson(LS_MESSAGES, messagesBySession);
  }, [sessions, messagesBySession, loading]);

  const selectChat = React.useCallback((id: string) => {
    setActiveId(id);
    // All messages already in memory — nothing to fetch.
    setMessagesBySession((prev) => ({ ...prev, [id]: prev[id] ?? [] }));
  }, []);

  const createChat = React.useCallback(
    (model: string, modelConfig: ModelConfig = DEFAULT_MODEL_CONFIG): string => {
      const id = uid();
      const s: ChatSession = {
        id,
        title: "New chat",
        model,
        modelConfig: { ...modelConfig },
        pinned: false,
        totalTokens: 0,
        updatedAt: nowIso(),
        createdAt: nowIso(),
      };
      setSessions((prev) => [s, ...prev]);
      setMessagesBySession((prev) => ({ ...prev, [id]: [] }));
      setActiveId(id);
      return id;
    },
    []
  );

  /** Updates local session fields (title/model/config/pin/tokens) — local only. */
  const updateSession = React.useCallback((id: string, patch: Partial<ChatSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch, id, updatedAt: patch.updatedAt ?? nowIso() } : s))
    );
  }, []);

  /** Sets the model (+ optional config) for one session — local only. */
  const setSessionModel = React.useCallback(
    (id: string, model: string, modelConfig?: ModelConfig) => {
      updateSession(id, modelConfig ? { model, modelConfig: { ...modelConfig } } : { model });
    },
    [updateSession]
  );

  const renameChat = React.useCallback(
    (id: string, title: string) => {
      const clean = smartTitle(title).slice(0, 80);
      if (!clean) return;
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: clean, updatedAt: nowIso() } : s))
      );
    },
    []
  );

  const deleteChat = React.useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setMessagesBySession((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const duplicateChat = React.useCallback(
    (id: string): string | null => {
      const src = sessions.find((s) => s.id === id);
      if (!src) return null;
      const nid = uid();
      const copy: ChatSession = { ...src, id: nid, title: `${src.title} (copy)`, createdAt: nowIso(), updatedAt: nowIso() };
      const msgs = (messagesBySession[id] ?? []).map((m) => ({ ...m, id: uid(), sessionId: nid }));
      setSessions((prev) => [copy, ...prev]);
      setMessagesBySession((prev) => ({ ...prev, [nid]: msgs }));
      setActiveId(nid);
      return nid;
    },
    [sessions, messagesBySession]
  );

  const togglePin = React.useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  }, []);

  const addMessage = React.useCallback(
    (sessionId: string, role: "user" | "assistant", content: string, model?: string) => {
      const msg: ChatMessage = {
        id: uid(),
        sessionId,
        role,
        content,
        tokens: estimateTokens(content),
        model,
        createdAt: nowIso(),
      };
      setMessagesBySession((prev) => ({ ...prev, [sessionId]: [...(prev[sessionId] ?? []), msg] }));
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                title: s.title === "New chat" && role === "user" ? smartTitle(content) : s.title,
                totalTokens: s.totalTokens + msg.tokens,
                updatedAt: nowIso(),
              }
            : s
        )
      );
      return msg.id;
    },
    []
  );

  const updateMessage = React.useCallback(
    (sessionId: string, messageId: string, content: string) => {
      setMessagesBySession((prev) => ({
        ...prev,
        [sessionId]: (prev[sessionId] ?? []).map((m) =>
          m.id === messageId ? { ...m, content, tokens: estimateTokens(content) } : m
        ),
      }));
    },
    []
  );

  // Search (fuzzy: title + message text) + pinned first + grouped
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = sessions;
    if (q) {
      list = sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (messagesBySession[s.id] ?? []).some((m) => m.content.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [sessions, query, messagesBySession]);

  const grouped = React.useMemo(() => {
    const groups: { label: DayGroup; items: ChatSession[] }[] = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This week", items: [] },
      { label: "Older", items: [] },
    ];
    for (const s of filtered) {
      const g = dayGroup(s.updatedAt);
      groups.find((x) => x.label === g)?.items.push(s);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [filtered]);

  const activeMessages = activeId ? (messagesBySession[activeId] ?? []) : [];
  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  const exportChat = React.useCallback(
    (format: "md" | "txt") => {
      if (!activeSession) return;
      const msgs = messagesBySession[activeSession.id] ?? [];
      const body = msgs
        .map((m) => (format === "md" ? `**${m.role === "user" ? "You" : "AI"}:** ${m.content}` : `${m.role === "user" ? "You" : "AI"}: ${m.content}`))
        .join(format === "md" ? "\n\n---\n\n" : "\n\n");
      const header =
        format === "md"
          ? `# ${activeSession.title}\n\n_Control Key export · ${new Date().toLocaleString()} · key masked, never exported._\n\n`
          : `${activeSession.title}\n(Control Key export — key never exported)\n\n`;
      // Safe download: explicit text/plain MIME + attachment disposition
      // (see lib/fileUpload.ts downloadBlob) — never inline HTML/SVG.
      const blob = new Blob([header + body], { type: "text/plain;charset=utf-8" });
      const filename = `${sanitizeDownloadName(activeSession.title.slice(0, 30)) || "chat"}.${format}`;
      downloadBlob(blob, filename);
    },
    [activeSession, messagesBySession]
  );

  const retryLoad = React.useCallback(() => {
    const localSessions = readJson<ChatSession[]>(LS_SESSIONS, []);
    const localMsgs = readJson<Record<string, ChatMessage[]>>(LS_MESSAGES, {});
    setSessions(localSessions);
    setMessagesBySession(localMsgs);
    setLoading(false);
    if (localSessions[0]) setActiveId((prev) => prev ?? localSessions[0].id);
  }, []);

  return {
    sessions,
    grouped,
    activeId,
    activeSession,
    activeMessages,
    loading,
    loadError: null as string | null,
    isLoggedIn: !!authUserId,
    query,
    setQuery,
    selectChat,
    createChat,
    updateSession,
    setSessionModel,
    renameChat,
    deleteChat,
    duplicateChat,
    togglePin,
    addMessage,
    updateMessage,
    exportChat,
    retryLoad,
  };
}
