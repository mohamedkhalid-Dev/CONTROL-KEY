"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { KeyGuide, EyeButton } from "@/components/onboarding/KeyGuide";
import { validateApiKey } from "@/lib/validators";
import { validateOpenRouterKey } from "@/lib/openrouter";

export interface KeyState {
  key: string;
  show: boolean;
  testing: boolean;
  testedOk: boolean;
  testMsg: string | null;
  guideOpen: boolean;
}

export function KeyStep({
  state,
  setState,
}: {
  state: KeyState;
  setState: (s: KeyState) => void;
}) {
  const [touched, setTouched] = useState(false);
  const formatError =
    touched && state.key ? validateApiKey(state.key) : null;

  async function testConnection() {
    const trimmed = state.key.trim();
    setTouched(true);
    const v = validateApiKey(trimmed);
    if (!v.ok) {
      setState({ ...state, key: trimmed, testedOk: false, testMsg: v.error ?? "Bad key." });
      return;
    }
    setState({ ...state, key: trimmed, testing: true, testMsg: null });
    const res = await validateOpenRouterKey(trimmed);
    setState({
      ...state,
      key: trimmed,
      testing: false,
      testedOk: res.valid,
      testMsg: res.message,
    });
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-extrabold text-[#0F172A] dark:text-white">
        Paste your OpenRouter key
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Free key. It stays in your browser only — never uploaded or stored in
        our database.
      </p>

      <div className="mt-6 flex items-start gap-2">
        <div className="flex-1">
          <Input
            label="API key"
            type={state.show ? "text" : "password"}
            placeholder="sk-or-v1-..."
            value={state.key}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              setState({ ...state, key: e.target.value, testedOk: false, testMsg: null })
            }
            onBlur={() => setState({ ...state, key: state.key.trim() })}
            error={formatError && !formatError.ok ? formatError.error : undefined}
            hint={!formatError ? "Starts with sk-or-. Spaces cut off alone." : undefined}
          />
        </div>
        <div className="pt-7">
          <EyeButton
            show={state.show}
            onToggle={() => setState({ ...state, show: !state.show })}
          />
        </div>
      </div>

      <KeyGuide
        open={state.guideOpen}
        setOpen={(v) => setState({ ...state, guideOpen: v })}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={testConnection}
          disabled={state.testing || !state.key.trim()}
          className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-[#4F46E5] px-6 text-sm font-bold text-[#4F46E5] transition hover:bg-indigo-50 disabled:opacity-40 dark:hover:bg-indigo-950"
        >
          {state.testing ? "Checking…" : "Test Connection"}
        </button>
        {state.testMsg && (
          <p
            role="status"
            className={`flex items-center rounded-2xl px-4 py-3 text-sm font-bold ${
              state.testedOk
                ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
            }`}
          >
            {state.testMsg}
          </p>
        )}
      </div>
    </div>
  );
}
