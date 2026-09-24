"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  CHAT_MODELS,
  loadOpenRouterModels,
  type ChatModel,
} from "@/lib/openrouter";
import { modelStorage } from "@/lib/storage";

/** Searchable model dropdown with FREE badges. Loads the live OpenRouter catalog on open. */
export function ModelPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [models, setModels] = React.useState<ChatModel[]>(CHAT_MODELS);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement>(null);
  const loadedRef = React.useRef(false);

  const current: ChatModel | undefined =
    models.find((m) => m.id === value) ??
    (value ? { id: value, label: value, free: value.endsWith(":free") } : undefined);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const list = models.filter((m) =>
    (m.label + m.id).toLowerCase().includes(q.trim().toLowerCase())
  );

  // Fetch the full catalog when the user opens the picker (lazy, cached 1h in lib).
  async function refreshModels(signal?: AbortSignal) {
    setLoading(true);
    setLoadError(null);
    try {
      const live = await loadOpenRouterModels(signal);
      if (signal?.aborted) return;
      if (live.length > 0) {
        setModels(live);
        loadedRef.current = true;
      }
    } catch {
      if (signal?.aborted) return;
      // Offline / API down — keep the fallback list and explain.
      setLoadError("Couldn't load the live list. Showing popular models — check connection and retry.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!open || loadedRef.current || loading) return;
    const ctrl = new AbortController();
    refreshModels(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  function pick(id: string) {
    onChange(id);
    modelStorage.set(id);
    setOpen(false);
    setQ("");
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Pick AI model"
        className="inline-flex min-h-[44px] max-w-[220px] items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white px-3 text-sm font-bold text-[#0F172A] transition hover:border-[#4F46E5] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        <span className="truncate">{current?.label ?? "Pick model"}</span>
        {current?.free && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
            FREE
          </span>
        )}
        <ChevronDown size={16} aria-hidden className={open ? "rotate-180" : ""} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="AI models"
          className="ck-card absolute left-0 top-12 z-40 w-72 overflow-hidden p-2"
        >
          <label className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
            <Search size={15} aria-hidden className="text-slate-400" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search models…"
              aria-label="Search models"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>
          <ul className="mt-1 max-h-64 overflow-auto">
            {loading && (
              <li role="status" className="px-3 py-4 text-sm text-slate-500">
                Loading all OpenRouter models…
              </li>
            )}
            {!loading &&
              list.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={m.id === value}
                  onClick={() => pick(m.id)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-950 ${
                    m.id === value ? "bg-indigo-50 font-bold dark:bg-indigo-950" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {m.id === value && <Check size={15} aria-hidden className="text-[#4F46E5]" />}
                    <span>
                      {m.label}
                      <span className="block max-w-[180px] truncate text-xs font-normal text-slate-400">
                        {m.id}
                      </span>
                    </span>
                  </span>
                  {m.free ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                      FREE
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800">
                      paid
                    </span>
                  )}
                </button>
              </li>
            ))}
            {!loading && list.length === 0 && (
              <li className="px-3 py-4 text-sm text-slate-500">No model found. Try “llama”.</li>
            )}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800">
            <span role="status">
              {loading
                ? "Fetching live catalog…"
                : loadError ?? `${models.length} models · live from OpenRouter`}
            </span>
            {loadError && (
              <button
                type="button"
                onClick={() => refreshModels()}
                className="font-bold text-[#4F46E5] hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
