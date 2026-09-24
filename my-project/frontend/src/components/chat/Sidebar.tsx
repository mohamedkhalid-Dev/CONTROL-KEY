"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Menu,
  MessageSquarePlus,
  MessageSquare,
  Pin,
  PinOff,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { timeAgo } from "@/lib/time";
import { estimateTokens } from "@/lib/openrouter";
import { profileStorage, type StoredProfile } from "@/lib/storage";
import type { useChats } from "@/hooks/useChats";

type ChatsApi = ReturnType<typeof useChats>;

/**
 * Sidebar — REQUIRED close element fully implemented:
 * desktop chevron + X + Ctrl/B, mobile drawer X + backdrop + swipe + Esc.
 */
export function Sidebar({
  open,
  onClose,
  onOpen,
  chats,
  profile,
  onSettings,
  onLocks,
}: {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  chats: ChatsApi;
  profile: StoredProfile | null;
  onSettings: () => void;
  onLocks: () => void;
}) {
  const [isMobile, setIsMobile] = React.useState(false);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [hoverX, setHoverX] = React.useState(false);
  const touchX = React.useRef<number | null>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Body scroll lock when mobile drawer open
  React.useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = "hidden";
      // Focus close for keyboard users
      setTimeout(() => closeBtnRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, isMobile]);

  // Focus returns to opener when the mobile drawer closes (§6.5 a11y)
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    if (wasOpen.current && !open && isMobile) {
      const fab = document.getElementById("sidebar-reopen-fab");
      (fab as HTMLButtonElement | null)?.focus?.();
    }
    wasOpen.current = open;
  }, [open, isMobile]);

  // Swipe-left to close (mobile)
  function onTouchStart(e: React.TouchEvent) {
    touchX.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchX.current === null || !isMobile) return;
    const dx = touchX.current - e.touches[0].clientX;
    if (dx > 70) {
      onClose();
      touchX.current = null;
    }
  }

  const totalTokens = chats.sessions.reduce((a, s) => a + s.totalTokens, 0);

  // Closed state: slim rail (desktop) / nothing + floating open (mobile)
  if (!open) {
    return (
      <>
        {/* Desktop slim rail */}
        <div className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-[#E2E8F0] bg-white py-4 lg:flex">
          <button
            type="button"
            onClick={onOpen}
            aria-label="Open sidebar"
            title="Open sidebar (Ctrl+B)"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            <ChevronsRight size={20} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => chats.createChat(chats.activeSession?.model ?? "")}
            aria-label="New chat"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <MessageSquarePlus size={20} aria-hidden />
          </button>
        </div>
        {/* Mobile floating open */}
        <button
          id="sidebar-reopen-fab"
          type="button"
          onClick={onOpen}
          aria-label="Open chats menu"
          className="fixed bottom-24 left-3 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg lg:hidden"
        >
          <Menu size={20} aria-hidden />
        </button>
      </>
    );
  }

  const panel = (
    <aside
      ref={drawerRef}
      aria-label="Chat history"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      className={`
        flex w-[280px] shrink-0 flex-col bg-white
        ${isMobile ? "fixed inset-y-0 left-0 z-50 shadow-2xl" : "sticky top-0 h-screen border-r border-[#E2E8F0]"}
      `}
    >
      {/* Top: circular logo + collapse + X */}
      <div
        className="flex items-center justify-between px-3 pt-3"
        onMouseEnter={() => setHoverX(true)}
        onMouseLeave={() => setHoverX(false)}
      >
        <Link href="/" aria-label="Control Key home" className="flex items-center gap-2 px-1 text-lg font-extrabold text-[#111827]">
          <Image src="/logo-circle.svg" alt="Control Key logo" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
          Control Key
        </Link>
        <div className="flex items-center gap-1">
          {/* Desktop collapse chevron */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse sidebar (Ctrl+B)"
            title="Collapse (Ctrl+B)"
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] lg:flex"
          >
            <ChevronsLeft size={19} aria-hidden />
          </button>
          {/* X — visible on hover desktop, always mobile */}
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC] ${
              isMobile ? "" : hoverX ? "" : "lg:opacity-0"
            }`}
          >
            <X size={19} aria-hidden />
          </button>
        </div>
      </div>

      {/* New chat */}
      <div className="px-3 pt-3">
        <button
          type="button"
          onClick={() => {
            chats.createChat(chats.activeSession?.model ?? "");
            if (isMobile) onClose();
          }}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[#2563EB] text-sm font-bold text-white hover:bg-[#1D4ED8]"
        >
          <MessageSquarePlus size={18} aria-hidden /> New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <label className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[#F8FAFC] px-3">
          <Search size={16} aria-hidden className="shrink-0 text-[#64748B]" />
          <input
            value={chats.query}
            onChange={(e) => chats.setQuery(e.target.value)}
            placeholder="Search chats…"
            aria-label="Search chats"
            className="w-full bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#64748B]"
          />
          {chats.query && (
            <button type="button" onClick={() => chats.setQuery("")} aria-label="Clear search" className="text-[#64748B]">
              <X size={15} aria-hidden />
            </button>
          )}
        </label>
      </div>

      {/* History */}
      <nav aria-label="Chats" className="mt-2 flex-1 overflow-y-auto bg-white px-2 pb-2">
        {chats.loading ? (
          <div className="space-y-2 p-2" aria-label="Loading chats">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-[#F8FAFC]" />
            ))}
          </div>
        ) : chats.grouped.length === 0 ? (
          <div className="p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
              <MessageSquare size={20} aria-hidden />
            </span>
            <p className="mt-2 text-sm font-bold text-[#111827]">Nothing here yet</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-[#64748B]">
              <ShieldCheck size={12} aria-hidden /> Your locks will guard it
            </p>
          </div>
        ) : (
          chats.grouped.map((g) => (
            <div key={g.label} className="mt-2">
              <p className="px-2 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">
                {g.label}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((s) => {
                  const isActive = s.id === chats.activeId;
                  const isRenaming = renamingId === s.id;
                  return (
                    <li key={s.id}>
                      <div
                        className={`group flex items-center gap-1 rounded-xl px-2 py-1 transition ${
                          isActive ? "bg-[#EFF6FF]" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        {s.pinned && (
                          <Pin size={12} aria-label="Pinned" className="shrink-0 text-[#2563EB]" />
                        )}
                        {isRenaming ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => {
                              chats.renameChat(s.id, renameValue);
                              setRenamingId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                chats.renameChat(s.id, renameValue);
                                setRenamingId(null);
                              }
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            aria-label="Rename chat"
                            maxLength={80}
                            className="h-9 w-full rounded-lg border border-[#2563EB] bg-white px-2 text-sm text-[#111827]"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              chats.selectChat(s.id);
                              if (isMobile) onClose();
                            }}
                            onDoubleClick={() => {
                              setRenamingId(s.id);
                              setRenameValue(s.title);
                            }}
                            title="Double-click to rename"
                            className="min-h-[44px] flex-1 truncate text-left text-sm font-semibold text-[#111827]"
                          >
                            {s.title}
                            <span className="block text-[11px] font-normal text-[#64748B]">
                              {timeAgo(s.updatedAt)} · ~{(s.totalTokens || estimateTokens(s.title)).toLocaleString()} tok
                            </span>
                          </button>
                        )}
                        {/* Row actions */}
                        <div className="flex shrink-0 items-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => chats.togglePin(s.id)}
                            aria-label={s.pinned ? "Unpin chat" : "Pin chat"}
                            title={s.pinned ? "Unpin" : "Pin"}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0]"
                          >
                            {s.pinned ? <PinOff size={14} aria-hidden /> : <Pin size={14} aria-hidden />}
                          </button>
                          <button
                            type="button"
                            onClick={() => chats.duplicateChat(s.id)}
                            aria-label="Duplicate chat"
                            title="Duplicate"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E2E8F0]"
                          >
                            <Copy size={14} aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(s.id)}
                            aria-label={`Delete ${s.title}`}
                            title="Delete"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                          >
                            <Trash2 size={14} aria-hidden />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* Footer: tokens + profile + settings */}
      <div className="border-t border-[#E2E8F0] bg-white p-3">
        <p className="flex items-center gap-1 px-1 text-[11px] text-[#64748B]">
          <ShieldCheck size={12} aria-hidden /> ~{totalTokens.toLocaleString()} tokens · key stays in browser
        </p>
        {"isLoggedIn" in chats && !(chats as { isLoggedIn?: boolean }).isLoggedIn && (
          <p className="mt-1 rounded-xl bg-[#EFF6FF] px-2 py-1.5 text-[11px] font-bold text-[#2563EB]">
            Chats stay on this device —{" "}
            <Link href="/login?next=/chat" className="underline">
              log in to sync profile + locks
            </Link>
          </p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <Avatar name={profile?.displayName ?? profileStorage.get()?.displayName ?? "?"} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#111827]">
              {profile?.displayName ?? profileStorage.get()?.displayName ?? "Student"}
            </p>
            <p className="text-xs text-[#64748B]">
              <button
                type="button"
                onClick={() => {
                  onLocks();
                  if (isMobile) onClose();
                }}
                className="inline-flex items-center gap-1 font-bold text-[#2563EB] underline"
              >
                <ShieldCheck size={12} aria-hidden /> My Locks
              </button>
            </p>
          </div>
          <button
            type="button"
            onClick={onSettings}
            aria-label="Open settings"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[#64748B] hover:bg-[#F8FAFC]"
          >
            <Settings size={18} aria-hidden />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete this chat?"
        message="This erases its messages for good. Your locks stay safe."
        confirmLabel="Delete chat"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) chats.deleteChat(deleteId);
          setDeleteId(null);
        }}
      />
    </aside>
  );

  // Mobile: drawer + backdrop
  if (isMobile) {
    return (
      <>
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#111827]/50"
        />
        {panel}
      </>
    );
  }
  return panel;
}
